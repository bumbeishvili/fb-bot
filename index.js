'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
var rhyme = require('./rhyme');


var mongojs = require('mongojs');
var db = mongojs(process.env.mongoDBConnection);
var conversationsDB = mongojs(process.env.loggingConnection);

var c = new EncodingConverter();

var maxResult = 100;

app.set('port', (process.env.PORT || 5000))
// app.listen(3000, function () {
//   console.log('listening on 3000')
// })

// // Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// // Process application/json
app.use(bodyParser.json())



app.post('/api/answers/save', function (req, res) {

  var post_data = JSON.parse(Object.keys(req.body)[0]);
  if (!post_data._id) {
    post_data._id = "ID" + Math.floor(Math.random() * 1000000) + Date.now();
  }

  conversationsDB.answers.save(post_data, { w: 1 }, (err, data) => {
    res.json(data);
  })


})


app.get('/api/answers', function (req, res) {

  conversationsDB.answers.find().toArray(function (err, items) {
    res.json(items);
  });

})

app.get('/', function (req, res) {
  res.send('Hello world, I am a chat bot')
})

//conversations
app.get('/conversations', function (req, res) {
  var regex = '.';
  conversationsDB.conversations.find({ message: { $regex: regex } }, (err, messages) => {
    try {
      res.json(messages);
    } catch (err) {
      console.log(err);
    }

  })
})

app.get('/admin', function (req, res) {
  res.sendFile(__dirname + '/views/admin.html')
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



function findAndPostRegexWords(res, sender, word) {
  var regex = c.toLatin(word);
  console.log(regex);
  db.words.find({ word: { $regex: regex } }, (err, words) => {
    try {


      console.log('got regex');
      console.log(words);

      var result = words.filter(w => w.word).map((w, i) => (i + 1) + '. ' + c.toGeorgian(w.word)).join('\u000A');
      // 640 is fb limit on characters in message ;
      var splitted = result.match(/[^>]{1,640}/g);
      console.log()
      if (splitted) {
        splitted.forEach((msg, index) => {
          if (index < 8) {
            setTimeout(sendTextMessage.bind(null, sender, msg), index * 1000);
          }

        })
      }
    } catch (err) {
      sendTextMessage(sender, err)
    }

  })
}

function findAndPostSameRhymeWords(res, sender, word) {
  word = c.toLatin(word);
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


// //remove after
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

  var result = uniqs.filter(w => w.word.trim()).map((w, i) => (i + 1) + '. ' + c.toGeorgian(w.word)).join('\u000A');

  console.log(result);

  // 640 is fb limit on characters in message ;
  var splitted = result.match(/[^>]{1,640}/g);

  splitted.forEach((msg, index) => {
    if (index < 1) {
      setTimeout(sendTextMessage.bind(null, sender, msg), index * 1000);
    }

  })


}

function processText(response, sender, text) {
  var splitted = text.trim().split(' ');

  if (splitted.length > 1 && ['regex', 'reg', 'რეგექსი', 'იპოვე', 'მოძებნე'].indexOf(splitted[0].trim()) != -1) {
    findAndPostRegexWords(response, sender, splitted[1]);
  } else if (splitted.length > 1 && ['garitme', 'gamiritme', 'გარითმე', 'გამირითმე'].indexOf(splitted[0].trim()) != -1) {
    findAndPostSameRhymeWords(response, sender, splitted[1]);
  } else {
    var logObj = { sender: sender, message: text, date: new Date() };

    if (sender != 369999366702204) {
      conversationsDB.messages.insert(logObj);
    }

    conversationsDB.answers.find().toArray(function (err, items) {  
      var responseMessage = getResponse(c.toGeorgian(text), items);
      sendTextMessage(sender, responseMessage);
    });




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


function getResponse(message, data) {
  var result = [];
  var resp;
  var lastDiff = 1;
  data.forEach(a => {
    var minDiff = 1;
    var maxQuestion = "";

    a.questions.forEach(q => {
      var lev = levenshteinDistance(q, message);
      var dist = lev / Math.max(q.length, message.length);
      if (dist < minDiff) {
        maxQuestion = q;
        minDiff = dist;
      }
    })

    result.push({ minDiff: minDiff, message: maxQuestion, answers: a.answers })
    if (minDiff < lastDiff) {
      lastDiff = minDiff;
      resp = a.answers[Math.floor(Math.random() * a.answers.length)]
    }

  })
  resp = [resp,'სიზუსტე ' + (100-lastDiff*100).toFixed(0)+'%'].join('\u000A \u000A')
  return resp;
}

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