import { REST, Routes, type Client } from 'discord.js';
import { discordConfig } from '../config/discord-config';
import type { Command } from '../types/command';

/**
 * Utility to re-deploy commands in a specific guild
 * Useful for debugging or manual updates
 * @param client - The Discord client
 * @param guildId - The guild ID where to re-deploy commands
 */
export async function redeployCommandsForGuild(client: Client, guildId: string): Promise<void> {
  console.log(`🔄 Re-deploying commands for guild ${guildId}...`);
  
  const commandsToDeploy: Command[] = [];
  
  client.commands.forEach(command => {
    // Exclude global commands
    if (command.isGlobal !== false) {
      return;
    }
    
    // Include commands that should be deployed in this guild
    if (shouldDeployCommandInGuild(command, guildId)) {
      commandsToDeploy.push(command);
    }
  });

  if (commandsToDeploy.length === 0) {
    console.log(`📝 No guild-specific commands to re-deploy for guild ${guildId}`);
    return;
  }

  const rest = new REST().setToken(discordConfig.DISCORD_TOKEN);

  try {
    const guildData = (await rest.put(
      Routes.applicationGuildCommands(discordConfig.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsToDeploy.map((cmd: Command) => cmd.data.toJSON()),
      }
    )) as any[];

    console.log(`✅ ${guildData.length} commands re-deployed for guild ${guildId}:`);
    guildData.forEach((command: any) => {
      console.log(`   - /${command.name}: ${command.description}`);
    });
  } catch (error) {
    console.error(`❌ Error re-deploying commands for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Utility to re-deploy commands in all guilds where the bot is present
 * @param client - The Discord client
 */
export async function redeployCommandsForAllGuilds(client: Client): Promise<void> {
  console.log(`🌐 Re-deploying commands for all ${client.guilds.cache.size} guilds...`);
  
  const deployPromises: Promise<void>[] = [];
  
  client.guilds.cache.forEach(guild => {
    deployPromises.push(redeployCommandsForGuild(client, guild.id));
  });
  
  try {
    await Promise.all(deployPromises);
    console.log(`✅ Re-deployment completed for all guilds!`);
  } catch (error) {
    console.error(`❌ Error during re-deployment for all guilds:`, error);
    throw error;
  }
}

/**
 * Determines if a command should be deployed in a specific guild
 * @param command - The command to check
 * @param guildId - The guild ID
 * @returns true if the command should be deployed
 */
function shouldDeployCommandInGuild(command: Command, guildId: string): boolean {
  // If the command is global, don't deploy it here
  if (command.isGlobal !== false) {
    return false;
  }

  // If it has specified guildsId
  if (command.guildsId && command.guildsId.length > 0) {
    // If it contains "-1", it should be deployed in all guilds
    if (command.guildsId.includes("-1")) {
      return true;
    }
    
    // If it contains the specific guild ID
    if (command.guildsId.includes(guildId)) {
      return true;
    }
    
    return false;
  }

  // If it doesn't have guildsId but is not global, use DEFAULT_GUILD_ID
  if (discordConfig.DEFAULT_GUILD_ID && guildId === discordConfig.DEFAULT_GUILD_ID) {
    return true;
  }

  return false;
}
