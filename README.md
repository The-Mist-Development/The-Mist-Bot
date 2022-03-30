# The-Mist-Bot
A Discord bot made for The Mist Discord.

To **invite our instance of the bot** to your server, **[click here](https://discord.com/api/oauth2/authorize?client_id=630381078963552267&permissions=70634560&scope=bot)**.

Feel free to fork the bot and make your own modifications for your own use. See also: [Contributing](#contributing)
## Refactor v2
This refactor aimed to recode the bot **from the ground up** using updated dependencies and better coding practices. 

It recoded the bot, all right. Better coding practices? In some places. Don't look too closely at the code. 

### Additions
- Queue Management commands: `remove`, `clear`, and `loopqueue`. 
Also, the full queue duration is now shown in the `queue` command embed.
- Counting for every server: Our previously private Counting feature can now be enabled in any channel. 
Members with the `Manage Channels` permission can run `enablecounting` or `disablecounting`.
- Counting improvements: 
    - `maxcount` command to see the highest ever count of the current counting channel, or any specified counting channel.
    - The bot no longer accepts strange decimals. It used to read `10.934729` or `10.` as 10 - not anymore.
- A smart restarting system: if the bot breaks or needs to be restarted manually, it will only restart once all currently playing songs finish playing.
- Update messages everywhere: Now, any channel can subscribe to update messages from the bot team. 
Members with the `Manage Channels` permission can run `subscribe` or `unsubscribe`.
- Only users in the same voice channel as the bot can control the music.
- Better error handling which will give you an error code to let admins find exactly what caused an issue!
- Additional secret admin commands.
### Removals
- DJ Music Control: This feature was never used.
- Lyrics command: Our Lyrics API shut down. This actually happened before v2.
### Behind-the-scenes changes
- The website is now enabled only if the environment variable `WEBSITE` equals `TRUE`. This will be disabled by default on the bot which we host.
- The bot now reads the prefix from `process.env.PREFIX`. 

## Contributing
If you have any ideas for this bot, we'd love to hear them! 

You can PR useful edits too, if you really want. 
