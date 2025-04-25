const db = require("../bot/database.js");

module.exports = {
    addUser(discordId, steamId) {
        return new Promise((resolve, reject) => {
            db.w_addUser(discordId, steamId).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            });
        });
    },
    getUser(discordId) {
        return new Promise((resolve, reject) => {
            db.w_getUser(discordId).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            });
        });
    },
    deleteUser(discordId) {
        return new Promise((resolve, reject) => {
            db.w_deleteUser(discordId).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            });
        });
    },
    writeWishlist(discordId, gameList) {
        return new Promise((resolve, reject) => {
            let wishlistString = gameList.join("|");
            db.w_writeWishlist(discordId, wishlistString).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            })
        })
    },
    getAllUsers() {
        return new Promise((resolve, reject) => {
            db.w_getAllUsers().then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            });
        });
    },
    updateGame(gameId, price) {
        return new Promise((resolve, reject) => {
            db.w_updateGame(gameId, price).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            });
        });
    },
    recordFailedDM(discordId) {
        return new Promise((resolve, reject) => {
            db.w_recordFailedDM(discordId).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            });
        })
    },
    resetFailedDM(discordId) {
        return new Promise((resolve, reject) => {
            db.w_resetFailedDM(discordId).then(function (response) {
                resolve(response);
            }).catch(function (error) {
                reject(error);
            });
        })
    }
}