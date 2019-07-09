# Amazon ISP Training 2019

### Setup 

* Clone github repo and switch to ```no-isp``` branch: 

<p>

    git clone -b no-isp https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world.git
 
<p>

    cd skill-sample-nodejs-premium-hello-world.git

* deploy the skill to your US account (optionally using an alternative ASK profile):

<p>

    ask deploy [-p us_profile]

* Check the skill is working fine in the developer console.

### Add "What can I buy"

* Add the code from the gist: https://gist.github.com/lucarosellini/48c4e558f79b22f11f0902c75fdb3cc2

### Add a Subscription product

* Execute the following command from the console:

    ask add isp

Choose 'Subscription' as the template and call the product ```Premium_Subscription```.

The generated subscription is based on a predefined template, copy the product metadata from: https://gist.github.com/lucarosellini/f45c78873d0232980e53624cf6495ae4

* Deploy the skill with the new ISP:
<p>

    ask deploy [-p us_profile]

### Add "Tell me more, purchase history and buy response handler"

* Add the code from the gist: https://gist.github.com/lucarosellini/371d18b6bf6b46a702a128c9774b5c13

* Deploy both the voice model and lambda:
<p>

    ask deploy [-p us_profile]

### Add "Upsell and Buy intent handlers"

* Add the code from the gist: https://gist.github.com/lucarosellini/2ccb5c1411fb443502c6f85039b17b88

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

1. Alexa only keeps track of the entitlement, is your consumable offers more than one item inside the same pack, you'll have to manually keep track of the items used. For reference, check: https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world/blob/master/lambda/custom/utils.js#L67
2. In order to store between session the number of used consumbles, you need to use a persistent attributes. Check how request and response interceptors work for this: https://github.com/lucarosellini/skill-sample-nodejs-premium-hello-world/blob/master/lambda/custom/utils.js#L67



