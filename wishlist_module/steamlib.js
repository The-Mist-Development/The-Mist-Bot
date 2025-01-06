const axios = require('axios').default;

module.exports = {
    getGameInfo: function (gameid) {
        return new Promise(function (resolve, reject) {
            axios.get(`https://store.steampowered.com/api/appdetails?appids=${gameid}&cc=us`)
                .then(function (response) {
                    if (response.data[gameid].success) {
                        resolve(response.data[gameid].data);
                    } else reject("GAME_NOT_FOUND");
                })
                .catch(function (error) {
                    reject(error.toString());
                });
        });
    },
    getGamePrices: function (gameids) {
        return new Promise(function (resolve, reject) {
            axios.get(`https://store.steampowered.com/api/appdetails?appids=${gameids.join(",")}&cc=us&filters=price_overview`)
                .then(function (response) {
                    let formatted = {};
                    for (let i = 0; i < gameids.length; i++) {
                        if (response.data[gameids[i]].success) {
                            formatted[gameids[i]] = response.data[gameids[i]].data;
                        }
                    }
                    if (Object.keys(formatted).length > 0) resolve(formatted);
                    else reject("GAMES_NOT_FOUND");
                })
                .catch(function (error) {
                    reject(error.toString());
                });
        });
    },
    getUserWishlist: function (steamId) {
        return new Promise(function (resolve, reject) {
            axios.get(`https://api.steampowered.com/IWishlistService/GetWishlist/v1?steamid=${steamId}`)
                .then(function (response) {
                    let resdata = response.data.response;
                    if (resdata.success) {
                        if (resdata.success == 2) {
                            return reject("WISHLIST_NOT_FOUND");
                        }
                        else return reject("IDK");
                    }
                    if (resdata.items) resolve(resdata.items);
                    else reject("WISHLIST_LENGTH_0");
                })
                .catch(function (error) {
                    string = error.toString()
                    if (string.includes("status code 500")) reject("WISHLIST_NOT_FOUND");
                    else if (string.includes("status code 400")) reject("INVALID_URL");
                    else reject(string);
                });
        });
    },
    getId64: function (customId) {
        return new Promise(function (resolve, reject) {
            axios.get(`https://playerdb.co/api/player/steam/${customId}`)
                .then(function (response) {
                    let resdata = response.data;
                    if (resdata.code && resdata.code == "player.found") {
                        resolve(resdata.data.player.meta.steam64id);
                    }
                    else reject("WISHLIST_NOT_FOUND");
                })
                .catch(function (error) {
                    string = error.toString()
                    if (string.includes("status code 400")) reject("WISHLIST_NOT_FOUND");
                    else reject(string);
                });
        })
    }
}