const Discord = require("discord.js");

const prefix = process.env.PREFIX

module.exports = {
    respond: function (message) {
        const args = message.content
            .slice(prefix.length)
            .trim()
            .split(/ +/);
        const command = args.shift().toLowerCase();

        switch (command) {
            case "help":
                helpMsg(message);
                break;
            case "ahelp":
                adminHelpMsg(message);
                break;
            default:
                message.channel.send(
                  `\`${command}\` is not a command. **Type** \`${prefix}help\` **to see the list of commands**`
                );
                break;
        }
        return;
    }
}

function helpMsg(message) {
    const embed = new Discord.MessageEmbed()
    .setTitle("Commands")
    .setDescription(
      "[Go to our website](https://themistbot.herokuapp.com/) to add the bot to your server."
    )
    .setColor("#d5dbe3")
    .setFooter("The Mist Bot - made by R2D2Vader")
    .addFields(
      { name: `My global prefix is \`${prefix}\``, value: "===" },
      { name: "General Commands", value: "===" },
      {
        name: "`" + prefix + "ahelp`",
        value: "If you are on the bot team, this will DM you the admin commands!"
      },
    );

    message.channel.send({embeds: [embed]});
}

function adminHelpMsg(message) {
    const embed = new Discord.MessageEmbed()
    .setTitle("Admin Commands")
    .setColor("#b9ceeb")
    .setFooter("The Mist Bot - made by R2D2Vader")
    .addFields(
        { name: `My global prefix is \`${prefix}\``, value: "===" },
        { name: "Admin Page", value: "Click [here](https://themistbot.herokuapp.com/admin.html) to visit the Admin page and send messages or changelogs." },
        {
        name: "`" + prefix + "restart`",
        value: "Restarts the bot. Do this mainly to solve weird, bot-breaking issues."
      },
    );

    if (message.member.id == process.env.OWNER_ID) {
        embed.setDescription(
            `Hello, Bot Owner **${message.author.username}**!`
          )
        message.author.send({embeds: [embed]});
        message.react("💌");
    }
    else {
        let staff = process.env.STAFF_IDS;
        let array = staff.split('&');
        if (array.includes(message.member.id)) {
            embed.setDescription(
                `Hello, Admin **${message.author.username}**!`
              )
            message.author.send({embeds: [embed]});
            message.react("📩");
        }
    }
}