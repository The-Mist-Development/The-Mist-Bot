require("dotenv").config();
const steam = require("./wishlist_module/steamlib");
const { Client } = require("pg");
const dbClient = new Client({
    connectionString: process.env.DATABASE_URL
});

const { Client: DiscordClient, GatewayIntentBits, Partials } = require("discord.js");
const discord = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
const token = process.env.TOKEN;
discord.login(token);

discord.on("ready", () => {
    dbClient.connect((err) => {
        if (err) {
            console.error('Connection error while connecting to database: ' + err.stack);
        } else {
            w_getAllUsers().then(async function (response) {
                for (let i = 0; i < response.rowCount; i++) {
                    console.log("Working on user " + response.rows[i]["discordid"]);
                    let steamId = await steam.getId64(response.rows[i]["steamsnippet"].split("/")[2]);
                    console.log("Got Steam ID " + steamId);
                    await setSteamId(response.rows[i]["discordid"], steamId);
                    await resyncSingle(response.rows[i]["discordid"], steamId);
                    console.log("Resynced their wishlist");
                    discord.users.fetch(response.rows[i]["discordid"]).then(user => {
                        user.send("We've **fixed our Wishlist notifications** and migrated your account to our new system! No action should be required from you. We expect the new system to have some bugs - if you encounter any issues, please contact `@r2d2vader`.");
                        console.log("Sent them the message.")
                    }).catch(err, console.error)
                }
            })

        }
    });
});

function resyncSingle(discordId, steamId) {
    return new Promise(async function (resolve, reject) {
        let wishlist = await steam.getUserWishlist(steamId);
        let games = wishlist.map(i => i.appid);
        let wishlistString = games.join("|");
        dbClient.query("UPDATE wishlist_users SET gamelist = $1 WHERE discordid = $2", [wishlistString, discordId], function (error, results) {
            if (error) reject(error);
            resolve(results);
        });
    });
}

function w_getAllUsers() {
    return new Promise((resolve, reject) => {
        dbClient.query("SELECT * FROM wishlist_users", function (error, results) {
            if (error) reject(error);
            resolve(results);
        });
    });
}

function setSteamId(discordId, steamId) {
    return new Promise((resolve, reject) => {
        dbClient.query("UPDATE wishlist_users SET steamid = $1 WHERE discordid = $2", [steamId, discordId], function (error, results) {
            if (error) reject(error);
            resolve(results);
        });
    })
}