const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { Client } = require("pg");
const fs = require("fs");
const dbClient = new Client({
    connectionString: process.env.DATABASE_URL
});
let connected = false;

let countingChannelsCache = [];

module.exports = {
    dbConnect: function(message) {
        dbClient.connect(err => {
            if (err) {
                console.error('Connection error while connecting to database: ' + err.stack);
            } else {
                console.log('Connected to Database');
                connected = true;
                dbClient.query("CREATE TABLE IF NOT EXISTS counting (channelid BIGINT PRIMARY KEY, maxcount BIGINT, count BIGINT, lastusertocount VARCHAR(255));", function (error, results) {
                    if (error) console.log("[DB] Error creating counting table: " + error);
                });
                dbClient.query("CREATE TABLE IF NOT EXISTS counting_messups (number BIGINT PRIMARY KEY, count BIGINT);", function (error, results) {
                    if (error) console.log("[DB] Error creating counting_messups table: " + error);
                });
                dbClient.query("CREATE TABLE IF NOT EXISTS subscribed (channelid VARCHAR(255) PRIMARY KEY);", function (error, results) {
                    if (error) console.log("[DB] Error creating subscribed table: " + error);
                });
                dbClient.query("CREATE TABLE IF NOT EXISTS wishlist_users (discordid VARCHAR(255) PRIMARY KEY, steamid VARCHAR(255), gamelist TEXT, failcount INTEGER DEFAULT 0);", function (error, results) {
                    if (error) console.log("[WISHLIST] Error creating wishlist_users table: " + error);
                });
                dbClient.query("CREATE TABLE IF NOT EXISTS wishlist_games (gameid VARCHAR(255) PRIMARY KEY, lastprice VARCHAR(255));", function (error, results) {
                    if (error) console.log("[WISHLIST] Error creating wishlist_games table: " + error);
                });
                dbClient.query("CREATE TABLE IF NOT EXISTS counting_users (userid VARCHAR(255), serverid VARCHAR(255), counts BIGINT, messups BIGINT, maxcount BIGINT, maxmessup BIGINT, PRIMARY KEY(userid, serverid))", function (error, results) {
                    if (error) console.log("[DB] Error creating counting_users table: " + error);
                });
                updateMessupCache();
                updateCountingCache();
            }
          });
    },
    getCountingChannels: async function() {
        if (connected == false) return [];
        if (countingChannelsCache.length == 0) {
            const res = await dbClient.query("SELECT channelid FROM counting;");
            countingChannelsCache = res.rows.map(x => x["channelid"]);
        }
        return countingChannelsCache;
    },
    getMaxCount: async function(message, lookupChannel) {
        if (lookupChannel) {
                const res = await dbClient.query(`SELECT * FROM counting WHERE channelid=${lookupChannel.id};`);
                if (res.rows.length == 0) return message.channel.send("Counting has not been enabled in that channel.");
                message.channel.send(`The highest ever count in <#${lookupChannel.id}> was \`${res.rows[0]["maxcount"]}\`.`);
        }
        else {
            const res = await dbClient.query(`SELECT * FROM counting WHERE channelid=${message.channel.id};`);
            if (res.rows.length == 0) return message.channel.send("Run this command in a **counting channel** to see the highest ever count in that channel!")
            message.channel.send(`The highest ever count in <#${message.channel.id}> was \`${res.rows[0]["maxcount"]}\`.`);
        }
    },
    getCurrentCount: async function(message, api) {
        if (api == true) {
            const res = await dbClient.query(`SELECT * FROM counting WHERE channelid=${message.channel.id};`);
            if (res.rows.length == 0) return null;
            return res.rows[0]["count"]
        }
    },
    count: async function (message) {
        if (connected == false) {
            message.channel.send("We're having issues **connecting to our database**. Please try again later. If this issue persists, contact `@r2d2vader`");
            message.react("❎").catch((err) => {return;});
            return;
        }
        const resObj = await dbClient.query(`SELECT * FROM counting WHERE channelid=${message.channel.id};`)
        let res = resObj.rows[0]
        if (message.content == parseInt(res["count"]) + 1) {
            if (res["lastusertocount"] != message.member.id) {
                await dbClient.query(`UPDATE counting SET count=${parseInt(res["count"]) + 1}, lastusertocount=${message.member.id} WHERE channelid=${message.channel.id}`)
                message.react("<a:mistbot_confirmed:870070841268928552>").catch((err) => {message.channel.send("<a:mistbot_confirmed:870070841268928552>")});
                updateUserCount(message.member.id, message.guild.id, parseInt(res["count"]) + 1)
            }
            else {
                await dbClient.query(`UPDATE counting SET count=0, lastusertocount=-1 WHERE channelid=${message.channel.id}`)
                message.channel.send("**<@" + message.member.id + ">** ruined the count at `" + res["count"] + "`! You cannot count **twice in a row**. The count reset.");
                recordMessup(res["count"]);
                updateUserMessup(message.member.id, message.guild.id, res["count"]);
                message.channel.send("Next number is `1`.");
                message.react("❌").catch((err) => {return;});
                return;
            }
        }
        else {
            await dbClient.query(`UPDATE counting SET count=0, lastusertocount=-1 WHERE channelid=${message.channel.id}`)
            message.channel.send("**<@" + message.member.id + ">** ruined the count at `" + res["count"] + "`! The count reset.");
            recordMessup(res["count"]);
            updateUserMessup(message.member.id, message.guild.id, res["count"]);
            message.channel.send("Next number is `1`.");
            message.react("❌").catch((err) => {return;});
            return;
        }

        if (parseInt(res["count"]) + 1 > parseInt(res["maxcount"])) {
            dbClient.query(`UPDATE counting SET maxcount = ${parseInt(res["count"]) + 1} WHERE channelid=${message.channel.id}`)
        }

    },
    enableCounting: async function(message) {
        let channels = countingChannelsCache;
        if (channels.includes(message.channel.id)) {
            message.channel.send("Counting is already enabled in this channel!")
        }
        else if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await dbClient.query(`INSERT INTO counting (channelid, maxcount, count, lastusertocount) VALUES (${message.channel.id},0,0,-1);`);
            message.channel.send("Counting is now enabled! The next number is `1`.");
            updateCache();
        }
        else {
            message.channel.send("You **don't have permission to do that**! Get someone who can `Manage Channels` to set counting up for you.")
        }
    },
    disableCounting: async function(message) {
        let channels = countingChannelsCache;
        if (!channels.includes(message.channel.id)) {
            message.channel.send("Counting isn't enabled in this channel!")
        }
        else if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await dbClient.query(`DELETE FROM counting WHERE channelid=${message.channel.id};`);
            message.channel.send("Counting is now disabled! Sorry to see you go 😦");
            updateCache();
        }
        else {
            message.channel.send("You **don't have permission to do that**! Get someone who can `Manage Channels` to turn counting off for you.")
        }
    },
    setDisconnected: function() {
        connected = false;
    },
    getSubscribedChannels: async function() {
        const res = await dbClient.query("SELECT channelid FROM subscribed;");
        return res.rows.map(x => x["channelid"]);
    },
    subscribe: async function(message) {
        if (message.channel.type != 0) return message.channel.send("Updates can only be subscribed to in a Server Text Channel!");
        const res = await dbClient.query("SELECT channelid FROM subscribed;");
        let array = res.rows.map(x => x["channelid"]);

        if (array.includes(message.channel.id)) {
            message.channel.send("This channel is already subscribed to updates!")
        }
        else if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await dbClient.query(`INSERT INTO subscribed (channelid) VALUES (${message.channel.id});`);
            message.channel.send("This channel is now subscribed to updates!");
        }
        else {
            message.channel.send("You **don't have permission to do that**! Get someone who can `Manage Channels` to subscribe to updates for you.")
        }
    },
    unsubscribe: async function(message) {
        const res = await dbClient.query("SELECT channelid FROM subscribed;");
        let array = res.rows.map(x => x["channelid"]);

        if (!array.includes(message.channel.id)) {
            message.channel.send("This channel isn't subscribed to updates!")
        }
        else if (message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            await dbClient.query(`DELETE FROM subscribed WHERE channelid=Cast(${message.channel.id} As varchar);`);
            message.channel.send("This channel is now unsubscribed from updates!");
        }
        else {
            message.channel.send("You **don't have permission to do that**! Get someone who can `Manage Channels` to unsubscribe from updates for you.")
        }
    },
    getCountingStats: async function(message, user, username) {
        const res = await dbClient.query(`SELECT * FROM counting_users WHERE userid = Cast(${user} As varchar) AND serverid = Cast(${message.guild.id} As varchar);`);
        if (res.rows.length == 0) {
            message.channel.send("That user hasn't counted in this server!")
        }
        else {
            let row = res.rows[0]
            let counts = parseInt(row["counts"])
            let messups = parseInt(row["messups"])
            let maxcount = parseInt(row["maxcount"])
            let maxmessup = parseInt(row["maxmessup"])
            
            //let elo = Math.floor((counts / (messups > 0 ? messups : 1)) * (maxcount / (maxmessup > 0 ? maxmessup : 1)))
            //let elo = Math.floor((Math.log10(counts + 1) / (messups > 0 ? messups : 1)) * (maxcount / (maxmessup > 0 ? maxmessup : 1)))
            let elo = Math.floor((Math.log10(counts + 1) / Math.log10((messups > 0 ? messups : 1) + 15)) * (maxcount / Math.log10((maxmessup > 0 ? maxmessup : 1) + 20)))

            let embed = new EmbedBuilder()
              .setTitle(`${username}'s Counting Stats`)
              .setDescription("Counting Stats are server-specific.")
              .setColor("#f2e200")
              .setFooter({text: "The Mist Bot - made by R2D2Vader"})
              .addFields(
                { name: "🎖️ Points", value: `\`${elo}\`` },
                { name: "🔢 Times Counted", value: `\`${counts}\``, inline: true },
                { name: "😠 Times Messed Up", value: `\`${messups}\``, inline: true },
                { name: "😎 Highest Count", value: `\`${maxcount}\``, inline: true },
                { name: "🥶 Highest Messup", value: `\`${maxmessup}\``, inline: true })
            
            message.channel.send({ embeds: [embed] })
        }
    },
    // wishlist mysql database file
    w_addUser(discordId, steamId) {
        return new Promise((resolve, reject) => {
            dbClient.query("INSERT INTO wishlist_users (discordid, steamid) VALUES ($1, $2)", [discordId, steamId], function (error, results) {
                if (error) reject(error);
                resolve(results);
            });
        });
    },
    w_getUser(discordId) {
        return new Promise((resolve, reject) => {
            dbClient.query("SELECT * FROM wishlist_users WHERE discordid = $1", [discordId], function (error, results) {
                if (error) reject(error);
                resolve(results);
            });
        });
    },
    w_deleteUser(discordId) {
        return new Promise((resolve, reject) => {
            dbClient.query("DELETE FROM wishlist_users WHERE discordid = $1", [discordId], function (error, results) {
                if (error) reject(error);
                resolve(results);
            });
        });
    },
    w_writeWishlist(discordId, wishlistString) {
        return new Promise((resolve, reject) => {
            dbClient.query("UPDATE wishlist_users SET gamelist = $1 WHERE discordid = $2", [wishlistString, discordId], function (error, results) {
                if (error) reject(error);
                resolve(results);
            });
        })
    },
    w_getAllUsers() {
        return new Promise((resolve, reject) => {
            dbClient.query("SELECT * FROM wishlist_users", function (error, results) {
                if (error) reject(error);
                resolve(results);
            });
        });
    },
    w_updateGame(gameId, price) {

        // Internal function declaration
        const insertIntoGames = (gameId, price, resolve, reject) => {
            dbClient.query("INSERT INTO wishlist_games (gameid, lastprice) VALUES ($1, $2)", [gameId, price], function (error, results) {
                if (error) reject(error);
                resolve(-1);
            });
        }
        const updateGames = (gameId, price, oldPrice, resolve, reject) => {
            dbClient.query("UPDATE wishlist_games SET lastprice = $1 WHERE gameid = $2", [price, gameId], function (error, results) {
                if (error) reject(error);
                resolve(oldPrice);
            });
        }

        return new Promise((resolve, reject) => {
            dbClient.query("SELECT * FROM wishlist_games WHERE gameid = $1", [gameId], function (error, results) {
                if (error) reject(error);
                if (results.rowCount < 1) {
                    insertIntoGames(gameId, price, resolve, reject);
                }
                else {
                    updateGames(gameId, price, results.rows[0]["lastprice"], resolve, reject);
                }
            });
        });
    },
    w_recordFailedDM(discordId) {
        return new Promise((resolve, reject) => {
            dbClient.query("UPDATE wishlist_users SET failcount = failcount + 1 WHERE discordid = $1", [discordId], function (error, results) {
                if (error) reject(error);
                resolve(results);
            });
        });
    }
}

