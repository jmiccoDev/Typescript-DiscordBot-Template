import { Events, EmbedBuilder, Colors, type Interaction, type TextChannel, InteractionType, ApplicationCommandType } from 'discord.js';
import type { Event } from '../../types/event';
import { discordConfig } from '../../config/discord-config';
import { channelsConfig, CHANNEL_TYPES } from '../../config/channels-config';

/**
 * Evento per loggare tutte le interazioni del bot
 * Cattura qualsiasi tipo di interazione e la logga in un canale dedicato
 */

// Mappatura dei tipi di interazione con colori
const INTERACTION_COLORS = {
  [InteractionType.ApplicationCommand]: Colors.Blue,
  [InteractionType.MessageComponent]: Colors.Green,
  [InteractionType.ApplicationCommandAutocomplete]: Colors.Yellow,
  [InteractionType.ModalSubmit]: Colors.Purple,
} as const;

function getInteractionTypeName(interaction: Interaction): string {
  switch (interaction.type) {
    case InteractionType.ApplicationCommand:
      if (interaction.isCommand()) {
        const cmdType = interaction.commandType;
        if (cmdType === ApplicationCommandType.ChatInput) return 'Slash Command';
        if (cmdType === ApplicationCommandType.User) return 'User Context Menu';
        if (cmdType === ApplicationCommandType.Message) return 'Message Context Menu';
        return 'Application Command';
      }
      return 'Application Command';
    case InteractionType.MessageComponent:
      if (interaction.isButton()) return 'Button Interaction';
      if (interaction.isStringSelectMenu()) return 'Select Menu Interaction';
      if (interaction.isChannelSelectMenu()) return 'Channel Select Interaction';
      if (interaction.isRoleSelectMenu()) return 'Role Select Interaction';
      if (interaction.isUserSelectMenu()) return 'User Select Interaction';
      if (interaction.isMentionableSelectMenu()) return 'Mentionable Select Interaction';
      return 'Message Component Interaction';
    case InteractionType.ApplicationCommandAutocomplete:
      return 'Autocomplete Interaction';
    case InteractionType.ModalSubmit:
      return 'Modal Submit Interaction';
    default:
      return 'Unknown Interaction';
  }
}

