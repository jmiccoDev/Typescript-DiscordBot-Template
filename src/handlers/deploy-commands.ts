import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { discordConfig } from '../config/discord-config';
import type { Command } from '../types/command';

/**
 * Deploy all slash commands
 */
export async function deployCommands(): Promise<void> {
  const commands: Command[] = [];
  const commandsPath = join(__dirname, '..', 'commands');

  try {
    // Load all commands recursively
    await loadCommandsFromDirectory(commandsPath, commands);

    if (commands.length === 0) {
      console.log('⚠️  No commands found to deploy');
      return;
    }

    const rest = new REST().setToken(discordConfig.DISCORD_TOKEN);

    console.log(`🔄 Starting deployment of ${commands.length} slash commands...`);

    // Separate global commands from guild-specific ones
    const globalCommands = commands.filter(cmd => cmd.isGlobal !== false);
    const guildCommands = commands.filter(cmd => cmd.isGlobal === false);

    // Deploy global commands
    if (globalCommands.length > 0) {
      const globalData = (await rest.put(Routes.applicationCommands(discordConfig.DISCORD_CLIENT_ID), {
        body: globalCommands.map(cmd => cmd.data.toJSON()),
      })) as any[];

      console.log(`✅ ${globalData.length} global commands deployed successfully!`);
      globalData.forEach((command: any) => {
        console.log(`   - /${command.name}: ${command.description} (global)`);
      });
    }

    // Deploy guild-specific commands
    const guildDeployments = new Map<string, Command[]>();
    
    // Group commands by guild
    for (const command of guildCommands) {
      if (command.guildsId && command.guildsId.length > 0) {
        // Check for special "-1" flag to deploy to all guilds
        if (command.guildsId.includes("-1")) {
          // Deploy to all guilds where the bot is present
          // Note: This requires the client to be available, so we'll handle this differently
          console.warn(`⚠️  Command ${command.data.name} requires deployment to all guilds. Use commandHandler for complete deployment.`);
          continue;
        }
        
        // If it has specific guilds, use them
        for (const guildId of command.guildsId) {
          if (!guildDeployments.has(guildId)) {
            guildDeployments.set(guildId, []);
          }
          guildDeployments.get(guildId)!.push(command);
        }
      } else if (discordConfig.DEFAULT_GUILD_ID) {
        // If it doesn't have specific guilds but DEFAULT_GUILD_ID exists, use that
        if (!guildDeployments.has(discordConfig.DEFAULT_GUILD_ID)) {
          guildDeployments.set(discordConfig.DEFAULT_GUILD_ID, []);
        }
        guildDeployments.get(discordConfig.DEFAULT_GUILD_ID)!.push(command);
      } else {
        console.warn(`⚠️  Command ${command.data.name} is not global and has no specific guilds, but no default guild is configured`);
      }
    }

    // Deploy for each guild
    for (const [guildId, guildCmds] of guildDeployments) {
      const guildData = (await rest.put(Routes.applicationGuildCommands(discordConfig.DISCORD_CLIENT_ID, guildId), {
        body: guildCmds.map(cmd => cmd.data.toJSON()),
      })) as any[];

      console.log(`✅ ${guildData.length} commands deployed for guild ${guildId}:`);
      guildData.forEach((command: any) => {
        const guildLabel = guildId === discordConfig.DEFAULT_GUILD_ID ? 'default' : guildId;
        console.log(`   - /${command.name}: ${command.description} (guild: ${guildLabel})`);
      });
    }

    const totalDeployed = globalCommands.length + guildCommands.length;
    console.log(`🎉 Deployment completed! Total commands deployed: ${totalDeployed}`);
  } catch (error) {
    console.error('❌ Error during command deployment:', error);
    throw error;
  }
}

/**
 * Load commands from a specific directory (recursively)
 * @param dirPath - The directory path
 * @param commands - Array to collect commands
 */
async function loadCommandsFromDirectory(dirPath: string, commands: Command[]): Promise<void> {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, load recursively
      await loadCommandsFromDirectory(filePath, commands);
    } else if (file.endsWith('.js') && !file.startsWith('_')) {
      // If it's a compiled JavaScript file and doesn't start with _, load it
      try {
        // Use require instead of dynamic import for compatibility
        delete require.cache[require.resolve(filePath)];
        const commandModule = require(filePath);
        const command: Command = commandModule.default || commandModule;

        if (!command.data || typeof command.execute !== 'function') {
          console.warn(`⚠️  Command ${file} doesn't have a valid structure`);
          continue;
        }

        commands.push(command);
        console.log(`📝 Command loaded: ${command.data.name} (${file})`);
      } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error);
      }
    }
  }
}

// If the file is executed directly, run the deployment
if (require.main === module) {
  deployCommands().catch(console.error);
}
