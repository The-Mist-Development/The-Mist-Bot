const Discord = require("discord.js");
const { music, requestRestart } = require("./music.js");
const { enableCounting, disableCounting, getMaxCount } = require("./counting.js")
const { cancelRestart } = require("./restart.js");

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
      case "cancel":
        cancelRestart(message);
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
  requestRestart();
});

process.on('uncaughtException', (reason) => {
  console.error('Uncaught Error! \n ' + reason.stack || reason);
  log("[APP] **ERR** | **Uncaught Exception:** ```" + reason.stack + "```" || reason + "```");
  if (reason.stack?.startsWith("Error: Connection terminated unexpectedly")) {
    requestRestart();
  }
});

// Help and Admin commands

function helpMsg(message) {
  message.react("📨");
  const embed = new Discord.MessageEmbed()
    .setTitle("Commands")
    .setDescription(
      "[Go to our website](https://themistbot.herokuapp.com/) to add the bot to your server."
    )
    .setColor("#d5dbe3")
    .setFooter("The Mist Bot - made by R2D2Vader")
    .addFields(
      { name: `My global prefix is \`${prefix}\``, value: "===" },
      { name: "General Commands", value: "===" },
      {
        name: "`" + prefix + "ahelp`",
        value: "If you are on the bot team, this will DM you the admin commands!"
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
        name: "`" + prefix + "stop`",
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
        value: "Get the highest counted number in a counting channel. Or specify a Channel ID to see the count from that channel."
      },
    );
  message.author.send({ embeds: [embed] });
}

function adminHelpMsg(message) {
  const embed = new Discord.MessageEmbed()
    .setTitle("Admin Commands")
    .setColor("#b9ceeb")
    .setFooter("The Mist Bot - made by R2D2Vader")
    .addFields(
      { name: `My global prefix is \`${prefix}\``, value: "===" },
      { name: "Admin Page", value: "Click [here](https://themistbot.herokuapp.com/admin.html) to visit the Admin page and send messages or changelogs." },
      {
        name: "`" + prefix + "restart`",
        value: "Restarts the bot. Do this mainly to solve weird, bot-breaking issues."
      },
      {
        name: "`" + prefix + "cancel`",
        value: "Cancel a manual or automatic restart."
      },
      {
        name: "`" + prefix + "forcerickroll <Server ID>`",
        value: "Forces the next song played, in the specified server, to be a Rickroll. Only works while music is playing and single song loop **is not enabled**."
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