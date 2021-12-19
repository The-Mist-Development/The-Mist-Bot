const Discord = require("discord.js");
const { Player } = require("discord-music-player");
let client;

function log(message) {
    console.log(message.replaceAll("*", "").replaceAll("`", ""));
    client.channels.cache.get("850844368679862282").send(message);
}

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

        client.player
            // Emitted when channel was empty.
            .on('channelEmpty', (queue) => {
                queue.data.channel.send("👋 **Bye!** See you another time.");
            })
            // Emitted when a song was added to the queue.
            .on('songAdd', (queue, song) =>
                queue.data.channel.send(`** ${song.name} ** was added to the queue!`))
            // Emitted when a playlist was added to the queue.
            .on('playlistAdd', (queue, playlist) =>
                queue.data.channel.send(`Added ${playlist.songs.length} videos from playlist **${playlist}** to the queue.`))
            // Emitted when the queue was destroyed (by stopping).    
            .on('queueDestroyed', (queue) =>
                queue.data.channel.send(`🎤 **Stopped** - Is that all for now?`))
            // Emitted when there was no more music to play.
            .on('queueEnd', (queue) =>
                queue.data.channel.send(`🎤 The queue has **ended**. Add some more songs!`))
            // Emitted when a song changed.
            .on('songChanged', (queue, newSong, oldSong) => {
                if (oldSong.url == newSong.url) queue.data.channel.send(`🎵 Playing Again: **${newSong.name}** 🔂`);
                else queue.data.channel.send(`🎵 Playing Now: **${newSong.name}** 🎶`);
            })
            // Emitted when a first song in the queue started playing.
            .on('songFirst', (queue, song) =>
                queue.data.channel.send(`🎵 Playing Now: **${song.name}** 🎶`))
            // Emitted when someone disconnected the bot from the channel.
            .on('clientDisconnect', (queue) =>
                queue.data.channel.send("👋 **Bye then!** I see how it is 😔"))
            // Emitted when deafenOnJoin is true and the bot was undeafened
            .on('clientUndeafen', (queue) =>
                console.log(`I got undefeanded.`))
            // Emitted when there was an error in runtime
            .on('error', (error, queue) => {
                log(`[PLAYER] Error in ${queue.guild.name}: \r\`\`\`\r${error}\r\`\`\``);
                if (queue.data.channel) { queue.data.channel.send("😓 **Something went wrong!** Please try again in a few minutes. If the issue persists, contact R2D2Vader#0693"); }

                if (error.includes("permission") || error.includes("Permission")) {
                    queue.data.channel.send("🚫 I don't have the permissions I need - Discord told me this: `" + error + "`");
                }
                else if (error.includes("Status code:")) {
                    queue.data.channel.send("YouTube returned an error code. Restarting the bot to potentially fix this issue.");
                    log("[PLAYER] Killing process to try and fix error status code. This restart is **uncancellable!**");
                    setTimeout(function () { process.kill(process.pid, 'SIGTERM'); }, 1000);
                }
            });
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
                        message.channel.send("⏸ **Paused!**");
                        break;
                    case "resume":
                        guildQueue.setPaused(false);
                        message.channel.send("▶ **Resumed!**");
                        break;
                    case "skip":
                        guildQueue.skip();
                        message.channel.send("⏭ **Skipped!**");
                        break;
                    case "stop":
                        guildQueue.stop();
                        message.react("⏹");
                        break;
                    default:
                        message.channel.send("😅⁉ w-w-what's happening?");
                        message.channel.send(`${message.member.displayName} has made the advancement \`Congratulations, You Broke It\``);
                        message.author.send("Achievement Get: `Congratulations, You Broke It`");
                        log(`[BOT] Easter Egg | \`${message.member.displayName}\` has made the advancement \`Congratulations, You Broke It\``);
                        break;
                }
            }
            else message.channel.send("🔊 **Join a Voice Channel** to use this command!");
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
            queue = client.player.createQueue(message.guild.id, {
                data: {
                    channel: message.channel,
                }
            });
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