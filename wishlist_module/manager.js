const steam = require("./steamlib");
const db = require("./dbwrapper");
const CronJob = require('cron').CronJob;
const { MessageEmbed } = require('discord.js');
let client;

// This file's log function
function log(message) {
    console.log(message.replaceAll("*", "").replaceAll("`", ""));
    client.channels.cache.get("850844368679862282").send(message);
}

// Exports
module.exports = {
    wishlistSetup: function(discordClient) {
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
                if (steamSnippet.startsWith("/id/") || steamSnippet.startsWith("/profiles/")) {
                    let array = steamSnippet.split("");
                    if (array[array.length - 1] != "/") steamSnippet = steamSnippet + "/";
                    steam.getUserWishlist(steamSnippet).then(function (response) {
                        db.addUser(discordId, steamSnippet).then(function (response2) {
                            resyncSingle(discordId, response);
                            resolve(response);
                        }).catch(function (error2) {
                            return reject(error2);
                        })
                    }).catch(function (error) {
                        return reject(error);
                    })
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

function resyncSingle(discordId, steamWishlist = null) {
    if (steamWishlist == null) {
        return new Promise(function (resolve, reject) {
            db.getUser(discordId).then(function (response) {
                if (response.rowCount == 0) return reject("USER_NOT_FOUND");
                    steam.getUserWishlist(response.rows[0]["steamsnippet"]).then(function (response) {
                            let keys = Object.keys(response);
                            db.writeWishlist(discordId, keys).then(function (response) {
                                return resolve("success");
                            }).catch(function (error) {
                                reject (error);
                            })
                    }).catch(function (error) {
                        return reject(error);
                    })

            }).catch(function (error) {
                return reject(error);
            });
        })
    }
    else {
        let keys = Object.keys(steamWishlist);
        db.writeWishlist(discordId, keys).then(function (response) {
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
        log("[WISHLIST] Starting daily wishlist sync.");
        db.getAllUsers().then(function (response) {
            for (let i = 0; i < response.length; i++) {
                resyncSingle(response.rows[i]["discordId"]);
            }
            log("[WISHLIST] Command issued for all wishlists to be synced with Steam.");
        }).catch(function (error) {
            log("[WISHLIST] Error automatically syncing wishlists in daily Cron job: " + error);
        })
    },
    null,
    true,
    'Europe/London'
);

let gamePriceSync = new CronJob(
    '0 30 * * * *',
    function () {
        log("[WISHLIST] Starting hourly game price sync.");
        db.getAllUsers().then(function (response) {
            let gamesObj = {};
            for (let i = 0; i < response.length; i++) {
                let games = response.rows[0]["gamelist"].split("|");
                for (let j = 0; j < games.length; j++) {
                    if (gamesObj[games[j]] == undefined) {
                        gamesObj[games[j]] = [response.rows[i]["discordid"]];
                    }
                    else {
                        gamesObj[games[j]].push(response.rows[i]["discordid"]);
                    }
                }
            }
            let games = Object.keys(gamesObj);
            for (let i = 0; i < games.length; i++) {
                steam.getGameInfo(games[i]).then(function (response) {
                    if (response.is_free) {
                        log(`[WISHLIST][DEBUG] Game ${response.name} is free, skipping.`);
                    }
                    else if (response.price_overview) {
                        db.updateGame(games[i], response.price_overview.final).then(function (oldPrice) {
                            if (oldPrice == -1) {
                                log(`[WISHLIST][DEBUG] Game ${response.name} not previously in database.`);
                            }
                            else if (oldPrice == response.price_overview.final) {
                                log(`[WISHLIST][DEBUG] Game ${response.name} has not changed in price.`);
                            }
                            else if (response.price_overview.final < oldPrice) {
                                if (response.price_overview.discount_percent > 0) {
                                    log(`[WISHLIST][DEBUG] Game ${response.name} has a discount of ${response.price_overview.discount_percent}%.`);
                                    let embed = new MessageEmbed()
                                                .setTitle(response.name)
                                                .setDescription(response.short_description)
                                                .setImage(response.header_image)
                                                .setColor("#a83e32")
                                                .addFields(
                                                    {
                                                        name: `Price: ${response.price_overview.final_formatted}`,
                                                        value: response.price_overview.discount_percent > 0 ? `Discount: **${response.price_overview.discount_percent}%**` : "Currently no discount."
                                                    },

                                                )
                                    for (let g = 0; g < gamesObj[games[i]].length; g++) {
                                            client.users.fetch(gamesObj[games[i]][g]).then(user => { 
                                                user.send({ content: `**${response.name}** is on sale on Steam!`, embeds: [embed] });
                                            });
                                    }
                                }
                                else {
                                    log(`[WISHLIST][DEBUG] Game ${response.name} has lowered in price off sale.`);
                                }
                            }
                            else if (response.price_overview.final > oldPrice) {
                                log(`[WISHLIST][DEBUG] Game ${response.name} has risen in price.`);
                            }
                        }).catch(function (error) {
                            log("[WISHLIST] Error updating game price in hourly Cron job: " + error);
                        });
                    }
                    else {
                        log(`[WISHLIST][DEBUG] Game ${response.name} has no price overview, skipping.`);
                    }
                }).catch(function (error) {
                    log("[WISHLIST] Error updating game price in hourly Cron job: " + error);
                })
            }
        }).catch(function (error) {
            log("[WISHLIST] Error automatically syncing game prices in hourly Cron job: " + error);
        })
    },
    null,
    true,
    'Europe/London'
);