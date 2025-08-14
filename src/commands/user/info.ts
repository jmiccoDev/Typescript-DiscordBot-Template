import {
  EmbedBuilder,
  SlashCommandBuilder,
  Colors,
  type ChatInputCommandInteraction,
} from 'discord.js';
import type { Command } from '../../types/command';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Shows server information'),
  cooldown: 10,
  isGlobal: false,
  requiredLevel: 1,
  guildsId: ["-1"],

  async execute(interaction: ChatInputCommandInteraction) {
    // Check if command is executed in DMs
    if (!interaction.guildId) {
      const dmErrorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('⚠️ Command not available')
        .setDescription('This command can only be executed within Discord servers.')
        .setFooter({ text: 'Execute this command in a server to see the information.' })
        .setTimestamp();

      await interaction.reply({ embeds: [dmErrorEmbed], ephemeral: true });
      return;
    }

    const guildId = interaction.guildId;
    let guild;
    if (guildId) {
      guild = interaction.client.guilds.cache.get(guildId);
    } else {
      guild = undefined;
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.DarkButNotBlack)
      .setAuthor({
        name: guild?.name ?? 'Server',
        iconURL: guild?.iconURL()!,
      })
      .setThumbnail(guild?.iconURL()!)
      .setTitle('Server Information');
    embed.addFields(
      {
        name: 'Server Owner',
        value: guild?.ownerId ? `<@${guild.ownerId}>` : 'N/A',
        inline: true,
      },
      {
        name: 'Members',
        value: guild?.memberCount != null ? guild.memberCount.toString() : 'N/A',
        inline: true,
      },
      { name: 'Roles', value: guild?.roles.cache.size.toString() ?? 'N/A', inline: true },
      {
        name: 'Server Boosts',
        value: guild?.premiumSubscriptionCount
          ? guild?.premiumSubscriptionCount.toString()
          : 'N/A',
        inline: true,
      },
      {
        name: 'Creation Date',
        value: guild?.createdAt ? guild.createdAt.toDateString() : 'N/A',
        inline: true,
      }
    );
    embed.setTimestamp();
    embed.setFooter({ text: `Guild ID: ${guildId}` });
    
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
