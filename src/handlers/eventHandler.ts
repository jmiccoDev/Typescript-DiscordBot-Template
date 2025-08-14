import chalk from 'chalk';
import type { Client } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { Event } from '../types/event';

/**
 * Carica ricorsivamente tutti gli eventi dalla cartella events/
 * @param client - Il client Discord
 */
export async function loadEvents(client: Client): Promise<void> {
  const eventsPath = join(__dirname, '..', 'events');

  try {
    await loadEventsFromDirectory(client, eventsPath);
    console.log(chalk.green('[EVENTS] SUCCESS ✅ Tutti gli eventi caricati con successo'));
  } catch (error) {
    console.error(chalk.red('[EVENTS] ERROR ❌'), error);
    throw error;
  }
}

/**
 * Carica gli eventi da una directory specifica (ricorsivamente)
 * @param client - Il client Discord
 * @param dirPath - Il percorso della directory
 */
async function loadEventsFromDirectory(client: Client, dirPath: string): Promise<void> {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Se è una directory, carica ricorsivamente
      await loadEventsFromDirectory(client, filePath);
    } else if (file.endsWith('.ts') && !file.startsWith('_')) {
      // Se è un file TypeScript e non inizia con _, caricalo
      try {
        // Usa require invece di import dinamico per compatibilità
        delete require.cache[require.resolve(filePath)];
        const eventModule = require(filePath);
        const event: Event = eventModule.default || eventModule;

        if (!event.name || typeof event.execute !== 'function') {
          console.warn(chalk.yellow(`[EVENTS] WARNING ⚠️  Evento ${file} non ha una struttura valida`));
          continue;
        }

        if (event.once) {
          client.once(event.name, event.execute);
        } else {
          client.on(event.name, event.execute);
        }

        console.log(chalk.white(`[EVENTS] LOADED 📝 ${event.name} (${file})`));
      } catch (error) {
        console.error(chalk.red(`[EVENTS] ERROR ❌ Errore caricamento ${file}:`), error);
      }
    }
  }
}
