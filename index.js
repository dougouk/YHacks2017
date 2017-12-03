/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */

'use strict';

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Imports dependencies and set up http server
const request = require('request'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()); // creates express http server
    app.use(express.static(__dirname + '/public'));

const picture_1 = '/kitty_1.jpeg';
const picture_2 = '/kitty_2.jpeg';
const picture_3 = 'https://static.pexels.com/photos/416160/pexels-photo-416160.jpeg';
const picture_4 = 'https://static.pexels.com/photos/127028/pexels-photo-127028.jpeg';
const picture_5 = 'https://static.pexels.com/photos/4602/jumping-cute-playing-animals.jpg';

app.set('port', process.env.PORT || 5000);
app.use(bodyParser.json());

// Sets server port and logs message on success
app.listen(process.env.PORT || app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {
    console.log('posting webhook');

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    console.log(body.object);
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Get the webhook event. entry.messaging is an array, but
            // will only ever contain one event, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender ID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {

                handlePostback(sender_psid, webhook_event.postback);
            }

        });
        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.status(404).send('NOT FOUND');
    }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

    /** UPDATE YOUR VERIFY TOKEN **/
    const VERIFY_TOKEN = 'trendy_test';

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

function handleMessage(sender_psid, received_message) {
    let response;
    const message = received_message.text;

    // Checks if the message contains text
    if (message) {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API
        if (message.includes('top 10 trends')) {
            // Send a text blurb
            const initialResponse = {'text': 'Here are the top 10 trending projects!' };
            callSendAPI(sender_psid, initialResponse);

            // send image right below
            // const imageResponse = getImageResponse(picture_3);
            // callSendAPI(sender_psid, imageResponse);

            const title = 'Top 10 Categories';
            const message = 'Click on a different factors for a different analysis!';
            response = getTop10Trending(picture_3, title, message);
            callSendAPI(sender_psid, response);
        } else if (message.includes('start typing')) {
            startTyping(sender_psid);
        } else if (message.includes('stop typing')) {
            stopTyping(sender_psid);
        } else {
            response = {
                "text": `You sent the message: "${received_message.text}".`
            }
            callSendAPI(sender_psid, response);
        }
    }

    // Send the response message
    // callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback) {
    console.log('ok')
    let response;
    // Get the payload for the postback
    let payload = received_postback.payload;

    const title = 'Here are the results based on ' + payload;
    const message = 'Click on a different factors for a different analysis!';

    // Set the response based on the postback payload
    switch(payload) {
        case TIME_TO_100K:
            response = getTop10Trending(picture_4, title, message);
            break;
        case TOTAL_FUNDED:
            response = getTop10Trending(picture_5, title, message);
            break;
        case NUM_OF_PLEDGES:
            response = getTop10Trending(picture_3, title, message);
            break;
        case 'yes':
            response = { 'text': 'Thanks!' }
            break;
        case 'no':
            response = { 'text': 'Opps.' }
            break;
    }

    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {
            "access_token": PAGE_ACCESS_TOKEN
        },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

// Show the user that the bot is 'typing'
function startTyping(senderPSID) {
    let requestBody = {
        'recipient': {
            'id': senderPSID
        },
        'sender_action': 'typing_on'
    }
    sendTypingAPI(requestBody);
}

// Show the user that the bot has stopped typing
function stopTyping(senderPSID) {
    let requestBody = {
        'recipient': {
            'id': senderPSID
        },
        'sender_action': 'typing_off'
    }
    sendTypingAPI(requestBody);
}

function sendTypingAPI(requestBody) {
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {
            "access_token": PAGE_ACCESS_TOKEN
        },
        "method": "POST",
        "json": requestBody
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

/*
    Our Functions!!
*/

function getImageResponse(imageUrl) {
    return {
        "attachment": {
            "type": "image",
            "payload": {
                "url": imageUrl,
                'is_reusable': true
            }
        }
    }
}

const TOTAL_FUNDED = 'Total Funded';
const NUM_OF_PLEDGES = 'Number of Pledges';
const TIME_TO_100K = '$100K Milestone';

function getTop10Trending(graphImage, title, message) {
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": title,
                        "subtitle": message,
                        'image_url': graphImage,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Total funded",
                                "payload": TOTAL_FUNDED
                            }, {
                                "type": "postback",
                                "title": "Number of pledges",
                                "payload": NUM_OF_PLEDGES
                            }, {
                                "type": "postback",
                                "title": "$100k Milestone",
                                "payload": TIME_TO_100K
                            }
                        ],
                        'default_action': {
                            'type': 'web url',
                            'url': graphImage,
                            'messenger_extensions': 'false',
                            'webview_height_ratio': 'FULL'
                        }
                    }
                ]
            }
        }
    }
}
