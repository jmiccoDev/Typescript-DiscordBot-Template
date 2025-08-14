import { Events, type Interaction, EmbedBuilder, Colors, MessageFlags } from 'discord.js';
import { getUserPermissionLevel, getPermissionLevelName, hasPermissionLevel } from '../../tools/permissions';
import { handleCooldown } from '../../tools/cooldown';
import { handleCommandError } from '../../tools/errorHandler';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`❌ Comando ${interaction.commandName} non trovato`);

      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('❌ Comando non trovato')
        .setDescription(`Il comando \`/${interaction.commandName}\` non è stato trovato.`)
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      // Verifica dei permessi
      // Se requiredLevel non è definito, qualsiasi utente può eseguire il comando senza controlli sui ruoli
      if (command.requiredLevel !== undefined) {
        const hasPermission = await hasPermissionLevel(
          interaction.user.id,
          interaction.guildId,
          command.requiredLevel,
          interaction.client
        );

        if (!hasPermission) {
          // Ottieni il livello dell'utente solo per mostrarlo nell'errore
          const userLevel = await getUserPermissionLevel(
            interaction.user.id,
            interaction.guildId,
            interaction.client
          );

          const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('❌ Permessi insufficienti')
            .setDescription('Non hai i permessi necessari per utilizzare questo comando.')
            .addFields(
              {
                name: 'Livello richiesto',
                value: getPermissionLevelName(command.requiredLevel),
                inline: true,
              },
              { name: 'Il tuo livello', value: getPermissionLevelName(userLevel), inline: true }
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral});
          return;
        }
      }
      // Se arriviamo qui, l'utente ha i permessi necessari o il comando non richiede permessi specifici

      // Gestione cooldown
      if (command.cooldown) {
        const cooldownResult = handleCooldown(
          interaction.user.id,
          interaction.commandName,
          command.cooldown
        );

        if (!cooldownResult.canExecute) {
          const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setTitle('⏰ Cooldown attivo')
            .setDescription(
              `Devi aspettare ancora ${cooldownResult.timeLeft?.toFixed(1)} secondi prima di utilizzare questo comando.`
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          return;
        }
      }

      // Esegui il comando
      await command.execute(interaction);

      // Log del comando eseguito
      console.log(
        `📝 Comando /${interaction.commandName} eseguito da ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`
      );
    } catch (error) {
      console.error(`❌ Errore nell'esecuzione del comando ${interaction.commandName}:`, error);

      // Invia messaggio di errore all'utente
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Errore nell'esecuzione")
        .setDescription("Si è verificato un errore durante l'esecuzione del comando.")
        .setTimestamp();

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({embeds: [errorEmbed]});
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
      } catch (replyError) {
        console.error("❌ Errore nell'invio della risposta di errore:", replyError);
      }

      // Log dell'errore dettagliato nel canale
      await handleCommandError(
        interaction.client,
        error,
        interaction.commandName,
        interaction.user.id,
        interaction.guildId,
        interaction.guild?.name
      );
    }
  },
};
