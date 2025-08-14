import { discordConfig } from './discord-config';

export interface PermissionLevel {
  level: number;
  name: string;
}

export interface Permissions {
  [guildId: string]: {
    [permissionLevel: number]: string[];
  };
}

export const PERMISSION_LEVELS: Record<string, PermissionLevel> = {
  USER: { level: 1, name: 'User' },
  MODERATOR: { level: 2, name: 'Moderator' },
  ADMIN: { level: 3, name: 'Administrator' },
  OWNER: { level: 4, name: 'Owner' },
};

export const permissions: Permissions = {
  [discordConfig.DEFAULT_GUILD_ID ?? '']: {
    4: ['YOUR_OWNER_ROLE_ID'],
    3: ['YOUR_ADMIN_ROLE_ID_1', 'YOUR_ADMIN_ROLE_ID_2'],
    2: ['YOUR_MODERATOR_ROLE_ID'],
    1: ['YOUR_USER_ROLE_ID'],
  }
};

export const BOT_OWNERS = ['YOUR_BOT_OWNER_ID_1', 'YOUR_BOT_OWNER_ID_2', 'YOUR_BOT_OWNER_ID_3'];
