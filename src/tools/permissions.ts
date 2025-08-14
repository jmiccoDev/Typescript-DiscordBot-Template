import { permissions, PERMISSION_LEVELS, BOT_OWNERS } from '../config/roles-config';
import type { Client, GuildMember } from 'discord.js';

/**
 * Ottiene il livello di permesso di un utente in una guild specifica
 * @param userId - ID dell'utente
 * @param guildId - ID della guild
 * @param client - Client Discord per fetchare i membri
 * @returns Il livello di permesso dell'utente
 */
export async function getUserPermissionLevel(
  userId: string,
  guildId: string | null,
  client: Client
): Promise<number> {
  // Se l'utente è proprietario del bot, ha sempre il livello massimo
  if (BOT_OWNERS.includes(userId)) {
    return PERMISSION_LEVELS['OWNER']?.level ?? 4;
  }

  if (!guildId) return PERMISSION_LEVELS['USER']?.level ?? 1;

  // Se non ci sono permessi configurati per questa guild, ritorna livello utente
  const guildPermissions = permissions[guildId];
  if (!guildPermissions) return PERMISSION_LEVELS['USER']?.level ?? 1;

  try {
    // Fetch del membro per ottenere i suoi ruoli
    const guild = await client.guilds.fetch(guildId);
    const member: GuildMember = await guild.members.fetch(userId);

    if (!member) return PERMISSION_LEVELS['USER']?.level ?? 1;

    const userRoleIds = member.roles.cache.map(role => role.id);

    // Trova il livello più alto dell'utente
    let highestLevel = PERMISSION_LEVELS['USER']?.level ?? 1;

    Object.entries(guildPermissions).forEach(([level, roleIds]) => {
      const levelNum = Number.parseInt(level, 10);
      const hasRole = roleIds.some(roleId => userRoleIds.includes(roleId));

      if (hasRole && levelNum > highestLevel) {
        highestLevel = levelNum;
      }
    });

    return highestLevel;
  } catch (error) {
    console.error(`Errore nel recupero dei permessi per ${userId}:`, error);
    return PERMISSION_LEVELS['USER']?.level ?? 1;
  }
}

/**
 * Verifica se un utente ha un livello di permesso specifico o superiore
 * @param userId - ID dell'utente
 * @param guildId - ID della guild
 * @param requiredLevel - Livello richiesto
 * @param client - Client Discord
 * @returns true se l'utente ha i permessi necessari
 */
export async function hasPermissionLevel(
  userId: string,
  guildId: string | null,
  requiredLevel: number,
  client: Client
): Promise<boolean> {
  // Livello 0 è riservato esclusivamente ai bot owners
  if (requiredLevel === 0) {
    return isBotOwner(userId);
  }
  
  const userLevel = await getUserPermissionLevel(userId, guildId, client);
  return userLevel >= requiredLevel;
}

/**
 * Ottiene il nome del livello di permesso
 * @param level - Il livello numerico
 * @returns Il nome del livello
 */
export function getPermissionLevelName(level: number): string {
  // Livello 0 è riservato ai bot owners
  if (level === 0) {
    return 'Bot Owner';
  }
  
  const permissionLevel = Object.values(PERMISSION_LEVELS).find(p => p.level === level);
  return permissionLevel?.name || 'Sconosciuto';
}

/**
 * Verifica se un utente è proprietario del bot
 * @param userId - ID dell'utente
 * @returns true se l'utente è il proprietario
 */
export function isBotOwner(userId: string): boolean {
  return BOT_OWNERS.includes(userId);
}
