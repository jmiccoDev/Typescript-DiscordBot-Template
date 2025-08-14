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
      console.error(`❌ Command ${interaction.commandName} not found`);

      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('❌ Command not found')
        .setDescription(`The command \`/${interaction.commandName}\` was not found.`)
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      // Permission check
      // If requiredLevel is not defined, any user can execute the command without role checks
      if (command.requiredLevel !== undefined) {
        const hasPermission = await hasPermissionLevel(
          interaction.user.id,
          interaction.guildId,
          command.requiredLevel,
          interaction.client
        );

        if (!hasPermission) {
          // Get user level only to show it in the error
          const userLevel = await getUserPermissionLevel(
            interaction.user.id,
            interaction.guildId,
            interaction.client
          );

          const embed = new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle('❌ Insufficient permissions')
            .setDescription('You do not have the necessary permissions to use this command.')
            .addFields(
              {
                name: 'Required level',
                value: getPermissionLevelName(command.requiredLevel),
                inline: true,
              },
              { name: 'Your level', value: getPermissionLevelName(userLevel), inline: true }
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral});
          return;
        }
      }
      // If we get here, the user has the necessary permissions or the command doesn't require specific permissions

      // Cooldown handling
      if (command.cooldown) {
        const cooldownResult = handleCooldown(
          interaction.user.id,
          interaction.commandName,
          command.cooldown
        );

        if (!cooldownResult.canExecute) {
          const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setTitle('⏰ Cooldown active')
            .setDescription(
              `You must wait ${cooldownResult.timeLeft?.toFixed(1)} more seconds before using this command.`
            )
            .setTimestamp();

          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          return;
        }
      }

      // Execute the command
      await command.execute(interaction);

      // Log the executed command
      console.log(
        `📝 Command /${interaction.commandName} executed by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`
      );
    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);

      // Send error message to user
      const errorEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Execution error")
        .setDescription("An error occurred while executing the command.")
        .setTimestamp();

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({embeds: [errorEmbed]});
        } else {
          await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
      } catch (replyError) {
        console.error("❌ Error sending error response:", replyError);
      }

      // Detailed error log in the channel
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
