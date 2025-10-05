import chalk from "chalk";
import { Client, EmbedBuilder, IntentsBitField, MessageFlags, Events, GatewayIntentBits, Message, PartialMessage } from "discord.js";
import fetch from "node-fetch";
import ora from "ora";
import prompts from "prompts";

console.log(chalk.bold.green("Discord Active Developer Badge"));
console.log(chalk.bold(chalk.red("Remember to do not share your Discord Bot token with anyone!\n")));

console.log(chalk.bold("This tool will help you to get the " + chalk.cyan.underline("Discord Active Developer Badge")));
console.log(chalk.bold("If you have any problem, please contact me on Discord: " + chalk.cyan.underline("majonez.exe") + "\n"));

export async function checkToken(value: string): Promise<boolean> {
 if (!value) return false;

 const res = await fetch("https://discord.com/api/v10/users/@me", {
  method: "GET",
  headers: {
   Authorization: `Bot ${value.toString()}`,
  },
 });
 return res.status !== 200 ? false : true;
}

const community = await prompts({
 type: "confirm",
 name: "value",
 message: "You created new Discord Server and enabled Community in Server Settings?",
 initial: true,
});

if (!community.value) {
 console.log(chalk.bold.red("✖ You need to create new Discord Server and enable Community in Server Settings!"));
 /* eslint-disable-next-line node/no-process-exit */
 process.exit(0);
}

const tokenPrompt = await prompts({
 type: "password",
 name: "token",
 message: "Enter your Discord Bot token (you can paste it by pressing Ctrl + Shift + V):",

 validate: async (value: string) => {
  const valid = await checkToken(value);
  return valid ? true : "Invalid Discord Bot token!";
 },
});

const valid = await checkToken(tokenPrompt.token);

if (!valid) {
 console.log(chalk.bold.red("✖ Invalid Discord Bot token!"));
 /* eslint-disable-next-line node/no-process-exit */
 process.exit(0);
}

console.log();
const spinner = ora(chalk.bold("Running Discord Bot")).start();

// Tracked replies for embed processing
const trackedReplies = new Map<string, { botReply: Message; type: string; data: Record<string, number> }>();

const client = new Client({
 intents: [
  IntentsBitField.Flags.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
 ],
});

try {
 client.login(tokenPrompt.token);
} catch (_e) {
 spinner.fail(chalk.bold("Error while logging in to Discord! GG, You broke Discord!"));
 /* eslint-disable-next-line node/no-process-exit */
 process.exit(0);
}

const slashSpinner = ora(chalk.bold("Creating slash command interaction..."));

client.on("ready", async (client) => {
 spinner.succeed(chalk.bold(`Logged in as ${chalk.cyan.underline(client.user.tag)}!`));
 console.log(
  chalk.bold.green("✔") +
   chalk.bold(
    " Use this link to add your bot to your server: " +
     chalk.cyan.italic.underline(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&scope=applications.commands%20bot\n`)
   )
 );
 await client.application?.commands.set([
  {
   name: "active",
   description: "Get the Discord Active Developer Badge",
  },
 ]);

 slashSpinner.text = chalk.bold("Go to your Discord Server (where you added your bot) and use the slash command " + chalk.cyan.bold("/active"));
 slashSpinner.start();
});

// ===== Embed Processing Features from index.js =====

client.on(Events.MessageCreate, async (message: Message) => {
 if (message.author.bot) return;
 if (!message.reference) return;

 try {
  if (!message.reference.messageId) return;
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

client.on(Events.MessageUpdate, async (oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage) => {
 try {
  if (newMsg.author?.id !== '1269481871021047891') return;
  if (!newMsg.embeds || newMsg.embeds.length === 0) return;

  const tracked = trackedReplies.get(newMsg.id);
  if (!tracked) return;

  const embed = newMsg.embeds[0];
  let updatedValues: string[] = [];

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

function extractIds(embed: any): string[] {
 const ids: string[] = [];
 if (embed.fields) {
  embed.fields.forEach((field: any) => {
   const match = field.value.match(/#(\d+)/);
   if (match) ids.push(match[1]);
  });
 }
 return ids;
}

function extractCodes(embed: any): string[] {
 const codes: string[] = [];
 if (embed.fields) {
  embed.fields.forEach((field: any) => {
   const match = field.value.match(/ID:\s*([0-9]+)/);
   if (match) codes.push(match[1]);
  });
 }
 return codes;
}

function extractNames(embed: any, onlyIconic = false): string[] {
 const names: string[] = [];
 if (embed.fields) {
  embed.fields.forEach((field: any) => {
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

function countItems(arr: string[]): Record<string, number> {
 const counts: Record<string, number> = {};
 arr.forEach(name => {
  counts[name] = (counts[name] || 0) + 1;
 });
 return counts;
}

function formatWithCounts(arr: string[]): string {
 const counts = countItems(arr);
 return formatWithCountsFromMap(counts);
}

function formatWithCountsFromMap(counts: Record<string, number>): string {
 return Object.entries(counts)
  .map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
  .join(', ');
}


client.on(Events.InteractionCreate, async (interaction) => {
 try {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "active") {
   console.log(chalk.bold.green("Slash command interaction received!"));
   const embed = new EmbedBuilder() // prettier
    .setAuthor({
     name: "Discord Active Developer Badge",
     iconURL: "https://cdn.discordapp.com/emojis/1040325165512396830.webp?size=64&quality=lossless",
    })
    .setTitle("You have successfully ran the slash command!")
    .setColor("#34DB98")
    .setDescription(
     "- Go to *https://discord.com/developers/active-developer* and claim your badge\n - Verification can take up to 24 hours, so wait patiently until you get your badge"
    )
    .setFooter({
     text: "Made by @majonez.exe",
     iconURL: "https://cdn.discordapp.com/emojis/1040325165512396830.webp?size=64&quality=lossless",
    });
   slashSpinner.succeed(
    chalk.bold(
     "You have successfully ran the slash command! Follow the instructions in Discord Message that you received!. Now you can close this application by pressing Ctrl + C"
    )
   );

   await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
 } catch {
  slashSpinner.fail(
   chalk.bold.red("Error while creating slash command interaction! This can sometimes happen, but don't worry - just kick your bot from the server and run this application again!")
  );
  /* eslint-disable-next-line node/no-process-exit */
  process.exit(0);
 }
});

// Error handling
client.on("error", (error) => {
 console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
 console.error('Unhandled promise rejection:', error);
});