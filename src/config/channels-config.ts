import { discordConfig } from './discord-config';

export interface ChannelConfig {
  id: string;
  name: string;
  description?: string;
}

export interface GuildChannels {
  [guildId: string]: {
    [channelKey: string]: ChannelConfig;
  };
}

// Tipi di canali del bot
export const CHANNEL_TYPES = {
  ERROR_LOGS: 'errorLogs',
  BOT_LOGS: 'botLogs',
} as const;

export const channelsConfig: GuildChannels = {
  [discordConfig.DEFAULT_GUILD_ID ?? '']: {
    [CHANNEL_TYPES.ERROR_LOGS]: {
      id: 'YOUR_ERROR_LOGS_CHANNEL_ID',
      name: 'error-logs',
      description: 'Canale per i log degli errori del bot'
    },
    [CHANNEL_TYPES.BOT_LOGS]: {
      id: 'YOUR_BOT_LOGS_CHANNEL_ID',
      name: 'bot-logs',
      description: 'Canale per i log generali del bot'
    },
  }
};

// Funzione helper per ottenere un canale specifico
export function getChannelId(channelType: string, guildId?: string): string | null {
  const guild = guildId || discordConfig.DEFAULT_GUILD_ID;
  if (!guild || !channelsConfig[guild] || !channelsConfig[guild][channelType]) {
    return null;
  }
  return channelsConfig[guild][channelType].id;
}

// Funzione helper per ottenere la configurazione completa di un canale
export function getChannelConfig(channelType: string, guildId?: string): ChannelConfig | null {
  const guild = guildId || discordConfig.DEFAULT_GUILD_ID;
  if (!guild || !channelsConfig[guild] || !channelsConfig[guild][channelType]) {
    return null;
  }
  return channelsConfig[guild][channelType];
}

// Funzione helper per verificare se tutti i canali obbligatori sono configurati
export function validateChannelsConfig(guildId?: string): boolean {
  const guild = guildId || discordConfig.DEFAULT_GUILD_ID;
  if (!guild || !channelsConfig[guild]) {
    return false;
  }
  
  // Per ora solo BOT_LOGS è obbligatorio (già configurato)
  const requiredChannels = [CHANNEL_TYPES.BOT_LOGS];
  
  return requiredChannels.every(channelType => {
    const guildConfig = channelsConfig[guild];
    const channel = guildConfig?.[channelType];
    return channel && channel.id && channel.id.trim() !== '';
  });
}

// Funzione helper per ottenere tutti i canali configurati
export function getAllChannels(guildId?: string): Record<string, ChannelConfig> {
  const guild = guildId || discordConfig.DEFAULT_GUILD_ID;
  if (!guild || !channelsConfig[guild]) {
    return {};
  }
  return channelsConfig[guild];
}
