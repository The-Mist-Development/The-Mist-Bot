// init site
const express = require('express');
const bodyParser = require("body-parser");
const app = express();

// init discord bot
const Discord = require("discord.js");
const client = new Discord.Client();

const token = process.env.TOKEN || require("./local_env.json").TOKEN;
const prefix = ",";


const fetch = require('node-fetch');


const lmaomode = true;
const janmode = true;
const rickrollchance = 1;
rickrolld = false;
djmode = false;
djuser = "";
loopingBool = false;
let cachedCount = -1;


// overall debug function
function debug(message) {
  console.log(message)
  client.channels.cache.get("850844368679862282").send(message);
}


// heroku db

const { Client } = require("pg");
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

dbClient.connect(err => {
  if (err) {
    console.error('Connection error while connecting to database: ' + err.stack)
  } else {
    console.log('Connected to Database');
    dbClient.query("SELECT * FROM exclusive WHERE key='count';", (err, res) => {
      let row = (JSON.stringify(res.rows[0]));
      let countString = row.toString().slice(24);
      cachedCount = parseInt(countString);
    });
  }
});

// discord bot login
client.login(token).catch(console.error);

client.on("ready", () => {
  client.user.setActivity(",help | WORKING AGAIN???", { type: "LISTENING" });
  debug("[BOT] **Bot Started!**");
  clearPlayground.start();
});

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

// init music player
// const { Player } = require('./Player/index.js');
const { Player } = require('discord-music-player');
const player = new Player(client, {
  leaveOnEnd: true,
  leaveOnStop: true,
  leaveOnEmpty: true,
  timeout: 30000
});
client.player = player;

// error reporting for client.player (to discord)
// Init the event listener only once (at the top of your code).
client.player
  .on('error', (error, message) => {
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    switch (error) {
      // Thrown when the YouTube search could not find any song with that query.
      case 'SearchIsNull':
        debug(`[PLAYER] ${time} | No song with the provided query was found. | ${message.guild}`);
        message.channel.send("**Couldn't find a song** for that query.")
        break;
      // Thrown when the provided YouTube Playlist could not be found.
      case 'InvalidPlaylist':
        debug(`[PLAYER] ${time} | No Playlist was found with the provided link. | ${message.guild}`);
        message.channel.send("**Couldn't find that playlist**. Are you sure it exists?")
        break;
      // Thrown when the provided Spotify Song could not be found.
      case 'InvalidSpotify':
        debug(`[PLAYER] ${time} | No Spotify Song was found with the provided link. | ${message.guild}`);
        break;
      // Thrown when the Guild Queue does not exist (no music is playing).
      case 'QueueIsNull':
        debug(`[PLAYER] ${time} | Guild Queue does not exist - no music is playing. | ${message.guild}`);
        break;
      // Thrown when the Members is not in a VoiceChannel.
      case 'VoiceChannelTypeInvalid':
        debug(`[PLAYER] ${time} | Member was not in VC while trying to play music. | ${message.guild}`);
        break;
      // Thrown when the current playing song was an live transmission (that is unsupported).
      case 'LiveUnsupported':
        debug(`[PLAYER] ${time} | Attempt to play unsupported YouTube Livestream. | ${message.guild}`);
        message.channel.send("Sorry! We **don't support Youtube Livestreams** for now!");
        break;
      // Thrown when the current playing song was unavailable.
      case 'VideoUnavailable':
        debug(`[PLAYER] **ERR** | ${time} | A song video was unavailable. | ${message.guild}`);
        message.channel.send("😓 **Something went wrong playing that song!** Please try a different song. If the issue persists, contact R2D2Vader#0693.");
        break;
      // Thrown when provided argument was Not A Number.
      case 'NotANumber':
        debug(`[PLAYER] **ERR** | ${time} | The provided argument was Not A Number. | ${message.guild}`);
        break;
      // Thrown when the first method argument was not a Discord Message object.
      case 'MessageTypeInvalid':
        debug(`[PLAYER] **ERR** | ${time} | Discord-Music-Player did not receive the Message object. | ${message.guild}`);
        break;
      default:
        debug(`[PLAYER] **ERR** | ${time} | **Unknown Error Ocurred** | ${message.guild} | ` + "```" + (error.stack || error) + "```");

        if (message.channel) { message.channel.send("😓 **Something went wrong!** Please try again in a few minutes. If the issue persists, contact R2D2Vader#0693"); }
        else { client.channels.cache.get(error.stack || error).send("😓 **Something went wrong!** Please try again in a few minutes. If the issue persists, contact R2D2Vader#0693"); }

        if (error.includes("permission") || error.includes("Permission")) {
          message.channel.send("🚫 I don't have the permissions I need - Discord told me this: `" + error + "`");
          break;
        }
        else if (error.includes("Status code:")) {
          message.channel.send("YouTube returned an error code. Restarting the bot to potentially fix this issue.");
          debug("Killing process to try and fix error status code.");
          setTimeout(function() {process.kill(process.pid, 'SIGTERM');}, 1000)
        }
        break;
    }
  });

