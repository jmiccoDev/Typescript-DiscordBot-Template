import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
  MessageFlags,
} from 'discord.js';
import type { Command } from '../../types/command';
import { exec } from 'child_process';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Spegne il bot in modo sicuro (Solo Owner)')
    .addStringOption(option =>
      option
        .setName('conferma')
        .setDescription('Scrivi "CONFERMA" per procedere con lo spegnimento')
        .setRequired(true)
    ),
  cooldown: 60, // 1 minuto di cooldown per evitare spegnimenti accidentali
  requiredLevel: 0, // Solo Bot Owners
  isGlobal: true,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const conferma = interaction.options.getString('conferma', true);

    // Verifica che la conferma sia corretta
    if (conferma !== 'CONFERMA') {
      const embed = new EmbedBuilder()
        .setColor(Colors.Orange)
        .setTitle('⚠️ Conferma richiesta')
        .setDescription(
          'Per spegnere il bot, devi scrivere **CONFERMA** nel campo di conferma.\n\n' +
          '⚠️ **Attenzione**: Questa azione spegnerà completamente il bot.'
        )
        .setFooter({ text: 'Assicurati di voler procedere prima di confermare.' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    // Prima rispondi all'interazione
    const shutdownEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('🔴 Spegnimento del bot')
      .setDescription(
        '**Il bot si sta spegnendo...**\n\n' +
        `• Richiesto da: ${interaction.user.tag}\n` +
        `• Server: ${interaction.guild?.name || 'N/A'}\n` +
        `• Orario: <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
        '🔧 **Stopping PM2 process...**'
      )
      .setFooter({ text: 'Il processo PM2 verrà fermato tra pochi secondi.' })
      .setTimestamp();

    await interaction.reply({ embeds: [shutdownEmbed] });

    // Log dello spegnimento
    console.log('🔴 SPEGNIMENTO DEL BOT RICHIESTO');
    console.log(`   Richiesto da: ${interaction.user.tag} (${interaction.user.id})`);
    console.log(`   Server: ${interaction.guild?.name || 'DM'} (${interaction.guildId || 'N/A'})`);
    console.log(`   Orario: ${new Date().toISOString()}`);

    // Spegni il bot dopo un breve delay per permettere l'invio della risposta
    setTimeout(() => {
      console.log('🔴 SPEGNIMENTO DEL BOT IN CORSO...');
      
      try {
        if (interaction.client.user) {
          console.log(`📴 ${interaction.client.user.tag} si sta spegnendo...`);
        }
      } catch (error) {
        console.error('Errore nel logging finale:', error);
      }

      // Determina il nome del processo PM2
      const processName = 'naplesBot-v3';
      
      console.log(`🔧 Tentativo di stop del processo PM2: ${processName}`);
      
      // Stoppa il processo PM2
      exec(`pm2 stop ${processName}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Errore PM2 stop: ${error.message}`);
          // Fallback: spegnimento normale
          console.log('🔄 Fallback: spegnimento processo normale');
          try {
            interaction.client.destroy();
            console.log('✅ Client Discord distrutto con successo');
          } catch (destroyError) {
            console.error('❌ Errore nella distruzione del client:', destroyError);
          }
          process.exit(0);
          return;
        }
        
        if (stderr) {
          console.warn(`⚠️ PM2 stderr: ${stderr}`);
        }
        
        console.log(`✅ PM2 stdout: ${stdout}`);
        console.log('✅ Processo PM2 fermato con successo');
        console.log('📴 Il bot è ora spento e non si riavvierà automaticamente');
        
        // Distruggi il client Discord prima dello stop definitivo
        try {
          interaction.client.destroy();
          console.log('✅ Client Discord distrutto con successo');
        } catch (destroyError) {
          console.error('❌ Errore nella distruzione del client:', destroyError);
        }
        
        // Exit finale (dovrebbe essere intercettato da PM2 che ha già ricevuto lo stop)
        process.exit(0);
      });
    }, 3000); // 3 secondi di delay
  },
};

export default command;