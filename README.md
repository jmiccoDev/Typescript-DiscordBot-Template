# Discord Bot Template

Un template professionale per Discord Bot con TypeScript, discord.js v14+ e supporto completo per database MySQL.

## 🚀 Caratteristiche

- **TypeScript**: Sviluppo type-safe con supporto completo per discord.js v14+
- **Database MySQL**: Sistema completo per gestione database con pool di connessioni
- **Sistema di Permessi**: Gestione ruoli e permessi per livelli utente
- **Logging Avanzato**: Sistema di log dettagliato per interazioni ed errori
- **Configurazione Modulare**: File di configurazione separati per Discord, database e canali
- **Comandi Slash**: Supporto completo per slash commands con cooldown e validazione
- **Error Handling**: Gestione robusta degli errori con logging automatico
- **Hot Reload**: Sviluppo rapido con nodemon
- **Linting & Formatting**: ESLint e Prettier preconfigurati

## 📋 Prerequisiti

- **Node.js** >= 18.0.0
- **MySQL** >= 8.0 (o MariaDB compatibile)
- **Discord Bot Token** e **Client ID**

## 🛠️ Setup Rapido

### 1. Clona o scarica il template

```bash
git clone https://github.com/tuousername/discord-bot-template.git
cd discord-bot-template
```

### 2. Installa le dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
```

Modifica il file `.env` con i tuoi dati:

```env
# Discord Configuration
DISCORD_TOKEN=Il_Tuo_Bot_Token_Qui
DISCORD_CLIENT_ID=Il_Tuo_Client_ID_Qui
DEFAULT_GUILD_ID=ID_Del_Tuo_Server_Discord

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=nome_database
DATABASE_USER=username_database
DATABASE_PASSWORD=password_database
```

### 4. Configura i canali Discord

Modifica il file `src/config/channels-config.ts`:

```typescript
export const channelsConfig: GuildChannels = {
  [discordConfig.DEFAULT_GUILD_ID ?? '']: {
    [CHANNEL_TYPES.ERROR_LOGS]: {
      id: 'ID_CANALE_ERROR_LOGS',
      name: 'error-logs',
      description: 'Canale per i log degli errori del bot'
    },
    [CHANNEL_TYPES.BOT_LOGS]: {
      id: 'ID_CANALE_BOT_LOGS',
      name: 'bot-logs',
      description: 'Canale per i log generali del bot'
    },
  }
};
```

### 5. Configura i ruoli e permessi

Modifica il file `src/config/roles-config.ts`:

```typescript
export const permissions: Permissions = {
  [discordConfig.DEFAULT_GUILD_ID ?? '']: {
    4: ['ID_RUOLO_OWNER'],
    3: ['ID_RUOLO_ADMIN_1', 'ID_RUOLO_ADMIN_2'],
    2: ['ID_RUOLO_MODERATORE'],
    1: ['ID_RUOLO_UTENTE'],
  }
};

export const BOT_OWNERS = ['TUO_USER_ID_1', 'TUO_USER_ID_2'];
```

### 6. Configura il database

Crea un database MySQL e importa lo schema:

```sql
-- Esempio di tabella utenti
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 7. Avvia il bot

Per sviluppo (con hot reload):
```bash
npm run dev
```

Per produzione:
```bash
npm run build
npm start
```

## 📁 Struttura del Progetto

```
src/
├── commands/          # Comandi slash del bot
│   ├── admin/         # Comandi amministrativi
│   └── user/          # Comandi utente
├── config/            # File di configurazione
│   ├── channels-config.ts
│   ├── database-config.ts
│   ├── discord-config.ts
│   └── roles-config.ts
├── events/            # Eventi Discord
│   └── main/
├── handlers/          # Gestori per comandi ed eventi
├── services/          # Servizi (database, ecc.)
├── tools/             # Utility e helper
├── types/             # Definizioni TypeScript
└── index.ts           # Entry point
```

## 🔧 Comandi Disponibili

### Comandi Utente
- `/ping` - Mostra la latenza del bot
- `/info` - Informazioni del server Discord
- `/whois <user>` - Informazioni di un utente Discord

### Comandi Admin
- `/admin-deploy` - Re-deploy dei comandi slash
- `/shutdown` - Spegnimento sicuro del bot

## 🛡️ Sistema di Permessi

Il template include un sistema di permessi a 4 livelli:

- **Livello 1**: Utenti normali
- **Livello 2**: Moderatori
- **Livello 3**: Amministratori
- **Livello 4**: Proprietari

I comandi possono specificare il livello richiesto con `requiredLevel`.

## 💾 Database

Il template include un sistema completo per MySQL con:

- **Pool di connessioni** ottimizzato
- **Query builder** semplificato
- **Gestione transazioni**
- **Error handling** robusto
- **Operazioni CRUD** predefinite

Esempio di utilizzo:

```typescript
import { getDatabase } from '../services/database';

const db = getDatabase();

// Trova un utente
const user = await db.findById('users', userId, 'discord_id');

// Crea un nuovo record
await db.create('users', {
    discord_id: '123456789',
    username: 'Username',
    is_admin: false
});
```

## 🔍 Logging

Il bot include logging automatico per:

- **Interazioni**: Tutte le interazioni vengono loggate nel canale configurato
- **Errori**: Gli errori vengono automaticamente inviati al canale error-logs
- **Console**: Output colorato e strutturato nella console

## ⚙️ Scripts NPM

```bash
npm run dev         # Sviluppo con hot reload
npm run build       # Build per produzione
npm start           # Avvia da build
npm run lint        # Controlla codice con ESLint
npm run lint:fix    # Correggi automaticamente errori ESLint
npm run format      # Formatta codice con Prettier
```

## 🚀 Deploy

### PM2 (Raccomandato)

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "discord-bot"
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## 🔧 Personalizzazione

### Aggiungere un nuovo comando

1. Crea un file in `src/commands/categoria/nome-comando.ts`
2. Usa il template in `src/commands/_template.ts`
3. Il comando verrà caricato automaticamente

### Aggiungere un nuovo evento

1. Crea un file in `src/events/categoria/nome-evento.ts`
2. Usa il template in `src/events/_template.ts`
3. L'evento verrà registrato automaticamente

## 📝 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📞 Supporto

Per supporto, apri una [Issue](https://github.com/tuousername/discord-bot-template/issues) su GitHub.

---

**Template creato con ❤️ per la community Discord**
