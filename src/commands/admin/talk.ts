import {
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
  ChannelType,
  type ChatInputCommandInteraction,
  type TextChannel,
} from 'discord.js';
import type { Command } from '../../types/command';

/**
 * Comando per far parlare il bot in un canale specifico
 * Permette agli amministratori di inviare messaggi attraverso il bot
 */
const command: Command = {
  data: new SlashCommandBuilder()
    .setName('talk')
    .setDescription('Fai parlare al bot!')
    .addStringOption(
      option =>
        option
          .setName('text')
          .setDescription('Il testo da mandare')
          .setRequired(true)
          .setMaxLength(2000) // Limite Discord per i messaggi
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Canale in cui mandare il messaggio (default: canale corrente)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),
  isGlobal: false,
  requiredLevel: 0,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Ottieni i parametri
      const text = interaction.options.getString('text', true);
      const targetChannel = interaction.options.getChannel('channel') as TextChannel | null;
      const channel = targetChannel || (interaction.channel as TextChannel);

      // Validazioni essenziali
      if (!channel || !('send' in channel)) {
        await interaction.reply({
          content: '❌ **Errore:** Il canale specificato non è valido.',
          ephemeral: true,
        });
        return;
      }

      // Verifica permessi bot
      if (!channel.permissionsFor(interaction.client.user!)?.has(['SendMessages', 'ViewChannel'])) {
        await interaction.reply({
          content: `❌ **Errore:** Non ho i permessi per scrivere in ${channel}.`,
          ephemeral: true,
        });
        return;
      }

      // Invia il messaggio e ottieni la reference
      const sentMessage = await channel.send(text);

      // Crea embed di conferma con link al messaggio
      const confirmEmbed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('✅ Messaggio Inviato')
        .setDescription(`Il messaggio è stato inviato con successo in ${channel}`)
        .addFields([
          {
            name: '🔗 Link al messaggio',
            value: `[Clicca qui per visualizzare](${sentMessage.url})`,
            inline: false,
          },
        ])
        .setTimestamp()
        .setFooter({
          text: `Inviato da ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true,
      });

    } catch (error) {
      console.error('Errore nel comando talk:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('💥 Errore')
        .setDescription('Si è verificato un errore durante l\'invio del messaggio.');

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};

export default command;
