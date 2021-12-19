const Discord = require("discord.js");
const { Player } = require("discord-music-player");
let client;

module.exports = {
    setup: function (variable) {
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
    music: function (message, command, args) {
        if (command == "play") {
            return playSong(message, args);
        }
        let guildQueue = client.player.getQueue(message.guild.id);
        if (!guildQueue) {
            return message.channel.send("**Nothing's playing in this server** 😢");
        }
        else {
            if (message.member.voice.channel) {
                switch (command) {
                    case "pause":
                        guildQueue.setPaused(true);
                        break;
                    case "resume":
                        guildQueue.setPaused(false);
                        break;
                    case "skip":
                        guildQueue.skip();
                        break;
                    case "stop":
                        guildQueue.stop();
                        break;
                    default:
                        message.channel.send("😅⁉ w-w-what's happening?");
                        message.channel.send(`${message.member.displayName} has made the advancement \`Congratulations, You Broke It\``);
                        message.author.send("Achievement Get: `Congratulations, You Broke It`");
                        break;
                }
            }
        }
    }
}

async function playSong(message, args) {
    if (args.length == 0) return;

    let guildQueue = client.player.getQueue(message.guild.id);

    if (message.member.voice.channel) {

        let queue;
        if (guildQueue) {
            queue = guildQueue;
        }
        else {
            queue = client.player.createQueue(message.guild.id);
        }
        await queue.join(message.member.voice.channel);

        if (message.content.toLowerCase().includes("list=")) {
            let song = await queue.playlist(args.join(' '));
        }
        else {
            let song = await queue.play(args.join(' '));
        }

    } else {
        message.channel.send(
            "🔊 **Join a Voice Channel** to play music!"
        );
    }
}