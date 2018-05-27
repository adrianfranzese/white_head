"use strict";
let scripts, sourceAdrian, sourceTrump
let rmAdrian, rmTrump
let scene, adrianHTML, trumpHTML, adrianProfile, trumpProfile;
let adrianText, trumpText, adrianTokens, trumpTokens
let order = 3;

function preload() {
  sourceAdrian = loadStrings("data/text/my_chats_all.txt");
  sourceTrump = loadStrings("data/text/trump_tweets.txt");
  scripts = loadStrings('data/text/movie_scripts.txt');
}

function setup() {
  noCanvas();
  // createCanvas(windowWidth,windowHeight).id('canvas')
  // createP("Click to start").parent('scene');

  // Initialize RiTa Markov with source text
  rmAdrian = new RiMarkov(order);
  rmAdrian.loadText(sourceAdrian.join(' '));
  rmTrump = new RiMarkov(order);
  rmTrump.loadText(sourceTrump.join(' '));

  // scene = createP('').parent('#scene')
  // createElement('b', 'ADRIAN').parent('#dialogue').class('name');
  // adrianHTML = createP('...').parent("dialogue")
  // createElement('b', 'TRUMP').parent('#dialogue').class('name');
  // trumpHTML = createP('...').parent("dialogue")

  // Initialize HTML elements
  scene = select('p', '#scene')
  adrianHTML = select('#adrianDialogue')
  trumpHTML = select('#trumpDialogue')

  adrianProfile = select('#adrianProfile')
  trumpProfile = select('#trumpProfile')

  // setInterval(mousePressed, 10000);

}

function mousePressed() {
  imageTags = []
  //scene.remove();
  //dialogue.remove();

  // select('#scene').remove();
  // select('#dialogue').remove();
  // select('#trumpProfile').remove();
  // select('#adrianProfile').remove();
  // clear();

  // createDiv('').id('scene').parent('script');
  // createP( random(scripts) ).parent('scene');

  //dialogue = createDiv('').parent(container);
  adrianText = rmAdrian.generateSentence()
  trumpText = rmTrump.generateSentence();

  // adrianTokens = splitTokens(adrianText, [' ', '.', '?', '!', '/'])
  // trumpTokens = splitTokens(trumpText, [' ', '.', '?', '!', '/'])
  adrianTokens = split(adrianText, ' ')
  trumpTokens = split(trumpText, ' ')
  // console.log(adrianTokens)
  // console.log(trumpTokens)

  scene.html(random(scripts))
  adrianHTML.html(adrianText)
  trumpHTML.html(trumpText)

  getAzure(sentiment, trumpText, adrianText);
  getAzure(keywords, trumpText, adrianText);

  // createDiv('').id('dialogue').parent('script');
  // createP( adrianText ).parent('dialogue');
  //
  // createP( trumpText ).parent('dialogue');


  //console.log( s.analyze(trumpText).score );

  //createImg('data/trump_pos.jpg').id('trumpProfile');



}

// Fullscreen on/off on "Spacebar" press
function keyReleased() {
  if (keyCode == 32) {
    let fs = fullscreen()
    fullscreen(!fs)
  }
}

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
        'Ocp-Apim-Subscription-Key': '6d720b9eb27e47b595cae27a1ee85461',
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
  // console.log(results.documents[0].score);
  if (trumpMood > 0.6) {
    // console.log('Trump is feeling good');
    // createImg('data/images/trump_good.jpg').id('trumpProfile').parent('#container');
    trumpProfile.style('background-image', 'url("data/images/trump_good.gif")')
  } else if (trumpMood < 0.4) {
    // console.log('Trump is feeling bad')
    // createImg('data/images/trump_bad.jpg').id('trumpProfile').parent('#container');
    trumpProfile.style('background-image', 'url("data/images/trump_bad.gif")')
  } else {
    // console.log('Trump is neutral')
    // createImg('data/images/trump_neutral.jpg').id('trumpProfile').parent('#container');
    trumpProfile.style('background-image', 'url("data/images/trump_neutral.gif")')
  }

  let adrianMood = results.documents[1].score;
  if (adrianMood > 0.6) {
    // console.log('Adrian is feeling good');
    // createImg('data/images/trump_good.jpg').id('adrianProfile').parent('#container');
    adrianProfile.style('background-image', 'url("data/images/adrian_good.gif")')
  } else if (adrianMood < 0.4) {
    // console.log('Adrian is feeling bad');
    // createImg('data/images/trump_good.jpg').id('adrianProfile').parent('#container');
    adrianProfile.style('background-image', 'url("data/images/adrian_bad.gif")')
  } else {
    // console.log('Adrian is neutral');
    // createImg('data/images/trump_good.jpg').id('adrianProfile').parent('#container');
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
        'Ocp-Apim-Subscription-Key': '4f9d3e47c3234199a718f4bfa8180e43'
      }
    },
    function(res) {
      res = JSON.parse(res)
      if (res.value[0]) {
        // let imgURL = res.value[0].thumbnailUrl
        // img = createImg(res.value[0].thumbnailUrl, keyword).class('inlineImage')
        img = '<img src=\"' + res.value[0].thumbnailUrl + '\" class=\"inlineImage\">'
        // imageTags.push([who, keyword, img.elt.outerHTML])
        imageTags.push([who, keyword, img])
        insertImages()
        //  [0]  [1]      [2]
        // let i = trumpText.match(keyword).index
        // trumpHTML.html( trumpHTML.html().substring(0, i) + img.elt.outerHTML + ' ' + trumpHTML.html().substring(i) )
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
      // trumpHTML.html( trumpHTML.html().substring(0, i) + x[1] + ' ' + trumpHTML.html().substring(i) )
      trumpReplacedText = trumpReplacedText.substring(0, splitPoint) + imgElem + ' ' + trumpReplacedText.substring(splitPoint)
    } else if (meOrTrump == 1) {
      let splitPoint = adrianReplacedText.match(keyword).index
      // adrianHTML.html( adrianHTML.html().substring(0, i) + x[1] + ' ' + adrianHTML.html().substring(i) )
      adrianReplacedText = adrianReplacedText.substring(0, splitPoint) + imgElem + ' ' + adrianReplacedText.substring(splitPoint)
    }
  }
  console.log(trumpReplacedText)
  trumpHTML.html(trumpReplacedText)
  adrianHTML.html(adrianReplacedText)
}
