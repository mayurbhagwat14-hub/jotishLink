import axios from 'axios';

class ShiprocketService {
  constructor() {
    this.baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      // If token exists and is valid (giving 1 hour buffer), reuse it
      if (this.token && this.tokenExpiry && new Date() < new Date(this.tokenExpiry.getTime() - 3600000)) {
        return this.token;
      }

      if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
        throw new Error('Shiprocket credentials are not configured in environment variables.');
      }

      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Shiprocket token usually expires in 10 days
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 9);
        this.tokenExpiry = expiry;
        return this.token;
      } else {
        throw new Error('Failed to retrieve Shiprocket token.');
      }
    } catch (error) {
      console.error('Shiprocket Auth Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Shiprocket authentication failed');
    }
  }

  async createOrder(orderData) {
    try {
      const token = await this.authenticate();
      const response = await axios.post(`${this.baseURL}/orders/create/adhoc`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to push order to Shiprocket');
    }
  }

  async generateAWB(shipmentId, courierId = null) {
    try {
      const token = await this.authenticate();
      const payload = {
        shipment_id: shipmentId,
      };
      if (courierId) {
        payload.courier_id = courierId;
      }

      const response = await axios.post(`${this.baseURL}/courier/generate/awb`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket AWB Generation Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to generate AWB');
    }
  }

  async trackOrder(awbCode) {
    try {
      const token = await this.authenticate();
      const response = await axios.get(`${this.baseURL}/courier/track/awb/${awbCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Tracking Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch tracking details');
    }
  }

  async getCouriers(pickupPostcode, deliveryPostcode, weight, cod = 0) {
    try {
      const token = await this.authenticate();
      const response = await axios.get(`${this.baseURL}/courier/serviceability/`, {
        params: {
          pickup_postcode: pickupPostcode,
          delivery_postcode: deliveryPostcode,
          weight: weight,
          cod: cod
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Couriers Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch couriers');
    }
  }

  async getOrderDetails(orderId) {
    try {
      const token = await this.authenticate();
      const response = await axios.get(`${this.baseURL}/orders/show/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Get Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch order details from Shiprocket');
    }
  }
  async cancelOrder(orderId) {
    try {
      const token = await this.authenticate();
      const response = await axios.post(`${this.baseURL}/orders/cancel`, {
        ids: [orderId]
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Cancel Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to cancel order on Shiprocket');
    }
  }
}

export default new ShiprocketService();

