import * as dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Variabili d'ambiente Discord mancanti: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

export const discordConfig = {
  DISCORD_TOKEN: process.env['DISCORD_TOKEN']!,
  DISCORD_CLIENT_ID: process.env['DISCORD_CLIENT_ID']!,
  DEFAULT_GUILD_ID: process.env['DEFAULT_GUILD_ID'],
};
