const {SlashCommandBuilder} = require('@discordjs/builders');
const {getVoiceConnection} = require('@discordjs/voice')
const {subscriptions} = require('../globals')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips current song'),
  async execute(interaction, client) {
    const subscription = subscriptions.get(interaction.guild.id);

    if (subscription) {
      // Transition into idle state. We're listening for idle state transition
      // in the play command so that means just play the next song.
      subscription.audioPlayer.stop();
      await interaction.reply("Skipped song");
    } else {
      await interaction.reply("Not playing a song");
    }

  }
}
