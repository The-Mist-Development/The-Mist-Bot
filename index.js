// init site
const express = require('express');
const bodyParser = require("body-parser");
const app = express();

// init discord bot
const Discord = require("discord.js");
const client = new Discord.Client();

const token = process.env.TOKEN;
const prefix = ",";

const fetch = require('node-fetch');

// const Database = require("@replit/database");
// const db = new Database();

const lmaomode = true;
const janmode = true;
const rickrollchance = 1;
rickrolld = false;
djmode = false;
djuser = "";

client.login(token).catch(console.error);

client.on("ready", () => {
  client.user.setActivity("(,help) MINECRAFT GONE WRONG [NOT CLICKBAIT] MINECRAFT GLITCHES WORKING 2021 LINK IN DESCRIPTION", { type: "WATCHING" });
  // send a message on startup
  // client.channels.cache.get("780902808353505341").startTyping();
  // setTimeout(sendmsg, 2000);
  // log all channels the bot can see
  // client.channels.cache.forEach(channel => {
  // console.log(`${channel.name} | ${channel.id} | ${channel.guild}`);
  // });
  // update delivery
  // deliverUpdate();
});
function deliverUpdate() {
  const channels = process.env.UPDATE;
  const array = channels.split('&');
  // console.log(array);
  for (i = 0; i < array.length; i++) {
    const embed = new Discord.MessageEmbed()
      .setTitle("New hosting 😁")
      .setColor(Math.floor(Math.random() * 16777215).toString(16))
      .setFooter("The Mist Bot - made by R2D2Vader")
      .addFields(
        { name: "Repl.it started to not work, so we transferred to Heroku!", value: "This means better performance as well!" },
        { name: "Fixed Jan-mode", value: "The bot no longer reacts to any message containing Jan within any word - it requires the word Jan." }
      );
    client.channels.cache.get(array[i]).send(embed);
  }
}
async function sendmsg() {
  client.channels.cache.get("780902808353505341").send("bye");
  client.channels.cache.get("780902808353505341").stopTyping();
}

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


