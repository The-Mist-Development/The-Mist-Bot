const Discord = require("discord.js");
const { Player } = require("discord-music-player");
let client;
let rickrollchance = 1;
let playingServers = [];

function log(message) {
    console.log(message.replaceAll("*", "").replaceAll("`", ""));
    client.channels.cache.get("850844368679862282").send(message);
}

// For errors which occur when trying to play a song
function runtimeErrorHandle(error, message) {
    log(`[PLAYER] Error trying to play in ${message.guild.name}: \r\`\`\`\r${error.message}\r\`\`\``);
    if (message.channel) {

        if (error.message.includes("no YouTube song found")) return message.channel.send("🔎 **No YouTube video found** for that query!");
        if (error.message.includes("Cannot set property 'data' of undefined")) return message.channel.send("💨 **Invalid Song** - please try a different query or paste a YouTube URL.");

        message.channel.send("😓 **Something went wrong!** Please try again in a few minutes. If the issue persists, contact R2D2Vader#0693");

        if (error.message.includes("permission") || error.message.includes("Permission")) {
            message.channel.send("🚫 I don't have the permissions I need - Discord told me this: `" + error.message + "`");
        }
    }
    else if (error.message.includes("Status code:")) {
        // message.channel.send("YouTube returned an error code. Restarting the bot to potentially fix this issue.");
        // log("[PLAYER] Killing process to try and fix error status code. This restart is **uncancellable!**");
        // setTimeout(function () { process.kill(process.pid, 'SIGTERM'); }, 1000);
        queue.data.channel.send("YouTube returned an error code. Try again in about 5 minutes.");
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
                let index = playingServers.indexOf(queue.data.channel.guildId);
                if (index > -1) {
                    playingServers.splice(index, 1); 
                }
            })
            // Emitted when a song was added to the queue.
            .on('songAdd', (queue, song) => {
                if (queue.data.hidemsg) return;
                queue.data.channel.send(`**${song.name}** was added to the queue!`)
            })
            // Emitted when a playlist was added to the queue.
            .on('playlistAdd', (queue, playlist) =>
                queue.data.channel.send(`Added ${playlist.songs.length} videos from playlist **${playlist}** to the queue.`))
            // Emitted when the queue was destroyed (by stopping).    
            .on('queueDestroyed', (queue) => {
                // queue.data.channel.send(`⏹ **Stopped** - Is that all for now?`);
                let index = playingServers.indexOf(queue.data.channel.guildId);
                if (index > -1) {
                    playingServers.splice(index, 1); 
                }
            })
            // Emitted when there was no more music to play.
            .on('queueEnd', (queue) => {
                queue.data.channel.send(`🎤 The queue has **ended**. Add some more songs!`);
                let index = playingServers.indexOf(queue.data.channel.guildId);
                if (index > -1) {
                    playingServers.splice(index, 1); 
                }
            })
            // Emitted when a song changed.
            .on('songChanged', (queue, newSong, oldSong) => {
                if (oldSong.url == newSong.url) queue.data.channel.send(`🔂 Playing Again: **${newSong.name}** 🎶`);
                else queue.data.channel.send(`🎵 Playing Now: **${newSong.name}** 🎶`);
                if (queue.data.rickroll) {
                    queue.data.channel.send("<a:mistbot_rickroll:821480726163226645> **Rickroll'd!** Sorry I just couldn't resist haha <a:mistbot_rickroll:821480726163226645>");
                    queue.data.rickrollmsg.react("<a:mistbot_rickroll:821480726163226645>");
                    log("[PLAYER] Force Rickrolled server " + queue.data.channel.guild.name + ", requested by <@" + queue.data.rickrollmsg.author.id + ">");
                    queue.setData({channel: queue.data.channel});
                }
            })
            // Emitted when a first song in the queue started playing.
            .on('songFirst', (queue, song) =>
                queue.data.channel.send(`🎵 Playing Now: **${song.name}** 🎶`))
            // Emitted when someone disconnected the bot from the channel.
            .on('clientDisconnect', (queue) => {
                queue.data.channel.send("👋 **Bye then!** I see how it is 😔")
                let index = playingServers.indexOf(queue.data.channel.guildId);
                if (index > -1) {
                    playingServers.splice(index, 1); 
                }
            })
            // Emitted when deafenOnJoin is true and the bot was undeafened
            .on('clientUndeafen', (queue) =>
                console.log(`I got undefeanded.`))
            // Module description: Emitted when there was an error in runtime
            // Mist Bot usage: For errors which occur during playback
            .on('error', (error, queue) => {
                log(`[PLAYER] Error in ${queue.guild.name}: \r\`\`\`\r${error.message}\r\`\`\``);
                if (queue.data.channel) { 
                    queue.data.channel.send("😓 **Something went wrong!** Please try again in a few minutes. If the issue persists, contact R2D2Vader#0693"); 

                    // don't think this is needed here
                    //if (error.message?.includes("permission") || error.includes("Permission")) {
                    //    queue.data.channel.send("🚫 I don't have the permissions I need - Discord told me this: `" + error + "`");
                    //}

                    if (error.message?.includes("Status code:")) {
                        // queue.data.channel.send("YouTube returned an error code. Restarting the bot to potentially fix this issue.");
                        // log("[PLAYER] Killing process to try and fix error status code. This restart is **uncancellable!**");
                        // setTimeout(function () { process.kill(process.pid, 'SIGTERM'); }, 1000);
                        queue.data.channel.send("YouTube returned an error code. Try again in about 5 minutes.");
                    }
                }
            });
    },
    music: function (message, command, args) {
        if (command == "play" || command == "p") {
            return playSong(message, args);
        }
        if (command == "forcerickroll") {
            return forceRickroll(message, command, args);
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
                        message.channel.send(`⏹ **Stopped** - Is that all for now?`);
                        break;
                    case "queue":
                    case "q":
                        sendQueue(message, guildQueue);
                        break;
                    case "remove":
                        if (args.length == 0) break;
                        let index = parseInt(args[0]);
                        if (index < guildQueue.songs.length && index > 0) {
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
                    case "loop":
                        if (guildQueue.repeatMode == 0) {
                            guildQueue.setRepeatMode(1);
                            message.channel.send("🔂 **Looping the current song**");
                        }
                        else {
                            guildQueue.setRepeatMode(0);
                            message.channel.send("**Loop Disabled**");
                        }
                        break;
                    case "loopqueue":
                    case "loopq":
                        if (guildQueue.repeatMode == 0) {
                            guildQueue.setRepeatMode(2);
                            message.channel.send("🔁 **Looping the entire queue**");
                        }
                        else {
                            guildQueue.setRepeatMode(0);
                            message.channel.send("**Loop Disabled**");
                        }
                        break;
                    case "clear":
                        if (guildQueue.songs.length > 0) {
                            guildQueue.clearQueue();
                            message.channel.send("🗑 **Queue Cleared**. Time to add some more songs!");
                        }
                        break;
                    default:
                        message.channel.send("😅⁉ w-w-what's happening?");
                        message.channel.send(`${message.member.displayName} has made the advancement \`Congratulations, You Broke It\``);
                        message.author.send("Achievement Get: `Congratulations, You Broke It`");
                        log(`[BOT] Easter Egg | \`${message.author.username}\` has made the advancement \`Congratulations, You Broke It\``);
                        break;
                }
            }
            else {
                switch (command) {
                    case "np":
                        sendNowPlaying(message, guildQueue);
                        break;
                    case "queue":
                    case "q":
                        sendQueue(message, guildQueue);
                        break;
                    default:
                        message.channel.send("🔊 **Join a Voice Channel** to use this command!");
                        break;
                }   
            }
        }
    },
    playing: function() {
       if (playingServers.length > 1) return true;
       else return false; 
    }
}

