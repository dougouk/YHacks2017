var express = require('express');
var app = express();

var FBBotFramework = require('fb-bot-framework');

// Initialize
var bot = new FBBotFramework({
    page_token: "EAAFTupF6DtMBADRTdRcbEnhFyyRGyaN1DXhhGnQWzib40ZAFsRiGpeEZCHuJ2ZBzWVdBzxG1UolX7xqZCdbZBVgDV4rZA4euJzFpXvdst9lXgaqf7RlKwvrTuVBgMPMnJ83kEJzXAd1pyl8OimGYd3HPgW7D0OpIZA6HAeoi9VpJwZDZD",
    verify_token: "trendy_test"
});

// Setup Express middleware for /webhook
app.use('/webhook', bot.middleware());

// Setup listener for incoming messages
bot.on('message', function(userId, message){
    // bot.sendTextMessage(userId, "Echo Message:" + message);

    // Send quick replies
    var replies = [
        {
            "content_type": "text",
            "title": "Good",
            "payload": "thumbs_up"
        },
        {
            "content_type": "text",
            "title": "Bad",
            "payload": "thumbs_down"
        }
    ];
    bot.sendQuickReplies(userId, message, replies);
});

// Setup listener for quick reply messages
bot.on('quickreply', function(userId, payload){
    bot.sendTextMessage(userId, "payload:" + payload);
});

// Config the Get Started Button and register a callback
bot.setGetStartedButton("GET_STARTED");
bot.on('postback', function(userId, payload){

    if (payload == "GET_STARTED") {
        getStarted(userId);
    }

    // Other postback callbacks here
    // ...

});

function getStarted(userId){

    // Get started process
}

// Setup listener for attachment
bot.on('attachment', function(userId, attachment){

    // Echo the audio attachment
    if (attachment[0].type == "audio") {
        bot.sendAudioAttachment(userId, attachment[0].payload.url);
    }

});

// Make Express listening
app.listen(3000, () => {
    console.log('listening on 3000')
});
