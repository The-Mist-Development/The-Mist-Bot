const { Discord, EmbedBuilder, Embed } = require("discord.js");
const { music, requestRestart, resetVar } = require("./music.js");
const { enableCounting, disableCounting, getMaxCount, setDisconnected, subscribe, unsubscribe, getSubscribedChannels, updateCache } = require("./database.js")
const { restart, cancelRestart } = require("./restart.js");
const { wishlistCommand } = require("./wishlist.js")

const prefix = process.env.PREFIX;
let killTimeout = null;
let client;

let staffArray = process.env.STAFF_IDS.split('&');

module.exports = {
  setClient: function (variable) {
    client = variable;
  },
  respond: function (message) {
    let args = message.content
      .slice(prefix.length)
      .trim()
      .split(/ +/);
    let command = args.shift().toLowerCase();

    switch (command) {
      case "help":
        helpMsg(message);
        break;
      case "ahelp":
        adminHelpMsg(message);
        break;
      case "restart":
        tryRestart(message);
        break;
      case "frestart":
        if (message.author.id == process.env.OWNER_ID || staffArray.includes(message.author.id)) {
          log("Forced Restart requested by <@" + message.author.id + ">.");
          restart();
        }
        break;
      case "cancel":
        if (message.author.id == process.env.OWNER_ID || staffArray.includes(message.author.id)) {
          tryCancel(message);
        }
        break;
      case "enablecounting":
        enableCounting(message);
        break;
      case "disablecounting":
        disableCounting(message);
        break;
      case "maxcount":
        if (args[0]) {
          let lookupChannel = client.channels.cache.get(args[0]);
          if (lookupChannel) {
            getMaxCount(message, lookupChannel);
          }
          else {
            message.channel.send("I can't find that channel! Try again with a **valid Channel ID**.")
          }
        }
        else getMaxCount(message);
        break;
      case "updatecache":
        if (message.author.id == process.env.OWNER_ID || staffArray.includes(message.author.id)) {
          message.react("📲")
          updateCache();
        }
        break;
      case "sendmsg":
        sendMessage(message, args);
        break;
      case "subscribe":
        subscribe(message);
        break;
      case "unsubscribe":
        unsubscribe(message);
        break;
      case "update":
        sendUpdate(message, args.join(" "));
        break;
      case "wishlist":
        wishlistCommand(message, args);
        break;
      case "play":
      case "p":
      case "pause":
      case "resume":
      case "skip":
      case "stop":
      case "queue":
      case "q":
      case "remove":
      case "np":
      case "loop":
      case "loopqueue":
      case "loopq":
      case "forcerickroll":
      case "clear":
      case "leave":
        music(message, command, args);
        break;
      default:
        message.channel.send(
          `\`${command}\` is not a command. **Type** \`${prefix}help\` **to see the list of commands**.`
        );
        break;
    }
    return;
  }
}

// This file's log message
function log(message) {
  console.log(message.replaceAll("*", "").replaceAll("`", ""));
  client.channels.cache.get("850844368679862282").send(message);
}

// Error Handling
// not crash on unhandled promise rejection, log then exit (auto restarts on Heroku)
process.on('unhandledRejection', (reason, promise) => {
  log("[APP] **ERR** | **Unhandled Promise Rejection:** ```" + reason.stack + "```" || reason + "```");
  if (reason.stack?.startsWith("DiscordAPIError: Missing Permissions")) {
    return log("Missing Permissions for something basic. No big deal.");
  }
  requestRestart();
});

process.on('uncaughtException', (reason) => {
  console.error('Uncaught Error! \n ' + reason.stack || reason);
  log("[APP] **ERR** | **Uncaught Exception:** ```" + reason.stack + "```" || reason + "```");
  if (reason.stack?.startsWith("Error: Connection terminated unexpectedly")) {
    setDisconnected();
  }
  if (reason.stack?.includes("Unexpected token < in JSON at position 0")) return log("[APP] A server responded with HTML or an error instead of JSON. Not restarting.")
  requestRestart();
});

// Help and Admin commands

