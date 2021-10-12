const { SlashCommandBuilder } = require('@discordjs/builders');
const { VoiceChannel } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceChannelConnectionStatus } = require('@discordjs/voice')
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Joins voice channel'),
  async execute(interaction, client) {
  }
}
