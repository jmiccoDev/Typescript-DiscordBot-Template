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
 * Gestisce e logga gli errori con embed dettagliati
 * @param client - Client Discord
 * @param error - L'errore da loggare
 * @param info - Informazioni aggiuntive sull'errore
 */
export async function handleError(client: Client, error: any, info: ErrorInfo): Promise<void> {
  // Log nella console
  console.error(`❌ Errore in ${info.eventName || info.commandName || 'Unknown'}:`, error);

  // Se non c'è un canale di log configurato, ferma qui
  const errorLogChannelId = getChannelId(CHANNEL_TYPES.ERROR_LOGS);
  if (!errorLogChannelId) return;

  try {
    const logChannel = (await client.channels.fetch(errorLogChannelId)) as TextBasedChannel;

    if (!logChannel?.isTextBased()) return;

    // Estrai informazioni dettagliate dall'errore
    const errorStack = error.stack || error.toString();
    const errorMessage = error.message || 'Errore sconosciuto';

    // Cerca informazioni su linea e colonna dall'stack trace
    const stackLines = errorStack.split('\n');
    const relevantLine =
      stackLines.find((line: string) => line.includes('.ts:')) || stackLines[1] || 'N/A';

    // Estrai file, linea e colonna se disponibili
    const fileMatch = relevantLine.match(/([^/\\]+\.ts):(\d+):(\d+)/);
    const fileName = fileMatch ? fileMatch[1] : 'N/A';
    const lineNumber = fileMatch ? fileMatch[2] : 'N/A';
    const columnNumber = fileMatch ? fileMatch[3] : 'N/A';

    // Determina il titolo dell'embed
    const title = info.commandName
      ? `Errore Comando: /${info.commandName}`
      : `Errore Evento: ${info.eventName || 'Unknown'}`;

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
        { name: 'Linea:Colonna', value: `${lineNumber}:${columnNumber}`, inline: true },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
        { name: 'Tipo Errore', value: error.name || 'Error', inline: false },
        { name: 'Node Version', value: process.version, inline: false }
      )
      .setTimestamp()
      .setFooter({
        text: `Bot Error Handler`,
        iconURL: client.user?.displayAvatarURL() || '',
      });

    if (info.userId) {
      errorEmbed.addFields({
        name: 'Utente',
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
      console.error('❌ Il canale di log non supporta il metodo send.');
    }
  } catch (logError) {
    console.error("❌ Errore nell'invio del log di errore:", logError);
  }
}

/**
 * Wrapper per errori di comandi
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
    // Forziamo a stringa o lasciamo non definito, mai null o undefined
    guildId: typeof guildId === 'string' ? guildId : '',
    guildName: guildName ?? '',
  });
}

/**
 * Wrapper per errori di eventi
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
