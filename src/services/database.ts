/**
 * Naples Italy Community Database Module
 * Author: jmiccoDev
 * Date: 2025-07-23
 * 
 * Complete module for MySQL database management with mysql2
 * Supports connection pools, transactions and optimized CRUD operations
 */

import chalk from 'chalk';
import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader, PoolOptions } from 'mysql2/promise';
import { databaseConfig } from '../config/database-config';

// Types for database tables
export interface User {
    id: number;
    discord_id: string;
    username: string;
    is_admin: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface BaseRequest {
    id: number;
    type: 'appello' | 'segnalazione' | 'cittadinanza';
    status: 'attesa_revisione' | 'accettato' | 'rifiutato';
    requester_id: number;
    reviewer_id?: number;
    admin_notes?: string;
    cache_message_id?: string;
    created_at: Date;
    reviewed_at?: Date;
}

export interface Appelli {
    type: 'appello';
    request_id: number;
    sanction_description: string;
    appeal_description: string;
    media_links?: any;
}

export interface Segnalazioni {
    type: 'segnalazione';
    request_id: number;
    reported_usernames: any;
    incident_description: string;
    evidence_links?: any;
}

export interface Cittadinanza {
    type: 'cittadinanza';
    request_id: number;
    additional_notes?: string;
}

// Database configuration
export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
    acquireTimeout?: number;
    timeout?: number;
    reconnect?: boolean;
    charset?: string;
}

// Type for query results
export type QueryResult<T = any> = T extends RowDataPacket ? T[] : T;

// Main Database Manager class
export class DatabaseManager {
    private pool: Pool;
    private config: DatabaseConfig;

    constructor(config: DatabaseConfig) {
        this.config = {
            connectionLimit: 10,
            reconnect: true,
            charset: 'utf8mb4',
            ...config
        };

        // Configurazione del pool di connessioni
        const poolConfig: PoolOptions = {
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            connectionLimit: this.config.connectionLimit || 10,
            charset: this.config.charset || 'utf8mb4',
            // Configurazioni aggiuntive per ottimizzazione
            multipleStatements: false,
            namedPlaceholders: true,
            dateStrings: false,
            supportBigNumbers: true,
            bigNumberStrings: false,
            // Pool event handlers
            typeCast: function(field: any, next: () => any) {
                if (field.type === 'TINY' && field.length === 1) {
                    return (field.string() === '1'); // Convert TINYINT(1) to boolean
                }
                return next();
            }
        };

        this.pool = mysql.createPool(poolConfig);

        // Event listeners per monitoring del pool
        this.pool.on('connection', (connection) => {
            console.log(chalk.blue(`[DATABASE] CONNECTED 🔗 New connection: ${connection.threadId}`));
        });
    }

