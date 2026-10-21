const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_campus',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    dbConfig.host = parsed.hostname;
    dbConfig.port = Number(parsed.port || 3306);
    dbConfig.user = decodeURIComponent(parsed.username || 'root');
    dbConfig.password = decodeURIComponent(parsed.password || '');
    dbConfig.database = (parsed.pathname || '').replace(/^\//, '') || 'smart_campus';
  } catch (err) {
    console.error('Failed to parse DATABASE_URL:', err.message);
  }
}

const isCloudDb = process.env.DB_SSL === 'true' || 
  (dbConfig.host !== '127.0.0.1' && dbConfig.host !== 'localhost' && !dbConfig.host.startsWith('192.168.'));

if (isCloudDb) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  db: dbConfig
};
