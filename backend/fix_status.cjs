const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    const result = await db.collection('astrologers').updateMany(
      { onlineStatus: 'busy' },
      { $set: { onlineStatus: 'online' } }
    );
    console.log(`Reset ${result.modifiedCount} astrologers to online.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
