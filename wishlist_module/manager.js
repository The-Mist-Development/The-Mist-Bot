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

function resyncSingle(discordId, steamWishlist = null, steamSnippet = null) {
    if (steamWishlist == null) {
        return new Promise(function (resolve, reject) {
            if (steamSnippet == null) {
                db.getUser(discordId).then(function (response) {
                    if (response.rowCount == 0) return reject("USER_NOT_FOUND");
                    steam.getUserWishlist(response.rows[0]["steamsnippet"]).then(function (response) {
                        let keys = Object.keys(response);
                        db.writeWishlist(discordId, keys).then(function (response) {
                            return resolve("success");
                        }).catch(function (error) {
                            reject(error);
                        })
                    }).catch(function (error) {
                        return reject(error);
                    })

                }).catch(function (error) {
                    return reject(error);
                });
            }
            else {
                steam.getUserWishlist(steamSnippet).then(function (response) {
                    let keys = Object.keys(response);
                    db.writeWishlist(discordId, keys).then(function (response) {
                        return resolve("success");
                    }).catch(function (error) {
                        reject(error);
                    })
                }).catch(function (error) {
                    return reject(error);
                })
            }
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
        //log("[WISHLIST] Starting daily wishlist sync.");
        db.getAllUsers().then(function (response) {
            for (let i = 0; i < response.rowCount; i++) {
                resyncSingle(response.rows[i]["discordid"], null, response.rows[i]["steamsnippet"])
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
    '0 40 * * * *',
    function () {
        //log("[WISHLIST] Starting hourly game price sync.");
        db.getAllUsers().then(function (response) {
            let gamesObj = {};
            for (let i = 0; i < response.rowCount; i++) {
                let games = response.rows[i]["gamelist"].split("|");
                for (let j = 0; j < games.length; j++) {
                    if (gamesObj[games[j]] == undefined) {
                        gamesObj[games[j]] = [response.rows[i]["discordid"]];
                    }
                    else {
                        gamesObj[games[j]].push(response.rows[i]["discordid"]);
                    }
                }
            }
            steam.getGamePrices(Object.keys(gamesObj)).then(function (allresponse) {
                let responses = Object.keys(allresponse);
                for (let i = 0; i < responses.length; i++) {
                    let response = allresponse[responses[i]];
                    let gameid = responses[i]
                    if (response.is_free) {
                        // Should never happen under new API
                        //log(`[WISHLIST][DEBUG] Game ${gameid} is free, skipping.`);
                    }
                    else if (response.price_overview) {
                        db.updateGame(gameid, response.price_overview.final).then(function (oldPrice) {
                            //log(`[WISHLIST][DEBUG] Game ${gameid}, OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`)
                            if (oldPrice == -1) {
                                //log(`[WISHLIST][DEBUG] Game ${gameid} not previously in database.`);
                            }
                            else if (oldPrice == response.price_overview.final) {
                                log(`[WISHLIST][DEBUG] Game ${gameid} has not changed in price.`);
                            }
                            else if (response.price_overview.final < oldPrice) {
                                if (response.price_overview.discount_percent > 0) {
                                    log(`[WISHLIST][DEBUG] Game ${gameid} has a new discount of ${response.price_overview.discount_percent}%. OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`);
                                    // Make further API request to get the game's info.
                                    steam.getGameInfo(gameid).then(function (response2) {
                                        let embed = new EmbedBuilder()
                                            .setTitle(response2.name)
                                            .setDescription(response2.short_description)
                                            .setImage(response2.header_image)
                                            .setColor("#a83e32")
                                            .addFields(
                                                {
                                                    name: `Price: ${response2.price_overview.final_formatted}`,
                                                    value: response2.price_overview.discount_percent > 0 ? `Discount: **${response2.price_overview.discount_percent}%**` : "Currently no discount."
                                                },

                                            )
                                        for (let g = 0; g < gamesObj[gameid].length; g++) {
                                            client.users.fetch(gamesObj[gameid][g]).then(user => {
                                                user.send({ content: `**${response2.name}** is on sale on Steam!`, embeds: [embed] });
                                            });
                                        }

                                    }).catch(function (error) {
                                        log("[WISHLIST] Error in second API call to announce sale: " + error + `\r Game ID: ${gameid}`);
                                    })
                                }
                                else {
                                    log(`[WISHLIST][DEBUG] Game ${gameid} has lowered in price off sale. OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`);
                                }
                            }
                            else if (response.price_overview.final > oldPrice) {
                                log(`[WISHLIST][DEBUG] Game ${gameid} has risen in price. OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`);
                            }
                        }).catch(function (error) {
                            log("[WISHLIST] Error updating game price in hourly Cron job: " + error + `\r Game ID: ${gameid}`);
                        });
                    }
                    else {
                        //log(`[WISHLIST][DEBUG] Game ${response.name} has no price overview, skipping.`);
                    }
                }
            }).catch(function (error) {
                log("[WISHLIST] Error updating game prices in hourly Cron job: " + error);
            })

            //log("[WISHLIST] Sent the command to update the prices of " + games.length.toString() + " games.")
        }).catch(function (error) {
            log("[WISHLIST] Error automatically syncing game prices in hourly Cron job: " + error);
        })
    },
    null,
    //SET TO TRUE BELOW TO RUN
    true,
    'Europe/London'
);