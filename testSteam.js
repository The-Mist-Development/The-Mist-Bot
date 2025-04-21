const steam = require("./wishlist_module/steamlib")
const db = require("./wishlist_module/dbwrapper")

async function dewit() {
    let response = await db.getAllUsers()
    let gamesList = []
    let gamesObj = {};
    let usersObj = {};

    for (let i = 0; i < response.rowCount; i++) {
        let games = response.rows[i]["gamelist"].split("|");
        console.log(response.rows[i]["discordid"], games)
        usersObj[response.rows[i]["discordid"]] = games;
        for (let j = 0; j < games.length; j++) {
            if (!gamesList.includes(games[j])) {
                gamesList.push(games[j]);
            }
        }
    }

    console.log("gamesList", gamesList)
    console.log("usersObj", usersObj)

    gamesObj = {}
    let allresponse = await steam.getGamePrices(["638970","989790","1105510","2001120","2950710","1295320","1260520","736260","1730360","2060590"])
    let responses = Object.keys(allresponse);
    for (let i = 0; i < responses.length; i++) {
        let response = allresponse[responses[i]];
        let gameid = responses[i]
        if (response.price_overview) {
            oldPrice = 2099
            //log(`[WISHLIST][DEBUG] Game ${gameid}, OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`)
            if (oldPrice == -1) {
                //log(`[WISHLIST][DEBUG] Game ${gameid} not previously in database.`);
            }
            else if (oldPrice == response.price_overview.final) {
                //log(`[WISHLIST][DEBUG] Game ${gameid} has not changed in price.`);
            }
            else if (response.price_overview.final < oldPrice) {
                if (response.price_overview.discount_percent > 0) {
                    console.log(`[WISHLIST][DEBUG] Game ${gameid} has a new discount of ${response.price_overview.discount_percent}%. OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`);
                    // Make further API request to get the game's info.
                    gamesObj[gameid] = await steam.getGameInfo(gameid);
                }
                else {
                    console.log(`[WISHLIST][DEBUG] Game ${gameid} has lowered in price off sale. OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`);
                }
            }
            else if (response.price_overview.final > oldPrice) {
                console.log(`[WISHLIST][DEBUG] Game ${gameid} has risen in price. OldPrice: ${oldPrice}, New Price: ${response.price_overview.final}`);
            }
        }
        else {
            //log(`[WISHLIST][DEBUG] Game ${gameid} has no price overview, skipping.`);
        }
    }

    let gamesOnSale = Object.keys(gamesObj);
    console.log(`[WISHLIST][DEBUG] Games on sale: ${gamesOnSale}`);

    let users = Object.keys(usersObj);
    for (let i = 0; i < users.length; i++) {
        let userGames = usersObj[users[i]];
        let userGamesOnSale = [];
        for (let j = 0; j < gamesOnSale.length; j++) {
            if (userGames.includes(gamesOnSale[j])) {
                userGamesOnSale.push(gamesOnSale[j]);
            }
        }
        console.log(`[WISHLIST][DEBUG] User ${users[i]}, userGames ${userGames}, userGamesOnSale ${userGamesOnSale}`)
    }
}

dewit()
