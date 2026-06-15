import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/madha/Desktop/astrotalk-replica/backend/.env' });
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }, { strict: false }));
  
  const result = await Order.updateMany(
    { userId: new mongoose.Types.ObjectId('6a1aae70e71e44875cd84bd0') },
    { $set: { userId: new mongoose.Types.ObjectId('6a26bc419e8ffe82d4ba6552') } }
  );
  
  console.log('Migrated orders:', result.modifiedCount);
  process.exit(0);
});