const event: Event = {
  name: Events.InteractionCreate,
  once: false,
  
  async execute(interaction: Interaction): Promise<void> {
    try {
      // Ottieni il canale per i log
      const logChannelId = channelsConfig[discordConfig.DEFAULT_GUILD_ID ?? '']?.[CHANNEL_TYPES.BOT_LOGS]?.id;
      
      if (!logChannelId) {
        console.warn('Canale per i log delle interazioni non configurato');
        return;
      }

      const logChannel = await interaction.client.channels.fetch(logChannelId).catch(() => null) as TextChannel | null;
      
      if (!logChannel) {
        console.warn(`Impossibile trovare il canale per i log delle interazioni: ${logChannelId}`);
        return;
      }

      // Ottieni informazioni sull'interazione
      const interactionType = getInteractionTypeName(interaction);
      const color = INTERACTION_COLORS[interaction.type] || Colors.Default;

      // Determina l'identificatore principale (comando o ID interazione)
      let mainIdentifier = interaction.id;
      if (interaction.isCommand()) {
        mainIdentifier = interaction.isChatInputCommand() ? `/${interaction.commandName}` : interaction.commandName;
      } else if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
        mainIdentifier = interaction.customId;
      }

      // Crea l'embed con Author e Title
      const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({
          name: `${interaction.user.displayName} (@${interaction.user.tag})`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTitle(interactionType)
        .setTimestamp();

      // Array per i fields
      const fields = [];

      // 1. ID/Comando (sempre presente)
      fields.push({
        name: interaction.isCommand() ? 'Command' : 'Interaction ID',
        value: `\`${mainIdentifier}\``,
        inline: true
      });

      // 2. User Mention
      fields.push({
        name: 'User',
        value: `<@${interaction.user.id}>`,
        inline: true
      });

      // 3. User ID
      fields.push({
        name: 'User ID',
        value: `\`${interaction.user.id}\``,
        inline: true
      });

      // 4. Channel (se disponibile)
      if (interaction.channel) {
        let channelName = 'Unknown Channel';
        if ('name' in interaction.channel) {
          channelName = `#${interaction.channel.name}`;
        }
        fields.push({
          name: 'Channel',
          value: channelName,
          inline: true
        });

        // 5. Channel ID
        fields.push({
          name: 'Channel ID',
          value: `\`${interaction.channel.id}\``,
          inline: true
        });
      } else {
        fields.push({
          name: 'Channel',
          value: 'Direct Message',
          inline: true
        });
      }

      // 6. Guild ID (se presente)
      if (interaction.guild) {
        fields.push({
          name: 'Guild ID',
          value: `\`${interaction.guild.id}\``,
          inline: true
        });
      }

      // 7. Valori inseriti/parametri (specifici per tipo)
      if (interaction.isCommand() && interaction.isChatInputCommand()) {
        const allOptions: string[] = [];
        
        // Funzione ricorsiva per estrarre tutte le opzioni
        function extractOptions(options: readonly any[], prefix = ''): void {
          for (const option of options) {
            if (option.type === 1) { // SUB_COMMAND
              allOptions.push(`${prefix}**subcommand**: ${option.name}`);
              if (option.options) {
                extractOptions(option.options, prefix);
              }
            } else if (option.type === 2) { // SUB_COMMAND_GROUP
              allOptions.push(`${prefix}**subcommand-group**: ${option.name}`);
              if (option.options) {
                extractOptions(option.options, prefix);
              }
            } else if (option.value !== undefined) {
              // Opzione normale con valore
              allOptions.push(`${prefix}**${option.name}**: ${option.value}`);
            } else if (option.options) {
              // Opzione che contiene altre opzioni
              extractOptions(option.options, prefix);
            }
          }
        }

        if (interaction.options.data.length > 0) {
          extractOptions(interaction.options.data);
          
          if (allOptions.length > 0) {
            fields.push({
              name: 'Command Options',
              value: allOptions.join('\n'),
              inline: false
            });
          } else {
            fields.push({
              name: 'Command Options',
              value: 'No options provided',
              inline: true
            });
          }
        } else {
          fields.push({
            name: 'Command Options',
            value: 'No options provided',
            inline: true
          });
        }
      }

      if (interaction.isButton()) {
        fields.push({
          name: 'Button Custom ID',
          value: `\`${interaction.customId}\``,
          inline: false
        });
      }

      if (interaction.isAnySelectMenu()) {
        fields.push({
          name: 'Select Menu Custom ID',
          value: `\`${interaction.customId}\``,
          inline: false
        });
        
        if (interaction.values.length > 0) {
          const values = interaction.values.map(val => `\`${val}\``).join(', ');
          fields.push({
            name: 'Selected Values',
            value: values,
            inline: false
          });
        }
      }

      if (interaction.isModalSubmit()) {
        fields.push({
          name: 'Modal Custom ID',
          value: `\`${interaction.customId}\``,
          inline: false
        });

        if (interaction.fields.fields.size > 0) {
          const modalFields = interaction.fields.fields.map(field => {
            const truncatedValue = field.value.length > 100 
              ? `${field.value.substring(0, 100)}...` 
              : field.value;
            return `**${field.customId}**: ${truncatedValue}`;
          }).join('\n');

          fields.push({
            name: 'Modal Fields',
            value: modalFields,
            inline: false
          });
        }
      }

      if (interaction.isAutocomplete()) {
        const focusedOption = interaction.options.getFocused(true);
        fields.push({
          name: 'Autocomplete Focus',
          value: `**${focusedOption.name}**: "${focusedOption.value}"`,
          inline: false
        });
      }

      // 8. Status aggiuntivi
      if ('deferred' in interaction && interaction.deferred) {
        fields.push({
          name: 'Status',
          value: 'Deferred Reply',
          inline: true
        });
      }

      if ('replied' in interaction && interaction.replied) {
        fields.push({
          name: 'Status',
          value: 'Replied',
          inline: true
        });
      }

      // 9. Guild Name (se presente)
      if (interaction.guild) {
        fields.push({
          name: 'Guild Name',
          value: interaction.guild.name,
          inline: true
        });
      }

      // 10. Interaction Type (tecnico)
      fields.push({
        name: 'Interaction Type',
        value: `${InteractionType[interaction.type]} (${interaction.type})`,
        inline: true
      });

      // Aggiungi tutti i fields all'embed
      embed.addFields(fields);

      // Footer con informazioni tecniche
      embed.setFooter({
        text: `Bot Interaction Logger • ID: ${interaction.id}`,
        iconURL: interaction.client.user?.displayAvatarURL()
      });

      // Invia il log
      await logChannel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Errore durante il logging dell\'interazione:', error);
      // Non rethrow l'errore per evitare di interferire con il funzionamento normale del bot
    }
  },
};

export default event;
