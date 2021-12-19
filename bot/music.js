const Discord = require("discord.js");
const { Player } = require("discord-music-player");
let client;

module.exports = {
    setup: function(variable) {
        client = variable;
        const newPlayer = new Player(client, {
            leaveOnEnd: true,
            leaveOnStop: true,
            leaveOnEmpty: true,
            timeout: 30000 
        });
        client.player = newPlayer;
        console.log("[BOT] **Music Module Loaded**");
    },
    music: function(message, command, args) {
        let guildQueue = client.player.getQueue(message.guild.id);
        if (!guildQueue) {
            if (command == "play") {
                playSong(message, args);
            }
            else return message.channel.send("Nothing's playing in this server 😢");
        }
        else {
            if (message.member.voice.channel){
                switch (command) {
                    case "play":
                        // add to queue
                        break;
                    case "pause":
                        break;
                    case "resume":
                        break;
                    case "skip":
                        break;
                    case "stop":
                        break;
                    default:
                        break;
                }
            }
        }
    }
}

async function playSong(message, args) {
    if (args.length == 0) return;
      if (message.member.voice.channel) {
        if (message.content.toLowerCase().includes("list=")) {
          // play playlist
        }
        else {
            let queue = client.player.createQueue(message.guild.id);
            await queue.join(message.member.voice.channel);
            let song = await queue.play(args.join(' '));
            message.channel.send(`🎵 Playing Now: **${song.name}** 🎶`)
        }
      } else {
        message.channel.send(
          "🔊 **Join a Voice Channel** to play music!"
        );
      }
}