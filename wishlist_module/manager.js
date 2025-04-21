const steam = require("./steamlib");
const db = require("./dbwrapper");
const CronJob = require('cron').CronJob;
const { EmbedBuilder } = require('discord.js');
let client;

// This file's log function
function log(message) {
    console.log(message.replaceAll("*", "").replaceAll("`", ""));
    client.channels.cache.get("850844368679862282").send(message);
}

// Exports
module.exports = {
    wishlistSetup: function (discordClient) {
        client = discordClient;
    },
    getSteamGame: function (gameid) {
        return new Promise(function (resolve, reject) {
            let int = parseInt(gameid);
            let check = BigInt("9223372036854775807")
            if (!int || int > check) return reject("INVALID_GAME_ID");
            steam.getGameInfo(int.toString()).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                return reject(error);
            });
        });
    },
    addUser: function (discordId, steamUrl) {
        return new Promise(function (resolve, reject) {
            db.getUser(discordId).then(function (response) {
                if (response.rows.length > 0) return reject("USER_ALREADY_EXISTS");
                if (!steamUrl.includes("steamcommunity.com")) return reject("INVALID_URL");
                let steamSnippet = steamUrl.split("steamcommunity.com")[1];
                if (steamSnippet.startsWith("/profiles/")) {
                    let steamId = steamSnippet.split("/profiles/")[1].split("/")[0];
                    steam.getUserWishlist(steamId).then(function (games) {
                        db.addUser(discordId, steamId).then(function (response2) {
                            resyncSingle(discordId, games);
                            resolve();
                        }).catch(function (error2) {
                            return reject(error2);
                        })
                    }).catch(function (error) {
                        return reject(error);
                    })
                }
                else if (steamSnippet.startsWith("/id/")) {
                    let customId = steamSnippet.split("/id/")[1].split("/")[0];
                    steam.getId64(customId).then(function (steamId) {
                        steam.getUserWishlist(steamId).then(function (games) {
                            db.addUser(discordId, steamId).then(function (response2) {
                                resyncSingle(discordId, games);
                                resolve();
                            }).catch(function (error2) {
                                return reject(error2);
                            })
                        }).catch(function (error) {
                            return reject(error);
                        })
                    }).catch(function (error) {
                        return reject(error);
                    });
                }
                else return reject("INVALID_URL");
            }).catch(function (error) {
                return reject(error);
            });
        })
    },
    deleteUser: function (discordId) {
        return new Promise(function (resolve, reject) {
            if (discordId.length != 18) return reject("INVALID_DISCORD_ID");
            db.getUser(discordId).then(function (response) {
                if (response.rowCount == 0) return reject("USER_NOT_FOUND");
                db.deleteUser(discordId).then(function (response) {
                    resolve(response);
                }).catch(function (error) {
                    return reject(error);
                })
            }).catch(function (error) {
                return reject(error);
            });
        })
    },
    getWishlistFromDB(discordId) {
        return new Promise(function (resolve, reject) {
            db.getUser(discordId).then(function (response) {
                if (response.rowCount == 0) return reject("USER_NOT_FOUND");
                let games = response.rows[0]["gamelist"].split("|");
                let finalArr = [];
                for (let i = 0; i < games.length; i++) {
                    steam.getGameInfo(games[i]).then(function (response) {
                        finalArr.push(response);
                        if (finalArr.length == games.length) {
                            resolve(finalArr);
                        }
                    }).catch(function (error) {
                        return reject(error);
                    })
                }
            }).catch(function (error) {
                return reject(error);
            });
        })
    }
}

module.exports.log = log

