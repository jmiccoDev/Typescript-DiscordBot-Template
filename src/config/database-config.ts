import * as dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  charset?: string;
}

const requiredDbEnvVars = [
  'DATABASE_HOST',
  'DATABASE_PORT', 
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME'
];

const missingDbEnvVars = requiredDbEnvVars.filter(envVar => !process.env[envVar]);

if (missingDbEnvVars.length > 0) {
  console.error(`❌ Variabili d'ambiente Database mancanti: ${missingDbEnvVars.join(', ')}`);
  process.exit(1);
}

export const databaseConfig: DatabaseConfig = {
  host: process.env['DATABASE_HOST']!,
  port: parseInt(process.env['DATABASE_PORT']!),
  user: process.env['DATABASE_USER']!,
  password: process.env['DATABASE_PASSWORD']!,
  database: process.env['DATABASE_NAME']!,
  connectionLimit: 10,
  charset: 'utf8mb4'
};
