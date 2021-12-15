// Features exclusively for The Mist server
const Discord = require("discord.js");

module.exports = {
    artValidate: async function(message) {
        if (message.attachments.size == 0) {
            message.delete();
            message.author.send("Hi " + message.member.displayName + "! Please make sure to **only post art** in the <#838834082183381092> channel. Thanks!");
            return ("[ART] **" + message.author.username + "** sent an art post without art: ```" + message.cleanContent + "```");
          }
        else return "valid";
    }
}