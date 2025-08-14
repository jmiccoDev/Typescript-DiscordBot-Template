import chalk from 'chalk';
import { REST, Routes, type Client } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { discordConfig } from '../config/discord-config';
import type { Command } from '../types/command';

/**
 * Load all commands from the commands/ folder
 * @param client - The Discord client
 */
export async function loadCommands(client: Client): Promise<void> {
  const commandsPath = join(__dirname, '..', 'commands');

  try {
    await loadCommandsFromDirectory(client, commandsPath);
    console.log(chalk.green(`[COMMANDS] SUCCESS ✅ Loaded ${client.commands.size} commands`));
  } catch (error) {
    console.error(chalk.red('[COMMANDS] ERROR ❌'), error);
    throw error;
  }
}

/**
 * Load commands from a specific directory (recursively)
 * @param client - The Discord client
 * @param dirPath - The directory path
 */
async function loadCommandsFromDirectory(client: Client, dirPath: string): Promise<void> {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, load recursively
      await loadCommandsFromDirectory(client, filePath);
    } else if (file.endsWith('.ts') && !file.startsWith('_')) {
      // If it's a TypeScript file and doesn't start with _, load it
      try {
        // Use require instead of dynamic import for compatibility
        delete require.cache[require.resolve(filePath)];
        const commandModule = require(filePath);
        const command: Command = commandModule.default || commandModule;

        if (!command.data || typeof command.execute !== 'function') {
          console.warn(chalk.yellow(`[COMMANDS] WARNING ⚠️  Command ${file} doesn't have a valid structure`));
          continue;
        }

        // Add the command to the collection
        client.commands.set(command.data.name, command);
        console.log(chalk.white(`[COMMANDS] LOADED 📝 ${command.data.name} (${file})`));
      } catch (error) {
        console.error(chalk.red(`[COMMANDS] ERROR ❌ Loading error ${file}:`), error);
      }
    }
  }
}

/**
 * Deploy all slash commands
 * @param client - The Discord client
 */
export async function deployCommands(client: Client): Promise<void> {
  const globalCommands: Command[] = [];
  const guildCommands: Command[] = [];

  try {
    // Separate global commands from guild-specific ones (same logic as deploy-commands.ts)
    client.commands.forEach(command => {
      if (command.isGlobal !== false) {
        // Global command (default if not specified)
        globalCommands.push(command);
      } else if (command.isGlobal === false) {
        // Guild-specific command (with or without specified guild IDs)
        guildCommands.push(command);
      }
    });

    const rest = new REST().setToken(discordConfig.DISCORD_TOKEN);

    // Deploy global commands
    if (globalCommands.length > 0) {
      console.log(chalk.blue(`[DEPLOY] DEPLOYING 🌍 ${globalCommands.length} global commands...`));
      const globalData = (await rest.put(Routes.applicationCommands(discordConfig.DISCORD_CLIENT_ID), {
        body: globalCommands.map(cmd => cmd.data.toJSON()),
      })) as any[];

      console.log(chalk.green(`[DEPLOY] SUCCESS ✅ ${globalData.length} global commands deployed:`));
      globalData.forEach((command: any) => {
        console.log(chalk.white(`   - /${command.name}: ${command.description} (global)`));
      });
    }

    // Deploy guild-specific commands
    const guildDeployments = new Map<string, Command[]>();
    
    // Group commands by guild (same logic as deploy-commands.ts)
    for (const command of guildCommands) {
      if (command.guildsId && command.guildsId.length > 0) {
        // Check for special "-1" flag to deploy to all guilds
        if (command.guildsId.includes("-1")) {
          // Deploy to all guilds where the bot is present
          const allGuilds = client.guilds.cache;
          console.log(chalk.blue(`[DEPLOY] INFO 🌐 Command ${command.data.name} will be deployed to all ${allGuilds.size} guilds`));
          
          for (const [guildId] of allGuilds) {
            if (!guildDeployments.has(guildId)) {
              guildDeployments.set(guildId, []);
            }
            guildDeployments.get(guildId)!.push(command);
          }
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
        // If it doesn't have specific guilds but is not global, use the default guild
        if (!guildDeployments.has(discordConfig.DEFAULT_GUILD_ID)) {
          guildDeployments.set(discordConfig.DEFAULT_GUILD_ID, []);
        }
        guildDeployments.get(discordConfig.DEFAULT_GUILD_ID)!.push(command);
      } else {
        console.warn(chalk.yellow(`[DEPLOY] WARNING ⚠️  Command ${command.data.name} not configured correctly`));
      }
    }

    // Deploy for each guild
    for (const [guildId, guildCmds] of guildDeployments) {
      console.log(chalk.blue(`[DEPLOY] DEPLOYING 🏠 ${guildCmds.length} commands for guild ${guildId}...`));
      const guildData = (await rest.put(
        Routes.applicationGuildCommands(discordConfig.DISCORD_CLIENT_ID, guildId),
        {
          body: guildCmds.map(cmd => cmd.data.toJSON()),
        }
      )) as any[];

      console.log(chalk.green(`[DEPLOY] SUCCESS ✅ ${guildData.length} commands deployed for guild ${guildId}:`));
      guildData.forEach((command: any) => {
        const guildLabel = guildId === discordConfig.DEFAULT_GUILD_ID ? 'default' : guildId;
        console.log(chalk.white(`   - /${command.name}: ${command.description} (guild: ${guildLabel})`));
      });
    }

    const totalDeployed = globalCommands.length + guildCommands.length;
    if (totalDeployed === 0) {
      console.log(chalk.yellow('[DEPLOY] WARNING ⚠️  No commands found to deploy'));
    } else {
      console.log(chalk.green(`[DEPLOY] COMPLETE 🎉 Total commands deployed: ${totalDeployed}`));
    }
  } catch (error) {
    console.error(chalk.red('[DEPLOY] ERROR ❌'), error);
    throw error;
  }
}
