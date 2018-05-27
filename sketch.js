"use strict";
let scripts, sourceAdrian, sourceTrump
let rmAdrian, rmTrump
let scene, adrianHTML, trumpHTML, adrianProfile, trumpProfile;
let adrianText, trumpText
let order = 3;

function preload() {
  sourceAdrian = loadStrings("data/text/my_chats_all.txt");
  sourceTrump = loadStrings("data/text/trump_tweets.txt");
  scripts = loadStrings('data/text/movie_scripts.txt');
}

function setup() {
  noCanvas();
  // Initialize RiTa Markov with source text
  rmAdrian = new RiMarkov(order);
  rmAdrian.loadText(sourceAdrian.join(' '));
  rmTrump = new RiMarkov(order);
  rmTrump.loadText(sourceTrump.join(' '));

  // Initialize HTML elements
  scene = select('p', '#scene')
  adrianHTML = select('#adrianDialogue')
  trumpHTML = select('#trumpDialogue')

  adrianProfile = select('#adrianProfile')
  trumpProfile = select('#trumpProfile')

  // Creates a new scene every 10 seconds (for display purposes)
  setInterval(newScene, 10000);
}

function newScene() {
  // Clear array of image urls
  imageTags = []
  // Generate a new sentence from sources
  adrianText = rmAdrian.generateSentence()
  trumpText = rmTrump.generateSentence();

  // Print a random scene from scripts file
  scene.html(random(scripts))
  // Print the newly generated sentences
  adrianHTML.html(adrianText)
  trumpHTML.html(trumpText)

  // Run Azure sentiment analysis on the generated texts
  getAzure(sentiment, trumpText, adrianText);
  // Run Azure keyword analysis on the generated texts
  getAzure(keywords, trumpText, adrianText);
  // Prepare to enter ~ ~ CALLBACK HELL ~ ~
}

// Fullscreen on/off on "Spacebar" press
function keyReleased() {
  if (keyCode == 32) {
    let fs = fullscreen()
    fullscreen(!fs)
  }
}

// Endpoint APIs for Azure
let sentiment = 'https://australiaeast.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';
let keywords = 'https://australiaeast.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases';

function getAzure(url, sentence01, sentence02) {
  var payload = {
    'documents': [{
        'language': 'en',
        'id': '1',
        'text': sentence01
      },
      {
        'language': 'en',
        'id': '2',
        'text': sentence02
      },
    ]
  };
  payload = JSON.stringify(payload);
  httpDo(
    url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': '6d720b9eb27e47b595cae27a1ee85461', // Shhhh
        'Content-Type': 'application/json'
      },
      body: payload
    },
    function(result) {
      result = JSON.parse(result);
      if (url == sentiment) {
        runSentimentCode(result);
      } else if (url == keywords) {
        runKeywordsCode(result);
      } else {
        console.log("Something is fishy...");
      }
    }
  );
}


function runSentimentCode(results) {
  let trumpMood = results.documents[0].score;
  if (trumpMood > 0.6) {
    trumpProfile.style('background-image', 'url("data/images/trump_good.gif")')
  } else if (trumpMood < 0.4) {
    trumpProfile.style('background-image', 'url("data/images/trump_bad.gif")')
  } else {
    trumpProfile.style('background-image', 'url("data/images/trump_neutral.gif")')
  }

  let adrianMood = results.documents[1].score;
  if (adrianMood > 0.6) {
    adrianProfile.style('background-image', 'url("data/images/adrian_good.gif")')
  } else if (adrianMood < 0.4) {
    adrianProfile.style('background-image', 'url("data/images/adrian_bad.gif")')
  } else {
    adrianProfile.style('background-image', 'url("data/images/adrian_neutral.gif")')
  }
}

let imageTags = []

function runKeywordsCode(results) {
  results = results.documents;

  for (let i = 0; i < results.length; i++) { // loops through the two results (adrian text, trump text)
    if (results[i].keyPhrases.length > 0) { // if a keyword is returned, continue
      for (let keyword of results[i].keyPhrases) { // Loop through all the keywords in the array
        searchImages(i, keyword)
      }
    }
  }
}

let imageSearchURL = 'https://api.cognitive.microsoft.com/bing/v7.0/images/search?count=1&q='

function searchImages(who, keyword) {
  let escaped = escape(keyword)
  let img
  httpDo(
    imageSearchURL + escaped, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': '4f9d3e47c3234199a718f4bfa8180e43' // Shhhh
      }
    },
    function(res) {
      res = JSON.parse(res)
      if (res.value[0]) {
        img = '<img src=\"' + res.value[0].thumbnailUrl + '\" class=\"inlineImage\">'
        imageTags.push([who, keyword, img])
        insertImages()
      }
    },
    function(error) {
      console.log(error)
    }
  )
}

function insertImages() {
  let trumpReplacedText = trumpText
  let adrianReplacedText = adrianText
  for (let item of imageTags) {
    let meOrTrump = item[0]
    let keyword = item[1]
    let imgElem = item[2]
    if (meOrTrump == 0) {
      let splitPoint = trumpReplacedText.match(keyword).index
      trumpReplacedText = trumpReplacedText.substring(0, splitPoint) + imgElem + ' ' + trumpReplacedText.substring(splitPoint)
    } else if (meOrTrump == 1) {
      let splitPoint = adrianReplacedText.match(keyword).index
      adrianReplacedText = adrianReplacedText.substring(0, splitPoint) + imgElem + ' ' + adrianReplacedText.substring(splitPoint)
    }
  }
  trumpHTML.html(trumpReplacedText)
  adrianHTML.html(adrianReplacedText)
}
