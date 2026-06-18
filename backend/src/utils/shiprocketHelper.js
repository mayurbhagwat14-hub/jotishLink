import axios from 'axios';

let shiprocketToken = null;
let tokenExpiry = null;

const getShiprocketToken = async () => {
  try {
    if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
      return shiprocketToken;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      console.warn('Shiprocket credentials missing in .env');
      return null;
    }

    const baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';

    const response = await axios.post(`${baseURL}/auth/login`, {
      email,
      password
    });

    if (response.data?.token) {
      shiprocketToken = response.data.token;
      // Shiprocket tokens usually expire in 10 days. We'll refresh after 9 days.
      tokenExpiry = new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000);
      return shiprocketToken;
    }
    return null;
  } catch (error) {
    console.error('Shiprocket Auth Error:', error.response?.data || error.message);
    return null;
  }
};

export const createShiprocketOrder = async (orderData) => {
  try {
    const token = await getShiprocketToken();
    if (!token) return null;

    const baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    const response = await axios.post(`${baseURL}/orders/create/adhoc`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
    return null;
  }
};

export const generateAWB = async (shipmentId) => {
  try {
    const token = await getShiprocketToken();
    if (!token) return null;

    const baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    const response = await axios.post(`${baseURL}/courier/assign/awb`, {
      shipment_id: shipmentId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Shiprocket Generate AWB Error:', error.response?.data || error.message);
    return null;
  }
};

export const getTrackingDetails = async (awbCode) => {
  try {
    const token = await getShiprocketToken();
    if (!token) return null;

    const baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    const response = await axios.get(`${baseURL}/courier/track/awb/${awbCode}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Shiprocket Tracking Error:', error.response?.data || error.message);
    return null;
  }
};
