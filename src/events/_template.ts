import { Events } from 'discord.js';
import type { Event } from '../types/event';

/**
 * Template for creating new events
 *
 * INSTRUCTIONS:
 * 1. Copy this file and rename it with the event name
 * 2. Modify the 'name' property with the appropriate Discord event
 * 3. Implement the logic in the execute function
 * 4. If the event should be executed only once, set 'once: true'
 * 5. If the event requires specific permissions, set 'requiredLevel' (optional)
 *
 * COMMON EVENTS:
 * - Events.ClientReady: when the bot is ready
 * - Events.InteractionCreate: for slash commands and interactions
 * - Events.MessageCreate: for messages
 * - Events.GuildMemberAdd: when a user joins the server
 * - Events.GuildMemberRemove: when a user leaves the server
 *
 * PERMISSION LEVELS:
 * - 1: USER (standard user)
 * - 2: MODERATOR (moderator)
 * - 3: ADMIN (administrator)
 * - 4: OWNER (owner)
 */

const event: Event = {
  name: Events.ClientReady, // Change with the appropriate event
  once: false, // true if the event should be executed only once
  // requiredLevel: 2, // Uncomment and set the required permission level (optional)
  async execute(..._args: any[]): Promise<void> {
    // Implement the event logic here
    console.log('Template event executed!');

    // Example of accessing event parameters:
    // const [client] = args; // for Events.ClientReady
    // const [interaction] = args; // for Events.InteractionCreate
    // const [message] = args; // for Events.MessageCreate
  },
};

export default event;
