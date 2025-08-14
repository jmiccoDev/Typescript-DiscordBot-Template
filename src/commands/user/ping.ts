import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import type { Command } from '../../types/command';

const command: Command = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Shows bot latency'),

  cooldown: 3,
  isGlobal: true, // Global command

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 Bot Latency', value: `${latency}ms`, inline: true },
        { name: '🌐 API Latency', value: `${apiLatency}ms`, inline: true },
        { name: '📊 Status', value: getLatencyStatus(latency), inline: true }
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ content: '', embeds: [embed] });
  },
};

function getLatencyStatus(latency: number): string {
  if (latency < 100) return '🟢 Excellent';
  if (latency < 200) return '🟡 Good';
  if (latency < 500) return '🟠 Average';
  return '🔴 Slow';
}

export default command;
