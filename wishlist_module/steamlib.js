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
    getUserWishlist: function (snippet) {
        return new Promise(function (resolve, reject) {
            axios.get(`https://store.steampowered.com/wishlist${snippet}wishlistdata/`)
                .then(function (response) {
                    if (response.success) {
                        if (response.success == 2) {
                            return reject("WISHLIST_NOT_FOUND");
                        }
                        else return reject("IDK");
                    }
                    resolve(response.data);
                })
                .catch(function (error) {
                    if (error.toString().includes("status code 500")) reject("WISHLIST_NOT_FOUND");
                    else reject(error.toString());
                });
        });
    }
}