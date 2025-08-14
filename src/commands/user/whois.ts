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
    .setDescription('Mostra le informazioni di un utente Discord')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription("L'utente Discord di cui mostrare le informazioni")
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
      .setTitle(`Informazioni Utente`)
      .setThumbnail(user.displayAvatarURL({ size: 128, extension: 'png' }))
      .addFields(
        { name: 'ID Utente', value: user.id.toString(), inline: false },
        {
          name: 'Data di Creazione',
          value: user.createdAt.toLocaleDateString('it-IT'),
          inline: true,
        },
        {
          name: 'Data di ingresso',
          value:
            'joinedAt' in (interaction.member ?? {}) && (interaction.member as any).joinedAt
              ? (interaction.member as any).joinedAt.toLocaleDateString('it-IT')
              : 'Non disponibile',
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Richiesto da ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
