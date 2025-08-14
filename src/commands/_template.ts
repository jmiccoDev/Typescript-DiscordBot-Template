import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import type { Command } from '../types/command';

/**
 * Template per creare nuovi comandi slash
 *
 * ISTRUZIONI:
 * 1. Copia questo file nella cartella appropriata (fun/, admin/, etc.)
 * 2. Rinomina il file con il nome del comando
 * 3. Modifica la proprietà 'data' con le informazioni del comando
 * 4. Implementa la logica nell'execute function
 * 5. Opzionalmente, imposta cooldown, requiredLevel, isGlobal e guild
 *
 * OPZIONI COMUNI PER SLASH COMMANDS:
 * - addStringOption(): per input di testo
 * - addIntegerOption(): per numeri interi
 * - addBooleanOption(): per true/false
 * - addUserOption(): per selezionare un utente
 * - addChannelOption(): per selezionare un canale
 * - addRoleOption(): per selezionare un ruolo
 *
 * LIVELLI DI PERMESSO:
 * - 0: Bot Owner (esclusivamente proprietari del bot)
 * - 1: User (default)
 * - 2: Moderator
 * - 3: Administrator
 * - 4: Owner
 * 
 * NOTA: Se requiredLevel non è definito, QUALSIASI UTENTE può eseguire il comando senza controlli sui ruoli
 *
 * SCOPE DEI COMANDI:
 * - isGlobal: true = comando globale (disponibile ovunque)
 * - isGlobal: false/undefined + guild: "GUILD_ID" = comando specifico per quella guild
 * - isGlobal: false/undefined + guild: undefined = usa DEFAULT_GUILD_ID dal config
 */

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('template') // Nome del comando (solo lettere minuscole, numeri e trattini)
    .setDescription('Comando template di esempio') // Descrizione del comando
    .addStringOption(
      option =>
        option.setName('esempio').setDescription('Un parametro di esempio').setRequired(false) // true se il parametro è obbligatorio
    ),

  // Cooldown in secondi (opzionale)
  cooldown: 5,

  // Livello di permesso richiesto (opzionale)
  // Se non definito, QUALSIASI UTENTE può eseguire il comando senza controlli sui ruoli
  // requiredLevel: 1,

  // Scope del comando (opzionale)
  isGlobal: true, // true per comando globale, false per guild-specific
  // guild: "123456789012345678", // ID della guild specifica (se non globale)

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Ottieni i parametri del comando
    const esempioParam = interaction.options.getString('esempio');

    // Esempio di embed di risposta
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle('🔧 Comando Template')
      .setDescription('Questo è un comando template di esempio!')
      .addFields(
        { name: 'Parametro ricevuto', value: esempioParam || 'Nessuno', inline: true },
        { name: 'Utente', value: interaction.user.tag, inline: true },
        { name: 'Scope', value: command.isGlobal ? 'Globale' : 'Guild-specific', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Template Bot', iconURL: interaction.client.user?.displayAvatarURL() });

    // Invia la risposta
    await interaction.reply({ embeds: [embed] });

    // Esempi di altri tipi di risposta:

    // Risposta semplice
    // await interaction.reply('Messaggio semplice');

    // Risposta ephemeral (visibile solo all'utente)
    // await interaction.reply({ content: 'Messaggio privato', ephemeral: true });

    // Risposta differita (per operazioni lunghe)
    // await interaction.deferReply();
    // // ... operazioni lunghe ...
    // await interaction.editReply('Operazione completata!');
  },
};

export default command;