function resyncSingle(discordId, steamWishlist = null, steamId = null) {
    if (steamWishlist == null) {
        return new Promise(function (resolve, reject) {
            if (steamId == null) {
                db.getUser(discordId).then(function (response) {
                    if (response.rowCount == 0) return reject("USER_NOT_FOUND");
                    steam.getUserWishlist(response.rows[0]["steamid"]).then(function (response) {
                        let games = response.map(i => i.appid);
                        db.writeWishlist(discordId, games).then(function (response) {
                            return resolve("success");
                        }).catch(function (error) {
                            reject(error);
                        })
                    }).catch(function (error) {
                        if (error == "WISHLIST_LENGTH_0") {
                            db.writeWishlist(discordId, []).then(function (response) {
                                return resolve("success");
                            }).catch(function (error) {
                                reject(error);
                            })
                        }
                        else return reject(error);
                    })

                }).catch(function (error) {
                    return reject(error);
                });
            }
            else {
                steam.getUserWishlist(steamId).then(function (response) {
                    let games = response.map(i => i.appid);
                    db.writeWishlist(discordId, games).then(function (response) {
                        return resolve("success");
                    }).catch(function (error) {
                        reject(error);
                    })
                }).catch(function (error) {
                    if (error == "WISHLIST_LENGTH_0") {
                        db.writeWishlist(discordId, []).then(function (response) {
                            return resolve("success");
                        }).catch(function (error) {
                            reject(error);
                        })
                    }
                    return reject(error);
                })
            }
        })
    }
    else {
        let games = response.map(i => i.appid);
        db.writeWishlist(discordId, games).then(function (response) {
            return;
        }).catch(function (error) {
            log("[WISHLIST] Error setting wishlist with provided data: " + error);
        })
    }
}

module.exports.resyncSingle = resyncSingle;

// Cron Jobs
let wishlistSync = new CronJob(
    '0 0 12 * * *',
    function () {
        //log("[WISHLIST] Starting daily wishlist sync.");
        db.getAllUsers().then(function (response) {
            for (let i = 0; i < response.rowCount; i++) {
                resyncSingle(response.rows[i]["discordid"], null, response.rows[i]["steamid"])
                    //.then(() => {log("[WISHLIST][DEBUG] Finished syncing wishlist for Discord user " + response.rows[i]["discordid"])})
                    .catch((err) => {
                        log("[WISHLIST] Error syncing a single wishlist in daily Cron job:: " + err)
                    });
            }
            //log(`[WISHLIST] Command issued for ${response.rowCount} wishlists to be synced with Steam.`);
        }).catch(function (error) {
            log("[WISHLIST] Error getting all users in daily Cron job: " + error);
        })
    },
    null,
    //SET TO TRUE BELOW TO RUN
    true,
    'Europe/London'
);

