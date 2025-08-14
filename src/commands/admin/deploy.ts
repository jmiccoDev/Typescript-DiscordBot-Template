import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  MessageFlags,
} from 'discord.js';
import { redeployCommandsForGuild, redeployCommandsForAllGuilds } from '../../handlers/guildCommandManager';
import type { Command } from '../../types/command';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('admin-deploy')
    .setDescription('Comandi di amministrazione per il deploy dei comandi')
    .addSubcommand(subcommand =>
      subcommand
        .setName('this-guild')
        .setDescription('Re-deploya i comandi per questo server')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('all-guilds')
        .setDescription('Re-deploya i comandi per tutti i server')
    ),
  cooldown: 30,
  requiredLevel: 0,
  isGlobal: true,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      if (subcommand === 'this-guild') {
        if (!interaction.guildId) {
          const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('❌ Errore')
            .setDescription('Questo comando può essere eseguito solo in un server.');

          await interaction.editReply({ embeds: [embed] });
          return;
        }

        await redeployCommandsForGuild(interaction.client, interaction.guildId);

        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('✅ Deploy completato')
          .setDescription(`I comandi sono stati re-deployati con successo per questo server.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

      } else if (subcommand === 'all-guilds') {
        await redeployCommandsForAllGuilds(interaction.client);

        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('✅ Deploy globale completato')
          .setDescription(`I comandi sono stati re-deployati con successo per tutti i ${interaction.client.guilds.cache.size} server.`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('❌ Errore durante il re-deploy:', error);

      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('❌ Errore durante il deploy')
        .setDescription('Si è verificato un errore durante il re-deploy dei comandi.')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};

export default command;
