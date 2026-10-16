const { SerialPort } = require('serialport');

SerialPort.list().then(ports => {
  console.log('\n--- PORTAS ENCONTRADAS ---');
  ports.forEach(port => {
    console.log(`Porta: ${port.path}`);
    console.log(`Fabricante: ${port.manufacturer || 'Desconhecido'}`);
    console.log('--------------------------');
  });
}).catch(err => {
  console.error('Erro ao listar portas:', err);
});