    /**
     * Testa la connessione al database
     */
    async testConnection(): Promise<boolean> {
        let connection: PoolConnection | undefined;
        
        try {
            console.log(chalk.blue('[DATABASE] TESTING 🔍 Connection in progress...'));
            connection = await this.pool.getConnection();
            
            await connection.execute('SELECT 1 as test');
            console.log(chalk.green('[DATABASE] SUCCESS ✅ Connection test successful'));
            return true;
        } catch (error) {
            console.error(chalk.red('[DATABASE] ERROR ❌ Connection test failed:'), error);
            return false;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Esegue una query SELECT generica con parametri
     */
    async query<T extends RowDataPacket>(
        sql: string, 
        params: any[] = []
    ): Promise<T[]> {
        let connection: PoolConnection | undefined;
        
        try {
            connection = await this.pool.getConnection();
            
            const startTime = Date.now();
            const [rows] = await connection.execute<T[]>(sql, params);
            const endTime = Date.now();
            
            console.log(`[DATABASE] Query executed in ${endTime - startTime}ms`);
            
            return rows;
        } catch (error) {
            console.error('[DATABASE] Error during query execution:', error);
            throw this.handleDatabaseError(error);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Esegue una query di modifica (INSERT, UPDATE, DELETE)
     */
    async execute(
        sql: string, 
        params: any[] = []
    ): Promise<ResultSetHeader> {
        let connection: PoolConnection | undefined;
        
        try {
            connection = await this.pool.getConnection();
            
            const startTime = Date.now();
            const [result] = await connection.execute<ResultSetHeader>(sql, params);
            const endTime = Date.now();
            
            console.log(`[DATABASE] Command executed in ${endTime - startTime}ms`);
            
            return result;
        } catch (error) {
            console.error('[DATABASE] Error during command execution:', error);
            throw this.handleDatabaseError(error);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Crea un nuovo record in una tabella
     */
    async create<T>(
        table: string, 
        data: Partial<T>
    ): Promise<{ insertId: number; affectedRows: number }> {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map(() => '?').join(', ');
            
            const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
            
            const result = await this.execute(sql, values);
            
            return {
                insertId: result.insertId,
                affectedRows: result.affectedRows
            };
        } catch (error) {
            console.error(`[DATABASE] Errore durante la creazione del record in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Trova un record per ID
     */
    async findById<T extends RowDataPacket>(
        table: string, 
        id: number | string,
        idField: string = 'id'
    ): Promise<T | null> {
        try {
            const sql = `SELECT * FROM ${table} WHERE ${idField} = ? LIMIT 1`;
            const rows = await this.query<T>(sql, [id]);
            
            return rows.length > 0 ? rows[0] as T : null;
        } catch (error) {
            console.error(`[DATABASE] Errore durante la ricerca per ID in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Trova record con condizioni personalizzate
     */
    async findWhere<T extends RowDataPacket>(
        table: string,
        conditions: Record<string, any>,
        limit?: number,
        orderBy?: string
    ): Promise<T[]> {
        try {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            
            const values = Object.values(conditions);
            
            let sql = `SELECT * FROM ${table}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            if (orderBy) {
                sql += ` ORDER BY ${orderBy}`;
            }
            if (limit) {
                sql += ` LIMIT ${limit}`;
            }
            
            return await this.query<T>(sql, values);
        } catch (error) {
            console.error(`[DATABASE] Errore durante la ricerca condizionale in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Aggiorna un record esistente
     */
    async update<T>(
        table: string,
        id: number | string,
        data: Partial<T>,
        idField: string = 'id'
    ): Promise<{ affectedRows: number; changedRows: number }> {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            
            const sql = `UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`;
            values.push(id);
            
            const result = await this.execute(sql, values);
            
            return {
                affectedRows: result.affectedRows,
                changedRows: result.changedRows || 0
            };
        } catch (error) {
            console.error(`[DATABASE] Errore durante l'aggiornamento del record in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Aggiorna record con condizioni personalizzate
     */
    async updateWhere<T>(
        table: string,
        conditions: Record<string, any>,
        data: Partial<T>
    ): Promise<{ affectedRows: number; changedRows: number }> {
        try {
            const setFields = Object.keys(data);
            const setValues = Object.values(data);
            const setClause = setFields.map(field => `${field} = ?`).join(', ');
            
            const whereFields = Object.keys(conditions);
            const whereValues = Object.values(conditions);
            const whereClause = whereFields.map(field => `${field} = ?`).join(' AND ');
            
            const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
            const allValues = [...setValues, ...whereValues];
            
            const result = await this.execute(sql, allValues);
            
            return {
                affectedRows: result.affectedRows,
                changedRows: result.changedRows || 0
            };
        } catch (error) {
            console.error(`[DATABASE] Errore durante l'aggiornamento condizionale in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Elimina un record per ID
     */
    async delete(
        table: string, 
        id: number | string,
        idField: string = 'id'
    ): Promise<{ affectedRows: number }> {
        try {
            const sql = `DELETE FROM ${table} WHERE ${idField} = ?`;
            const result = await this.execute(sql, [id]);
            
            return { affectedRows: result.affectedRows };
        } catch (error) {
            console.error(`[DATABASE] Errore durante l'eliminazione del record in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Elimina record con condizioni personalizzate
     */
    async deleteWhere(
        table: string,
        conditions: Record<string, any>
    ): Promise<{ affectedRows: number }> {
        try {
            const whereClause = Object.keys(conditions)
                .map(key => `${key} = ?`)
                .join(' AND ');
            
            const values = Object.values(conditions);
            
            const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
            const result = await this.execute(sql, values);
            
            return { affectedRows: result.affectedRows };
        } catch (error) {
            console.error(`[DATABASE] Errore durante l'eliminazione condizionale in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Conta i record in una tabella
     */
    async count(
        table: string,
        conditions?: Record<string, any>
    ): Promise<number> {
        try {
            let sql = `SELECT COUNT(*) as count FROM ${table}`;
            let values: any[] = [];
            
            if (conditions && Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                sql += ` WHERE ${whereClause}`;
                values = Object.values(conditions);
            }
            
            const rows = await this.query<RowDataPacket & { count: number }>(sql, values);
            return rows[0]?.count || 0;
        } catch (error) {
            console.error(`[DATABASE] Errore durante il conteggio in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Esegue una transazione
     */
    async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
        let connection: PoolConnection | undefined;
        
        try {
            connection = await this.pool.getConnection();
            await connection.beginTransaction();
            
            const result = await callback(connection);
            
            await connection.commit();
            return result;
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('[DATABASE] Errore durante la transazione:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Verifica se un record exists
     */
    async exists(
        table: string,
        conditions: Record<string, any>
    ): Promise<boolean> {
        try {
            const count = await this.count(table, conditions);
            return count > 0;
        } catch (error) {
            console.error(`[DATABASE] Errore durante la verifica esistenza in ${table}:`, error);
            throw error;
        }
    }

    /**
     * Gestione degli errori del database
     */
    private handleDatabaseError(error: any): Error {
        if (error.code) {
            switch (error.code) {
                case 'ER_DUP_ENTRY':
                    return new Error(`Duplicato: Un record con questi dati esiste già`);
                case 'ER_NO_REFERENCED_ROW_2':
                    return new Error(`Riferimento non valido: Il record referenziato non esiste`);
                case 'ER_ROW_IS_REFERENCED_2':
                    return new Error(`Impossibile eliminare: Il record è referenziato da altri dati`);
                case 'ER_BAD_FIELD_ERROR':
                    return new Error(`Campo non valido nella query`);
                case 'ER_PARSE_ERROR':
                    return new Error(`Errore di sintassi nella query SQL`);
                case 'ER_ACCESS_DENIED_ERROR':
                    return new Error(`Accesso negato al database`);
                case 'ECONNREFUSED':
                    return new Error(`Impossibile connettersi al database`);
                case 'PROTOCOL_CONNECTION_LOST':
                    return new Error(`Connessione al database persa`);
                default:
                    return new Error(`Errore database: ${error.message}`);
            }
        }
        
        return error instanceof Error ? error : new Error('Errore sconosciuto del database');
    }

    /**
     * Chiude tutte le connessioni del pool
     */
    async close(): Promise<void> {
        try {
            await this.pool.end();
            console.log('[DATABASE] Connection pool closed');
        } catch (error) {
            console.error('[DATABASE] Errore durante la chiusura del pool:', error);
            throw error;
        }
    }

    /**
     * Ottieni statistiche del pool di connessioni
     */
    getPoolStats() {
        return {
            totalConnections: this.config.connectionLimit || 10,
            activeConnections: 'N/A - Privato in mysql2',
            status: 'Attivo'
        };
    }
}

// Singleton instance per l'applicazione
let dbInstance: DatabaseManager | null = null;

/**
 * Valida la configurazione del database
 */
function validateDatabaseConfig(config: DatabaseConfig): boolean {
    const required = ['host', 'port', 'user', 'database'];
    
    for (const field of required) {
        if (!config[field as keyof DatabaseConfig]) {
            throw new Error(`[DATABASE] Campo richiesto mancante: ${field}`);
        }
    }
    
    if (config.port < 1 || config.port > 65535) {
        throw new Error('[DATABASE] Porta non valida (deve essere tra 1 e 65535)');
    }
    
    if ((config.connectionLimit || 0) < 1) {
        throw new Error('[DATABASE] connectionLimit deve essere almeno 1');
    }
    
    console.log(chalk.green('[DATABASE] VALIDATED ✅ Configuration validated successfully'));
    return true;
}

/**
 * Inizializza il database manager con la configurazione dal config.ts
 */
export async function initializeDatabase(config?: DatabaseConfig): Promise<DatabaseManager> {
    if (dbInstance) {
        console.warn(chalk.yellow('[DATABASE] WARNING ⚠️  Database già inizializzato'));
        return dbInstance;
    }
    
    // Usa la configurazione dal config.ts se non specificata
    const dbConfig = config || databaseConfig;
    
    // Valida la configurazione
    validateDatabaseConfig(dbConfig);
    
    dbInstance = new DatabaseManager(dbConfig);
    
    // Testa la connessione
    const connectionTest = await dbInstance.testConnection();
    if (!connectionTest) {
        throw new Error('[DATABASE] Impossibile stabilire una connessione al database durante l\'inizializzazione');
    }
    
    console.log(chalk.green('[DATABASE] INITIALIZED ✅ Database manager initialized successfully'));
    return dbInstance;
}

/**
 * Inizializzazione automatica del database
 * Utilizza automaticamente la configurazione dal config.ts
 */
export async function initializeDatabaseFromConfig(): Promise<DatabaseManager> {
    return await initializeDatabase(databaseConfig);
}

/**
 * Ottieni l'istanza del database
 */
export function getDatabase(): DatabaseManager {
    if (!dbInstance) {
        throw new Error('Database non inizializzato. Chiamare initializeDatabase() prima.');
    }
    return dbInstance;
}

/**
 * Chiudi il database
 */
export async function closeDatabase(): Promise<void> {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
}

// Export di tutti i tipi e la classe principale
export default DatabaseManager;