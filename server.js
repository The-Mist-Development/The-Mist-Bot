// Debug Function
const { log } = require("./botmain");

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

app.get("/countstats", (req, res) => {
  res.sendFile(process.cwd() + "/countingcache.json");
})