function helpMsg(message) {
  message.react("📨").catch((err) => {});
  const embed = new EmbedBuilder()
    .setTitle("Commands")
    .setDescription(
      "[Click here](https://discord.com/api/oauth2/authorize?client_id=630381078963552267&permissions=70634560&scope=bot) to add the bot to your server. \r The Mist Bot is open source - [click here](https://github.com/The-Mist-Development/The-Mist-Bot) to view the source code and contribute."
    )
    .setColor("#d5dbe3")
    .setFooter({text: "The Mist Bot - made by R2D2Vader"})
    .addFields(
      { name: `My global prefix is \`${prefix}\``, value: "===" },
      { name: "General Commands", value: "===" },
      {
        name: "`" + prefix + "ahelp`",
        value: "If you are on the bot team, this will DM you the admin commands!"
      },
      {
        name: "`" + prefix + "subscribe`",
        value: "Subscribe to updates from us in any channel! Requires the `Manage Channels` permission."
      },
      {
        name: "`" + prefix + "unsubscribe`",
        value: "Unsubscribe from our updates in an already subscribed channel. Requires the `Manage Channels` permission."
      },
      {
        name: "`" + prefix + "wishlist`",
        value: "Get notified when games on your Steam Wishlist go on sale! Run this command for the subcommand help menu."
      },
      { name: "🎵 Music Commands", value: "===" },
      {
        name: "`" + prefix + "play <Song Name / URL / Playlist URL>`",
        value: "Play the first result on YouTube for the Song Name, or the YouTube video / playlist at the link you provide."
      },
      {
        name: "`" + prefix + "pause` / `" + prefix + "resume`",
        value: "Pause or Resume the music."
      },
      {
        name: "`" + prefix + "skip`",
        value: "Skip the currently playing song."
      },
      {
        name: "`" + prefix + "stop` / `" + prefix + "leave`",
        value: "Clear the queue and stop the music."
      },
      {
        name: "`" + prefix + "queue`",
        value: "View the queue."
      },
      {
        name: "`" + prefix + "remove <Song Index>`",
        value: "Remove the specified song from the queue."
      },
      {
        name: "`" + prefix + "clear`",
        value: "Clear the entire queue."
      },
      {
        name: "`" + prefix + "np`",
        value: "View information about the currently playing song."
      },
      {
        name: "`" + prefix + "loop` / `" + prefix + "loopqueue`",
        value: "Toggle either looping the current song or looping the whole queue."
      },
      { name: "🔢 Counting", value: "===" },
      {
        name: "`" + prefix + "enablecounting`",
        value: "Enable Counting in a channel. Requires the `Manage Channels` permission."
      },
      {
        name: "`" + prefix + "disablecounting`",
        value: "Disable Counting in a channel. Requires the `Manage Channels` permission."
      },
      {
        name: "`" + prefix + "maxcount <optional Channel ID>`",
        value: "Get the highest counted number in a counting channel. Or specify a Channel ID to see the max count from that channel."
      },
    );
  message.author.send({ embeds: [embed] }).catch((err) => {message.channel.send("Unable to DM you the help message. 😔")});
}

function adminHelpMsg(message) {
  const embed = new EmbedBuilder()
    .setTitle("Admin Commands")
    .setColor("#b9ceeb")
    .setFooter({text: "The Mist Bot - made by R2D2Vader"})
    .addFields(
      { name: `My global prefix is \`${prefix}\``, value: "===" },
      { name: "Admin Page", value: "Click [here](https://themistbot.herokuapp.com/admin.html) to visit the Admin page and send messages or changelogs." },
      {
        name: "`" + prefix + "restart`",
        value: "Restarts the bot. Do this mainly to solve weird, bot-breaking issues."
      },
      {
        name: "`" + prefix + "frestart`",
        value: "Forces the bot to restart. Run this only if the normal restart command has failed to restart / errored, or you urgently need to restart the bot!"
      },
      {
        name: "`" + prefix + "cancel`",
        value: "Cancel a manual or automatic restart."
      },
      {
        name: "`" + prefix + "forcerickroll <Server ID>`",
        value: "Forces the next song played, in the specified server, to be a Rickroll. Only works while music is playing and single song loop **is not enabled**."
      },
      {
        name: "`" + prefix + "sendmsg <Text Channel ID> <Message>`",
        value: "Sends a message in the specified text channel."
      },
      {
        name: "`" + prefix + "update <Title>`",
        value: "Sends an update message out to all subscribed channels. You will be prompted to provide fields for the embed."
      },
      {
        name: "`" + prefix + "updatecache`",
        value: "Manually updates the list of counting channels from the database."
      },
    );

  if (message.author.id == process.env.OWNER_ID) {
    embed.setDescription(
      `Hello, Bot Owner **${message.author.username}**!`
    )
    message.author.send({ embeds: [embed] });
    message.react("💌");
  }
  else if (staffArray.includes(message.author.id)) {
    embed.setDescription(
      `Hello, Bot Admin **${message.author.username}**!`
    )
    message.author.send({ embeds: [embed] });
    message.react("📩");
  }
}

