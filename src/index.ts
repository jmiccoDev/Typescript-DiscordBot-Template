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

// Extend the Client type to include the commands collection
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
    // Initialize the client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
      ],
    });

    // Initialize collections
    this.client.commands = new Collection();
    this.client.cooldowns = new Collection();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      logger.banner('Discord Bot - Starting');
      logger.info(chalk.cyan('🚀 Initializing bot...'));

      // Load commands
      await loadCommands(this.client);
      logger.success('✅ Commands loaded successfully');

      // Load events
      await loadEvents(this.client);
      logger.success('✅ Events loaded successfully');

      // Initialize database
      await initializeDatabaseFromConfig();
      logger.success('✅ Database initialized successfully');

      // Bot login
      await this.client.login(discordConfig.DISCORD_TOKEN);
      logger.success('✅ Bot logged in successfully');

      // Deploy slash commands after login
      await deployCommands(this.client);
      logger.success('✅ Slash commands deployed successfully');

      logger.info(chalk.green('The bot is ready and running.'));
    } catch (error) {
      logger.error('❌ Error during initialization:', error);
      process.exit(1);
    }
  }

  // Handle graceful shutdown
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string): Promise<void> => {
      logger.warn(`\n📴 Received signal ${signal}. Shutting down bot...`);

      try {
        this.client.destroy();
        logger.success('✅ Bot shut down correctly');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
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

// Start the bot
const bot = new DiscordBot();
bot.start();

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', error => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
