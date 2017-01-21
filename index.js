'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
var rhyme = require('./rhyme');


var mongojs = require('mongojs');
var db = mongojs(process.env.mongoDBConnection );
var c = new EncodingConverter();

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text;
            processText(res, sender, text);

        }
    }
    res.sendStatus(200)
})

function findAndPostSameRhymeWords(res, sender, word) {
    word = c.toLatin(word);
    var maxResult = 100;
    var regexLevels = rhyme.rhymeRegex(word);


    db.words.find({ word: { $regex: regexLevels.level1 } }, (err, level1Result) => {
        console.log('got level 1')

        var unitedResult = level1Result;
        if (unitedResult.length < maxResult) {
            db.words.find({ word: { $regex: regexLevels.level2 } }, (err, level2Result) => {
                unitedResult = unitedResult.concat(level2Result)
                console.log('got level 2');
                if (unitedResult.length < maxResult) {
                    db.words.find({ word: { $regex: regexLevels.level3 } }, (err, level3Result) => {
                        unitedResult = unitedResult.concat(level3Result, regexLevels);
                        processResults(res, unitedResult, regexLevels, word, sender);

                    })
                } else {
                    processResults(res, unitedResult, regexLevels, word, sender);
                }
            })
        } else {
            processResults(res, unitedResult, regexLevels, word, sender);
        }

    });
}


//remove after
// app.get('/rhyme/:word', function (req, res) {
//     var maxResult = 100;
//     //res.send('all good' + req.params.word);

//     var word = req.params.word;

// })

function processResults(res, words, regexLevels, originalString, sender) {
    console.log('getting uniques');

    var uniqsObj = {};

    words.forEach(w => { uniqsObj[w.word] = { word: w.word || "" } })

    var uniqs = Object.keys(uniqsObj).map(k => uniqsObj[k]);

    console.log('got uniques');


    //assign order index 
    uniqs.forEach(word => {
        var base = 100;

        var regex1 = new RegExp(regexLevels.level1);
        var regex2 = new RegExp(regexLevels.level2);
        var regex3 = new RegExp(regexLevels.level3);

        if (regex1.test(word.word)) {
            word.orderIndex = base;
        } else if (regex2.test(word.word)) {
            word.orderIndex = base * 2;
        } else {
            word.orderIndex = base * 3;
        }

        try {
            word.orderIndex += levenshteinDistance(word.word, originalString);
        }
        catch (err) {
            console.log(err);
        }
    })

    uniqs.sort((a, b) => a.orderIndex - b.orderIndex);

    var result = uniqs.map((w, i) => (i + 1) + '. ' + c.toGeorgian(w.word)).join('\u000A');

    console.log(result);

    // 640 is fb limit on characters in message ;
    var splitted = result.match(/[^>]{1,640}/g);

    splitted.forEach((msg, index) => {
        setTimeout(sendTextMessage.bind(null, sender, msg), index * 1000);
    })


}

function processText(response, sender, text) {
    var splitted = text.trim().split(' ');
    if (splitted.length == 1) {
        sendTextMessage(sender, 'Regex');
    } else if (splitted.length > 1 && ['garitme', 'gamiritme', 'გარითმე', 'გამირითმე'].indexOf(splitted[0].trim()) != -1) {
        findAndPostSameRhymeWords(response, sender, splitted[1]);
    } else {
        sendTextMessage(sender, 'ვერ გევიგე, რა გინდა :/');
    }
}

function sendTextMessage(sender, text) {
    let messageData = { text: text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

const token = process.env.RITMA_PAGE_ACCESS_TOKEN;

function levenshteinDistance(a, b) {
    if (a.length == 0) return b.length;
    if (b.length == 0) return a.length;

    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};


function EncodingConverter() {
    var geoToLatinBinding = [
        'a', 'b', 'g', 'd', 'e', 'v', 'z', 'T', 'i', 'k', 'l', 'm', 'n', 'o', 'p', 'J', 'r', 's', 't', 'u', 'f', 'q', 'R', 'y', 'S', 'C', 'c', 'Z', 'w', 'W', 'x', 'j', 'h'
    ];
    var latinToGeoBinding = [
        'A', 'B', 'ჩ', 'D', 'E', 'F', 'G', 'H', 'I', 'ჟ', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'ღ', 'შ', 'თ', 'U', 'V', 'ჭ', 'X', 'Y', 'ძ', '[', '\\', ']', '^', '_', '`', 'ა', 'ბ', 'ც', 'დ', 'ე', 'ფ', 'გ', 'ჰ', 'ი', 'ჯ', 'კ', 'ლ', 'მ', 'ნ', 'ო', 'პ', 'ქ', 'რ', 'ს', 'ტ', 'უ', 'ვ', 'წ', 'ხ', 'ყ', 'ზ'
    ];

    this.toLatin = function (geoWord) {
        return convert(geoWord, geoToLatinBinding, 'ა', 'ჰ', 4304);
    }

    this.toGeorgian = function (latinWord) {
        return convert(latinWord, latinToGeoBinding, 'A', 'z', 65);
    }

    function convert(word, binding, min, max, charNum) {
        var buffer = []
        var i = 0;
        word.split('').forEach(function (c) {
            if (c >= min && c <= max) {
                buffer[i++] = binding[c.charCodeAt(0) - charNum];
            } else {
                buffer[i++] = c;
            }
        });
        return buffer.join('');
    }
}