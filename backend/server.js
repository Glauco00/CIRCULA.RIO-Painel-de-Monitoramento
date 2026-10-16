const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const ESP_COMMAND_URL = process.env.ESP_COMMAND_URL || 'http://localhost:3002/comando';

app.use(cors());
app.use(express.json());

// Encaminha comandos para o processo que mantém a porta serial do ESP aberta.
app.post('/api/esp/comando', async (req, res) => {
  const command = String(req.body?.comando || '').trim().toUpperCase();

  if (!['A0', 'A1', 'A2'].includes(command)) {
    return res.status(400).json({ error: 'Comando inválido. Use A0, A1 ou A2.' });
  }

  try {
    const response = await fetch(ESP_COMMAND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comando: command })
    });
    const result = await response.json();
    res.status(response.status).json(result);
  } catch (err) {
    res.status(503).json({ error: 'Bridge do ESP não está em execução.' });
  }
});

// Endpoint para o ESP/gateway LoRa enviar dados
app.post('/api/sensores', (req, res) => {
  console.log('JSON recebido do ESP:', req.body);
  const {
    device_id = null,
    gateway_id = null,
    temperatura = null,
    umidade = null,
    distancia_cm,
    distancia: dist,
    nivel,
    nivel_calculado: niv_calc,
    bateria = null,
    rssi = null,
    snr = null
  } = req.body;
  const distancia = distancia_cm !== undefined ? distancia_cm : dist;
  const nivelRecebido = nivel !== undefined ? nivel : niv_calc;
  const nivel_calculado = nivelRecebido === 'Medio' ? 'Media' : nivelRecebido;
  
  if (temperatura === null && umidade === null && distancia === undefined) {
    return res.status(400).json({ error: 'Nenhum dado válido enviado.' });
  }

  const query = `
    INSERT INTO medicoes (device_id, gateway_id, temperatura, umidade, distancia, nivel_calculado, bateria, rssi, snr, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  `;

  db.run(query, [device_id, gateway_id, temperatura, umidade, distancia, nivel_calculado || null, bateria, rssi, snr], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao salvar no banco de dados.' });
    }
    res.status(201).json({ message: 'Dados salvos com sucesso', id: this.lastID });
  });
});

// Endpoint para o frontend consultar o histórico
app.get('/api/sensores', (req, res) => {
  const { start, end } = req.query;
  
  let query = '';
  let params = [];

  if (start && end) {
    // Format from datetime-local (YYYY-MM-DDTHH:MM) to SQLite (YYYY-MM-DD HH:MM:SS)
    const startStr = start.replace('T', ' ') + ':00';
    const endStr = end.replace('T', ' ') + ':59';
    // Removemos o limite de 500 para exibir todos os dados no intervalo de tempo
    query = 'SELECT * FROM medicoes WHERE data >= ? AND data <= ? ORDER BY data ASC';
    params = [startStr, endStr];
  } else {
    query = 'SELECT * FROM (SELECT * FROM medicoes ORDER BY data DESC LIMIT 100) ORDER BY data ASC';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
    res.json(rows);
  });
});

// Endpoint para pegar a medição mais recente (atual)
app.get('/api/sensores/atual', (req, res) => {
  const query = 'SELECT * FROM medicoes ORDER BY data DESC LIMIT 1';

  db.get(query, [], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
    res.json(row || null);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
