import { Collection } from 'discord.js';

// Collection globale per gestire i cooldown
const cooldowns = new Collection<string, Collection<string, number>>();

export interface CooldownResult {
  canExecute: boolean;
  timeLeft?: number;
}

/**
 * Gestisce il cooldown per un comando specifico
 * @param userId - ID dell'utente
 * @param commandName - Nome del comando
 * @param cooldownAmount - Durata del cooldown in secondi
 * @returns Risultato del controllo cooldown
 */
export function handleCooldown(
  userId: string,
  commandName: string,
  cooldownAmount: number
): CooldownResult {
  // Ottieni o crea la collection per questo comando
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName)!;
  const cooldownAmountMs = cooldownAmount * 1000;

  // Controlla se l'utente ha un cooldown attivo
  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId)! + cooldownAmountMs;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return { canExecute: false, timeLeft };
    }
  }

  // Imposta il nuovo timestamp per l'utente
  timestamps.set(userId, now);

  // Rimuovi il timestamp dopo il cooldown
  setTimeout(() => timestamps.delete(userId), cooldownAmountMs);

  return { canExecute: true };
}

/**
 * Rimuove il cooldown per un utente specifico su un comando
 * @param userId - ID dell'utente
 * @param commandName - Nome del comando
 */
export function removeCooldown(userId: string, commandName: string): void {
  const timestamps = cooldowns.get(commandName);
  if (timestamps) {
    timestamps.delete(userId);
  }
}

/**
 * Ottiene il tempo rimanente del cooldown per un utente
 * @param userId - ID dell'utente
 * @param commandName - Nome del comando
 * @param cooldownAmount - Durata del cooldown in secondi
 * @returns Tempo rimanente in secondi, o 0 se non c'è cooldown
 */
export function getRemainingCooldown(
  userId: string,
  commandName: string,
  cooldownAmount: number
): number {
  const timestamps = cooldowns.get(commandName);
  if (!timestamps || !timestamps.has(userId)) {
    return 0;
  }

  const now = Date.now();
  const cooldownAmountMs = cooldownAmount * 1000;
  const expirationTime = timestamps.get(userId)! + cooldownAmountMs;

  if (now >= expirationTime) {
    return 0;
  }

  return (expirationTime - now) / 1000;
}

/**
 * Pulisce tutti i cooldown scaduti
 */
export function cleanupExpiredCooldowns(): void {
  const now = Date.now();

  cooldowns.forEach((timestamps, commandName) => {
    timestamps.forEach((timestamp, userId) => {
      // Assumiamo un cooldown massimo di 1 ora per la pulizia
      if (now - timestamp > 3600000) {
        timestamps.delete(userId);
      }
    });

    // Rimuovi la collection se è vuota
    if (timestamps.size === 0) {
      cooldowns.delete(commandName);
    }
  });
}

// Pulisci i cooldown scaduti ogni 10 minuti
setInterval(cleanupExpiredCooldowns, 600000);
