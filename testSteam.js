const steam = require("./wishlist_module/steamlib")

async function dewit() {
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
    console.log(`[WISHLIST][DEBUG] Games on sale: ${gamesOnSale}`)
}

dewit()
