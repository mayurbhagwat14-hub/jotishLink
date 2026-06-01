import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const APIKey = process.env.INDIA_SMS_HUB_API_KEY;
const senderid = process.env.INDIA_SMS_HUB_SENDER_ID;
const baseUrl = process.env.INDIA_SMS_HUB_BASE_URL;

async function testSMS() {
  const otp = '123456';
  const message = `Welcome to the V10 gym powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;
  // You need a valid phone number here to test. We'll use a dummy or a generic 10-digit number.
  // Using 9876543210 might result in an error or just consume a credit.
  const phoneNumber = '9876543210';

  console.log('Sending to URL:', baseUrl);
  console.log('Params:', { APIKey, senderid, number: phoneNumber, text: message, channel: '2', DCS: '0', flashsms: '0', route: '1' });

  try {
    const response = await axios.get(baseUrl, {
      params: {
        APIKey,
        senderid,
        channel: '2',
        DCS: '0',
        flashsms: '0',
        number: phoneNumber,
        text: message,
        route: '1'
      },
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSMS();
