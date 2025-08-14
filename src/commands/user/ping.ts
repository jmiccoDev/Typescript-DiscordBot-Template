import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import type { Command } from '../../types/command';

const command: Command = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Mostra la latenza del bot'),

  cooldown: 3,
  isGlobal: true, // Comando globale

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 Latenza Bot', value: `${latency}ms`, inline: true },
        { name: '🌐 Latenza API', value: `${apiLatency}ms`, inline: true },
        { name: '📊 Status', value: getLatencyStatus(latency), inline: true }
      )
      .setTimestamp()
      .setFooter({
        text: `Richiesto da ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ content: '', embeds: [embed] });
  },
};

function getLatencyStatus(latency: number): string {
  if (latency < 100) return '🟢 Ottima';
  if (latency < 200) return '🟡 Buona';
  if (latency < 500) return '🟠 Media';
  return '🔴 Lenta';
}

export default command;
