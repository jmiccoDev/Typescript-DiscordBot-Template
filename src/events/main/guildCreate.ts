import { Events, type Guild } from 'discord.js';
import { handleEventError } from '../../tools/errorHandler';
import { redeployCommandsForGuild } from '../../handlers/guildCommandManager';
import type { Event } from '../../types/event';

export default {
  name: Events.GuildCreate,
  async execute(guild: Guild): Promise<void> {
    try {
      console.log(`🏠 Bot added to server: ${guild.name} (ID: ${guild.id})`);
      console.log(`👥 Members in server: ${guild.memberCount}`);

      // Deploy commands for the new guild
      await redeployCommandsForGuild(guild.client, guild.id);

      console.log(`✅ Commands deployed successfully for server ${guild.name}`);
    } catch (error) {
      await handleEventError(guild.client, error, 'GuildCreate', {
        'Guild Name': guild.name,
        'Guild ID': guild.id,
        'Member Count': guild.memberCount?.toString() || 'N/A',
      });
    }
  },
} as Event;
