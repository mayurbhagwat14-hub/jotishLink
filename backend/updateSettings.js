const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/jyotishlink').then(async () => {
  await mongoose.connection.db.collection('systemsettings').updateMany({}, { $set: { newUserWalletBonus: 0 } });
  console.log('Updated db');
  process.exit(0);
}).catch(console.error);