client.player.on('songAdd', (message, queue, song) => {
  if (client.player.isPlaying(message)) {
    message.channel.send(`** ${song.name} ** was added to the queue!`)
  }
})
  .on('songFirst', (message, song) =>
    message.channel.send(`🎵 Playing Now: **${song.name}** 🎶`))
  .on('songChanged', (message, newSong, oldSong) => {
    if (loopingBool == false) {
      message.channel.send(`🎵 Playing Now: **${newSong.name}** 🎶`)
    }
  })
  .on('playlistAdd', (message, queue, playlist) => {
    message.channel.send(`Playlist **${playlist.name}** with ${playlist.videoCount} videos was added to the queue!`)
  });

// Handle Messages
client.on("message", message => {
  if (message.author.bot) return;
  if (!message.content) return;

  // art channel validation
  if (message.channel.id == "838834082183381092") {
    artValidate(message);
  }

  // counting
  if (message.channel.id == "864513696596492378") {
    doCounting(message);
  }

  // reactions 
  const msgcontent = message.content.toLowerCase();
  if (lmaomode == true) {
    if (msgcontent.includes("100%")) {
      message.react("💯");
    }
    if (msgcontent.includes("lmao")) {
      message.react("🇱");
      message.react("🇲");
      message.react("🅰️");
      message.react("🇴");
    }
    if (msgcontent.includes("lmfao")) {
      message.react("🇱");
      message.react("🇲");
      message.react("🇫");
      message.react("🅰️");
      message.react("🇴");
    }
    if (msgcontent.includes("bruh")) {
      message.react("<:BRUH:815919351970529290>");
    }
  }
  if (janmode == true) {
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

  if (!message.content.startsWith(prefix)) return;

  // args itself is only used by the play function
  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/);
  const command = args.shift().toLowerCase();

  // main switch command
  // music control commands do not accept input while dj mode is on 
  switch (command) {
    case "help":
      sendHelp(message);
      break;
    case "wip":
      sendWIP(message);
      break;
    case "play":
    case "p":
      if (djmode == true) break;
      if (args.length == 0) return;
      if (message.member.voice.channel) {
        if (message.content.toLowerCase().includes("list=")) {
          playNotSong(message, args);
        }
        else {
          playSong(message, args);
        }
      } else {
        message.channel.send(
          "**You must be in a Voice Channel to play music!**"
        );
      }
      break;
    case "pause":
      if (djmode == true) break;
      if (message.member.voice.channel) {
        let isPlaying = client.player.isPlaying(message);
        if (isPlaying) {

          client.player.pause(message);
          message.channel.send("⏸ **Paused!**");

        } else {
          message.channel.send("**Nothing's playing in this server** 😢");
        }
      } else {
        message.channel.send(
          "**You must be in the Voice Channel to pause the music!**"
        );
      }
      break;
    case "resume":
      if (djmode == true) break;
      if (message.member.voice.channel) {
        let isPlaying = client.player.isPlaying(message);
        if (isPlaying) {

          client.player.resume(message);
          message.channel.send("▶ **Resumed!**");

        } else {
          message.channel.send("**Nothing's playing in this server** 😢");
        }
      } else {
        message.channel.send(
          "**You must be in the Voice Channel to resume the music!**"
        );
      }
      break;
    case "loop":
      if (djmode == true) break;
      if (message.member.voice.channel) {
        let isPlaying = client.player.isPlaying(message);
        if (isPlaying) {
          let toggle = client.player.toggleLoop(message);
          if (toggle) {
            message.channel.send("🔁 **Looping the current song**");
            loopingBool = true;
          }
          else {
            message.channel.send("**Loop Disabled.**");
            loopingBool = false;
          }
        } else {
          message.channel.send("**Nothing's playing in this server** 😢");
        }
      } else {
        message.channel.send(
          "**You must be in the Voice Channel to loop the current song!**"
        );
      }
      break;
    case "loopqueue":
    case "loopq":
      if (djmode == true) break;
      if (message.member.voice.channel) {
        let isPlaying = client.player.isPlaying(message);
        if (isPlaying) {
          let toggle = client.player.toggleQueueLoop(message);
          if (toggle) {
            message.channel.send("🔁 **Looping the entire queue**");
            loopingBool = true;
          }
          else {
            message.channel.send("** Queue Loop Disabled.**");
            loopingBool = false;
          }
        } else {
          message.channel.send("**Nothing's playing in this server** 😢");
        }
      } else {
        message.channel.send(
          "**You must be in the Voice Channel to loop the queue!**"
        );
      }
      break;
    case "queue":
    case "q":
      getQueue(message);
      break;
    case "np":
      nowPlaying(message);
      break;
    case "skip":
      if (djmode == true) break;
      if (message.member.voice.channel) {
        let isPlaying = client.player.isPlaying(message);
        if (isPlaying) {
          client.player.skip(message);
          message.channel.send("⏭ **Skipped!**");
        } else {
          message.channel.send("**Nothing's playing in this server** 😢");
        }
      } else {
        message.channel.send(
          "**You must be in the Voice Channel to skip the current song!**"
        );
      }
      break;
    case "leave":
      if (djmode == true) break;
      if (message.member.voice.channel) {
        client.player.stop(message);
        message.channel.send("👋 **Bye!** See you another time.");
      } else {
        return;
      }
      break;
    case "lyrics":
      sendLyrics(message);
      break;
    case "dj":
      djAction(message);
      break;
    case "restart":
      if (message.member.id == "517742819830399000" || message.member.id == "459596793936871424") {
        tryRestart(message);
      }
      break;
    case "frestart":
      if (message.member.id == "459596793936871424") {
        tryForcedRestart(message);
      }
      break;
    default:
      message.channel.send(
        "`" +
        command +
        "` is not a command. **Type** `" +
        prefix +
        "help` **to see the list of commands**"
      );
      break;
  }
});

