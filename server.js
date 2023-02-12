// Debug Function
const { log, updateFromWeb, sendMsg, evalInBot } = require("./botmain");

// Constants
const fs = require("fs");

const express = require("express");
const app = express();
const http = require('http').Server(app);
const bodyParser = require("body-parser");

let https;
let sslEnabled = process.env.SSL;

if (sslEnabled == "TRUE") {
  const privateKey = fs.readFileSync(process.env.SSL_PRIVATEKEY_PATH, 'utf8');
  const certificate = fs.readFileSync(process.env.SSL_CERTIFICATE_PATH, 'utf8');
  const ca = fs.readFileSync(process.env.SSL_CA_PATH, 'utf8');
  const credentials = {
  	key: privateKey,
  	cert: certificate,
  	ca: ca
  };
  https = require('https').Server(credentials, app);
}

http.listen(80, () => {
  log("[HTTP] Listening on port 80");
});

if (sslEnabled == "TRUE") https.listen(443, () => {
  log("[HTTPS] Listening on port 443");
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// routes
app.use(function (req, res, next) {
    //console.log("[" + new Date().toLocaleString() + "] [app.use] Route: " + req.url + " | IP: " + req.ip);

    if (!req.secure && sslEnabled == "TRUE") {
        return res.redirect("https://" + req.headers.host + req.url);
    }

    next();
});

app.use(express.static("public"));

app.get("/messups", (req, res) => {
  res.sendFile(process.cwd() + "/messupcache.json");
})

//app.post("/send", (req, res) => {
//  const { token, chanID, msgContent } = req.body;
//  if (token != process.env.ADMIN_TOKEN) {
//    log("[WEB] **ALERT**: Authentication for /send failed with invalid token: " + token);
//    res.status(401).end();
//    return;
//  }
//  res.status(202).end();
//  log("[WEB] Sending message to " + chanID + " with content: " + msgContent);
//  sendMsg(chanID, msgContent);
//})
//
//app.post("/eval", (req, res) => {
//  const { token, code } = req.body;
//  if (token != process.env.ADMIN_TOKEN) {
//    log("[WEB] **ALERT**: Authentication failed **for /eval** with invalid token: " + token);
//    log("[WEB] Code attempted to run: \r```js\r" + code + "\r```");
//    res.status(401).end();
//    return;
//  }
//  res.status(202).end();
//  log("[WEB] **ALERT**: Executing the following code from the web console: \r```js\r" + code + "\r```");
//  evalInBot(code)
//  return;
//})
//
//app.post("/update", (req, res) => {
//  const { token, updatemsg, updatebody } = req.body;
//  if (token != process.env.ADMIN_TOKEN) {
//    log("[WEB] **ALERT**: Authentication failed for /update with invalid token: " + token);
//    res.status(401).end();
//    return;
//  }
//  updateFromWeb(updatemsg, updatebody);
//  res.status(202).end();
//})