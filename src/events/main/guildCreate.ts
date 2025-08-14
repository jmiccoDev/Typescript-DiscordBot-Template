import { Events, type Guild } from 'discord.js';
import { handleEventError } from '../../tools/errorHandler';
import { redeployCommandsForGuild } from '../../handlers/guildCommandManager';
import type { Event } from '../../types/event';

export default {
  name: Events.GuildCreate,
  async execute(guild: Guild): Promise<void> {
    try {
      console.log(`🏠 Bot aggiunto al server: ${guild.name} (ID: ${guild.id})`);
      console.log(`👥 Membri nel server: ${guild.memberCount}`);

      // Deploy dei comandi per il nuovo guild
      await redeployCommandsForGuild(guild.client, guild.id);

      console.log(`✅ Comandi deployati con successo per il server ${guild.name}`);
    } catch (error) {
      await handleEventError(guild.client, error, 'GuildCreate', {
        'Guild Name': guild.name,
        'Guild ID': guild.id,
        'Member Count': guild.memberCount?.toString() || 'N/A',
      });
    }
  },
} as Event;
