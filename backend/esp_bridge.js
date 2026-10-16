const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');

const ESP_PORT = 'COM3';
const API_URL = process.env.API_URL || 'http://localhost:3001/api/sensores';
const BAUD_RATE = Number(process.env.BAUD_RATE || 9600);
const COMMAND_PORT = Number(process.env.COMMAND_PORT || 3002);
const allowedCommands = new Set(['A0', 'A1', 'A2']);

function isLikelyEspPort(port) {
  const description = `${port.manufacturer || ''} ${port.friendlyName || ''} ${port.pnpId || ''}`.toLowerCase();
  return /esp|ch340|cp210|silicon|usb.serial|ftdi/.test(description);
}

async function findSerialPort() {
  const ports = await SerialPort.list();
  const requestedPort = ESP_PORT;

  if (requestedPort) return requestedPort;

  const preferredPort = ports.find(isLikelyEspPort);
  const fallbackPort = ports.find(port => /^COM\d+$/i.test(port.path)) || ports[0];

  if (!preferredPort && !fallbackPort) {
    throw new Error('Nenhuma porta serial encontrada. Conecte o ESP e tente novamente.');
  }

  if (!preferredPort && ports.length > 1) {
    console.warn('Mais de uma porta encontrada; defina SERIAL_PORT para escolher o ESP.');
  }

  return (preferredPort || fallbackPort).path;
}

function parseJsonLine(line) {
  const text = line.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    return JSON.parse(text.slice(start, end + 1));
  }
}

async function sendToApi(sensorData) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sensorData)
  });

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  console.log('Dados do ESP salvos no banco e disponíveis no dashboard.');
}

async function startBridge() {
  const serialPath = await findSerialPort();
  const port = new SerialPort({ path: serialPath, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  const commandApp = express();
  commandApp.use(express.json());

  port.on('open', () => {
    console.log(`ESP conectado na porta ${serialPath} a ${BAUD_RATE} baud.`);
    console.log(`Aguardando JSON do ESP. API: ${API_URL}`);
  });

  port.on('error', (err) => {
    console.error('Erro na porta serial:', err.message);
  });

  commandApp.post('/comando', (req, res) => {
    const command = String(req.body?.comando || '').trim().toUpperCase();

    if (!allowedCommands.has(command)) {
      return res.status(400).json({ error: 'Comando inválido. Use A0, A1 ou A2.' });
    }

    if (!port.isOpen) {
      return res.status(503).json({ error: 'ESP não está conectado à porta serial.' });
    }

    port.write(`${command}\n`, (err) => {
      if (err) {
        console.error(`Erro ao enviar ${command} ao ESP:`, err.message);
        return res.status(500).json({ error: 'Não foi possível enviar o comando ao ESP.' });
      }

      console.log(`Comando enviado ao ESP: ${command}`);
      res.json({ message: `Comando ${command} enviado com sucesso`, comando: command });
    });
  });

  commandApp.listen(COMMAND_PORT, () => {
    console.log(`Servidor de comandos do ESP disponível na porta ${COMMAND_PORT}.`);
  });

  parser.on('data', async (line) => {
    const rawLine = line.trim();
    if (!rawLine) return;

    try {
      const sensorData = parseJsonLine(rawLine);
      if (!sensorData || typeof sensorData !== 'object' || Array.isArray(sensorData)) {
        console.log('Mensagem serial ignorada (não é JSON):', rawLine);
        return;
      }

      console.log('JSON recebido do ESP:', JSON.stringify(sensorData));
      await sendToApi(sensorData);
    } catch (err) {
      console.error('Não foi possível processar a mensagem do ESP:', err.message);
    }
  });
}

startBridge().catch((err) => {
  console.error('Não foi possível iniciar a comunicação com o ESP:', err.message);
  process.exitCode = 1;
});