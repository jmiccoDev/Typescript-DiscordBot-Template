import { EmbedBuilder, Colors, codeBlock, type TextBasedChannel, type Client } from 'discord.js';
import { getChannelId, CHANNEL_TYPES } from '../config/channels-config';

export interface ErrorInfo {
  eventName?: string;
  commandName?: string;
  userId?: string;
  guildId?: string;
  guildName?: string;
  additionalInfo?: Record<string, string>;
}

/**
 * Handles and logs errors with detailed embeds
 * @param client - Discord Client
 * @param error - The error to log
 * @param info - Additional information about the error
 */
export async function handleError(client: Client, error: any, info: ErrorInfo): Promise<void> {
  // Console log
  console.error(`❌ Error in ${info.eventName || info.commandName || 'Unknown'}:`, error);

  // If there's no configured log channel, stop here
  const errorLogChannelId = getChannelId(CHANNEL_TYPES.ERROR_LOGS);
  if (!errorLogChannelId) return;

  try {
    const logChannel = (await client.channels.fetch(errorLogChannelId)) as TextBasedChannel;

    if (!logChannel?.isTextBased()) return;

    // Extract detailed information from the error
    const errorStack = error.stack || error.toString();
    const errorMessage = error.message || 'Unknown error';

    // Search for line and column information from stack trace
    const stackLines = errorStack.split('\n');
    const relevantLine =
      stackLines.find((line: string) => line.includes('.ts:')) || stackLines[1] || 'N/A';

    // Extract file, line and column if available
    const fileMatch = relevantLine.match(/([^/\\]+\.ts):(\d+):(\d+)/);
    const fileName = fileMatch ? fileMatch[1] : 'N/A';
    const lineNumber = fileMatch ? fileMatch[2] : 'N/A';
    const columnNumber = fileMatch ? fileMatch[3] : 'N/A';

    // Determine embed title
    const title = info.commandName
      ? `Command Error: /${info.commandName}`
      : `Event Error: ${info.eventName || 'Unknown'}`;

    const errorEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle(title)
      .setDescription(
        codeBlock(
          'typescript',
          errorMessage.length > 1900 ? errorMessage.substring(0, 1900) + '...' : errorMessage
        )
      )
      .addFields(
        { name: 'File', value: fileName, inline: true },
        { name: 'Line:Column', value: `${lineNumber}:${columnNumber}`, inline: true },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: 'Error Type', value: error.name || 'Error', inline: false },
        { name: 'Node Version', value: process.version, inline: false }
      )
      .setTimestamp()
      .setFooter({
        text: `Bot Error Handler`,
        iconURL: client.user?.displayAvatarURL() || '',
      });

    if (info.userId) {
      errorEmbed.addFields({
        name: 'User',
        value: `<@${info.userId}> (${info.userId})`,
        inline: true,
      });
    }

    if (info.guildName) {
      errorEmbed.addFields({ name: 'Server', value: info.guildName, inline: false });
    }

    if (info.additionalInfo) {
      Object.entries(info.additionalInfo).forEach(([key, value]) => {
        errorEmbed.addFields({ name: key, value: value.substring(0, 1024), inline: false });
      });
    }

    if (errorStack.length > 500) {
      errorEmbed.addFields({
        name: 'Stack Trace',
        value: codeBlock(
          'typescript',
          errorStack.substring(0, 1000) + (errorStack.length > 1000 ? '...' : '')
        ),
        inline: false,
      });
    }

    if ('send' in logChannel && typeof logChannel.send === 'function') {
      await logChannel.send({ embeds: [errorEmbed] });
    } else {
      console.error('❌ The log channel does not support the send method.');
    }
  } catch (logError) {
    console.error("❌ Error sending error log:", logError);
  }
}

/**
 * Wrapper for command errors
 */
export async function handleCommandError(
  client: Client,
  error: any,
  commandName: string,
  userId: string,
  guildId?: string | null,
  guildName?: string
): Promise<void> {
  await handleError(client, error, {
    commandName,
    userId,
    // Force to string or leave undefined, never null or undefined
    guildId: typeof guildId === 'string' ? guildId : '',
    guildName: guildName ?? '',
  });
}

/**
 * Wrapper for event errors
 */
export async function handleEventError(
  client: Client,
  error: any,
  eventName: string,
  additionalInfo?: Record<string, string>
): Promise<void> {
  await handleError(client, error, {
    eventName,
    additionalInfo: additionalInfo ?? {},
  });
}
