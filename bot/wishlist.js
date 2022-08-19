const { EmbedBuilder } = require("discord.js")
const wishlist = require("../wishlist_module/manager.js");

module.exports = {
    wishlistCommand(message, args) {
        if (!args[0]) return message.channel.send({ embeds: [helpembed()] });
        let command = args.shift().toLowerCase();

        switch (command) {
            case "help":
                message.channel.send({ embeds: [helpembed()] });
                break;
            case "privacy":
                message.channel.send({ embeds: [privacyembed()] });
                break;
            case "game":
                if (args[0]) sendGameInfo(message, args[0]);
                else message.channel.send("Please provide a Steam Game ID.");
                break;
            case "register":
                startRegister(message);
                break;
            case "delete":
                unregister(message);
                break;
            case "resync":
                wishlist.resyncSingle(message.author.id).then(function () {
                    message.channel.send("✅ Successfully synced our copy of your wishlist with Steam.");
                }).catch(function (err) {
                    if (err == "USER_NOT_FOUND") return message.channel.send("You don't have your wishlist registered!");
                    message.channel.send("❌ Failed to sync your wishlist with Steam. Please try again later.");
                    console.log("Error syncing wishlist: " + err);
                });
                break;
            case "list": 
                sendList(message); 
                break;
            default:
                message.channel.send({ embeds: [helpembed()] });
                break;
        }
    }
}

function sendGameInfo(message, id) {
    wishlist.getSteamGame(id).then(function (response) {
        let embed = new EmbedBuilder()
            .setTitle(response.name)
            .setDescription(response.short_description)
            .setImage(response.header_image)
            .setColor("#de66d0")
        if (response.price_overview) {
            embed.addFields(
                {
                    name: `Price: ${response.price_overview.final_formatted}`,
                    value: response.price_overview.discount_percent > 0 ? `Discount: **${response.price_overview.discount_percent}%**` : "Currently no discount."
                },

            )
        }
        else if (response.is_free) {
            embed.addFields(
                {
                    name: "Price: Free",
                    value: "You can't get more discounted than that!"
                }
            )
        }
        else {
            embed.addFields(
                {
                    name: "Price: Unknown",
                    value: "This game may not be available for purchase."
                }
            )
        }
        message.channel.send({ embeds: [embed] });
    }).catch(function (error) {
        if (error == "GAME_NOT_FOUND") {
            message.channel.send("**Game not found**. Please ensure the Steam ID is correct.");
        }
        else if (error == "INVALID_GAME_ID") {
            message.channel.send("Please provide a valid Steam Game ID.")
        }
        else {
            console.log("Error getting game from Steam: " + error);
            message.channel.send("An error occured! Try again later.");
        }
    });
}

async function startRegister(message) {
    message.react("📩")
    let embed = new EmbedBuilder()
        .setTitle("Send your Steam Profile URL")
        .setColor("#ebc610")
        .addFields(
            {
                name: "Step 1: Open your Steam Profile.",
                value: 'Open the Steam app, hover over your profile name in the top bar, and click "Profile".'
            },
            {
                name: "Step 2: Right-click somewhere on the page to open the context menu.",
                value: "Or if you have opened your profile in a browser, you can simply copy the URL from the address bar."
            },
            {
                name: 'Step 3: Click "Copy Page URL".',
                value: "Then, paste the link here."
            }
        )
    let dm = await message.author.send({ content: "Follow the instructions below to register your Wishlist and enable notifications.", embeds: [embed] });
    let filter = m => m.author.id == message.author.id
    dm.channel.awaitMessages({
        filter,
        max: 1,
        time: 120000,
        errors: ['time']
    }).then(collected => {
        let url = collected.first().content;
        wishlist.addUser(message.author.id, url).then(function (wishlist) {
            let embed2 = new EmbedBuilder()
                .setTitle("Success")
                .setDescription("Your Wishlist has successfully been added to our database to alert you when one of your games goes on sale. We will automatically keep your wishlist updated, but you can manually update our copy of it by running `" + process.env.PREFIX + "wishlist resync`. To disable notifications, run `" + process.env.PREFIX + "wishlist delete`.")
                .setColor("#382bc4")
            embed2.addFields({name: "Games currently on your wishlist", value: "---"});
            let keys = Object.keys(wishlist);
            let length = keys.length <= 8 ? keys.length : 8;
            for (let i = 0; i < length; i++) {
                let cprice = wishlist[keys[i]].subs[0] ? wishlist[keys[i]].subs[0].discount_block.split("<div class=\"discount_final_price\">")[1].split("</div>")[0] : "Not available";
                embed2.addFields({name: `\`${keys[i]}\` ${wishlist[keys[i]].name}`, value: `Estimated price: **${cprice}**`});
            }
            if (keys.length - length > 0) {
                embed2.addFields({name: `Plus ${keys.length - length} more game${keys.length - length > 1 ? "s" : ""}.`, value: "---"});
            }
            dm.channel.send({ embeds: [embed2] });
        }).catch(error => {
            if (error == "INVALID_URL") {
                dm.channel.send("Invalid Steam Profile URL! Registration cancelled.");
            }
            else if (error == "WISHLIST_NOT_FOUND") {
                dm.channel.send("Couldn't find your wishlist! Make sure that your profile URL is correct and that your Game Details are set to public.");
            }
            else if (error == "USER_ALREADY_EXISTS") {
                dm.channel.send("Wait a minute - you are already registered! To update your wishlist, run `" + process.env.PREFIX + "wishlist resync`.");
            }
            else {
                console.log(error);
                dm.channel.send("An error occured! Please try again.");
            }
        })
    }).catch(collected => {
        if (collected.size == 0) {
            dm.channel.send("Timed out. Please try again.");
        }
        else dm.channel.send("An error occured. Please try again.")
    })
}

