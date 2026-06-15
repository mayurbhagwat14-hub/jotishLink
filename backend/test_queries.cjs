const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  const objId = new mongoose.Types.ObjectId('6a26bc419e8ffe82d4ba6552');
  
  const qObj = { 
    userId: objId, 
    deletedByUser: { $ne: true },
    $or: [{ type: 'chat' }, { type: { $exists: false } }]
  };
  const sessions = await db.collection('chatsessions').find(qObj).toArray();
  console.log('Query with qObj count for Naitik:', sessions.length);

  process.exit(0);
});