async function playSong(message, args) {
    if (args.length == 0) return;

    let guildQueue = client.player.getQueue(message.guild.id);

    if (message.member.voice.channel) {
        let loading = null;
        let rickrolled = false;
        let loTimeout = false;
        let deleted = false;

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
            loTimeout = setTimeout(function () {
                if (deleted) return;
                deleted = true;
                loading.delete()
                    .then(function () { message.channel.send("😓 **Something went wrong!** Please contact **R2D2Vader#0693** and inform them of the time you ran the command.") });
            }, 10000);

            if (args[0].includes("youtube.com/") || args[0].includes("youtu.be/")) {
                // console.log(args[0]);
                if (args[0].startsWith("www.") || args[0].startsWith("youtube.com/") || args[0].startsWith("youtu.be/")) {
                    args[0] = "https://" + args[0];
                    // console.log("fixed: " + args[0]);
                }
            }
            if (args[args.length - 1] == "-r") {
                args = ["never", "gonna", "give", "you", "up", "rick", "astley"];
            }
            else if (Math.floor(Math.random() * 100) <= rickrollchance) {
                args = ["never", "gonna", "give", "you", "up", "rick", "astley"];
                rickrolled = true;
            }
        }
        await queue.join(message.member.voice.channel);

        if (message.content.toLowerCase().includes("list=")) {
            if (message.content.toLowerCase().includes("?v=")) {
                message.channel.send("💿 **Adding Full Playlist** to the queue. If you wanted the single song, paste the URL up to the `&list=` part, or try using the song name.");
            }
            let song = await queue.playlist(args.join(' ')).catch(err => {
                runtimeErrorHandle(err, message)
                if (loading != null && deleted == false) {
                    loading.delete();
                    deleted = true;
                }
                if (loTimeout) clearTimeout(loTimeout);
            });
        }
        else {
            let song = await queue.play(args.join(' ')).catch(err => {
                runtimeErrorHandle(err, message)
                if (loading != null && deleted == false) {
                    loading.delete();
                    deleted = true;
                }
                if (loTimeout) clearTimeout(loTimeout);
            });
        }

        if (loading != null && deleted == false) {
            loading.delete();
            deleted = true;
        }
        if (rickrolled == true) setTimeout(function () { message.channel.send("<a:mistbot_rickroll:821480726163226645> **Rickroll'd!** Sorry I just couldn't resist haha <a:mistbot_rickroll:821480726163226645>"); }, 2000);

        playingServers.push(message.channel.guildId);

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

    message.channel.send({ embeds: [embed] });
}

