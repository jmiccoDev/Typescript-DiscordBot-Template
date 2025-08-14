import chalk from 'chalk';
import type { Client } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { Event } from '../types/event';

/**
 * Recursively loads all events from the events/ folder
 * @param client - The Discord client
 */
export async function loadEvents(client: Client): Promise<void> {
  const eventsPath = join(__dirname, '..', 'events');

  try {
    await loadEventsFromDirectory(client, eventsPath);
    console.log(chalk.green('[EVENTS] SUCCESS ✅ All events loaded successfully'));
  } catch (error) {
    console.error(chalk.red('[EVENTS] ERROR ❌'), error);
    throw error;
  }
}

/**
 * Loads events from a specific directory (recursively)
 * @param client - The Discord client
 * @param dirPath - The directory path
 */
async function loadEventsFromDirectory(client: Client, dirPath: string): Promise<void> {
  const files = readdirSync(dirPath);

  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, load recursively
      await loadEventsFromDirectory(client, filePath);
    } else if (file.endsWith('.ts') && !file.startsWith('_')) {
      // If it's a TypeScript file and doesn't start with _, load it
      try {
        // Use require instead of dynamic import for compatibility
        delete require.cache[require.resolve(filePath)];
        const eventModule = require(filePath);
        const event: Event = eventModule.default || eventModule;

        if (!event.name || typeof event.execute !== 'function') {
          console.warn(chalk.yellow(`[EVENTS] WARNING ⚠️  Event ${file} doesn't have a valid structure`));
          continue;
        }

        if (event.once) {
          client.once(event.name, event.execute);
        } else {
          client.on(event.name, event.execute);
        }

        console.log(chalk.white(`[EVENTS] LOADED 📝 ${event.name} (${file})`));
      } catch (error) {
        console.error(chalk.red(`[EVENTS] ERROR ❌ Loading error ${file}:`), error);
      }
    }
  }
}
