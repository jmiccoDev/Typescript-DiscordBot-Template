import { Events } from 'discord.js';
import type { Event } from '../types/event';

/**
 * Template per creare nuovi eventi
 *
 * ISTRUZIONI:
 * 1. Copia questo file e rinominalo con il nome dell'evento
 * 2. Modifica la proprietà 'name' con l'evento Discord appropriato
 * 3. Implementa la logica nell'execute function
 * 4. Se l'evento deve essere eseguito solo una volta, imposta 'once: true'
 * 5. Se l'evento richiede permessi specifici, imposta 'requiredLevel' (opzionale)
 *
 * EVENTI COMUNI:
 * - Events.ClientReady: quando il bot è pronto
 * - Events.InteractionCreate: per slash commands e interazioni
 * - Events.MessageCreate: per messaggi
 * - Events.GuildMemberAdd: quando un utente entra nel server
 * - Events.GuildMemberRemove: quando un utente esce dal server
 *
 * LIVELLI DI PERMESSO:
 * - 1: USER (utente standard)
 * - 2: MODERATOR (moderatore)
 * - 3: ADMIN (amministratore)
 * - 4: OWNER (proprietario)
 */

const event: Event = {
  name: Events.ClientReady, // Cambia con l'evento appropriato
  once: false, // true se l'evento deve essere eseguito solo una volta
  // requiredLevel: 2, // Decommentare e impostare il livello di permesso richiesto (opzionale)
  async execute(..._args: any[]): Promise<void> {
    // Implementa qui la logica dell'evento
    console.log('Template evento eseguito!');

    // Esempio di accesso ai parametri dell'evento:
    // const [client] = args; // per Events.ClientReady
    // const [interaction] = args; // per Events.InteractionCreate
    // const [message] = args; // per Events.MessageCreate
  },
};

export default event;
