require('dotenv').config();
const dns = require('dns');
// Prefer IPv4 and known public resolvers to avoid SRV lookup issues in some environments
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // non-fatal
}

const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');
const { DEFAULT_ACHIEVEMENTS } = require('../controllers/achievementController');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI not set in environment. Aborting.');
  process.exit(1);
}

const seed = async () => {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB, seeding achievements...');

    const created = [];
    for (const a of DEFAULT_ACHIEVEMENTS) {
      const exists = await Achievement.findOne({ key: a.key });
      if (!exists) {
        const doc = await Achievement.create(a);
        created.push(doc);
        console.log('Created:', a.key);
      } else {
        console.log('Exists:', a.key);
      }
    }

    console.log(`Seeding complete. Created ${created.length} achievements.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
