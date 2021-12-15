// Debug Function
const { log, updateFromWeb, sendMsg, evalInBot } = require("./botmain");

// Constants
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

//app.use(function (req, res, next) {
//    // We console.log here because there's no reason to log every request in Discord. This is just for debugging. 
//    // I'll probably comment it out when deployed anyway as Heroku Router provides this logging for us.
//    console.log(
//      "[ROUTER] Request recieved to " + req.url + " from " + req.headers["x-forwarded-for"] || req.ip
//    );
//    next();
//  });
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const listener = app.listen(process.env.PORT, () => {
  log("[WEB] Listening on port " + listener.address().port);
});

app.post("/send", (req, res) => {
  const { token, chanID, msgContent } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    log("[WEB] **ALERT**: Authentication for /send failed with invalid token: " + token);
    res.status(401).end();
    return;
  }
  res.status(202).end();
  log("[WEB] Sending message to " + chanID + " with content: " + msgContent);
  sendMsg(chanID, msgContent);
})

app.post("/eval", (req, res) => {
  const { token, code } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    log("[WEB] **ALERT**: Authentication failed **for /eval** with invalid token: " + token);
    log("[WEB] Code attempted to run: \r```js\r" + code + "\r```");
    res.status(401).end();
    return;
  }
  res.status(202).end();
  log("[WEB] **ALERT**: Executing the following code from the web console: \r```js\r" + code + "\r```");
  evalInBot(code)
  return;
})

app.post("/update", (req, res) => {
  const { token, updatemsg, updatebody } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    log("[WEB] **ALERT**: Authentication failed for /update with invalid token: " + token);
    res.status(401).end();
    return;
  }
  updateFromWeb(updatemsg, updatebody);
  res.status(202).end();
})