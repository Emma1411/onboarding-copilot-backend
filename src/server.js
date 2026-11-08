const config = require('./config');
const app = require('./app');
const { buildIndex } = require('./search');

buildIndex(); // charge et indexe les .md une seule fois au démarrage

app.listen(config.port, () => {
  console.log(`API sur http://localhost:${config.port}`);
});