client.on('messageDelete', message => {
  if (message.channel.id != "864513696596492378") return;
  if (+message.content === +message.content) {
    if (cachedCount == -1) {
      message.channel.send("⚠ A message by " + message.author.username + " was deleted! 🤔 I'm not sure what the count is now... **try checking further up in the channel**.")
    }
    else {
      message.channel.send("⚠ A message by " + message.author.username + " was deleted! **The last number sent was " + cachedCount + "**.");
    }
  }
});

client.on('messageUpdate', (oldmessage, newmessage) => {
  if (oldmessage.channel.id != "864513696596492378") return;
  if (+oldmessage.content === +oldmessage.content) {
    if (cachedCount == -1) {
      oldmessage.channel.send("⚠ " + oldmessage.author.username + ", we all saw you edit that message! 🤔 I'm not sure what the count is now... **try checking further up in the channel**.")
    }
    else {
      oldmessage.channel.send("⚠ " + oldmessage.author.username + ", we all saw you edit that message! **The last number sent was " + cachedCount + "**.");
    }
  }
});

function doCounting(message) {
  if (cachedCount == -1) {
    message.channel.send("I haven't been able to connect to the database yet! Hold your horses.");
    message.react("❎");
    return;
  }

  if (+message.content === +message.content) {
    dbClient.query("SELECT * FROM exclusive WHERE key='count';", (err, res) => {
      if (err) {
        message.channel.send("Error connecting to the database. The count is still " + cachedCount + ". Contact R2D2Vader#0693 if the issue persists.");
        message.react("❎");
        debug("[DB] **ERR** |" + err.stack || err);
      }
      else {
        let row = (JSON.stringify(res.rows[0]));
        continueCounting(message, row);
      }
    });
  }
  else {
    message.react("👌");
  }
}

