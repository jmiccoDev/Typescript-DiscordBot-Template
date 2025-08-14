import chalk from 'chalk';
import { Events, ActivityType, type Client } from 'discord.js';
import { handleEventError } from '../../tools/errorHandler';

// List of customizable presences - uses placeholder template:
// {users}, {guilds}, {commands}, {prefix}, {version}, {uptime}, {invite}, {owner}
const PRESENCE_LIST: Array<{
  name: string;
  type: ActivityType;
}> = [
  { name: '{users} users', type: ActivityType.Watching },
  { name: 'Serving {guilds} servers', type: ActivityType.Watching },
  { name: '{prefix}help · {commands} commands', type: ActivityType.Listening },
  { name: 'Version {version}', type: ActivityType.Playing },
  { name: 'Online for {uptime}', type: ActivityType.Competing },
  { name: 'Join: {invite}', type: ActivityType.Streaming },
  { name: 'Developed by {owner}', type: ActivityType.Playing },
  { name: 'Active moderation', type: ActivityType.Competing },
] as const;

// Update interval in milliseconds (60 seconds)
const PRESENCE_UPDATE_INTERVAL = 60 * 1000;

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client): Promise<void> {
    try {
      if (!client.user) {
        throw new Error('Client user not available');
      }

      console.log(chalk.green(`[BOT] ONLINE ✅ ${client.user.tag}`));
      console.log(chalk.blue(`[BOT] INFO 📊 Connected to ${client.guilds.cache.size} servers`));
      console.log(chalk.blue(`[BOT] INFO 👥 Serving ${client.users.cache.size} users`));
      console.log(chalk.blue(`[BOT] INFO 🤖 Bot ID: ${client.user.id}`));
      console.log(chalk.blue(`[BOT] INFO 📝 Commands loaded: ${client.commands.size}`));

      // Log bot information
      const guilds = client.guilds.cache.map(
        guild => `${guild.name} (ID: ${guild.id}, ${guild.memberCount} members)`
      );
      if (guilds.length > 0) {
        console.log(chalk.blue('[BOT] SERVERS 🏠 Connected servers:'));
        guilds.forEach(guild => console.log(chalk.white(`   - ${guild}`)));
      }
      
      console.log(chalk.blue('[BOT] READY 🔄 Ready to handle new servers automatically!'));

      // Set the first presence and start the rotation system
      setupPresenceRotation(client);

    } catch (error) {
      await handleEventError(client, error, 'ClientReady', {
        'Guilds Count': client.guilds.cache.size.toString(),
        'Users Count': client.users.cache.size.toString(),
      });
    }
  },
};

/**
 * Configures the presence rotation system
 * @param client - The Discord client
 */
function setupPresenceRotation(client: Client): void {
  let currentIndex = 0;

  // Function to update presence
  const updatePresence = (): void => {
    try {
      // Verify that presences are available
      if (PRESENCE_LIST.length === 0) {
        console.warn('⚠️ No presence configured in the list');
        return;
      }

      const presence = PRESENCE_LIST[currentIndex];
      if (!presence) {
        console.error('❌ Presence not found at index:', currentIndex);
        return;
      }
      
      client.user?.setPresence({
        activities: [{
          name: presence.name,
          type: presence.type,
        }],
        status: 'online',
      });
      
      // Move to the next presence (with loop)
      currentIndex = (currentIndex + 1) % PRESENCE_LIST.length;
    } catch (error) {
      console.error('❌ Error during presence update:', error);
    }
  };

  // Set the first presence immediately
  updatePresence();

  // Start the update interval
  setInterval(updatePresence, PRESENCE_UPDATE_INTERVAL);
  
  console.log(chalk.magenta(`[PRESENCE] STARTED 🔄 Rotation system started (every ${PRESENCE_UPDATE_INTERVAL / 1000}s)`));
}
