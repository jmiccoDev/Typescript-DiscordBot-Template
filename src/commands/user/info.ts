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
    .setDescription('Mostra le informazioni del server'),
  cooldown: 10,
  isGlobal: false,
  requiredLevel: 1,
  guildsId: ["-1"],

  async execute(interaction: ChatInputCommandInteraction) {
    // Check if command is executed in DMs
    if (!interaction.guildId) {
      const dmErrorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('⚠️ Comando non disponibile')
        .setDescription('Questo comando può essere eseguito esclusivamente all\'interno dei server Discord.')
        .setFooter({ text: 'Esegui questo comando in un server per vedere le informazioni.' })
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
      .setTitle('Informazioni del Server');
    embed.addFields(
      {
        name: 'Owner Server',
        value: guild?.ownerId ? `<@${guild.ownerId}>` : 'N/A',
        inline: true,
      },
      {
        name: 'Membri',
        value: guild?.memberCount != null ? guild.memberCount.toString() : 'N/A',
        inline: true,
      },
      { name: 'Ruoli', value: guild?.roles.cache.size.toString() ?? 'N/A', inline: true },
      {
        name: 'Server Boosts',
        value: guild?.premiumSubscriptionCount
          ? guild?.premiumSubscriptionCount.toString()
          : 'N/A',
        inline: true,
      },
      {
        name: 'Data di creazione',
        value: guild?.createdAt ? guild.createdAt.toDateString() : 'N/A',
        inline: true,
      }
    );
    embed.setTimestamp();
    embed.setFooter({ text: `ID Guild: ${guildId}` });
    
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
