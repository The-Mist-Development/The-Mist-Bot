const { Discord, Permissions } = require("discord.js");
const { Client } = require("pg");
const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
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
            }
          });
    },
    getCountingChannels: async function() {
        if (countingChannelsCache.length == 0) {
            const res = await dbClient.query("SELECT channelid FROM counting;");
            countingChannelsCache = res.rows.map(x => x["channelid"]);
        }
        return countingChannelsCache;
    },
    getMaxCount: async function(message, lookupChannel) {
        if (lookupChannel) {
                const res = await dbClient.query(`SELECT * FROM counting WHERE channelid=${lookupChannel.id};`);
                if (res.rows.length == 0) return message.channel.send("Counting has not been enabled in this channel.");
                message.channel.send(`The highest ever count in **${lookupChannel.guild.name}** <#${lookupChannel.id}> was \`${res.rows[0]["maxcount"]}\`.`);
        }
        else {
            const res = await dbClient.query(`SELECT * FROM counting WHERE channelid=${message.channel.id};`);
            if (res.rows.length == 0) return message.channel.send("Run this command in a **counting channel** to see the highest ever count in that channel!")
            message.channel.send(`The highest ever count in **${message.guild.name}** <#${message.channel.id}> was \`${res.rows[0]["maxcount"]}\`.`);
        }
    },
    count: async function (message) {
        if (connected == false) {
            message.react("❎").catch((err) => {return;});
            message.channel.send("We're having issues **connecting to our database**. Please try again later. If this issue persists, contact R2D2Vader#0693");
            return;
        }
        const resObj = await dbClient.query(`SELECT * FROM counting WHERE channelid=${message.channel.id};`)
        let res = resObj.rows[0]
        if (message.content == parseInt(res["count"]) + 1) {
            if (res["lastusertocount"] != message.member.id) {
                await dbClient.query(`UPDATE counting SET count=${parseInt(res["count"]) + 1}, lastusertocount=${message.member.id} WHERE channelid=${message.channel.id}`)
                message.react("<a:mistbot_confirmed:870070841268928552>").catch((err) => {message.channel.send("<a:mistbot_confirmed:870070841268928552>")});
            }
            else {
                await dbClient.query(`UPDATE counting SET count=0, lastusertocount=-1 WHERE channelid=${message.channel.id}`)
                message.channel.send("**<@" + message.member.id + ">** ruined the count at `" + res["count"] + "`! You cannot count **twice in a row**. `The count reset.`");
                message.react("❌").catch((err) => {return;});
                message.channel.send("Next number is `1`.");
                return;
            }
        }
        else {
            await dbClient.query(`UPDATE counting SET count=0, lastusertocount=-1 WHERE channelid=${message.channel.id}`)
            message.channel.send("**<@" + message.member.id + ">** ruined the count at `" + res["count"] + "`! `The count reset.`");
            message.react("❌").catch((err) => {return;});
            message.channel.send("Next number is `1`.");
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
        else if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
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
        else if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
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
        if (message.channel.type != "GUILD_TEXT") return message.channel.send("Updates can only be subscribed to in a Server Text Channel!");
        const res = await dbClient.query("SELECT channelid FROM subscribed;");
        let array = res.rows.map(x => x["channelid"]);

        if (array.includes(message.channel.id)) {
            message.channel.send("This channel is already subscribed to updates!")
        }
        else if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
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
        else if (message.member.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            await dbClient.query(`DELETE FROM subscribed WHERE channelid=Cast(${message.channel.id} As varchar);`);
            message.channel.send("This channel is now unsubscribed from updates!");
        }
        else {
            message.channel.send("You **don't have permission to do that**! Get someone who can `Manage Channels` to unsubscribe from updates for you.")
        }
    }
}

async function updateCache() {
    const res = await dbClient.query("SELECT channelid FROM counting;");
    countingChannelsCache = res.rows.map(x => x["channelid"]);
}

module.exports.updateCache = updateCache;