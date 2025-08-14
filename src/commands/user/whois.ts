import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import type { Command } from '../../types/command';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Shows information about a Discord user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription("The Discord user to show information about")
        .setRequired(true)
    ),
  cooldown: 10,
  isGlobal: false,
  guildsId: ["-1"],

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user', true);
    const embed = new EmbedBuilder()
      .setColor(Colors.DarkButNotBlack)
      .setAuthor({ name: `@${user.username}`, iconURL: user.displayAvatarURL() })
      .setTitle(`User Information`)
      .setThumbnail(user.displayAvatarURL({ size: 128, extension: 'png' }))
      .addFields(
        { name: 'User ID', value: user.id.toString(), inline: false },
        {
          name: 'Creation Date',
          value: user.createdAt.toLocaleDateString('en-US'),
          inline: true,
        },
        {
          name: 'Join Date',
          value:
            'joinedAt' in (interaction.member ?? {}) && (interaction.member as any).joinedAt
              ? (interaction.member as any).joinedAt.toLocaleDateString('en-US')
              : 'Not available',
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
