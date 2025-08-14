import { REST, Routes, type Client } from 'discord.js';
import { discordConfig } from '../config/discord-config';
import type { Command } from '../types/command';

/**
 * Utility per re-deployare i comandi in un guild specifico
 * Utile per debug o aggiornamenti manuali
 * @param client - Il client Discord
 * @param guildId - L'ID del guild dove re-deployare i comandi
 */
export async function redeployCommandsForGuild(client: Client, guildId: string): Promise<void> {
  console.log(`🔄 Re-deploy dei comandi per guild ${guildId}...`);
  
  const commandsToDeploy: Command[] = [];
  
  client.commands.forEach(command => {
    // Escludi i comandi globali
    if (command.isGlobal !== false) {
      return;
    }
    
    // Includi comandi che devono essere deployati in questo guild
    if (shouldDeployCommandInGuild(command, guildId)) {
      commandsToDeploy.push(command);
    }
  });

  if (commandsToDeploy.length === 0) {
    console.log(`📝 Nessun comando guild-specific da re-deployare per guild ${guildId}`);
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

    console.log(`✅ ${guildData.length} comandi re-deployati per guild ${guildId}:`);
    guildData.forEach((command: any) => {
      console.log(`   - /${command.name}: ${command.description}`);
    });
  } catch (error) {
    console.error(`❌ Errore nel re-deploy dei comandi per guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Utility per re-deployare i comandi in tutti i guild dove il bot è presente
 * @param client - Il client Discord
 */
export async function redeployCommandsForAllGuilds(client: Client): Promise<void> {
  console.log(`🌐 Re-deploy dei comandi per tutti i ${client.guilds.cache.size} guild...`);
  
  const deployPromises: Promise<void>[] = [];
  
  client.guilds.cache.forEach(guild => {
    deployPromises.push(redeployCommandsForGuild(client, guild.id));
  });
  
  try {
    await Promise.all(deployPromises);
    console.log(`✅ Re-deploy completato per tutti i guild!`);
  } catch (error) {
    console.error(`❌ Errore durante il re-deploy per tutti i guild:`, error);
    throw error;
  }
}

/**
 * Determina se un comando deve essere deployato in un guild specifico
 * @param command - Il comando da verificare
 * @param guildId - L'ID del guild
 * @returns true se il comando deve essere deployato
 */
function shouldDeployCommandInGuild(command: Command, guildId: string): boolean {
  // Se il comando è globale, non deployarlo qui
  if (command.isGlobal !== false) {
    return false;
  }

  // Se ha guildsId specificati
  if (command.guildsId && command.guildsId.length > 0) {
    // Se contiene "-1", deve essere deployato in tutti i guild
    if (command.guildsId.includes("-1")) {
      return true;
    }
    
    // Se contiene l'ID del guild specifico
    if (command.guildsId.includes(guildId)) {
      return true;
    }
    
    return false;
  }

  // Se non ha guildsId ma non è globale, usa il DEFAULT_GUILD_ID
  if (discordConfig.DEFAULT_GUILD_ID && guildId === discordConfig.DEFAULT_GUILD_ID) {
    return true;
  }

  return false;
}
