import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let userToken = '';

async function runTests() {
  console.log('--- STARTING API TESTS ---');

  // 1. Healthcheck
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Healthcheck:', res.data.status);
  } catch (err) {
    console.error('❌ Healthcheck failed:', err.message);
  }

  // 2. Astrologers Public List
  try {
    const res = await axios.get(`${BASE_URL}/api/astrologers`);
    console.log(`✅ Astrologers list fetched: ${res.data.data.astrologers?.length || 0} found`);
  } catch (err) {
    console.error('❌ Astrologers fetch failed:', err.message);
  }

  // 3. Admin Login
  try {
    const res = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      email: 'admin@jyotishlink.com',
      password: 'adminpassword123'
    });
    adminToken = res.data.data.accessToken;
    console.log('✅ Admin login successful');
  } catch (err) {
    console.error('❌ Admin login failed:', err.response?.data?.message || err.message);
  }

  // 4. Admin Dashboard Stats
  if (adminToken) {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin Dashboard stats fetched');
    } catch (err) {
      console.error('❌ Admin Dashboard stats failed:', err.response?.data?.message || err.message);
    }
  }

  // 5. User OTP Request
  try {
    const res = await axios.post(`${BASE_URL}/api/user/auth/request-otp`, {
      phoneNumber: '9876543210'
    });
    console.log('✅ User OTP requested:', res.data.message);
  } catch (err) {
    console.error('❌ User OTP request failed:', err.response?.data?.message || err.message);
  }

  // 6. Tools API (e.g. daily-horoscope)
  try {
    const res = await axios.post(`${BASE_URL}/api/tools/daily-horoscope`, {
      zodiac: 'aries',
      day: 'today'
    });
    console.log('✅ Daily horoscope fetched');
  } catch (err) {
    console.error('❌ Daily horoscope failed:', err.response?.data?.message || err.message);
  }

  console.log('--- API TESTS COMPLETED ---');
}

runTests();