async function updateCache() {
    const res = await dbClient.query("SELECT channelid FROM counting;");
    countingChannelsCache = res.rows.map(x => x["channelid"]);
}

async function recordMessup(number) {
    const res = await dbClient.query(`SELECT * FROM counting_messups WHERE number=${number};`);
    if (res.rows.length == 0) {
        dbClient.query(`INSERT INTO counting_messups (number, count) VALUES (${number},1);`);
    }
    else {
        let newcount = parseInt(res.rows[0]["count"]) + 1;
        dbClient.query(`UPDATE counting_messups SET count = ${newcount} WHERE number = ${number};`);
    }  
}

async function updateMessupCache() {
    const res = await dbClient.query(`SELECT * FROM counting_messups;`);
    let obj = {}
    for (let i = 0; i < res.rows.length; i++) {
        obj[res.rows[i]["number"]] = parseInt(res.rows[i]["count"]);
    }
    fs.writeFileSync("messupcache.json", JSON.stringify(obj));
}
setInterval(updateMessupCache, 300000);

async function updateCountingCache() {
    const res = await dbClient.query(`SELECT * FROM counting_users;`);
    let arr = []
    for (let i = 0; i < res.rows.length; i++) {
        let row = res.rows[i]
        let counts = parseInt(row["counts"])
        let messups = parseInt(row["messups"])
        let maxcount = parseInt(row["maxcount"])
        let maxmessup = parseInt(row["maxmessup"])

        let elo = Math.floor((Math.log10(counts + 1) / Math.log10((messups > 0 ? messups : 1) + 15)) * (maxcount / Math.log10((maxmessup > 0 ? maxmessup : 1) + 20)))
        let newelo = Math.floor((counts ** (1/2) / Math.log10(messups + 10)) * (maxcount ** (2/3) / Math.log10((maxmessup + 10))))
        arr.push({counts: counts, messups: messups, maxcount: maxcount, maxmessup: maxmessup, elo: elo, newelo: newelo})
    }
    fs.writeFileSync("countingcache.json", JSON.stringify(arr));
}
setInterval(updateCountingCache, 300000);

