# The-Mist-Bot
A Discord bot made for The Mist Discord.

To **invite the bot** to your server, **[click here](https://discord.com/api/oauth2/authorize?client_id=630381078963552267&permissions=70634560&scope=bot)**.

Feel free to fork the bot and make your own modifications for your own use. See also: [Contributing](#contributing)

## Latest Addition: Steam Wishlist Notifications
We coded [Steam-Wishlist-Bot](https://github.com/The-Mist-Development/Steam-Wishlist-Bot) as a standalone bot to notify users when items on their Steam Wishlist went on sale. It's relatively simple - for players with public steam profiles, they simply need to link their profile by sending a link to the bot, and after that we check their wishlisted games to see if they're on sale or not, comparing the price against the previous one recorded in our database. 

Adding it to our active bot was the next logical step, and although only I use it, I love it! It notifies you of Steam sales on your favourite games several hours before Steam gets around to emailing you.

Simply run `,wishlist` to see the wishlist command help menu.  

## Running the bot yourself
Here are a couple of which could break when you try to run the bot. 
I'll update this list soon to include everything.

### Run any production version of the bot with Nodemon. 
You can install Nodemon by running `npm install -g nodemon`.

The command to run the bot is `nodemon -e mistbot index.js`. 

The restart functionality, triggered when the bot errors badly or when you run the `,restart` command, simply edits a file called `restart.mistbot` when it is time to restart. Nodemon detects this and restarts the bot.

## Contributing
If you have any ideas for this bot, we'd love to hear them! 

You can PR useful edits too. Make sure all PRs target the `test-chamber` branch.
