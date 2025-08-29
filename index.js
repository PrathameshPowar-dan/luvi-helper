import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import express from 'express';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

// Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log('Bot is ready!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignore bot messages
  if (!message.reference) return; // Only reply messages

  try {
    const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);

    if (referencedMessage.author.id !== '1269481871021047891') return;
    if (!referencedMessage.embeds || referencedMessage.embeds.length === 0) return;

    const embed = referencedMessage.embeds[0];

    // Command: L.id
    if (message.content.toLowerCase() === 'l.id') {
      if (embed.fields && embed.fields.length > 0) {
        const ids = [];
        embed.fields.forEach((field) => {
          const idMatch = field.value.match(/#(\d+)/);
          if (idMatch) ids.push(idMatch[1]);
        });

        if (ids.length > 0) {
          await message.reply(ids.join(', '));
        } else {
          await message.reply('❌ No IDs found in the embed fields.');
        }
      } else {
        await message.reply('❌ No fields found in the referenced embed.');
      }
    }

    // Command: L.code
    if (message.content.toLowerCase() === 'l.code') {
      if (embed.fields && embed.fields.length > 0) {
        const codes = [];
        embed.fields.forEach((field) => {
          const idMatch = field.value.match(/ID:\s*([0-9]+)/);
          if (idMatch) codes.push(idMatch[1]);
        });

        if (codes.length > 0) {
          await message.reply(codes.join(', '));
        } else {
          await message.reply('❌ No IDs found in the embed fields.');
        }
      } else {
        await message.reply('❌ No fields found in the referenced embed.');
      }
    }

    // Command: L.name
    if (message.content.toLowerCase() === 'l.name') {
      if (embed.fields && embed.fields.length > 0) {
        const names = [];
        embed.fields.forEach((field) => {
          if (field.name) {
            const cleanName = field.name
              .replace(/:[^:]+:/g, '') // remove emoji patterns
              .replace(/<[^>]+>/g, '') // remove Discord emoji IDs
              .trim();
            if (cleanName) names.push(cleanName);
          }
        });

        if (names.length > 0) {
          await message.reply(names.join(', '));
        } else {
          await message.reply('❌ No names found in the embed fields.');
        }
      } else {
        await message.reply('❌ No fields found in the referenced embed.');
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await message.reply('❌ An error occurred while processing the command.');
  }
});

// Error handling
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login with bot token
client.login(process.env.DISCORD_TOKEN);

// 🔹 Dummy Express server to keep Render Web Service alive
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Discord bot is running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server listening on port ${PORT}`);
});