function tryRestart(message) {
  if (message.author.id == process.env.OWNER_ID || staffArray.includes(message.author.id)) {
    message.react("👌");
    requestRestart(message);
  }
}

function tryCancel(message) {
  let result = cancelRestart(message);
  if (result) {
    if (result == "cancelled") resetVar();
  }
}

function sendMessage(message, args) {
  if (message.author.id == process.env.OWNER_ID || staffArray.includes(message.author.id)) {
    let channel = client.channels.cache.get(args.shift());
    if (channel) {
      if (channel.type == "GUILD_TEXT") {
        if (channel.permissionsFor(client.user.id).has("SEND_MESSAGES")) {
          channel.send(args.join(" "));
          message.react("📤");
        }
        else return message.channel.send(`I **don't have permission** to send messages in <#${channel.id}>!`);
      }
      else return message.channel.send(`The channel <#${channel.id}> is not a **Guild Text channel**! I cannot send messages there.`);
    }
    else return message.channel.send(`That isn't a **valid Channel ID**, or is a channel that I don't have access to! Please try again.`);
  }
  else message.channel.send(`\`sendmsg\` is not a command. **Type** \`${prefix}help\` **to see the list of commands**.`)
}

async function sendUpdate(fmessage, title) {
  if (title == "") return fmessage.channel.send("You need to provide a title!");
  if (fmessage.author.id == process.env.OWNER_ID || staffArray.includes(fmessage.author.id)) {
    fmessage.channel.send("What should the fields be for update **" + title + "**? (Type `cancel` to cancel)\rFormat:\r```Field name=Field value|Field name=Field value|...```");
    let filter = m => m.author.id == fmessage.author.id
    fmessage.channel.awaitMessages({
      filter,
      max: 1,
      time: 30000,
      errors: ['time']
    })
      .then(async function (collected) {
        let message = collected.first()

        if (message.content.toLowerCase() == "cancel") return message.channel.send("Cancelled sending the update.");
        if (!message.content.includes("=")) return message.channel.send("That doesn't look like a valid field format! Cancelled sending the update.");

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(
            "R2D2Vader and kamicavi just patched the bot! Here are the updates."
          )
          .setColor(Math.floor(Math.random() * 16777215).toString(16))
          .setFooter({text: "The Mist Bot - made by R2D2Vader"})
        const fields = message.content.split("|");

        for (i = 0; i < fields.length; i++) {
          const parts = fields[i].split("=");
          embed.addFields({ name: parts[0], value: parts[1] });
        }

        fmessage.channel.send({ content: "**Preview** update embed. Type `confirm` to send the update, or `cancel` to cancel.", embeds: [embed] });
        fmessage.channel.awaitMessages({
          filter,
          max: 1,
          time: 30000,
          errors: ['time']
        })
          .then(async function (collected) {
            let message2 = collected.first()

            if (message2.content.toLowerCase() == "confirm") {
              message2.react("✅");
              let channels = await getSubscribedChannels();
              for (let i = 0; i < channels.length; i++) {
                client.channels.cache.get(channels[i]).send({ embeds: [embed] });
              }
              fmessage.channel.send("Update sent!");
            }

            else if (message2.content.toLowerCase() == "cancel") fmessage.channel.send("Cancelled sending the update.");

            else fmessage.channel.send("Invalid response! Cancelled sending the update.");
          })
          .catch(collected => {
            if (collected.size == 0) fmessage.channel.send('Cancelled sending the update - Timeout.');
            else fmessage.channel.send('Cancelled sending the update - An error occurred.');
          });
      })
      .catch(collected => {
        if (collected.size == 0) fmessage.channel.send('Cancelled sending the update - Timeout.');
        else fmessage.channel.send('Cancelled sending the update - Double check that your field format is correct.');
      });

  }
  else fmessage.channel.send(`\`update\` is not a command. **Type** \`${prefix}help\` **to see the list of commands**.`)
}