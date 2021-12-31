const {SlashCommandBuilder} = require('@discordjs/builders');
const {MessageEmbed} = require('discord.js');
const {subscriptions} = require('../globals')

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus
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

    console.log("Searching for song");
    await interaction.reply("Searching...");

    // Find video
    const findVideo = async (query) => {
      const videoResult = await ytSearch(query);
      return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
    }

    const searchString = interaction.options.getString('query');

    const song = await findVideo(searchString);

    if (!song) {
      await interaction.editReply('No videos found...');
      console.log("Could not find video with query", searchString);
      return;
    }

    // Queue stuff
    let serverQueue = queue.get(interaction.guild.id);

    // If no queue for this guild, create one.
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

function playSong(interaction, song) {

  // Connect to voice channel
  console.log("Joining voice channel");
  const connection = joinVoiceChannel({
    channelId: interaction.member.voice.channel.id,
    guildId: interaction.member.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });

  const player = createAudioPlayer();
  connection.subscribe(player);

  subscriptions.set(interaction.guild.id, {
    audioPlayer: player,
    connection: connection
  });

  // Get stream
  const stream = ytdl(
    song.url,
    {
      filter: 'audioonly',
      quality: 'highestaudio',
      dlChunkSize: 0,
    }
  );

  // Create resource
  let audioResource = createAudioResource(stream, {
    inputType: StreamType.Arbitrary,
    inlineVolume: true,
    metadata: {
      serverQueue: queue.get(interaction.guild.id)
    }
  });

  audioResource.volume.setVolume(0.2);

  console.log("Playing song");
  player.play(audioResource);

  // Handle error on player
  player.on('error', (err) => {
    console.error(`Error: ${err.message}\n${err}`);
  });

  player.on(AudioPlayerStatus.Playing, event => {
    const embed = createEmbed(song);
    interaction.channel.send({embeds: [embed]});
  });

  player.on(AudioPlayerStatus.Idle, () => {
    console.log("Finished playing song");
    let serverQueue = queue.get(interaction.guild.id);

    serverQueue.shift();

    if (serverQueue && serverQueue.length > 0) {
      console.log("Playing next song");
      playSong(interaction, serverQueue[0]);
    } else {
      console.log("Queue empty, stopping.");
      queue.delete(interaction.guildId);
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
