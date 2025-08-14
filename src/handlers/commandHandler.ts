import chalk from 'chalk';
import { REST, Routes, type Client } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { discordConfig } from '../config/discord-config';
import type { Command } from '../types/command';

/**
 * Carica tutti i comandi dalla cartella commands/
 * @param client - Il client Discord
 */
export async function loadCommands(client: Client): Promise<void> {
  const commandsPath = join(__dirname, '..', 'commands');

  try {
    await loadCommandsFromDirectory(client, commandsPath);
    console.log(chalk.green(`[COMMANDS] SUCCESS ✅ Caricati ${client.commands.size} comandi`));
  } catch (error) {
    console.error(chalk.red('[COMMANDS] ERROR ❌'), error);
    throw error;
  }
}

/**
 * Carica i comandi da una directory specifica (ricorsivamente)
 * @param client - Il client Discord
 * @param dirPath - Il percorso della directory
 */
async function loadCommandsFromDirectory(client: Client, dirPath: string): Promise<void> {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Se è una directory, carica ricorsivamente
      await loadCommandsFromDirectory(client, filePath);
    } else if (file.endsWith('.ts') && !file.startsWith('_')) {
      // Se è un file TypeScript e non inizia con _, caricalo
      try {
        // Usa require invece di import dinamico per compatibilità
        delete require.cache[require.resolve(filePath)];
        const commandModule = require(filePath);
        const command: Command = commandModule.default || commandModule;

        if (!command.data || typeof command.execute !== 'function') {
          console.warn(chalk.yellow(`[COMMANDS] WARNING ⚠️  Comando ${file} non ha una struttura valida`));
          continue;
        }

        // Aggiungi il comando alla collection
        client.commands.set(command.data.name, command);
        console.log(chalk.white(`[COMMANDS] LOADED 📝 ${command.data.name} (${file})`));
      } catch (error) {
        console.error(chalk.red(`[COMMANDS] ERROR ❌ Errore caricamento ${file}:`), error);
      }
    }
  }
}

/**
 * Deploy di tutti i comandi slash
 * @param client - Il client Discord
 */
export async function deployCommands(client: Client): Promise<void> {
  const globalCommands: Command[] = [];
  const guildCommands: Command[] = [];

  try {
    // Separa i comandi globali da quelli guild-specific (stessa logica di deploy-commands.ts)
    client.commands.forEach(command => {
      if (command.isGlobal !== false) {
        // Comando globale (default se non specificato)
        globalCommands.push(command);
      } else if (command.isGlobal === false) {
        // Comando guild-specific (con o senza guild IDs specificati)
        guildCommands.push(command);
      }
    });

    const rest = new REST().setToken(discordConfig.DISCORD_TOKEN);

    // Deploy comandi globali
    if (globalCommands.length > 0) {
      console.log(chalk.blue(`[DEPLOY] DEPLOYING 🌍 ${globalCommands.length} comandi globali...`));
      const globalData = (await rest.put(Routes.applicationCommands(discordConfig.DISCORD_CLIENT_ID), {
        body: globalCommands.map(cmd => cmd.data.toJSON()),
      })) as any[];

      console.log(chalk.green(`[DEPLOY] SUCCESS ✅ ${globalData.length} comandi globali deployati:`));
      globalData.forEach((command: any) => {
        console.log(chalk.white(`   - /${command.name}: ${command.description} (globale)`));
      });
    }

    // Deploy comandi guild-specific
    const guildDeployments = new Map<string, Command[]>();
    
    // Raggruppa i comandi per guild (stessa logica di deploy-commands.ts)
    for (const command of guildCommands) {
      if (command.guildsId && command.guildsId.length > 0) {
        // Check for special "-1" flag to deploy to all guilds
        if (command.guildsId.includes("-1")) {
          // Deploy to all guilds where the bot is present
          const allGuilds = client.guilds.cache;
          console.log(chalk.blue(`[DEPLOY] INFO 🌐 Comando ${command.data.name} verrà deployato in tutti i ${allGuilds.size} guild`));
          
          for (const [guildId] of allGuilds) {
            if (!guildDeployments.has(guildId)) {
              guildDeployments.set(guildId, []);
            }
            guildDeployments.get(guildId)!.push(command);
          }
          continue;
        }
        
        // Se ha guilds specifici, usali
        for (const guildId of command.guildsId) {
          if (!guildDeployments.has(guildId)) {
            guildDeployments.set(guildId, []);
          }
          guildDeployments.get(guildId)!.push(command);
        }
      } else if (discordConfig.DEFAULT_GUILD_ID) {
        // Se non ha guilds specifici ma non è globale, usa il guild di default
        if (!guildDeployments.has(discordConfig.DEFAULT_GUILD_ID)) {
          guildDeployments.set(discordConfig.DEFAULT_GUILD_ID, []);
        }
        guildDeployments.get(discordConfig.DEFAULT_GUILD_ID)!.push(command);
      } else {
        console.warn(chalk.yellow(`[DEPLOY] WARNING ⚠️  Comando ${command.data.name} non configurato correttamente`));
      }
    }

    // Deploy per ogni guild
    for (const [guildId, guildCmds] of guildDeployments) {
      console.log(chalk.blue(`[DEPLOY] DEPLOYING 🏠 ${guildCmds.length} comandi per guild ${guildId}...`));
      const guildData = (await rest.put(
        Routes.applicationGuildCommands(discordConfig.DISCORD_CLIENT_ID, guildId),
        {
          body: guildCmds.map(cmd => cmd.data.toJSON()),
        }
      )) as any[];

      console.log(chalk.green(`[DEPLOY] SUCCESS ✅ ${guildData.length} comandi deployati per guild ${guildId}:`));
      guildData.forEach((command: any) => {
        const guildLabel = guildId === discordConfig.DEFAULT_GUILD_ID ? 'default' : guildId;
        console.log(chalk.white(`   - /${command.name}: ${command.description} (guild: ${guildLabel})`));
      });
    }

    const totalDeployed = globalCommands.length + guildCommands.length;
    if (totalDeployed === 0) {
      console.log(chalk.yellow('[DEPLOY] WARNING ⚠️  Nessun comando trovato da deployare'));
    } else {
      console.log(chalk.green(`[DEPLOY] COMPLETE 🎉 Totale comandi deployati: ${totalDeployed}`));
    }
  } catch (error) {
    console.error(chalk.red('[DEPLOY] ERROR ❌'), error);
    throw error;
  }
}
