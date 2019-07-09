# Amazon ISP Training 2019

### Use case and training flow

The training will start by deploying a very simple 'hello world' skill and then adding to it an Premium Subscription product that will provide users with "premium" hello in different languages and spoken using different Amazon Polly voices.

The ISP product will be added intent by intent, analyzing the backend code and the reccommended patterns.

Finally, we will briefly overview the differences at handling consumables.

### Setup 

* Clone github repo and switch to ```no-isp``` branch: 

<p>

    git clone -b no-isp https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world.git
 
<p>

    cd skill-sample-nodejs-premium-hello-world.git

* deploy the skill to your US account (optionally using an alternative ASK profile):

<p>

    ask deploy [-p us_profile]

* Test the skill in the developer console.

### Add "What can I buy"

* Add the code from the gist: https://gist.github.com/lucarosellini/48c4e558f79b22f11f0902c75fdb3cc2

### Add a Subscription product

* Execute the following command from the console:
<p>

    ask add isp

Choose 'Subscription' as the template and call the product ```Premium_Subscription```.

* Check the ISP status:

<p>

    ask status --isp [-p us_profile]
    
* Copy the product metadata from: https://gist.github.com/lucarosellini/f45c78873d0232980e53624cf6495ae4

* Deploy the skill with the new ISP:
<p>

    ask deploy [-p us_profile]

* Now check how the new ISP product is shown in the developer console.

### Add "Tell me more, purchase history and buy response handler"

* Add the code from the gist: https://gist.github.com/lucarosellini/371d18b6bf6b46a702a128c9774b5c13. The "tell me more" intent integrates the upsell logic into the skill. It represents an ad-hoc intent to upsell, the skill should manage the upsell logic naturally into the skill flow.

* Deploy both the voice model and lambda:
<p>

    ask deploy [-p us_profile]

### Add "Buy intent handlers"

* Add the code from the gist: https://gist.github.com/lucarosellini/2ccb5c1411fb443502c6f85039b17b88. Overriding the ```GetAnotherHelloHandler``` is optional, the new implementation just integrates the upsell logic into the flow when the user asks for a new hello. By the way, in the previous step we already added the upsell logic by adding the "tell me more" intent.

* Deploy both the voice model and lambda:
<p>

    ask deploy [-p us_profile]

### Handle refunds

* Add the code from the gist: https://gist.github.com/lucarosellini/c75c9ab04a7aa291267cc6221649f4bd

* Deploy both the voice model and lambda:
<p>

    ask deploy [-p us_profile]

### Consumables

Check how consumables are handled in the ```master``` branch, make sure you get the following:

1. The idea is to have consumable "goodbyes". The user will pay for "premium" goodbye messages in different languages spoken with different voices.
2. Alexa only keeps track of the entitlement, is your consumable offers more than one item inside the same pack, you'll have to manually keep track of the items used. For reference, check the [```getGoodbyesCount```](https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world/blob/master/lambda/custom/utils.js#L67) method in ```utils.js```.
3. In order to store between session the number of used consumbles, you need to use a persistent attributes. Check how [```LoadAttributesRequestInterceptor```](https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world/blob/master/lambda/custom/utils.js#L310) and [```SaveAttributesResponseInterceptor```](https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world/blob/master/lambda/custom/utils.js#L322).
4. Look at how the logic is merged into the skill flow in the [```NoIntentHandler```](https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world/blob/master/lambda/custom/index.js#L53) and [```CancelAndStopIntentHandler```](https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world/blob/master/lambda/custom/index.js#L617). 

### Additiona links

You can find a more complete version of the skill having OTP (One-Time-Purchases), Consumables and Subscription at: https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world

You might find interesting check the code of the skill [expensive-pixels](https://github.com/muttoni/expensive-pixels). This skill takes a professional approach at structuring the skill code and the ISP products. 
