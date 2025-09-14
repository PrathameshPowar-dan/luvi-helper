import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const trackedReplies = new Map();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Bot is ready!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.reference) return;

  try {
    const referencedMessage = await message.channel.messages.fetch(
      message.reference.messageId
    );

    // Only process if from the target bot
    if (referencedMessage.author.id !== '1269481871021047891') return;

    // Require embeds with fields
    if (!referencedMessage.embeds || referencedMessage.embeds.length === 0) return;
    const embed = referencedMessage.embeds[0];
    if (!embed.fields || embed.fields.length === 0) return;

    const cmd = message.content.toLowerCase();

    if (cmd === 'l.id') {
      const ids = extractIds(embed);
      if (ids.length === 0) return;
      const botReply = await message.reply(`IDs: ${ids.join(', ')}`);
      trackedReplies.set(referencedMessage.id, { botReply, type: 'id', data: {} });
    }

    if (cmd === 'l.code') {
      const codes = extractCodes(embed);
      if (codes.length === 0) return;
      const botReply = await message.reply(`Codes: ${codes.join(', ')}`);
      trackedReplies.set(referencedMessage.id, { botReply, type: 'code', data: {} });
    }

    if (cmd === 'l.name') {
      const names = extractNames(embed, false);
      if (names.length === 0) return;
      const botReply = await message.reply(`Names: ${formatWithCounts(names)}`);
      trackedReplies.set(referencedMessage.id, { botReply, type: 'name', data: countItems(names) });
    }

    if (cmd === 'l.ico') {
      const iconic = extractNames(embed, true);
      if (iconic.length === 0) return;
      const botReply = await message.reply(`Iconic: ${formatWithCounts(iconic)}`);
      trackedReplies.set(referencedMessage.id, { botReply, type: 'ico', data: countItems(iconic) });
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

client.on('messageUpdate', async (oldMsg, newMsg) => {
  try {
    if (newMsg.author?.id !== '1269481871021047891') return;
    if (!newMsg.embeds || newMsg.embeds.length === 0) return;

    const tracked = trackedReplies.get(newMsg.id);
    if (!tracked) return;

    const embed = newMsg.embeds[0];
    let updatedValues = [];

    if (tracked.type === 'id') {
      updatedValues = extractIds(embed);
    }
    if (tracked.type === 'code') {
      updatedValues = extractCodes(embed);
    }
    if (tracked.type === 'name') {
      updatedValues = extractNames(embed, false);
    }
    if (tracked.type === 'ico') {
      updatedValues = extractNames(embed, true);
    }

    if (updatedValues.length === 0) return;

    // Merge counts instead of just unique values
    const existingCounts = tracked.data || {};
    const newCounts = countItems(updatedValues);

    for (const [name, count] of Object.entries(newCounts)) {
      existingCounts[name] = (existingCounts[name] || 0) + count;
    }

    tracked.data = existingCounts;

    const label =
      tracked.type === 'id' ? 'IDs' :
        tracked.type === 'code' ? 'Codes' :
          tracked.type === 'name' ? 'Names' :
            'Iconic';

    await tracked.botReply.edit(`${label}: ${formatWithCountsFromMap(existingCounts)}`);
  } catch (err) {
    console.error('Error handling messageUpdate:', err);
  }
});

// ===== Utility Functions =====

function extractIds(embed) {
  const ids = [];
  if (embed.fields) {
    embed.fields.forEach((field) => {
      const match = field.value.match(/#(\d+)/);
      if (match) ids.push(match[1]);
    });
  }
  return ids;
}

function extractCodes(embed) {
  const codes = [];
  if (embed.fields) {
    embed.fields.forEach((field) => {
      const match = field.value.match(/ID:\s*([0-9]+)/);
      if (match) codes.push(match[1]);
    });
  }
  return codes;
}

function extractNames(embed, onlyIconic = false) {
  const names = [];
  if (embed.fields) {
    embed.fields.forEach((field) => {
      if (field.name) {
        let cleanName = field.name
          .replace(/:[^:]+:/g, '')   // remove custom Discord emoji <:emoji:123>
          .replace(/<[^>]+>/g, '')   // remove mentions
          .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '') // remove unicode emojis
          .replace(/\s+/g, ' ')      // collapse multiple spaces
          .trim();

        const isIconic = /(\|\s*\*{0,2}Iconic\*{0,2})/i.test(cleanName);

        if (onlyIconic && isIconic) {
          cleanName = cleanName.replace(/\|\s*\*{0,2}Iconic\*{0,2}/i, '').trim();
          names.push(cleanName);
        } else if (!onlyIconic && !isIconic && cleanName) {
          names.push(cleanName);
        }
      }
    });
  }
  return names;
}

function countItems(arr) {
  const counts = {};
  arr.forEach(name => {
    counts[name] = (counts[name] || 0) + 1;
  });
  return counts;
}

function formatWithCounts(arr) {
  const counts = countItems(arr);
  return formatWithCountsFromMap(counts);
}

function formatWithCountsFromMap(counts) {
  return Object.entries(counts)
    .map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
    .join(', ');
}

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN);