// Handle Messages
client.on("message", message => {
  if (message.author.bot) return;

  // art channel validation
  if (message.channel.id == "838834082183381092") {
    artValidate(message);
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
          message.channel.send("😢 I **don't support playlists** for now!")
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
        let isPlaying = client.player.isPlaying(message.guild.id);
        if (isPlaying) {

          client.player.pause(message.guild.id);
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
        let isPlaying = client.player.isPlaying(message.guild.id);
        if (isPlaying) {

          client.player.resume(message.guild.id);
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
        let isPlaying = client.player.isPlaying(message.guild.id);
        if (isPlaying) {
          let toggle = client.player.toggleLoop(message.guild.id);
          if (toggle) message.channel.send("🔁 **Looping the current song**");
          else message.channel.send("**Loop Disabled.**");
        } else {
          message.channel.send("**Nothing's playing in this server** 😢");
        }
      } else {
        message.channel.send(
          "**You must be in the Voice Channel to loop the current song!**"
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
        let isPlaying = client.player.isPlaying(message.guild.id);
        if (isPlaying) {
          client.player.skip(message.guild.id);
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
        client.player.stop(message.guild.id);
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
    case "quote":

      break;
    case "update":
      // disabled until needed.
      //if (message.member.id == "517742819830399000") {
      //sendUpdate(message);
      //}
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

// the ,play command
async function playSong(message, args) {
  let isPlaying = client.player.isPlaying(message.guild.id);
  // If there's already a song playing
  if (isPlaying) {
    // Add the song to the queue
    let song = await client.player.addToQueue(message.guild.id, args.join(" "));
    song = song.song;
    message.channel.send(`** ${song.name} ** was added to the queue!`);
  } else {
    const loading = await message.channel.send("<a:mistbot_loading:818438330299580428> Loading...");

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
      message.member.voice.channel,
      args.join(" ")
    );
    song = song.song;
    // handle random rickroll
    if (rickrolld == true) {
      message.channel.send("<a:mistbot_rickroll:821480726163226645> **Rickroll'd!** Sorry I just couldn't resist haha <a:mistbot_rickroll:821480726163226645>");
      rickrolld = false;
    }
    else {
      message.channel.send(`🎵 Playing Now: ** ${song.name} ** 🎶`);
    }
    loading.delete();

    song.queue.on('songChanged', (oldSong, newSong, skipped, repeatMode) => {
      if (repeatMode) {
        message.channel.send(`🔂 Playing again: ** ${newSong.name} ** 🎶`);
      } else {
        message.channel.send(`🎵 Playing Now: ** ${newSong.name} ** 🎶`);
      }
    });
  }
}

// the ,queue command
async function getQueue(message) {
  let isPlaying = client.player.isPlaying(message.guild.id);

  if (isPlaying) {
    const queue = await client.player.getQueue(message.guild.id);

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
        name: "`" + prefix + "play <Song Name / URL>`",
        value: "Play the first result on YouTube for the Song Name, or the YouTube video at the URL you provide."
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
    );

  message.channel.send(embed);
}

// ,np command
async function nowPlaying(message) {
  let isPlaying = client.player.isPlaying(message.guild.id);

  if (isPlaying) {
    const queue = await client.player.getQueue(message.guild.id);

    let progressBar = client.player.createProgressBar(message.guild.id, 40, "🔴", "-");

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
            message.channel.send("😢 I **don't support playlists** for now! Sorry DJ! 💿")
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
          let isPlaying = client.player.isPlaying(message.guild.id);
          if (isPlaying) {

            client.player.pause(message.guild.id);
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
          let isPlaying = client.player.isPlaying(message.guild.id);
          if (isPlaying) {

            client.player.resume(message.guild.id);
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
          let isPlaying = client.player.isPlaying(message.guild.id);
          if (isPlaying) {
            let toggle = client.player.toggleLoop(message.guild.id);
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
          let isPlaying = client.player.isPlaying(message.guild.id);
          if (isPlaying) {
            client.player.skip(message.guild.id);
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
          client.player.stop(message.guild.id);
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
    let isPlaying = client.player.isPlaying(message.guild.id);
    if (isPlaying) {
      const queue = await client.player.getQueue(message.guild.id);

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
          content2 = resdata.data[0].lyrics.substring(max);
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
        content2 = resdata.data[0].lyrics.substring(max);
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

async function artValidate (message) {
  // console.log("Validating art message...");
  if (message.attachments.size == 0) {
    message.delete();
    console.log("Deleted art post without attachment by " + message.author.username);
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

const listener = app.listen(process.env.PORT, () => {
  console.log("Listening on port " + listener.address().port);
});

// not crash on unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection. ' + " \n This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). \n" + reason.stack || reason);
});

//ADMIN WEB CONSOLE CODE

const { readFileSync } = require('fs')

app.post("/send", (req, res) => {
  const { token, chanID, msgContent } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    console.log("ALERT: authenticaion failed with invalid token: " + token)
    res.status(401).end();
    return;
  }
  res.status(202).end();
  console.log("Sending message from web to " + chanID + " with content: " + msgContent);
  const channel = client.channels.cache.get(chanID)
  channel.send(msgContent)
})

const GlobalObject = {} // for storage
app.post("/eval", (req, res) => {
  const { token, code } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    console.log("ALERT: authenticaion failed with invalid token: " + token)
    res.status(401).end();
    return;
  }
  res.status(202).end();
  console.log("ALERT: Received request from web to execute: " + code);
  const f = new Function("bot", "go", code);
  return f(client, GlobalObject);
})

app.post("/update", (req, res) => {
  const { token, updatemsg, updatebody } = req.body;
  if (token != process.env.ADMIN_TOKEN) {
    console.log("ALERT: authenticaion failed with invalid token: " + token)
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
    embed.addFields({name: parts[0], value: parts[1]});
  }

  const channels = process.env.UPDATE;
  const array = channels.split('&');
  // console.log(array);
  for (i = 0; i < array.length; i++) {
    client.channels.cache.get(array[i]).send(embed);
  }
}