function unregister(message) {
    wishlist.deleteUser(message.author.id).then(function () {
        message.channel.send("Your wishlist has been successfully removed from our database. We will no longer notify you when your games go on sale!");
    }).catch(error => {
        if (error == "USER_NOT_FOUND") {
            message.channel.send("You don't have your wishlist registered!");
        }
        else {
            console.log(error);
            message.channel.send("An error occured. Please try again.");
        }
    })
}

function sendList(message) {
    wishlist.getWishlistFromDB(message.author.id).then(function (response) {
        let embed = new EmbedBuilder()
            .setTitle("Your Wishlist")
            .setDescription("This is the list of games we will notify you about. To update our copy of your wishlist, run `" + process.env.PREFIX + "wishlist resync` - though this automatically happens once every 24 hours.")
            .setColor("#0d8222")
        for (let i = 0; i < response.length; i++) {
            if (response[i].price_overview) {
                embed.addFields({name: `\`${response[i].steam_appid}\` ${response[i].name}`, value: `Price: **${response[i].price_overview.final_formatted}** (${response[i].price_overview.discount_percent > 0 ? `**${response[i].price_overview.discount_percent}%** Discount` : `Full Price`})`});
            }
            else if (response[i].is_free) {
                embed.addFields({name: `\`${response[i].steam_appid}\` ${response[i].name}`, value: "Price: **Free**"});
            }
            else {
                embed.addFields({name: `\`${response[i].steam_appid}\` ${response[i].name}`, value: "Price: **Unknown** / not available"});
            }
        }
        message.channel.send({ embeds: [embed] });
    }).catch(function (error) {
        if (error == "USER_NOT_FOUND") {
            message.channel.send("You don't have your wishlist registered!");
        }
        else if (error == "GAME_NOT_FOUND") {
            message.channel.send("Couldn't find one or more of the games on your wishlist! Run `" + process.env.PREFIX + "wishlist resync` to update our copy.");
        }
        else {
            console.log(error);
            message.channel.send("An error occured. Please try again.");
        }
    })
}

function helpembed () {
    let prefix = process.env.PREFIX + "wishlist ";
    return new EmbedBuilder()
        .setTitle("Wishlist - Commands")
        .setColor("#2058b3")
        .setDescription("This is a custom implementation of another bot we designed to notify Discord users when games on their Steam wishlist go on sale. \r The original source code can be found [here](https://github.com/The-Mist-Development/Steam-Wishlist-Bot) and the modified version along with the rest of The Mist Bot source [here](https://github.com/The-Mist-Development/The-Mist-Bot). \r The Mist Bot is not affiliated with Valve or Steam.")
        .addFields(
            {
                name: `\`${prefix}help\``,
                value: "Gives you a list of the bot's commands"
            },
            {
                name: `\`${prefix}register\``,
                value: "Starts the process (which continues in DMs) of acquiring your Steam wishlist, so we can notify you when games on it go on sale."
            },
            {
                name: `\`${prefix}list\``,
                value: "Displays a list of the games you will be notified about."
            },
            {
                name: `\`${prefix}resync\``,
                value: "Manually syncs your Steam wishlist. This happens automatically every 24 hours."
            },
            {
                name: `\`${prefix}delete\``,
                value: "Deletes your wishlist from our database and unregisters you from notifications."
            },
            {
                name: `\`${prefix}privacy\``,
                value: "Provides information about data we store, and how the bot works."
            },
            {
                name: `\`${prefix}game\``,
                value: "Looks up a Steam game by ID and provides information about it. This was initially intended for debugging."
            }
        )
}

function privacyembed() {
    return new EmbedBuilder()
        .setTitle("Privacy")
        .setColor("#10b555")
        .addFields(
            {
                name: "Data we store",
                value: "When you register, we store part of your Steam profile link and your Discord ID in our database. This allows us to update which games we should notify you about when your wishlist changes. \r We also store Steam's Game ID for all of the games in your wishlist, along with your Discord ID. This allows us to notify you when we detect a sale."
            },
            {
                name: "How we access data from Steam",
                value: "Steam has a public API which can be accessed without an API key. We can get Wishlist data from any profile with Game Details set to public. Also, we can see information about any game, including the price and whether it's on sale."
            },
            {
                name: "How we can tell when information changes",
                value: "We don't know immediately when you have changed your wishlist or a game goes on sale. This is because we update our data at a set interval - every 24 hours for wishlists (unless you trigger a manual resync) and every hour for game prices."
            }
        )
}