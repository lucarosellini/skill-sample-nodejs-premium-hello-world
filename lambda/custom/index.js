const Alexa = require('ask-sdk');

const {isEntitled,
  makeUpsell,
  getAllEntitledProducts,
  makeBuyOffer,
  SaveAttributesResponseInterceptor,
  LoadAttributesRequestInterceptor,
  LogRequestInterceptor,
  LogResponseInterceptor,
  getBuyResponseText,
  getResponseBasedOnAccessType,
  getSpeakableListOfProducts,
  getRandomYesNoQuestion,
  getPremiumOrRandomGoodbye,
  getGoodbyesCount,
  skillName} = require("./utils");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = `Welcome to ${skillName}, you can say hello! How can I help?`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  },
};

const GetAnotherHelloHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'SimpleHelloIntent'));
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const preSpeechText = '';

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Use the helper function getResponseBasedOnAccessType to determine the response based on the products the customer has purchased
      return getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
    });
  },
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      return getPremiumOrRandomGoodbye(handlerInput, res);
    });
  }
};

// Respond to the utterance "what can I buy"
const WhatCanIBuyIntentHandler = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'WhatCanIBuyIntent');
  },
  handle(handlerInput) {
    // Get the list of products available for in-skill purchase
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // res contains the list of all ISP products for this skill.
      // We now need to filter this to find the ISP products that are available for purchase (NOT ENTITLED)
      const purchasableProducts = res.inSkillProducts.filter(
        record => record.entitled === 'NOT_ENTITLED' &&
          record.purchasable === 'PURCHASABLE',
      );

      // Say the list of products
      if (purchasableProducts.length > 0) {
        // One or more products are available for purchase. say the list of products
        const speechText = `Products available for purchase at this time are ${getSpeakableListOfProducts(purchasableProducts)}. 
                            To learn more about a product, say 'Tell me more about' followed by the product name. 
                            If you are ready to buy, say, 'Buy' followed by the product name. So what can I help you with?`;
        const repromptOutput = 'I didn\'t catch that. What can I help you with?';
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // no products are available for purchase. Ask if they would like to hear another greeting
      const speechText = 'There are no products to offer to you right now. Sorry about that. Would you like a greeting instead?';
      const repromptOutput = 'I didn\'t catch that. What can I help you with?';
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptOutput)
        .getResponse();
    });
  },
};

const TellMeMoreAboutGreetingsPackIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'TellMeMoreAboutGreetingsPackIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const greetingsPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
      );

      // const premiumSubscriptionProduct = res.inSkillProducts.filter(
      //   record => record.referenceName === 'Premium_Subscription'
      // );

      if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription, which includes all features of the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the upsell
      const speechText = 'Sure.';
      return makeUpsell(speechText, greetingsPackProduct, handlerInput);
    });
  },
};

const TellMeMoreAboutGoodbyesPackIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'TellMeMoreAboutGoodbyesPack';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const goodbyesPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Goodbyes_Pack',
      );

      console.log(
        `GOODBYES PACK PRODUCT = ${JSON.stringify(goodbyesPackProduct)}`,
      );

      if (getGoodbyesCount(handlerInput, goodbyesPackProduct) > 0) {
        // Customer has bought the Greetings Pack. They don't need to buy the Goodbyes Pack.
        const speechText = `Good News! You're subscribed to the Goodbyes Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      
      // Make the upsell
      const speechText = 'Sure.';
      return makeUpsell(speechText, goodbyesPackProduct, handlerInput);
    });
  },
};

const TellMeMoreAboutPremiumSubscriptionIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'TellMeMoreAboutPremiumSubscription';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      // const greetingsPackProduct = res.inSkillProducts.filter(
      //   record => record.referenceName === 'Greetings_Pack'
      // );

      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      if (isEntitled(premiumSubscriptionProduct)) {
        // Customer has bought the Greetings Pack. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription. ${premiumSubscriptionProduct[0].summary} ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the upsell
      const speechText = 'Sure.';
      return makeUpsell(speechText, premiumSubscriptionProduct, handlerInput);
    });
  },
};

const BuyGreetingsPackIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'BuyGreetingsPackIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const greetingsPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
      );

      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      if (isEntitled(premiumSubscriptionProduct)) {
        // Customer has bought the Premium Subscription. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription, which includes all features of the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      } else if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack. Deliver the special greetings
        const speechText = `Good News! You've already bought the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the buy offer for Greetings Pack
      return makeBuyOffer(greetingsPackProduct, handlerInput);
    });
  },
};

const BuyGoodbyesPackIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'BuyGoodbyesPackIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const goodbyesPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Goodbyes_Pack',
      );

      if (isEntitled(goodbyesPackProduct)) {
        // Customer has bought the Greetings Pack. Deliver the special greetings
        const speechText = `Good News! You've already bought the Goodbyes Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the buy offer for Greetings Pack
      return makeBuyOffer(goodbyesPackProduct, handlerInput);
    });
  },
};

const GetSpecialGreetingsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'GetSpecialGreetingsIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const greetingsPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
      );

      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      if (isEntitled(premiumSubscriptionProduct)) {
        // Customer has bought the Premium Subscription. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription, which includes all features of the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      } else if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack. Deliver the special greetings
        const speechText = `Good News! You've already bought the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the upsell
      const speechText = 'You need the Greetings Pack to get the special greeting.';
      return makeUpsell(speechText, greetingsPackProduct, handlerInput);
    });
  },
};

const BuyPremiumSubscriptionIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'BuyPremiumSubscriptionIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Premium_Subscription"
      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      // Send Connections.SendRequest Directive back to Alexa to switch to Purchase Flow
      return makeBuyOffer(premiumSubscriptionProduct, handlerInput);
    });
  },
};

const BuyResponseHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'Connections.Response'
           && (handlerInput.requestEnvelope.request.name === 'Buy'
               || handlerInput.requestEnvelope.request.name === 'Upsell');
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const productId = handlerInput.requestEnvelope.request.payload.productId;

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const product = res.inSkillProducts.filter(
        record => record.productId === productId,
      );

      if (handlerInput.requestEnvelope.request.status.code === '200') {
        let preSpeechText;

        // check the Buy status - accepted, declined, already purchased, or something went wrong.
        switch (handlerInput.requestEnvelope.request.payload.purchaseResult) {
          case 'ACCEPTED':
            preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
            break;
          case 'DECLINED':
            preSpeechText = 'No Problem.';
            break;
          case 'ALREADY_PURCHASED':
            preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
            break;
          default:
            preSpeechText = `Something unexpected happened, but thanks for your interest in the ${product[0].name}.`;
            break;
        }
        // respond back to the customer
        return getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
      }
      // Request Status Code NOT 200. Something has failed with the connection.
      console.log(
        `Connections.Response indicated failure. error: + ${handlerInput.requestEnvelope.request.status.message}`,
      );
      return handlerInput.responseBuilder
        .speak('There was an error handling your purchase request. Please try again or contact us for help.')
        .getResponse();
    });
  },
};

const PurchaseHistoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PurchaseHistoryIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then(function (result) {
      const entitledProducts = getAllEntitledProducts(result.inSkillProducts);
      if (entitledProducts && entitledProducts.length > 0) {
        const speechText = `You have bought the following items: ${getSpeakableListOfProducts(entitledProducts)}. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `You asked me for a what you've bought, here's a list ${getSpeakableListOfProducts(entitledProducts)}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }

      const speechText = 'You haven\'t purchased anything yet. To learn more about the products you can buy, say - what can I buy. How can I help?';
      const repromptOutput = `You asked me for a what you've bought, but you haven't purchased anything yet. You can say - what can I buy, or say yes to get another greeting. ${getRandomYesNoQuestion()}`;

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptOutput)
        .getResponse();
    });
  },
};

const RefundGreetingsPackIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RefundGreetingsPackIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const premiumProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
      );
      return handlerInput.responseBuilder
        .addDirective({
          type: 'Connections.SendRequest',
          name: 'Cancel',
          payload: {
            InSkillProduct: {
              productId: premiumProduct[0].productId,
            },
          },
          token: 'correlationToken',
        })
        .getResponse();
    });
  },
};

const RefundGoodbyesPackIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RefundGoodbyesPackIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const premiumProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Goodbyes_Pack',
      );
      return handlerInput.responseBuilder
        .addDirective({
          type: 'Connections.SendRequest',
          name: 'Cancel',
          payload: {
            InSkillProduct: {
              productId: premiumProduct[0].productId,
            },
          },
          token: 'correlationToken',
        })
        .getResponse();
    });
  },
};

const RefundPremiumSubscriptionIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RefundPremiumSubscriptionIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const premiumProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );
      return handlerInput.responseBuilder
        .addDirective({
          type: 'Connections.SendRequest',
          name: 'Cancel',
          payload: {
            InSkillProduct: {
              productId: premiumProduct[0].productId,
            },
          },
          token: 'correlationToken',
        })
        .getResponse();
    });
  },
};

const CancelProductResponseHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'Connections.Response'
      && handlerInput.requestEnvelope.request.name === 'Cancel'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const productId = handlerInput.requestEnvelope.request.payload.productId;
    let speechText;
    let repromptOutput;

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const product = res.inSkillProducts.filter(
        record => record.productId === productId,
      );

      console.log(
        `PRODUCT = ${JSON.stringify(product)}`,
      );

      if (handlerInput.requestEnvelope.request.status.code === '200') {
        // Alexa handles the speech response immediately following the cancellation request.
        // It then passes the control to our CancelProductResponseHandler() along with the status code (ACCEPTED, DECLINED, NOT_ENTITLED)
        // We use the status code to stitch additional speech at the end of Alexa's cancellation response.
        // Currently, we have the same additional speech (getRandomYesNoQuestion)for accepted, canceled, and not_entitled. You may edit these below, if you like.
        if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED') {
          // The cancellation confirmation response is handled by Alexa's Purchase Experience Flow.
          // Simply add to that with getRandomYesNoQuestion()
          speechText = `${getRandomYesNoQuestion()}`;
          repromptOutput = getRandomYesNoQuestion();
        } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'DECLINED') {
          speechText = `${getRandomYesNoQuestion()}`;
          repromptOutput = getRandomYesNoQuestion();
        } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'NOT_ENTITLED') {
          // No subscription to cancel.
          // The "No subscription to cancel" response is handled by Alexa's Purchase Experience Flow.
          // Simply add to that with getRandomYesNoQuestion()
          speechText = `${getRandomYesNoQuestion()}`;
          repromptOutput = getRandomYesNoQuestion();
        }
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Something failed.
      console.log(`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`);

      return handlerInput.responseBuilder
        .speak('There was an error handling your purchase request. Please try again or contact us for help.')
        .getResponse();
    });
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me! How can I help?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      return getPremiumOrRandomGoodbye(handlerInput, res);
    });
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};


const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetAnotherHelloHandler,
    NoIntentHandler,
    WhatCanIBuyIntentHandler,
    TellMeMoreAboutGreetingsPackIntentHandler,
    TellMeMoreAboutPremiumSubscriptionIntentHandler,
    TellMeMoreAboutGoodbyesPackIntentHandler,
    BuyGreetingsPackIntentHandler,
    GetSpecialGreetingsIntentHandler,
    BuyPremiumSubscriptionIntentHandler,
    BuyGoodbyesPackIntentHandler,
    BuyResponseHandler,
    PurchaseHistoryIntentHandler,
    RefundGreetingsPackIntentHandler,
    RefundPremiumSubscriptionIntentHandler,
    RefundGoodbyesPackIntentHandler,
    CancelProductResponseHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LogRequestInterceptor, LoadAttributesRequestInterceptor)
  .addResponseInterceptors(LogResponseInterceptor, SaveAttributesResponseInterceptor)
  .withTableName("premium-hello-world")
  .withAutoCreateTable(true)
  .lambda();
