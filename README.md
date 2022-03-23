# The-Mist-Bot-Node-v12
A Discord bot made for The Mist Discord. It actually uses more recent Node versions but the name has stuck.
## Refactor v2
This refactor aims to recode the bot **from the ground up** using updated dependencies and better coding practices, and is still in progress. 
### Additions
- Queue Management commands: `remove`, `clear`, and `loopqueue`
- Counting for every server: Our previously private Counting feature can now be enabled in any channel. 
Members with the `Manage Channels` permission can run `enablecounting` or `disablecounting`.
- Counting improvement: `maxcount` command to see the highest ever count of the current counting channel, or any specified counting channel.
- A smart restarting system: if the bot breaks or needs to be restarted manually, it will only restart once all currently playing songs finish playing.
- Additional secret admin commands.
### Removals
- DJ Music Control: This feature was never used.
- Lyrics command: Our Lyrics API shut down. This actually happened before v2.
