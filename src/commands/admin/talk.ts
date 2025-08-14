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
 * Command to make the bot speak in a specific channel
 * Allows administrators to send messages through the bot
 */
const command: Command = {
  data: new SlashCommandBuilder()
    .setName('talk')
    .setDescription('Make the bot talk!')
    .addStringOption(
      option =>
        option
          .setName('text')
          .setDescription('The text to send')
          .setRequired(true)
          .setMaxLength(2000) // Discord limit for messages
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send the message to (default: current channel)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),
  isGlobal: false,
  requiredLevel: 0,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Get parameters
      const text = interaction.options.getString('text', true);
      const targetChannel = interaction.options.getChannel('channel') as TextChannel | null;
      const channel = targetChannel || (interaction.channel as TextChannel);

      // Essential validations
      if (!channel || !('send' in channel)) {
        await interaction.reply({
          content: '❌ **Error:** The specified channel is not valid.',
          ephemeral: true,
        });
        return;
      }

      // Check bot permissions
      if (!channel.permissionsFor(interaction.client.user!)?.has(['SendMessages', 'ViewChannel'])) {
        await interaction.reply({
          content: `❌ **Error:** I don't have permissions to write in ${channel}.`,
          ephemeral: true,
        });
        return;
      }

      // Send the message and get the reference
      const sentMessage = await channel.send(text);

      // Create confirmation embed with message link
      const confirmEmbed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle('✅ Message Sent')
        .setDescription(`The message was sent successfully to ${channel}`)
        .addFields([
          {
            name: '🔗 Message link',
            value: `[Click here to view](${sentMessage.url})`,
            inline: false,
          },
        ])
        .setTimestamp()
        .setFooter({
          text: `Sent by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true,
      });

    } catch (error) {
      console.error('Error in talk command:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('💥 Error')
        .setDescription('An error occurred while sending the message.');

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};

export default command;
