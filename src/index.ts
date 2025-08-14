import chalk from 'chalk';
import {
  Client,
  GatewayIntentBits,
  Collection,
} from 'discord.js';
import { discordConfig } from './config/discord-config';
import { loadEvents } from './handlers/eventHandler';
import { loadCommands, deployCommands } from './handlers/commandHandler';
import { initializeDatabaseFromConfig } from './services/database'
import type { Command } from './types/command';

// Estendi il tipo Client per includere la collection dei comandi
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}

// Simple logger helper for nicer, more visible console output
const timestamp = (): string => chalk.gray(`[${new Date().toLocaleTimeString()}]`);

const logger = {
  info: (...args: any[]) =>
    console.log(`${timestamp()} ${chalk.cyan.bold('INFO')} ${chalk.cyan('•')}`, ...args),
  success: (...args: any[]) =>
    console.log(`${timestamp()} ${chalk.green.bold('SUCCESS')} ${chalk.green('✓')}`, ...args),
  warn: (...args: any[]) =>
    console.warn(`${timestamp()} ${chalk.yellow.bold('WARN')} ${chalk.yellow('!')}`, ...args),
  error: (...args: any[]) =>
    console.error(`${timestamp()} ${chalk.red.bold('ERROR')} ${chalk.red('✖')}`, ...args),
  banner: (title: string) =>
    console.log(
      `\n${chalk.bgBlue.white.bold('  ' + title + '  ')}\n${chalk.gray('='.repeat(40))}`
    ),
};

class DiscordBot {
  private client: Client;

  constructor() {
    // Inizializza il client con gli intent necessari
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
      ],
    });

    // Inizializza le collections
    this.client.commands = new Collection();
    this.client.cooldowns = new Collection();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      logger.banner('Discord Bot - Avvio');
      logger.info(chalk.cyan('🚀 Inizializzazione del bot...'));

      // Carica i comandi
      await loadCommands(this.client);
      logger.success('✅ Comandi caricati con successo');

      // Carica gli eventi
      await loadEvents(this.client);
      logger.success('✅ Eventi caricati con successo');

      // Inizializza il database
      await initializeDatabaseFromConfig();
      logger.success('✅ Database inizializzato con successo');

      // Login del bot
      await this.client.login(discordConfig.DISCORD_TOKEN);
      logger.success('✅ Bot loggato con successo');

      // Deploy dei comandi slash dopo il login
      await deployCommands(this.client);
      logger.success('✅ Comandi slash deployati con successo');

      logger.info(chalk.green('Il bot è pronto e in esecuzione.'));
    } catch (error) {
      logger.error('❌ Errore durante l\'inizializzazione:', error);
      process.exit(1);
    }
  }

  // Gestione graceful shutdown
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string): Promise<void> => {
      logger.warn(`\n📴 Ricevuto segnale ${signal}. Spegnimento del bot...`);

      try {
        this.client.destroy();
        logger.success('✅ Bot spento correttamente');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Errore durante lo spegnimento:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  public start(): void {
    this.setupGracefulShutdown();
  }
}

// Avvia il bot
const bot = new DiscordBot();
bot.start();

// Gestione errori non catturati
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', error => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
