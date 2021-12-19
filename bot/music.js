const Discord = require("discord.js");
const { Player } = require("discord-music-player");
let client;

function log(message) {
    console.log(message.replaceAll("*", "").replaceAll("`", ""));
    client.channels.cache.get("850844368679862282").send(message);
}

function runtimeErrorHandle(error, message) {
    log(`[PLAYER] Error trying to play in ${message.guild.name}: \r\`\`\`\r${error.message}\r\`\`\``);
    if (message.channel) { message.channel.send("😓 **Something went wrong!** Please try again in a few minutes. If the issue persists, contact R2D2Vader#0693"); }

    if (error.message.includes("permission") || error.message.includes("Permission")) {
        message.channel.send("🚫 I don't have the permissions I need - Discord told me this: `" + error.message + "`");
    }
    else if (error.message.includes("Status code:")) {
        message.channel.send("YouTube returned an error code. Restarting the bot to potentially fix this issue.");
        log("[PLAYER] Killing process to try and fix error status code. This restart is **uncancellable!**");
        setTimeout(function () { process.kill(process.pid, 'SIGTERM'); }, 1000);
    }
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

        client.player
            // Emitted when channel was empty.
            .on('channelEmpty', (queue) => {
                queue.data.channel.send("👋 **Bye!** See you another time.");
            })
            // Emitted when a song was added to the queue.
            .on('songAdd', (queue, song) =>
                queue.data.channel.send(`**${song.name}** was added to the queue!`))
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
                log(`[PLAYER] Error in ${queue.guild.name}: \r\`\`\`\r${error.message}\r\`\`\``);
                if (queue.data.channel) { queue.data.channel.send("😓 **Something went wrong!** Please try again in a few minutes. If the issue persists, contact R2D2Vader#0693"); }

                if (error.message.includes("permission") || error.includes("Permission")) {
                    queue.data.channel.send("🚫 I don't have the permissions I need - Discord told me this: `" + error + "`");
                }
                else if (error.message.includes("Status code:")) {
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
                    case "queue":
                        sendQueue(message, guildQueue);
                        break;
                    case "remove":
                        if (args.length == 0) break;
                        let index = parseInt(args[0]);
                        if (guildQueue.songs.length > index && index < 0) {
                            let name = guildQueue.songs[index].name;
                            guildQueue.remove(index);
                            message.channel.send(`📤 Removed **${name}** from the queue.`);
                        }
                        else {
                            let explanation = index == 0 ? "You cannot remove the currently playing song" : "There are not that many songs in the queue."
                            message.channel.send("🚫 **Invalid Index** - " + explanation);
                        }
                        break;
                    case "np":
                        sendNowPlaying(message, guildQueue);
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
        let loading = null;

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
            loading = await message.channel.send("<a:mistbot_loading:818438330299580428> Loading...");
            setTimeout(function () {
                if (loading.deleted) return;
                loading.delete()
                    .then(function () { message.channel.send("😓 **Something went wrong!** Please contact **R2D2Vader#0693** and inform them of the time you ran the command.") });
            }, 10000);
        }
        await queue.join(message.member.voice.channel);

        if (message.content.toLowerCase().includes("list=")) {
            let song = await queue.playlist(args.join(' ')).catch(err => {
                runtimeErrorHandle(err, message)
                if (loading != null) loading.delete();
            });
        }
        else {
            let song = await queue.play(args.join(' ')).catch(err => {
                runtimeErrorHandle(err, message)
                if (loading != null) loading.delete();
            });
        }

        loading.delete();

    } else {
        message.channel.send(
            "🔊 **Join a Voice Channel** to play music!"
        );
    }
}

function sendQueue(message, queue) {
    const embed = new Discord.MessageEmbed()
        .setTitle("Queue for " + message.guild.name)
        .setFooter("The Mist Bot - made by R2D2Vader")
        .setColor("#066643")
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

    message.channel.send({ embeds: [embed] });
}

function sendNowPlaying(message, queue) {
    let progressBar = queue.createProgressBar({
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

    message.channel.send({embeds: [embed]});
}