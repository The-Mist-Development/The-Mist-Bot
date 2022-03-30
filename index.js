require("dotenv").config();

// Run bot
const bot = require("./botmain.js");


// Run webserver
if (process.env.WEBSITE == "TRUE") {
    const server = require("./server.js"); 
}
