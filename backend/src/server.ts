import 'dotenv/config';
import app from './app';
import prisma from './config/database';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function main() {
  let dbStatus = 'disconnected';
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    dbStatus = 'connected';
  } catch (err) {
    console.warn('⚠️ Database connection notice: PostgreSQL server is offline or unreachable on localhost. Running in API server mode.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🏥 NHS Hospital Agent Backend Server`);
    console.log(`   Running on http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Database: ${dbStatus}\n`);
  });
}

main();
