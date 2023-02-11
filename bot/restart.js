const Discord = require("discord.js");
const fs = require("fs");
const cp = require('child_process');
let killTimeout = null; 
let client;

function log(message) {
    console.log(message.replaceAll("*", "").replaceAll("`", ""));
    client.channels.cache.get("850844368679862282").send(message);
}

module.exports = {
    setRestartClient: function(variable) {
        client = variable;
    },
    restart: function() {
        log("[APP] Restarting in 20 seconds. Use `" + process.env.PREFIX + "cancel` to cancel.");
        let string = "Last restart: " + new Date().toLocaleString() 
        killTimeout = setTimeout(function () { fs.writeFile("restart.mistbot", string, function() {return;}) }, 20000)
    },
    cancelRestart: function(message) {
        if (killTimeout != null) {
            if (message.author.id == process.env.OWNER_ID || staffArray.includes(message.author.id)) {
              clearTimeout(killTimeout);
              message.react("👍");
              killTimeout = null;
              log("[BOT] Restart cancelled by <@" + message.author.id + ">.");
              return "cancelled";
            }
        }
        else message.channel.send("There is no restart to cancel!");
        return "";
    },
    npmInstall: function() {
        console.log("haha")
        cp.exec('npm install', function(err, stdout, stderr) {
            if (err) {
                log("[APP] Error executing `npm install`: ", err)
                return;
              }
              log("[APP] Ran `npm install`.");
              if (stdout) log("`stdout` ```" + stdout + "```");
              if (stderr) log("`stderr` ```" + stderr + "```");
        });
    }
}