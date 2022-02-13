const Discord = require("discord.js");

// Settings
const lmaomode = true;
const janmode = true;

module.exports = {
    react: function(message) {
        const msgcontent = message.content.toLowerCase();

        if (lmaomode == true) {
          if (msgcontent.includes("100%")) {
            message.react("💯");
          }
          if (msgcontent.includes("lmao")) {
            message.react("🇱");
            message.react("Ⓜ");
            message.react("🅰️");
            message.react("🇴");
          }
          if (msgcontent.includes("lmfao")) {
            message.react("🇱");
            message.react("Ⓜ");
            message.react("🇫");
            message.react("🅰️");
            message.react("🇴");
          }
          if (msgcontent.includes("bruh")) {
            message.react("<:BRUH:815919351970529290>");
          }
        }

        if (janmode == true && message.guild.id == "780901822734532659") {
            if (msgcontent.includes("jan ") || msgcontent.includes(" jan ") || msgcontent == "jan") {
              message.react("🐸");
            }
            if (msgcontent.includes("alkali")) {
              message.react("🇦");
              message.react("🇨");
              message.react("🇮");
              message.react("🇩");
            }
        }
    }
}