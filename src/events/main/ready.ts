import chalk from 'chalk';
import { Events, ActivityType, type Client } from 'discord.js';
import { handleEventError } from '../../tools/errorHandler';

// Lista delle presence personalizzabili - Modifica qui per aggiungere/rimuovere stati
const PRESENCE_LIST: Array<{
  name: string;
  type: ActivityType;
}> = [
  {
    name: '+7.000 Utenti',
    type: ActivityType.Watching,
  },
  {
    name: 'Moderazione In-Game',
    type: ActivityType.Competing,
  },
  {
    name: 'Sviluppato dalla Direzione di Naples, Italy',
    type: ActivityType.Streaming,
  },
  {
    name: 'discord.gg/naples',
    type: ActivityType.Listening,
  }

] as const;

// Intervallo di aggiornamento in millisecondi (60 secondi)
const PRESENCE_UPDATE_INTERVAL = 60 * 1000;

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client): Promise<void> {
    try {
      if (!client.user) {
        throw new Error('Client user non disponibile');
      }

      console.log(chalk.green(`[BOT] ONLINE ✅ ${client.user.tag}`));
      console.log(chalk.blue(`[BOT] INFO 📊 Connesso a ${client.guilds.cache.size} server`));
      console.log(chalk.blue(`[BOT] INFO 👥 Servendo ${client.users.cache.size} utenti`));
      console.log(chalk.blue(`[BOT] INFO 🤖 Bot ID: ${client.user.id}`));
      console.log(chalk.blue(`[BOT] INFO 📝 Comandi caricati: ${client.commands.size}`));

      // Log delle informazioni del bot
      const guilds = client.guilds.cache.map(
        guild => `${guild.name} (ID: ${guild.id}, ${guild.memberCount} membri)`
      );
      if (guilds.length > 0) {
        console.log(chalk.blue('[BOT] SERVERS 🏠 Server connessi:'));
        guilds.forEach(guild => console.log(chalk.white(`   - ${guild}`)));
      }
      
      console.log(chalk.blue('[BOT] READY 🔄 Pronto per gestire nuovi server automaticamente!'));

      // Imposta la prima presence e avvia il sistema di rotazione
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
 * Configura il sistema di rotazione delle presence
 * @param client - Il client Discord
 */
function setupPresenceRotation(client: Client): void {
  let currentIndex = 0;

  // Funzione per aggiornare la presence
  const updatePresence = (): void => {
    try {
      // Verifica che ci siano presence disponibili
      if (PRESENCE_LIST.length === 0) {
        console.warn('⚠️ Nessuna presence configurata nella lista');
        return;
      }

      const presence = PRESENCE_LIST[currentIndex];
      if (!presence) {
        console.error('❌ Presence non trovata all\'indice:', currentIndex);
        return;
      }
      
      client.user?.setPresence({
        activities: [{
          name: presence.name,
          type: presence.type,
        }],
        status: 'online',
      });
      
      // Passa alla prossima presence (con loop)
      currentIndex = (currentIndex + 1) % PRESENCE_LIST.length;
    } catch (error) {
      console.error('❌ Errore durante l\'aggiornamento della presence:', error);
    }
  };

  // Imposta la prima presence immediatamente
  updatePresence();

  // Avvia l'intervallo di aggiornamento
  setInterval(updatePresence, PRESENCE_UPDATE_INTERVAL);
  
  console.log(chalk.magenta(`[PRESENCE] STARTED 🔄 Sistema rotazione avviato (ogni ${PRESENCE_UPDATE_INTERVAL / 1000}s)`));
}
