const Discord = require("discord.js");

// Settings
const lmaomode = false;
const janmode = true;

module.exports = {
    react: function(message) {
        if (message.guild.id == "311623758395998219") return;
        
        const msgcontent = message.content.toLowerCase();

        if (lmaomode == true) {

          if (msgcontent.includes("lmaof")) {
            message.react("🇱").catch((err) => {return;});
            message.react("Ⓜ").catch((err) => {return;});
            message.react("🅰️").catch((err) => {return;});
            message.react("🇴").catch((err) => {return;});
            message.react("🇫").catch((err) => {return;});
          }
          else if (msgcontent.includes("lamof")) {
            message.react("🇱").catch((err) => {return;});
            message.react("🅰️").catch((err) => {return;});
            message.react("Ⓜ").catch((err) => {return;});
            message.react("🇴").catch((err) => {return;});
            message.react("🇫").catch((err) => {return;});
          }
          else if (msgcontent.includes("lmfao")) {
            message.react("🇱").catch((err) => {return;});
            message.react("Ⓜ").catch((err) => {return;});
            message.react("🇫").catch((err) => {return;});
            message.react("🅰️").catch((err) => {return;});
            message.react("🇴").catch((err) => {return;});
          }
          else if(msgcontent.includes("mfw")) {
            message.react("🇲").catch((err) => {return;});
            message.react("🇫").catch((err) => {return;});
            message.react("🇼").catch((err) => {return;});
          }
          else if (msgcontent.includes("lmao")) {
            message.react("🇱").catch((err) => {return;});
            message.react("Ⓜ").catch((err) => {return;});
            message.react("🅰️").catch((err) => {return;});
            message.react("🇴").catch((err) => {return;});
          }      

          if (msgcontent.includes("100%")) {
            message.react("💯").catch((err) => {return;});
          }
          
          if (msgcontent.includes("bruh")) {
            message.react("<:BRUH:815919351970529290>").catch((err) => {return;});
          }
        }

        if (janmode == true && message.guild.id == "780901822734532659") {
            if (msgcontent.includes("jan ") || msgcontent.includes(" jan ") || msgcontent == "jan") {
              message.react("🐸").catch((err) => {return;});
            }
        }
    }
}
