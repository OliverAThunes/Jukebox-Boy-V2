const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus
} = require('@discordjs/voice');

const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');


let queue = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play some music')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The search query or URL')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.reply("Searching...");

    const connection = joinVoiceChannel({
      channelId: interaction.member.voice.channel.id,
      guildId: process.env.GUILD_ID,
      adapterCreator: interaction.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    const videoFinder = async (query) => {
      const videoResult = await ytSearch(query);
      return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
    }

    const searchString = interaction.options.getString('query');

    const video = await videoFinder(searchString);

    if (video) {
      const stream = ytdl(video.url, {filter: 'audio', quality: 'highestaudio'});

      let audioResource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary
      });

      player.play(audioResource);

      await interaction.deleteReply();
      player.on(AudioPlayerStatus.Playing, async event => {
        const embed = createEmbed(video);
        interaction.channel.send({embeds: [embed]});
      })
    } else {
      await interaction.editReply('No videos found...');
      console.log("Could not find video with query", searchString);
    }

  }
}

function createEmbed(video) {
  return new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(video.title)
    .setURL(video.url)
    .setAuthor(video.author.name, video.thumbnail, video.author.url)
    .setDescription('Duration: ' + video.timestamp)
    .setImage(video.image);
}