function continueCounting(message, row) {
  let countString = row.toString().slice(24);
  let counte = parseInt(countString);
  let userInput = parseInt(message.content, 10);
  if (userInput === counte + 1) {
    message.react("<a:mistbot_confirmed:870070841268928552>");
    dbClient.query("UPDATE exclusive SET value = " + (counte + 1).toString() + "WHERE key='count'");
    cachedCount = counte + 1;
  }
  else {
    dbClient.query("UPDATE exclusive SET value = 0 WHERE key='count'");
    message.channel.send("**" + message.member.displayName + "** ruined the count at `" + counte + "`! `The count reset.`");
    message.react("❌");
    message.channel.send("Next number is `1`.");
    // quick fix to make the maxcount work
    counte = counte - 1;
    cachedCount = 0;
  }

  dbClient.query("SELECT * FROM exclusive WHERE key='maxcount';", (err, res) => {
    let maxString = JSON.stringify(res.rows[0]).toString().slice(27);
    let oldMax = parseInt(maxString);

    if (counte + 1 > oldMax) {
      dbClient.query("UPDATE exclusive SET value = " + (counte + 1).toString() + "WHERE key='maxcount'");
    }
  });
}

// experimental restart function
function tryRestart(message) {
  if (message.member.id == "517742819830399000") {
    message.react("<a:mistbot_loading:818438330299580428>");
    debug("Killing process on authority of R2D2Vader#0693");
    setTimeout(function() {process.kill(process.pid, 'SIGTERM');}, 1000)
  }
  else if (message.member.id == "459596793936871424") {
    message.react("📩");
    debug("<@459596793936871424> are you sure you want to kill the process? Respond with `" + prefix + "frestart` to confirm.");
  }
}

function tryForcedRestart(message) {
  if (message.channel.id == "850844368679862282" && message.member.id == "459596793936871424") {
    message.react("<a:mistbot_loading:818438330299580428>");
    debug("Killing process on authority of kamicavi#5608");
    setTimeout(function() {process.kill(process.pid, 'SIGTERM');}, 1000)
  }
}

// the ,play command for playlists
async function playNotSong(message, args) {
  let isPlaying = client.player.isPlaying(message);
  // If there's already a song playing
  if (isPlaying) {
    // Add the song to the queue
    await client.player.playlist(message, {
      search: args.join(' '),
      maxSongs: -1
    });
  } else {
    const loading = await message.channel.send("<a:mistbot_loading:818438330299580428> Loading...");
    // delete loading if something else errors
    setTimeout(function () {
      if (client.player.isPlaying(loading.guild.id)) return;
      if (loading.deleted) return;
      loading.delete()
        .then(function () { message.channel.send("😓 **Something went wrong!** Please contact **R2D2Vader#0693** and inform them of the time you ran the command.") });
    }, 10000);

    let list = await client.player.playlist(message, {
      search: args.join(' '),
      maxSongs: -1
    });

    loading.delete();
  }
}


// the ,play command
async function playSong(message, args) {
  let isPlaying = client.player.isPlaying(message);
  // If there's already a song playing
  if (isPlaying) {
    // Add the song to the queue
    let song = await client.player.play(
      message,
      args.join(" ")
    );
  } else {
    const loading = await message.channel.send("<a:mistbot_loading:818438330299580428> Loading...");
    // delete loading if something else errors
    setTimeout(function () {
      if (client.player.isPlaying(loading.guild.id)) return;
      if (loading.deleted) return;
      loading.delete()
        .then(function () { message.channel.send("😓 **Something went wrong!** Please contact **R2D2Vader#0693** and inform them of the time you ran the command.") });
    }, 10000);
    // check for rickroll
    if (args[args.length - 1] == "-r") {
      args = ["never", "gonna", "give", "you", "up", "rick", "astley"];
    }

    // random rickroll chance
    if (rickrollchance >= 1) {
      random = Math.floor(Math.random() * 100);
      if (random <= rickrollchance) {
        args = ["never", "gonna", "give", "you", "up", "rick", "astley"];
        rickrolld = true;
      }
    }
    // Play the song
    let song = await client.player.play(
      message,
      args.join(" ")
    );

    // handle random rickroll
    if (rickrolld == true) {
      message.channel.send("<a:mistbot_rickroll:821480726163226645> **Rickroll'd!** Sorry I just couldn't resist haha <a:mistbot_rickroll:821480726163226645>");
      rickrolld = false;
    }
    loading.delete();
  }
}

