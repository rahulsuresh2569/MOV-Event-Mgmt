const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Auth service listening on port ${PORT}`);
});
