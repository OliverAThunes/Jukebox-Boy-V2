const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection } = require('@discordjs/voice')

module.exports = {
  data: new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Leaves voice channel'),
  async execute(interaction, client) {
    const connection = getVoiceConnection(process.env.GUILD_ID);

    if (!connection) {
      await interaction.reply('Not in a voice channel!');
    } else {
      connection.destroy();
    }

  }
}
