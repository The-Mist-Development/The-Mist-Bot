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
            message.react("❎");
            message.channel.send("We're having issues **connecting to our database**. Please try again later. If this issue persists, contact R2D2Vader#0693");
            return;
        }
        const resObj = await dbClient.query(`SELECT * FROM counting WHERE channelid=${message.channel.id};`)
        let res = resObj.rows[0]
        if (message.content == parseInt(res["count"]) + 1) {
            await dbClient.query(`UPDATE counting SET count=${parseInt(res["count"]) + 1} WHERE channelid=${message.channel.id}`)
            message.react("<a:mistbot_confirmed:870070841268928552>")
        }
        else {
            await dbClient.query(`UPDATE counting SET count=0 WHERE channelid=${message.channel.id}`)
            message.channel.send("**" + message.member.displayName + "** ruined the count at `" + res["count"] + "`! `The count reset.`");
            message.react("❌");
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
            await dbClient.query(`INSERT INTO counting (channelid, maxcount, count) VALUES (${message.channel.id},0,0);`);
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
    }
}

async function updateCache() {
    const res = await dbClient.query("SELECT channelid FROM counting;");
    countingChannelsCache = res.rows.map(x => x["channelid"]);
}