// the ,queue command
async function getQueue(message) {
  let isPlaying = client.player.isPlaying(message);

  if (isPlaying) {
    const queue = await client.player.getQueue(message);

    const embed = new Discord.MessageEmbed()
      .setTitle("Queue for " + message.guild.name)
      .setFooter("The Mist Bot - made by R2D2Vader")
      .addFields({
        name: "`Now Playing` **" + queue.songs[0].name + "**",
        value: "Duration: " + queue.songs[0].duration
      });

    for (let i = 1; i < queue.songs.length; i++) {
      embed.addFields({
        name: "`" + i + "` **" + queue.songs[i].name + "**",
        value: "Duration: " + queue.songs[i].duration
      });
    }

    message.channel.send(embed);
  } else {
    message.channel.send("**Nothing's playing in this server** 😢");
  }
}

// main help command
function sendHelp(message) {
  const embed = new Discord.MessageEmbed()

    .setTitle("Commands")
    .setDescription(
      "[Go to our website](https://themistbot.herokuapp.com/) to add the bot to your server."
    )
    .setColor("#d5dbe3")
    .setFooter("The Mist Bot - made by R2D2Vader")
    .addFields(
      { name: "My global prefix is " + prefix, value: "===" },
      { name: "General Commands", value: "===" },
      {
        name: "`" + prefix + "wip`",
        value: "See work in progress commands! \n"
      },
      { name: "🎵 Music Commands", value: "===" },
      {
        name: "`" + prefix + "play <Song Name / URL / Playlist URL>`",
        value: "Play the first result on YouTube for the Song Name, or the YouTube video at the URL you provide. Alternatively, add every song in a YouTube Playlist to the queue by providing its link."
      },
      {
        name: "`" + prefix + "pause` / " + "`" + prefix + "resume`",
        value: "Pause or Resume the music."
      },
      {
        name: "`" + prefix + "queue`",
        value: "View the song queue of this server."
      },
      { name: "`" + prefix + "np`", value: "Gives you info on the currently playing song." },
      { name: "`" + prefix + "leave`", value: "Stops playing, clears the queue, and leaves." },
      { name: "`" + prefix + "skip`", value: "Skips the current song." },
      { name: "`" + prefix + "loop`", value: "Toggles looping the current song." },
      { name: "`" + prefix + "lyrics <Optional Song Name and Artist>`", value: "Gets lyrics of either the currently playing song, or the Song Name you specify. \n If specifying the song name, specify the Artist as well for better results" },
      { name: "`" + prefix + "dj`", value: "Starts a DJ session where only the DJ controls the music. The DJ uses `,dj <command>` to control the music." }
    );

  message.channel.send(embed);
}

// ,wip command
function sendWIP(message) {
  const embed = new Discord.MessageEmbed()
    .setTitle("Work In Progress")
    .setFooter("The Mist Bot - made by R2D2Vader")
    .setDescription("This is a list of all the work-in-progress commands which are not on the help message. You can try them out if you'd like!")
    .addFields(
      { name: "Commands I'm working on:", value: "===" },
      { name: "`" + prefix + "loopqueue`", value: "Loops the entire queue." }
    );

  message.channel.send(embed);
}

// ,np command
async function nowPlaying(message) {
  let isPlaying = client.player.isPlaying(message);

  if (isPlaying) {
    const queue = await client.player.getQueue(message);

    let progressBar = client.player.createProgressBar(message, {
      size: 40,
      block: '-',
      arrow: '🔴'
    });

    const embed = new Discord.MessageEmbed()
      .setTitle("Now Playing: " + queue.songs[0].name)
      .setURL(queue.songs[0].url)
      .setFooter("The Mist Bot - made by R2D2Vader")
      .setThumbnail(queue.songs[0].thumbnail)
      .addFields(
        {
          name: "👤",
          value: "Channel: " + queue.songs[0].author
        },
        {
          name: "⌚",
          value: "`" + progressBar + "`"
        }
      );

    message.channel.send(embed);
  } else {
    message.channel.send("**Nothing's playing in this server** 😢");
  }
}

