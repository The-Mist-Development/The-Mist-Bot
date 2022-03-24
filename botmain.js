const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES], partials: ["CHANNEL"] });

const token = process.env.TOKEN;
const prefix = process.env.PREFIX;

// Import other files
const { respond, setClient } = require("./bot/commands.js");
const { react } = require("./bot/reactions.js");
const { artValidate } = require("./bot/exclusive.js");
const { setup } = require("./bot/music.js");
const { setRestartClient } = require("./bot/restart.js");
const { getCountingChannels, count, dbConnect } = require("./bot/counting.js");

let ready = false;

client.login(token).catch(log);

client.on("ready", async () => {
  ready = true;
  client.user.setActivity(`${prefix}help | I am being refactored!`, { type: "LISTENING" });
  log("[BOT] **Bot Started**");
  setClient(client);
  setup(client);
  setRestartClient(client);
  clearPlayground.start();
  dbConnect();
});

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;
  if (!message.content) return;
  
  // art channel validation
  if (message.channel.id == "838834082183381092") {
    let result = (await artValidate(message)).valueOf();
    if (result != "valid") {
      log(result);
    }
  }

  // counting
  let channels = await getCountingChannels();

  if (channels.includes(message.channel.id)) {
    if (+message.content === +message.content && !message.content.includes(".")) {
      count(message)
    }
    else {
      message.react("👌")
    }
  }

  // command handling
  if (message.content.startsWith(prefix)) {
    respond(message);
  }

  // reactions
  if (message.guild) {
    react(message);
  }
});

// Global logging function used for important things in many places
function log(message) {
  console.log(message.replaceAll("*", "").replaceAll("`", ""));
  if (ready == true) {
    client.channels.cache.get("850844368679862282").send(message);
  }
}

// Set up the module exports
module.exports = {
  updateFromWeb: async function (title, body) {
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
      client.channels.cache.get(array[i]).send({ embeds: [embed] });
    }
  },
  sendMsg: function (ID, message) {
    const channel = client.channels.cache.get(ID);
    channel.send(message);
  },
  evalInBot: function (code) {
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