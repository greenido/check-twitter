//
// An app with a SQLite database to check twitter stats

// @author @greenido
// @date 10/2019
//
// @see
// https://github.com/topics/puppeteer
// http://expressjs.com/en/starter/static-files.html
//
// DB:
// http://www.sqlitetutorial.net/sqlite-limit/
// https://www.npmjs.com/package/sqlite3
//
const puppeteer = require("puppeteer");
var fs = require("fs");
var sqlite3 = require("sqlite3").verbose();

// init project
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

const ONE_DAY_AS_SECONDS = 60 * 60 * 24;

// init sqlite db
var dbFile = "./.data/sqlite.db";
var exists = fs.existsSync(dbFile);
var db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(function() {
  if (!exists) {
    db.run(
      "CREATE TABLE IF NOT EXISTS `stats` (`id` INTEGER PRIMARY KEY, `total` INTEGER, `comment` VARCHAR(255), `updatedAt` TEXT NOT NULL);"
    );
    console.log("New table *stats* created! 🚀 go and run it another time...");
    exists(0);
  } else {
    console.log('🏈 Database "stats" ready to go!');
    db.each("SELECT * from Stats ORDER BY total DESC limit 10;", function(
      err,
      row
    ) {
      if (row) {
        console.log("🏝 Record:", row);
      }
    });

    //
    // Start it 🚦
    //
    run();
  }
});

//
// http://expressjs.com/en/starter/basic-routing.html
//
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

//
// endpoint to get all the stats in the database
// read the sqlite3 module docs and try to add your own! https://www.npmjs.com/package/sqlite3
//
app.get("/getStats", function(request, response) {
  db.all("SELECT * from Stats ORDER BY id DESC limit 10;", function(err, rows) {
    response.send(JSON.stringify(rows));
  });
  run();
});

app.get("/checkTweetTime", function(request, response) {
  run().then(function(retMsg) {
    // here you can use the result of promise
    console.log("💽 retMsg: " + retMsg);
    response.send(retMsg);
  });
});

//
// Util to format numbers with commas
//
const numberWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

//
// The main functionality - open chrome and check the time of the tweet
//
async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    let retMsg = await getLastTweet(process.env.twitterID);
    return retMsg;
    //totalViews += parseInt(tmpStrViews);
  } catch (err) {
    console.log("⛑ ERR page: " + process.env.twitterID + " Error: " + err);
  }

  //
  // fetch the tweet and check its time
  //
  async function getLastTweet(key) {
    const pageUrl = "https://twitter.com/" + key;
    console.log("🧐 - Start with page: " + pageUrl + "  ==");
    const page = await browser.newPage();
    // await page.goto(pageUrl);  await page.waitFor(1500);
    await page.goto(pageUrl, {
      timeout: 3000000
    });

    await page.waitFor(4500);

    const VIEWS_SELECTOR = "#stream-items-id"; //li:nth-child(3)
    let tweetTime = await page.evaluate(sel => {
      let element = document.querySelector(sel);
      console.log("🏄🏻‍ HTML: " + element + " \n\n");
      return element ? element.innerHTML : null;
    }, VIEWS_SELECTOR);

    // await page.focus(VIEWS_SELECTOR);
    // await page.keyboard.type("k"); // let's play it for 5sec.
    // await page.waitFor(15000);

    let inx0 = tweetTime.indexOf("data-time") + 110; // skip the pinned tweet
    let inx1 = tweetTime.indexOf("data-time", inx0) + 11;
    let inx2 = tweetTime.indexOf("data-time-ms", inx1) - 2;
    console.log("=== inx1: " + inx1 + " 2:" + inx2);
    let tweetUnixTime = tweetTime.substring(inx1, inx2);
    let nowTime = Math.round(new Date().getTime() / 1000);

    console.log(
      "The time for last tweet from: " +
        key +
        " is: " +
        tweetUnixTime +
        " and now: " +
        nowTime
    );
    let retStr = "";
    let getInTime = nowTime - tweetUnixTime;
    if (getInTime > ONE_DAY_AS_SECONDS) {
      retStr =
        "😨 something is not working - Gap from the last tweet is: " +
        getInTime;
      console.log(retStr);
    } else {
      retStr =
        " ALL good 😎 - Gap from the last tweet is: " +
        getInTime +
        " sec. Which is: " +
        (getInTime / 3600).toFixed(2) +
        " hours";
      console.log(retStr);
    }

    var ts = Math.round(new Date().getTime());
    var now = new Date().toISOString();

    db.run(
      "INSERT INTO stats (id,total,comment,updatedAt) VALUES (?,?,?,?)",
      [ts, getInTime, retStr, now],
      dbErr => {
        if (dbErr) {
          console.log("😰 ---> " + dbErr.message);
        }
        console.log("Updated the DB for " + retStr);
      }
    );
    return retStr;
  }
}

//
// start the party - listen for requests 🕌
//
var listener = app.listen(process.env.PORT, function() {
  console.log("⛰ Your app is listening on port " + listener.address().port);
});