// Complex ,DJ control command
async function djAction(message) {
  if (message.guild.id !== "780901822734532659") return;
  const args = message.content.trim().split(" ");
  args.shift();
  if (args == "") {
    // base command to get ownership
    if (djmode == false) {
      djmode = true;
      djuser = message.member.displayName;
      // give them the role
      const djrole = message.guild.roles.cache.find(role => role.name === 'The Mist DJ');
      message.member.roles.add(djrole);
      message.channel.send("💿 **DJ Mode** activated 🎛 🎚");
    }
    else {
      message.channel.send("**" + djuser + "** is already the DJ!");
    }
    return;
  }
  if (djmode == false) {
    message.channel.send("DJ Mode is **not yet active**. Become the DJ by doing `" + prefix + "dj`")
    return;
  }
  if (message.member.roles.cache.some(role => role.name === 'The Mist DJ')) {
    // DJ command switch, calls the same functions as the regular commands
    switch (args[0]) {
      case "end":
        djmode = false;
        const djrole = message.guild.roles.cache.find(role => role.name === 'The Mist DJ');
        message.member.roles.remove(djrole);
        message.channel.send("🎛 **" + djuser + "** is no longer the DJ.");
        djuser = "";
        break;
      case "play":
        if (message.member.voice.channel) {
          if (message.content.toLowerCase().includes("list=")) {
            playNotSong(message, args);
          }
          else {
            args.shift();
            playSong(message, args);
          }
        } else {
          message.channel.send(
            "**🎛 Get in the Voice Channel, DJ!**"
          );
        }
        break;
      case "pause":
        if (message.member.voice.channel) {
          let isPlaying = client.player.isPlaying(message);
          if (isPlaying) {

            client.player.pause(message);
            message.channel.send("⏸ **Paused!**");

          } else {
            message.channel.send("**Nothing's playing**, DJ! Play us a song! 🎚");
          }
        } else {
          message.channel.send(
            "**🎛 Get in the Voice Channel** to pause the music, DJ!"
          );
        }
        break;
      case "resume":
        if (message.member.voice.channel) {
          let isPlaying = client.player.isPlaying(message);
          if (isPlaying) {

            client.player.resume(message);
            message.channel.send("▶ **Resumed!**");

          } else {
            message.channel.send("**Nothing's playing**, DJ! Play us a song! 🎚");
          }
        } else {
          message.channel.send(
            "**🎛 Get in the Voice Channel** to resume the music, DJ!"
          );
        }
        break;
      case "loop":
        if (message.member.voice.channel) {
          let isPlaying = client.player.isPlaying(message);
          if (isPlaying) {
            let toggle = client.player.toggleLoop(message);
            if (toggle) message.channel.send("🔁 **Looping the current song**");
            else message.channel.send("**Loop Disabled.**");
          } else {
            message.channel.send("**Nothing's playing**, DJ! Play us a song! 🎚");
          }
        } else {
          message.channel.send(
            "**🎛 Get in the Voice Channel** to loop the current song, DJ!"
          );
        }
        break;
      case "skip":
        if (message.member.voice.channel) {
          let isPlaying = client.player.isPlaying(message);
          if (isPlaying) {
            client.player.skip(message);
            message.channel.send("⏭ **Skipped!**");
          } else {
            message.channel.send("**Nothing's playing**, DJ! Play us a song! 🎚");
          }
        } else {
          message.channel.send(
            "**🎛 Get in the Voice Channel** to loop the current song, DJ!"
          );
        }
        break;
      case "leave":
        if (message.member.voice.channel) {
          client.player.stop(message);
          message.channel.send("👋 **Bye DJ!** 🎚");
          djmode = false;
          const djrole = message.guild.roles.cache.find(role => role.name === 'The Mist DJ');
          message.member.roles.remove(djrole);
          message.channel.send("🎛 **" + djuser + "** is no longer the DJ.");
          djuser = "";
        } else {
          return;
        }
        break;
      default:
        message.channel.send("🎚 Hey DJ, `" + args[0] + "` **is not a valid DJ command**.")
        break;
    }
  }
}