async function updateUserCount(userid, serverid, newCount) {
    const res = await dbClient.query(`SELECT * FROM counting_users WHERE userid = Cast(${userid} As varchar) AND serverid = Cast(${serverid} As varchar);`);
    if (res.rows.length == 0) {
        dbClient.query(`INSERT INTO counting_users (userid, serverid, counts, maxcount) VALUES (${userid},${serverid},1,${newCount});`);
    }
    else {
        let numCounts = parseInt(res.rows[0]["counts"]) + 1;
        dbClient.query(`UPDATE counting_users SET counts = ${numCounts} WHERE userid = Cast(${userid} As varchar) AND serverid = Cast(${serverid} As varchar);`);

        if (newCount > parseInt(res.rows[0]["maxcount"])) {
            dbClient.query(`UPDATE counting_users SET maxcount = ${newCount} WHERE userid = Cast(${userid}As varchar) AND serverid = Cast(${serverid} As varchar);`)
        }
    }
}

async function updateUserMessup(userid, serverid, messupCount) {
    const res = await dbClient.query(`SELECT * FROM counting_users WHERE userid = Cast(${userid} As varchar) AND serverid = Cast(${serverid} As varchar);`);
    if (res.rows.length == 0) {
        dbClient.query(`INSERT INTO counting_users (userid, serverid, messups, maxmessup) VALUES (${userid},${serverid},1,${messupCount});`);
    }
    else {
        let numMessups = parseInt(res.rows[0]["messups"]) + 1;
        dbClient.query(`UPDATE counting_users SET messups = ${numMessups} WHERE userid = Cast(${userid} As varchar) AND serverid = Cast(${serverid} As varchar);`);

        if (messupCount > parseInt(res.rows[0]["maxmessup"])) {
            dbClient.query(`UPDATE counting_users SET maxmessup = ${messupCount} WHERE userid = Cast(${userid} As varchar) AND serverid = Cast(${serverid} As varchar);`)
        }
    }
}

module.exports.updateCache = updateCache;