let gamePriceSync = new CronJob(
    '0 30 * * * *',
    async function () {
        //log("[WISHLIST] Starting hourly game price sync.");
        let response = await db.getAllUsers()
        let gamesList = []
        let gamesObj = {};
        let usersObj = {};

        for (let i = 0; i < response.rowCount; i++) {
            let games = response.rows[i]["gamelist"].split("|");
            usersObj[response.rows[i]["discordid"]] = games;
            for (let j = 0; j < games.length; j++) {
                gamesList.push(games[j]);
            }
        }

        let allresponse = await steam.getGamePrices(gamesList)
        let responses = Object.keys(allresponse);
        for (let i = 0; i < responses.length; i++) {
            let responseData = allresponse[responses[i]];
            let gameid = responses[i]
            if (responseData == []) {
                //log(`[WISHLIST][DEBUG] Game ${gameid} has no price overview, skipping.`);
            }
            else {
                priceOverview = responseData.price_overview;
                oldPrice = db.updateGame(gameid, priceOverview.final)
                //log(`[WISHLIST][DEBUG] Game ${gameid}, OldPrice: ${oldPrice}, New Price: ${priceOverview.final}`)
                if (oldPrice == -1) {
                    //log(`[WISHLIST][DEBUG] Game ${gameid} not previously in database.`);
                }
                else if (priceOverview.final == oldPrice) {
                    //log(`[WISHLIST][DEBUG] Game ${gameid} has not changed in price.`);
                }
                else if (priceOverview.final < oldPrice) {
                    if (priceOverview.discount_percent > 0) {
                        log(`[WISHLIST][DEBUG] Game ${gameid} has a new discount of ${priceOverview.discount_percent}%. OldPrice: ${oldPrice}, New Price: ${priceOverview.final}`);
                        // Make further API request to get the game's info.
                        gamesObj[gameid] = await steam.getGameInfo(gameid);
                    }
                    else {
                        //log(`[WISHLIST][DEBUG] Game ${gameid} has lowered in price off sale. OldPrice: ${oldPrice}, New Price: ${priceOverview.final}`);
                    }
                }
                else if (priceOverview.final > oldPrice) {
                    //log(`[WISHLIST][DEBUG] Game ${gameid} has risen in price. OldPrice: ${oldPrice}, New Price: ${priceOverview.final}`);
                }
            }
        }
        
        // Notify users which of their games are on sale.
        let gamesOnSale = Object.keys(gamesObj);
        //log(`[WISHLIST][DEBUG] Games on sale: ${gamesOnSale}`)
        let users = Object.keys(usersObj);
        for (let i = 0; i < users.length; i++) {
            let userGames = usersObj[users[i]];
            let userGamesOnSale = [];
            for (let j = 0; j < gamesOnSale.length; j++) {
                if (userGames.includes(gamesOnSale[j])) {
                    userGamesOnSale.push(gamesOnSale[j]);
                }
            }
            //log(`[WISHLIST][DEBUG] User ${users[i]}, userGames ${userGames}, userGamesOnSale ${userGamesOnSale}`)
            if (userGamesOnSale.length < 1) {
                //log(`[WISHLIST][DEBUG] User ${users[i]} has no games on sale.`)
            }
            else if (userGamesOnSale.length == 1) {
                log(`[WISHLIST][DEBUG] User ${users[i]} has one game on sale.`)
                let response2 = gamesObj[userGamesOnSale[0]]
                let embed = new EmbedBuilder()
                    .setTitle(response2.name)
                    .setDescription(response2.short_description)
                    .setImage(response2.header_image)
                    .setColor("#a83e32")
                    .setURL(`https://store.steampowered.com/app/${response2.steam_appid}`)
                    .addFields(
                        {
                            name: `Price: ${response2.price_overview.final_formatted}`,
                            value: response2.price_overview.discount_percent > 0 ? `Discount: **${response2.price_overview.discount_percent}%**` : "Currently no discount."
                        },
                    );
                    client.users.fetch(users[i]).then(user => {
                        user.send({ content: `**${response2.name}** is on sale on Steam!`, embeds: [embed] })
                            .catch(err => {log(`[WISHLIST] Error while trying to DM user ${users[i]}: ${err}`)});
                    });
            }
            else {
                log(`[WISHLIST][DEBUG] User ${users[i]} has multiple games on sale.`)
                let embed = new EmbedBuilder()
                    .setTitle("Sale Summary")
                    .setDescription("[Check Steam](https://store.steampowered.com/wishlist/) for the full details!")
                    .setColor("#a83e32");
                let limit = userGamesOnSale.length
                if (limit > 24) {
                    embed.addFields({name: "Too many of your games are on sale!", value: "The first 24 will be displayed below."})
                    limit = 24;
                }
                for (let i = 0; i < limit; i++) {
                    embed.addFields({name: `\`${userGamesOnSale[i].steam_appid}\` ${userGamesOnSale[i].name}`, value: `Price: **${userGamesOnSale[i].price_overview.final_formatted}** (**${userGamesOnSale[i].price_overview.discount_percent}%** Discount). [View on Steam](https://store.steampowered.com/app/${userGamesOnSale[i].steam_appid})`});
                }
                client.users.fetch(users[i]).then(user => {
                    user.send({ content: `Multiple games are on sale on Steam!`, embeds: [embed] })
                        .catch(err => {log(`[WISHLIST] Error while trying to DM user ${users[i]}: ${err}`)});
                });
            }
        }
    },
    null,
    //SET TO TRUE BELOW TO RUN
    true,
    'Europe/London'
);