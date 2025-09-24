import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Prise } from './types';

let db: SQLiteDBConnection | null = null;
const DB_NAME = 'prepy_db';

const initializeWeb = async () => {
    // For web, we simulate the database with localStorage for simplicity.
    console.log("Initializing database for web...");
};

const initializeNative = async () => {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    try {
        const ret = await sqlite.checkConnectionsConsistency();
        const isConn = (await sqlite.isConnection(DB_NAME, false)).result;
        if (ret.result && isConn) {
            db = await sqlite.retrieveConnection(DB_NAME, false);
        } else {
            db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
        }
        await db.open();
        
        const schema = `
            CREATE TABLE IF NOT EXISTS prises (
                id TEXT PRIMARY KEY NOT NULL,
                time TEXT NOT NULL,
                pills INTEGER NOT NULL,
                type TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );
        `;
        await db.execute(schema);
        
        const sessionActive = await db.query("SELECT value FROM settings WHERE key = 'sessionActive'");
        if (!sessionActive.values || sessionActive.values.length === 0) {
            await db.run("INSERT INTO settings (key, value) VALUES ('sessionActive', 'false')");
        }
    } catch (err) {
        console.error("Database initialization error", err);
        throw err;
    }
};

export const initialize = async () => {
    if (Capacitor.isNativePlatform()) {
        await initializeNative();
    } else {
        await initializeWeb();
    }
};

export const getPrises = async (): Promise<Prise[]> => {
    if (Capacitor.isNativePlatform()) {
        if (!db) throw new Error("Database not initialized");
        const res = await db.query('SELECT * FROM prises ORDER BY time ASC');
        return res.values?.map(p => ({ ...p, time: new Date(p.time) })) || [];
    } else {
        const data = localStorage.getItem('prises');
        return data ? JSON.parse(data).map((p: any) => ({ ...p, time: new Date(p.time) })) : [];
    }
};

export const addPrise = async (prise: Prise): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
        if (!db) throw new Error("Database not initialized");
        const { id, time, pills, type } = prise;
        await db.run('INSERT INTO prises (id, time, pills, type) VALUES (?, ?, ?, ?)', [id, time.toISOString(), pills, type]);
    } else {
        const prises = await getPrises();
        prises.push(prise);
        localStorage.setItem('prises', JSON.stringify(prises));
    }
};

export const clearHistory = async (): Promise<void> => {
     if (Capacitor.isNativePlatform()) {
        if (!db) throw new Error("Database not initialized");
        await db.run('DELETE FROM prises');
    } else {
        localStorage.removeItem('prises');
    }
};

export const isSessionActive = async (): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
        if (!db) throw new Error("Database not initialized");
        const res = await db.query("SELECT value FROM settings WHERE key = 'sessionActive'");
        return res.values?.[0]?.value === 'true';
    } else {
        return localStorage.getItem('sessionActive') === 'true';
    }
};

export const setSessionActive = async (isActive: boolean): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
        if (!db) throw new Error("Database not initialized");
        await db.run("UPDATE settings SET value = ? WHERE key = 'sessionActive'", [isActive.toString()]);
    } else {
        localStorage.setItem('sessionActive', isActive.toString());
    }
};
