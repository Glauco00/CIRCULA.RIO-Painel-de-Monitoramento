const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sensores.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    
    // Criar a tabela se não existir
    db.run(`
      CREATE TABLE IF NOT EXISTS medicoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        gateway_id TEXT,
        temperatura REAL,
        umidade REAL,
        distancia REAL,
        nivel_calculado TEXT,
        bateria REAL,
        rssi REAL,
        snr REAL,
        data DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err.message);
      } else {
        const columns = [
          ['device_id', 'TEXT'],
          ['gateway_id', 'TEXT'],
          ['bateria', 'REAL'],
          ['rssi', 'REAL'],
          ['snr', 'REAL']
        ];

        columns.forEach(([name, type]) => {
          db.run(`ALTER TABLE medicoes ADD COLUMN ${name} ${type}`, (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
              console.error(`Erro ao atualizar coluna ${name}:`, alterErr.message);
            }
          });
        });
        console.log('Tabela de medições pronta para dados do ESP.');
      }
    });
  }
});

module.exports = db;
