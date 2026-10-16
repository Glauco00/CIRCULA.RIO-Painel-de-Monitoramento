const db = require('./database');
db.run("UPDATE medicoes SET data = datetime(data, 'localtime')", [], (err) => {
  if (err) console.error(err);
  else console.log('Database updated to localtime');
  db.close();
});
