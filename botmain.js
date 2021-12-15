const { Client, Intents, MessageEmbed} = require("discord.js");
const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: ["CHANNEL"]});

const token = process.env.TOKEN;
const prefix = ","

let ready = false;

client.login(token).catch(this.debug);

client.on("ready", () => {
  ready = true;
  client.user.setActivity(`${prefix}help | I am being refactored!`, { type: "LISTENING" });
  log("[BOT] **Bot Started**");
  clearPlayground.start();
});

// Global logging function used for important things in every file
function log(message) {
  console.log(message);
  if (ready == true) {
    client.channels.cache.get("850844368679862282").send(message);
  }
}

// Set up the module exports
module.exports = {
  updateFromWeb: async function(title, body) {
    const embed = new MessageEmbed()
      .setTitle(title)
      .setDescription(
        "R2D2Vader just patched the bot! Here are the updates."
      )
      .setColor(Math.floor(Math.random() * 16777215).toString(16))
      .setFooter("The Mist Bot - made by R2D2Vader");
  
    const fields = body.split("|");
  
    for (i = 0; i < fields.length; i++) {
      const parts = fields[i].split("=");
      embed.addFields({ name: parts[0], value: parts[1] });
    }
  
    const channels = process.env.UPDATE;
    const array = channels.split('&');
    for (i = 0; i < array.length; i++) {
      client.channels.cache.get(array[i]).send({embeds: [embed]});
    }
  },
  sendMsg: function(ID, message) {
    const channel = client.channels.cache.get(ID);
    channel.send(message);
  },
  evalInBot: function(code) {
    eval(code);
  }
}
module.exports.log = log;

// cron job for clearing dark playground every week
const CronJob = require('cron').CronJob;

const clearPlayground = new CronJob('0 35 19 * * 0', async function () {
  let fetched;
  const naughtychannel = client.channels.cache.get("878638710726475867");
  do {
    fetched = await naughtychannel.messages.fetch({ limit: 100 });
    naughtychannel.bulkDelete(fetched);
  }
  while (fetched.size >= 2);
}, null, true, 'Europe/London');