async function forceRickroll(message, command, args) {
    if (message.author.id == process.env.OWNER_ID || process.env.STAFF_IDS.split('&').includes(message.author.id)) {
        let queue = client.player.getQueue(args[0]);

        if (!queue)  {
            let reason = client.guilds.cache.get(args[0]) ? "**No queue found** in server " + client.guilds.cache.get(args[0]).name : "**No guild found** with ID `" + args[0] + "`";
            return message.channel.send("Can't force rickroll: " + reason);
        }
        if (queue.repeatMode == 1) return message.channel.send("Can't force rickroll: Queue is **looping the current song** 🔂");

        let clone = [...queue.songs];
        let len = queue.songs.length;
        message.react("<a:mistbot_loading:818438330299580428>");

        queue.setData({ channel: queue.data.channel, hidemsg: true });
        
        // Please don't edit the below, IDK how but it works
        queue.remove(1);
        for (let i = 1; i < len; i++) {
            queue.remove(i);
        }
        let song = await queue.play("never gonna give you up rick astley").catch(err => {
            runtimeErrorHandle(err, message);
        });

        for (let i = 1; i < len; i++) {
            let song = await queue.play(clone[i].url).catch(err => {
                runtimeErrorHandle(err, message);
            });
        }

        message.react("<a:mistbot_confirmed:870070841268928552>");
        queue.setData({ channel: queue.data.channel, rickroll: true, rickrollmsg: message });
    }
    else {
        message.channel.send(`\`${command}\` is not a command.`);
    }
}