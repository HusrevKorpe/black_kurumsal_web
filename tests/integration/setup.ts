import 'dotenv/config'

// db.ts import edilmeden ÖNCE çalışır: uygulama istemcisi test veritabanına bağlanır.
const url = process.env.TEST_DATABASE_URL
if (!url) throw new Error('TEST_DATABASE_URL tanımlı değil (.env)')
process.env.DATABASE_URL = url
process.env.DIRECT_DATABASE_URL = url
