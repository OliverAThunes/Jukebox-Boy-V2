require("dotenv").config();

const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");

// Create a new client instance
const intents = new Intents([
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_VOICE_STATES,
]);
const client = new Client({ intents });

client.commands = new Collection();
const commandFiles = fs
  .readdirSync("./commands/")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// When the client is ready, run this code (only once)
client.once("ready", (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