// lyrics command, powered by api.ksoft.si
async function sendLyrics(message) {
  const args = message.content.trim().split(" ");
  args.shift();
  if (args == "") {
    let isPlaying = client.player.isPlaying(message);
    if (isPlaying) {
      const queue = await client.player.getQueue(message);

      const options = {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + process.env.KSOFT,
        },
      };

      const response = await fetch("https://api.ksoft.si/lyrics/search?q=" + queue.songs[0].name + "&limit=1", options);
      const resdata = await response.json();
      // resdata.data[0].property

      var max = 1024;
      var content = "";
      var content2 = "";
      var long = false;

      if (resdata.data[0].lyrics.length <= max) {
        content = resdata.data[0].lyrics;
      }
      else {
        var slicedContent = resdata.data[0].lyrics.substring(0, max);
        content = slicedContent.substring(0, slicedContent.lastIndexOf("\n"));
        if (resdata.data[0].lyrics.length <= max * 2) {
          content2 = resdata.data[0].lyrics.substring(slicedContent.lastIndexOf("\n"));
          long = true;
        }
        else {
          content = "Sorry! " + resdata.data[0].name + "'s lyrics are a **bit too long**. View them by clicking the link in the title!";
        }
      }

      const embed = new Discord.MessageEmbed()
        .setTitle(resdata.data[0].name + " by " + resdata.data[0].artist)
        .setURL(resdata.data[0].url)
        .setFooter("Lyrics provided by api.ksoft.si")
        .setThumbnail(resdata.data[0].album_art)
        .addFields(
          {
            name: "Lyrics:",
            value: content,
          }
        );
      message.channel.send(embed);

      if (long == true) {
        const embed2 = new Discord.MessageEmbed()
          .setFooter("Lyrics provided by api.ksoft.si")
          .setThumbnail(resdata.data[0].album_art)
          .addFields(
            {
              name: "Continued:",
              value: content2,
            }
          );
        message.channel.send(embed2);
      }
    }
    else {
      message.channel.send("**Nothing's playing in this server** 😢");
    }
  }
  else {
    const options = {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + process.env.KSOFT,
      },
    };

    const response = await fetch("https://api.ksoft.si/lyrics/search?q=" + args.join(" ") + "&limit=1", options);
    const resdata = await response.json();
    // resdata.data[0].property

    var max = 1024;
    var content = "";
    var content2 = "";
    var long = false;

    if (resdata.data[0].lyrics.length <= max) {
      content = resdata.data[0].lyrics;
    }
    else {
      var slicedContent = resdata.data[0].lyrics.substring(0, max);
      content = slicedContent.substring(0, slicedContent.lastIndexOf("\n"));
      if (resdata.data[0].lyrics.length <= max * 2) {
        content2 = resdata.data[0].lyrics.substring(slicedContent.lastIndexOf("\n"));
        long = true;
      }
      else {
        content = "Sorry! " + resdata.data[0].name + "'s lyrics are a **bit too long**. View them by clicking the link in the title!";
      }
    }

    const embed = new Discord.MessageEmbed()
      .setTitle(resdata.data[0].name + " by " + resdata.data[0].artist)
      .setURL(resdata.data[0].url)
      .setFooter("Lyrics provided by api.ksoft.si")
      .setThumbnail(resdata.data[0].album_art)
      .addFields(
        {
          name: "Lyrics:",
          value: content,
        }
      );
    message.channel.send(embed);

    if (long == true) {
      const embed2 = new Discord.MessageEmbed()
        .setFooter("Lyrics provided by api.ksoft.si")
        .setThumbnail(resdata.data[0].album_art)
        .addFields(
          {
            name: "Continued:",
            value: content2,
          }
        );
      message.channel.send(embed2);
    }
  }
}

