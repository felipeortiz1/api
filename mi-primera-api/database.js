const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function conectarDB() {
    // Abre (o crea) el archivo 'database.db' en la carpeta raíz
    const db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });

    // Crea la tabla si no existe
    await db.exec(`
        CREATE TABLE IF NOT EXISTS tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            completada BOOLEAN DEFAULT 0
        )
    `);
    
    console.log("✅ Base de datos lista y conectada.");
    return db;
}

module.exports = conectarDB;