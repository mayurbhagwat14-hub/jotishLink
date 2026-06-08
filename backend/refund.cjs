const mongoose = require('mongoose');
mongoose.connect('mongodb://mayur:mayur1234@ac-0yynjcf-shard-00-00.vfq8tic.mongodb.net:27017,ac-0yynjcf-shard-00-01.vfq8tic.mongodb.net:27017,ac-0yynjcf-shard-00-02.vfq8tic.mongodb.net:27017/jotishlink?ssl=true&authSource=admin&replicaSet=atlas-1d9q3o-shard-0')
.then(async () => {
  await mongoose.connection.db.collection('users').updateMany({}, { $set: { wallet: 5000 } });
  console.log('Wallet restored to 5000');
  process.exit(0);
}).catch(console.error);
