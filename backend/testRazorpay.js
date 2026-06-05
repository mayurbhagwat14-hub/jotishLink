import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log('Testing with Key ID:', key_id);
console.log('Secret length:', key_secret ? key_secret.length : 0);

if (!key_id || !key_secret) {
  console.log('Keys missing in .env!');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

async function testRazorpay() {
  try {
    const order = await razorpay.orders.create({
      amount: 5000, // 50 INR
      currency: 'INR',
      receipt: 'test_receipt'
    });
    console.log('Success! Order created:', order.id);
  } catch (error) {
    console.error('Razorpay API Error Response:');
    console.error(error);
  }
}

testRazorpay();
