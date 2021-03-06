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

const picture_balance = 'https://image.ibb.co/m9xkeb/balance.png';
const picture_pledges_count = 'https://image.ibb.co/kNBBKb/pledges_count.png';
const picture_percentage = 'https://image.ibb.co/hfVkCw/nearest_percentage.png';
const picture_heat_map = 'https://image.ibb.co/citGKb/correlation.png';

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
            callSendAPI_setup(getWhiteListedDomains());
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
        if (message.includes('analysis')) {
            // Send a text blurb
            const initialResponse = {
                'text': 'Here is the analysis of categories!'
            };
            callSendAPI(sender_psid, initialResponse);

            // send image right below
            // const imageResponse = getImageResponse(picture_3);
            // callSendAPI(sender_psid, imageResponse);

            const title = 'Category Analysis';
            const message = 'Click on a different factor for a different analysis!';
            response = getTop10Trending(picture_balance, title, message);
            callSendAPI(sender_psid, response);
        } else if (message.includes('audio')) {
            // Send a text blurb
            const initialResponse = {
                'text': 'Here are the top 3 projects in Audio!'
            };
            callSendAPI(sender_psid, initialResponse);
            const projects = [
                {
                    'title': 'New GABC Album Produced by John Evans!',
                    'postback': AUDIO1
                }, {
                    'title': 'Faith-Based EP: 2nd album by Courtney Tarpley',
                    'postback': AUDIO2
                }, {
                    'title': 'iVamos pa\' SXSW 2017!',
                    'postback': AUDIO3
                }
            ];

            let audioResponse = showTop3Projects(projects, 'Audio');
            callSendAPI(sender_psid, audioResponse);
        } else if (message.includes('outdoors') || message.includes('travel')) {
            // Send a text blurb
            const initialResponse = {
                'text': 'Here are the top 3 projects in Travel & Outdoors!'
            };
            callSendAPI(sender_psid, initialResponse);

            const projects = [
                {
                    'title': 'Audrey\'s Big Adventure',
                    'postback': TRAVEL1
                }, {
                    'title': 'Kelsey & Joe\'s Wedding Registry!',
                    'postback': TRAVEL2
                }, {
                    'title': 'David and Matt\'s Astrophotography Adventur',
                    'postback': TRAVEL3
                }
            ];

            let travelResponse = showTop3Projects(projects, 'Travel & Outdoors');
            callSendAPI(sender_psid, travelResponse);
        } else if(message.includes('heat map')) {
            // Send a text blurb
            const initialResponse = {
                'text': 'Generating heat map...'
            };
            callSendAPI(sender_psid, initialResponse);

            let heatResponse = showImageTitleMessage(picture_heat_map, 'Heat Map', '');
            callSendAPI(sender_psid, heatResponse);
        } else if (message.includes('black line')) {
            // Send a text blurb
            const initialResponse = {
                'text': 'The black lines on the graph represent predicted change. It can be a signal of growth, or loss.'
            };
            callSendAPI(sender_psid, initialResponse);
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
    let response;
    // Get the payload for the postback
    let payload = received_postback.payload;

    const title = 'Here are the results based on ' + payload;
    const message = 'Click on different factors for a different analysis!';

    const title1 = 'Product - New GABC Album Produced by John Evans!' + '\nFunding raised - $2515.00' + '\nDays funded in - 25' + '\nPercentage collected - 128%';
    const title2 = 'Product - Faith-Based EP: 2nd album by Courtney Tarpley' + '\nFunding raised - $9040.00' + '\nDays funded in - 56' + '\nPercentage collected - 109%';
    const title3 = 'Product - \'iVamos pa\' SXSW 2017!' + '\nFunding raised - $2620.00' + '\nDays funded in - 36' + '\nPercentage collected - 105%';

    const title4 = 'Product - Audrey\'s Big Adventure' + '\nFunding raised - $2045.00' + '\nPercentage collected - 78%';
    const title5 = 'Product - Kelsey & Joe\'s Wedding Registry!' + '\nFunding raised - $6589.00' + '\nPercentage collected - 92%';
    const title6 = 'Product - David and Matt\'s Astrophotography Adventure' + '\nFunding raised - $2400.00' + '\nPercentage collected - 88%';

    const message2 = 'Indicators of success:\nHigh cash collected %, partial forever funding' + '\nPain points?\nLow 100% conversion rate';
    const message1 = 'Indicators of success:\nHigh cash collected %, high balance' + '\nPain points?\nLast minute conversions';
    console.log(payload);
    // Set the response based on the postback payload
    switch (payload) {
        case PERCENTAGE:
            response = getTop10Trending(picture_percentage, title, message);
            break;
        case TOTAL_FUNDED:
            response = getTop10Trending(picture_balance, title, message);
            break;
        case NUM_OF_PLEDGES:
            response = getTop10Trending(picture_pledges_count, title, message);
            break;
        case AUDIO1:
            sendDetails(sender_psid, title1, message1);
            return;
        case AUDIO2:
            sendDetails(sender_psid, title2, message1);
            return;
        case AUDIO3:
            sendDetails(sender_psid, title3, message1);
            return;
        case TRAVEL1:
            sendDetails(sender_psid, title4, message2);
            return;
        case TRAVEL2:
            sendDetails(sender_psid, title5, message2);
            return;
        case TRAVEL3:
            sendDetails(sender_psid, title6, message2);
            return;
        case 'yes':
            response = {
                'text': 'Thanks!'
            }
            break;
        case 'no':
            response = {
                'text': 'Opps.'
            }
            break;
    }

    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    console.log(response);
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

function callSendAPI_setup(response) {
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {
            "access_token": PAGE_ACCESS_TOKEN
        },
        "method": "POST",
        "json": response
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

function getWhiteListedDomains() {
    return {'whitelisted_domains': ['https://peterssendreceiveapp.ngrok.io']}
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

const SHOW_DETAILS_AUDIO_PROJECT = 'New GABC Album Produced by John Evans!';

function showTop3Projects(projects, category) {
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": `Top 3 Projects in ${category}`,
                        "subtitle": "Choose a project to see details!",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": projects[0].title,
                                "payload": projects[0].postback
                            }, {
                                "type": "postback",
                                "title": projects[1].title,
                                "payload": projects[0].postback
                            }, {
                                "type": "postback",
                                "title": projects[2].title,
                                "payload": projects[0].postback
                            }
                        ]
                    }
                ]
            }
        }
    }
}

const TOTAL_FUNDED = 'Total Funded';
const NUM_OF_PLEDGES = 'Number of Pledges';
const PERCENTAGE = '% Funded';

function getTop10Trending(graphImage, title, message) {
    console.log('Image is ' + graphImage);
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
                                "title": "% Funded",
                                "payload": PERCENTAGE
                            }
                        ]
                    }
                ]
            }
        }
    }
}


function showImageTitleMessage(graphImage, title, message) {
    console.log('Image is ' + graphImage);
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": title,
                        "subtitle": message,
                        'image_url': graphImage
                    }
                ]
            }
        }
    }
}


const AUDIO1 = 'Audio1';
const AUDIO2 = 'Audio2';
const AUDIO3 = 'Audio3';
const TRAVEL1 = "Travel1";
const TRAVEL2 = "Travel2";
const TRAVEL3 = "Travel3";

function sendDetails(sender_psid, title, message) {
    const titleResponse = {
        "text": title
    };
    callSendAPI(sender_psid, titleResponse);

    const descriptionResponse = {
        "text": message
    };
    callSendAPI(sender_psid, descriptionResponse);
}
