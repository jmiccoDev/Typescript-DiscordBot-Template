import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import type { Command } from '../types/command';

/**
 * Template for creating new slash commands
 *
 * INSTRUCTIONS:
 * 1. Copy this file to the appropriate folder (fun/, admin/, etc.)
 * 2. Rename the file with the command name
 * 3. Modify the 'data' property with command information
 * 4. Implement the logic in the execute function
 * 5. Optionally, set cooldown, requiredLevel, isGlobal and guild
 *
 * COMMON OPTIONS FOR SLASH COMMANDS:
 * - addStringOption(): for text input
 * - addIntegerOption(): for integer numbers
 * - addBooleanOption(): for true/false
 * - addUserOption(): to select a user
 * - addChannelOption(): to select a channel
 * - addRoleOption(): to select a role
 *
 * PERMISSION LEVELS:
 * - 0: Bot Owner (exclusively bot owners)
 * - 1: User (default)
 * - 2: Moderator
 * - 3: Administrator
 * - 4: Owner
 * 
 * NOTE: If requiredLevel is not defined, ANY USER can execute the command without role checks
 *
 * COMMAND SCOPE:
 * - isGlobal: true = global command (available everywhere)
 * - isGlobal: false/undefined + guild: "GUILD_ID" = specific command for that guild
 * - isGlobal: false/undefined + guild: undefined = use DEFAULT_GUILD_ID from config
 */

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('template') // Command name (only lowercase letters, numbers and hyphens)
    .setDescription('Example template command') // Command description
    .addStringOption(
      option =>
        option.setName('example').setDescription('An example parameter').setRequired(false) // true if the parameter is mandatory
    ),

  // Cooldown in seconds (optional)
  cooldown: 5,

  // Required permission level (optional)
  // If not defined, ANY USER can execute the command without role checks
  // requiredLevel: 1,

  // Command scope (optional)
  isGlobal: true, // true for global command, false for guild-specific
  // guild: "123456789012345678", // Specific guild ID (if not global)

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Get command parameters
    const exampleParam = interaction.options.getString('example');

    // Example response embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle('🔧 Template Command')
      .setDescription('This is an example template command!')
      .addFields(
        { name: 'Parameter received', value: exampleParam || 'None', inline: true },
        { name: 'User', value: interaction.user.tag, inline: true },
        { name: 'Scope', value: command.isGlobal ? 'Global' : 'Guild-specific', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Template Bot', iconURL: interaction.client.user?.displayAvatarURL() });

    // Send the response
    await interaction.reply({ embeds: [embed] });

    // Examples of other response types:

    // Simple response
    // await interaction.reply('Simple message');

    // Ephemeral response (visible only to the user)
    // await interaction.reply({ content: 'Private message', ephemeral: true });

    // Deferred response (for long operations)
    // await interaction.deferReply();
    // // ... long operations ...
    // await interaction.editReply('Operation completed!');
  },
};

export default command;
