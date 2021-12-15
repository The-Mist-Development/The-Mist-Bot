const { Client, Intents, Collection } = require("discord.js");
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: ["CHANNEL"]});

const token = process.env.TOKEN || require("./local_env.json").TOKEN;
const prefix = ","

client.login(token).catch(this.debug);

client.on("ready", () => {
  client.user.setActivity(`${prefix}help | I am being refactored!`, { type: "LISTENING" });
  log("[BOT] **Bot Started**")
});

// Global logging function used in every file
function log(message) {
  console.log(message);
  if (client.channels.cache) {
    client.channels.cache.get("850844368679862282").send(message);
  }
}

module.exports.log = log;