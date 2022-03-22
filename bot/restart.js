const Discord = require("discord.js");
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
        log("Restarting in 20 seconds. Use `" + process.env.PREFIX + "cancel` to cancel.");
        killTimeout = setTimeout(function () { process.kill(process.pid, 'SIGTERM'); }, 20000)
    },
    cancelRestart: function(message) {
        if (killTimeout != null) {
            if (message.author.id == process.env.OWNER_ID || staffArray.includes(message.author.id)) {
              clearTimeout(killTimeout);
              message.react("👍");
              killTimeout = null;
              log("[BOT] Restart cancelled by <@" + message.author.id + ">.");
            }
          }
    },
}