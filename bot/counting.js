const Discord = require("discord.js");
const { Client } = require("pg");
const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = {
    dbConnect: function(message) {
        dbClient.connect(err => {
            if (err) {
              console.error('Connection error while connecting to database: ' + err.stack)
            } else {
              console.log('Connected to Database');
            }
          });
    },
    getCountingChannels: async function() {
        const res = await dbClient.query("SELECT channelid FROM counting;");
        return res.rows.map(x => x["channelid"]);
    },
    count: async function (message) {
        const res = await dbClient.query(`SELECT * FROM counting WHERE channelid=${message.channel.id};`).rows[0]
        if (message.content == res["count"]+1) {
            await dbClient.query(`UPDATE counting SET count=${res["count"]+1} WHERE channelid=${message.channel.id}`)
            message.react("<a:mistbot_confirmed:870070841268928552>")
        }
        else {
            await dbClient.query(`UPDATE counting SET count=0 WHERE channelid=${message.channel.id}`)
            message.channel.send("**" + message.member.displayName + "** ruined the count at `" + res["count"] + "`! `The count reset.`");
            message.react("❌");
            message.channel.send("Next number is `1`.");
        }
        if (res["count"]+1 > res["maxcount"]) {
            dbClient.query(`UPDATE counting SET maxcount = ${count} WHERE channelid = '${message.channel.id}`)
        }

    },
    enableCounting: async function(message) {
        if (this.getCountingChannels().includes(message.channel.id)) {
            message.channel.send("Counting is already enabled in this channel!")
        }
        else if (message.member.permissions.has(Permissions.FLAG.MANAGE_CHANNELS)) {
            await dbClient.query(`INSERT INTO counting (channelid, maxcount, count) VALUES (${message.channel.id},0,0);`);
            message.channel.send("Counting is now enabled! The next number is `1`.")
        }
        else {
            message.channel.send("You don't have permission to do that! Get someone who can Manage Channels to set counting up for you.")
        }

    },
    disableCounting: async function(message) {
        if (this.getCountingChannels().includes(message.channelid)) {
            message.channel.send("Counting isn't enabled in this channel!")
        }
        else if (message.member.permissions.has(Permissions.FLAG.MANAGE_CHANNELS)) {
            await dbClient.query(`DELETE FROM counting WHERE channelid=${message.channel.id};`)
            message.channel.send("Counting is now disabled! Sorry to see you go :(")
        }
        else {
            message.channel.send("You don't have permission to do that! Get someone who can Manage Channels to turn counting off for you.")
        }
    },
}