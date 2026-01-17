require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Discord client
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
});

// Refresh Spotify access token
async function refreshSpotifyToken() {
  try {
    const data = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('Spotify token refreshed');
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
}

// Extract Spotify track ID from URL
function extractSpotifyTrackId(url) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Add track to playlist
async function addTrackToPlaylist(trackId) {
  try {
    await spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_PLAYLIST_ID, [
      `spotify:track:${trackId}`,
    ]);
    return true;
  } catch (error) {
    console.error('Error adding track:', error);
    return false;
  }
}

discord.on('ready', () => {
  console.log(`Logged in as ${discord.user.tag}`);
  refreshSpotifyToken();
  // Refresh token every 50 minutes
  setInterval(refreshSpotifyToken, 50 * 60 * 1000);
});

discord.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check for Spotify links
  const spotifyUrlRegex = /https?:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/g;
  const matches = message.content.match(spotifyUrlRegex);

  if (matches) {
    for (const url of matches) {
      const trackId = extractSpotifyTrackId(url);
      if (trackId) {
        const success = await addTrackToPlaylist(trackId);
        if (success) {
          message.react('✅');
        } else {
          message.react('❌');
        }
      }
    }
  }
});

discord.login(process.env.DISCORD_BOT_TOKEN);