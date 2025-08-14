import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { discordConfig } from '../config/discord-config';
import type { Command } from '../types/command';

/**
 * Deploy di tutti i comandi slash
 */
export async function deployCommands(): Promise<void> {
  const commands: Command[] = [];
  const commandsPath = join(__dirname, '..', 'commands');

  try {
    // Carica tutti i comandi ricorsivamente
    await loadCommandsFromDirectory(commandsPath, commands);

    if (commands.length === 0) {
      console.log('⚠️  Nessun comando trovato da deployare');
      return;
    }

    const rest = new REST().setToken(discordConfig.DISCORD_TOKEN);

    console.log(`🔄 Inizio deploy di ${commands.length} comandi slash...`);

    // Separa i comandi globali da quelli specifici per guild
    const globalCommands = commands.filter(cmd => cmd.isGlobal !== false);
    const guildCommands = commands.filter(cmd => cmd.isGlobal === false);

    // Deploy dei comandi globali
    if (globalCommands.length > 0) {
      const globalData = (await rest.put(Routes.applicationCommands(discordConfig.DISCORD_CLIENT_ID), {
        body: globalCommands.map(cmd => cmd.data.toJSON()),
      })) as any[];

      console.log(`✅ ${globalData.length} comandi globali deployati con successo!`);
      globalData.forEach((command: any) => {
        console.log(`   - /${command.name}: ${command.description} (globale)`);
      });
    }

    // Deploy dei comandi specifici per guild
    const guildDeployments = new Map<string, Command[]>();
    
    // Raggruppa i comandi per guild
    for (const command of guildCommands) {
      if (command.guildsId && command.guildsId.length > 0) {
        // Check for special "-1" flag to deploy to all guilds
        if (command.guildsId.includes("-1")) {
          // Deploy to all guilds where the bot is present
          // Note: This requires the client to be available, so we'll handle this differently
          console.warn(`⚠️  Comando ${command.data.name} richiede deploy in tutti i guild. Usa il commandHandler per il deploy completo.`);
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
        // Se non ha guild specifiche ma esiste DEFAULT_GUILD_ID, usa quello
        if (!guildDeployments.has(discordConfig.DEFAULT_GUILD_ID)) {
          guildDeployments.set(discordConfig.DEFAULT_GUILD_ID, []);
        }
        guildDeployments.get(discordConfig.DEFAULT_GUILD_ID)!.push(command);
      } else {
        console.warn(`⚠️  Comando ${command.data.name} non è globale e non ha guilds specifici, ma non è configurato un guild di default`);
      }
    }

    // Deploy per ogni guild
    for (const [guildId, guildCmds] of guildDeployments) {
      const guildData = (await rest.put(Routes.applicationGuildCommands(discordConfig.DISCORD_CLIENT_ID, guildId), {
        body: guildCmds.map(cmd => cmd.data.toJSON()),
      })) as any[];

      console.log(`✅ ${guildData.length} comandi deployati per guild ${guildId}:`);
      guildData.forEach((command: any) => {
        const guildLabel = guildId === discordConfig.DEFAULT_GUILD_ID ? 'default' : guildId;
        console.log(`   - /${command.name}: ${command.description} (guild: ${guildLabel})`);
      });
    }

    const totalDeployed = globalCommands.length + guildCommands.length;
    console.log(`🎉 Deploy completato! Totale comandi deployati: ${totalDeployed}`);
  } catch (error) {
    console.error('❌ Errore durante il deploy dei comandi:', error);
    throw error;
  }
}

/**
 * Carica i comandi da una directory specifica (ricorsivamente)
 * @param dirPath - Il percorso della directory
 * @param commands - Array per raccogliere i comandi
 */
async function loadCommandsFromDirectory(dirPath: string, commands: Command[]): Promise<void> {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Se è una directory, carica ricorsivamente
      await loadCommandsFromDirectory(filePath, commands);
    } else if (file.endsWith('.js') && !file.startsWith('_')) {
      // Se è un file JavaScript compilato e non inizia con _, caricalo
      try {
        // Usa require invece di import dinamico per compatibilità
        delete require.cache[require.resolve(filePath)];
        const commandModule = require(filePath);
        const command: Command = commandModule.default || commandModule;

        if (!command.data || typeof command.execute !== 'function') {
          console.warn(`⚠️  Comando ${file} non ha una struttura valida`);
          continue;
        }

        commands.push(command);
        console.log(`📝 Comando caricato: ${command.data.name} (${file})`);
      } catch (error) {
        console.error(`❌ Errore nel caricamento del comando ${file}:`, error);
      }
    }
  }
}

// Se il file viene eseguito direttamente, esegui il deploy
if (require.main === module) {
  deployCommands().catch(console.error);
}
