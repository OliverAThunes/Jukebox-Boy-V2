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


// Global list of all servers and their queues.
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

    // TODO Add a check if the user is in an voice channel.

    await interaction.reply("Searching...");


    // Find video
    const findVideo = async (query) => {
      const videoResult = await ytSearch(query);
      return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
    }

    const searchString = interaction.options.getString('query');

    const video = await findVideo(searchString);

    let song = {};

    if (video) {
      song = {...video};

    } else {
      await interaction.editReply('No videos found...');
      console.log("Could not find video with query", searchString);
      return;
    }


    // Queue stuff
    let serverQueue = queue.get(interaction.guild.id);

    console.log(serverQueue);

    if (!serverQueue) {

      let songs = [];
      queue.set(interaction.guildId, songs);

      songs.push(song);

      try {

        await interaction.deleteReply();
        playSong(interaction, songs[0]);
        
      } catch (err) {
        queue.delete(interaction.guildId);
        console.error("There was an error connecting to voice channel.", err);
        throw err;
      }

    } else {
      serverQueue.push(song);

      await interaction.editReply(`${song.title} added to queue.`);
    }
  }
}

async function playSong(interaction, song) {

  // Connect to voice channel
  const connection = joinVoiceChannel({
    channelId: interaction.member.voice.channel.id,
    guildId: process.env.GUILD_ID,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });

  const player = createAudioPlayer();
  connection.subscribe(player);

  const stream = ytdl(song.url, {filter: 'audio', quality: 'highestaudio'});

  let audioResource = createAudioResource(stream, {
    inputType: StreamType.Arbitrary
  });

  player.play(audioResource);

  player.on(AudioPlayerStatus.Playing, async event => {
    const embed = createEmbed(song);
    interaction.channel.send({embeds: [embed]});
  });

  player.on(AudioPlayerStatus.Idle, () => {
    let serverQueue = queue.get(interaction.guild.id);

    serverQueue.shift();

    if (serverQueue && serverQueue.length > 0) {
      playSong(interaction, serverQueue[0]);
    }
  });
}

function createEmbed(song) {
  return new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(song.title)
    .setURL(song.url)
    .setAuthor(song.author.name, song.thumbnail, song.author.url)
    .setDescription('Duration: ' + song.timestamp)
    .setImage(song.image);
}
