import { Events, type Guild } from 'discord.js';
import { handleEventError } from '../../tools/errorHandler';
import type { Event } from '../../types/event';

export default {
  name: Events.GuildDelete,
  async execute(guild: Guild): Promise<void> {
    try {
      console.log(`🚪 Bot rimosso dal server: ${guild.name} (ID: ${guild.id})`);
      console.log(`👥 Membri nel server: ${guild.memberCount}`);
      
      // I comandi vengono automaticamente rimossi da Discord quando il bot viene rimosso dal server
      // Questo evento serve principalmente per logging e pulizia di dati se necessario
      
      console.log(`📝 Rimozione dal server ${guild.name} registrata`);
    } catch (error) {
      await handleEventError(guild.client, error, 'GuildDelete', {
        'Guild Name': guild.name,
        'Guild ID': guild.id,
        'Member Count': guild.memberCount?.toString() || 'N/A',
      });
    }
  },
} as Event;
