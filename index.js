// const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
// const config = require('./config.example.js');
import { config } from 'dotenv';
config(); // Load environment variables from .env file

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Bot is ready!');
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if the message is a reply
  if (!message.reference) return;

  try {
    // Get the referenced message
    const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);

    // Check if the referenced message is from the specific author
    if (referencedMessage.author.id !== '1269481871021047891') {
      return;
    }

    // Check if the referenced message has embeds
    if (!referencedMessage.embeds || referencedMessage.embeds.length === 0) {
      return;
    }

    const embed = referencedMessage.embeds[0]; // Get the first embed

    // Command: L.id
    if (message.content.toLowerCase() === 'l.id') {
      if (embed.fields && embed.fields.length > 0) {
        const ids = [];
        embed.fields.forEach(field => {
          // Extract ID numbers from field values
          const idMatch = field.value.match(/#(\d+)/);
          if (idMatch) {
            ids.push(idMatch[1]);
          }
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
        embed.fields.forEach(field => {
          // Extract ID numbers from field values
          const idMatch = field.value.match(/ID:\s*([0-9]+)/);
          if (idMatch) {
            codes.push(idMatch[1]);
          }
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
    else if (message.content.toLowerCase() === 'l.name') {
      if (embed.fields && embed.fields.length > 0) {
        const names = [];
        embed.fields.forEach(field => {
          // Extract names from field titles (removing emojis and emoji Code)
          if (field.name) {
            // Remove emoji patterns like :LU_E:, :LU_C: etc.
            // Remove Discord emoji IDs like <1368396998348116071>
            const cleanName = field.name
              .replace(/:[^:]+:/g, '') // Remove emoji patterns
              .replace(/<[^>]+>/g, '') // Remove Discord emoji Code
              .trim();
            if (cleanName) {
              names.push(cleanName);
            }
          }
        });

        if (names.length > 0) {
          await message.reply(names.join(', '));
        } else {
          await message.reply('No names found in the embed fields.');
        }
      } else {
        await message.reply('No fields found in the referenced embed.');
      }
    }

  } catch (error) {
    console.error('Error processing message:', error);
    await message.reply('❌ An error occurred while processing the command.');
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login with bot token
client.login(process.env.DISCORD_TOKEN);
