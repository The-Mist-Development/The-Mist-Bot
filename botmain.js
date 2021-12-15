const Discord = require("discord.js");
const client = new Discord.Client();

const token = process.env.TOKEN || require("./local_env.json").TOKEN;
const prefix = ","

client.login(token).catch(this.debug);

module.exports = {
  debug(message) {
      console.log(message);
      if (client.channels.cache) {
        client.channels.cache.get("850844368679862282").send(message);
      }
  }
}