// Patch update - disabled for now in switch
function sendUpdate(message) {
  const embed = new Discord.MessageEmbed()
    .setTitle("Update!")
    .setDescription(
      "R2D2Vader just patched the bot! Here are the updates."
    )
    .setColor("#176634")
    .setFooter("The Mist Bot - made by R2D2Vader")
    .addFields(
      { name: "Command Aliases", value: "Due to popular demand, the alias `p` has been added for the Play command, and `q` has been added for the Queue command. What other aliases do you want to see?" },
      { name: "That's it for this update!", value: "===" }
    );

  message.channel.send(embed);
}

async function artValidate(message) {
  // console.log("Validating art message...");
  if (message.attachments.size == 0) {
    message.delete();
    //console.log("Deleted art post without attachment by " + message.author.username);
    debug("[ART] **" + message.author.username + "** sent an art post without art: ```" + message.cleanContent + "```");
    message.author.send("Hi " + message.member.displayName + "! Please make sure to **only post art** in the <#838834082183381092> channel. Thanks!");
  }
}
// WEBSERVER CODE

//logging requests - keep on top
app.use(function (req, res, next) {
  console.log(
    "Request recieved to " + req.url + " from " + req.headers["x-forwarded-for"]
  );
  next();
});
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/count", (req, res) => {
  let currentCount = 0;
  let recordCount = 0;
  dbClient.query("SELECT * FROM exclusive WHERE key='count';", (err, dbres) => {
    currentCount = parseInt(JSON.stringify(dbres.rows[0]).toString().slice(24));
    dbClient.query("SELECT * FROM exclusive WHERE key='maxcount';", (err, dbres2) => {
      recordCount = parseInt(JSON.stringify(dbres2.rows[0]).toString().slice(27));
      res.send({ "currentCount": currentCount, "recordCount": recordCount });
    });
  });
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Listening on port " + listener.address().port);
});

// not crash on unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection. ' + " \n This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). \n" + reason.stack || reason);
  debug("[APP] **ERR** | **Unhandled Promise Rejection:** ```" + reason.stack + "```" || reason + "```");
});

process.on('uncaughtException', (reason) => {
  console.error('Uncaught Error! \n ' + reason.stack || reason);
  debug("[APP] **ERR** | **Uncaught Exception:** ```" + reason.stack + "```" || reason + "```");
});

//ADMIN WEB CONSOLE CODE

const { readFileSync } = require('fs');
const { deserializeOptionsPlaylist } = require('discord-music-player/src/Util');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

app.post("/send", (req, res) => {
  const { token, chanID, msgContent } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    debug("[WEB] **ALERT**: Authentication failed with invalid token: " + token);
    res.status(401).end();
    return;
  }
  res.status(202).end();
  debug("Sending message from web to " + chanID + " with content: " + msgContent);
  const channel = client.channels.cache.get(chanID)
  channel.send(msgContent)
})

const GlobalObject = {} // for storage
app.post("/eval", (req, res) => {
  const { token, code } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    debug("[WEB] **ALERT**: Authentication failed with invalid token: " + token);
    res.status(401).end();
    return;
  }
  res.status(202).end();
  debug("[WEB] **ALERT**: Executing the following code from the web console: " + code);
  eval(code)
  return;
})

app.post("/update", (req, res) => {
  const { token, updatemsg, updatebody } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    debug("[WEB] **ALERT**: Authentication failed with invalid token: " + token);
    res.status(401).end();
    return;
  }
  updatefromWeb(updatemsg, updatebody);
  res.status(202).end();
})

async function updatefromWeb(title, body) {
  const embed = new Discord.MessageEmbed()
    .setTitle(title)
    .setDescription(
      "R2D2Vader just patched the bot! Here are the updates."
    )
    .setColor(Math.floor(Math.random() * 16777215).toString(16))
    .setFooter("The Mist Bot - made by R2D2Vader");

  // console.log(body);
  const fields = body.split("|");
  // console.log(fields);

  for (i = 0; i < fields.length; i++) {
    const parts = fields[i].split("=");
    // console.log("Name: " + parts[0] + " Value: " + parts[1]);
    embed.addFields({ name: parts[0], value: parts[1] });
  }

  const channels = process.env.UPDATE;
  const array = channels.split('&');
  // console.log(array);
  for (i = 0; i < array.length; i++) {
    client.channels.cache.get(array[i]).send(embed);
  }
}
