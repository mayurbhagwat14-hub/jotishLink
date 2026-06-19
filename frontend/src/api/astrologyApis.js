import api from './axios';

// Fetch daily horoscope
export const getDailyHoroscope = async (sign) => {
  try {
    const response = await api.post('/tools/horoscope', { sign, period: 'today' });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
