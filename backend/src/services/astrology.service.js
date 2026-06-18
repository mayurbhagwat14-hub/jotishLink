import axios from 'axios';

class AstrologyService {
  constructor() {
    this.userId = process.env.ASTROLOGY_API_USER_ID;
    this.apiKey = process.env.ASTROLOGY_API_KEY;
    this.baseUrl = 'https://json.astrologyapi.com/v1';
    this.cache = new Map();
  }

  get authHeader() {
    if (!this.userId || !this.apiKey) {
      throw new Error('Astrology API credentials missing');
    }
    return 'Basic ' + Buffer.from(`${this.userId}:${this.apiKey}`).toString('base64');
  }

  async getPeriodHoroscope(sign, period = 'today') {
    let timeframe = period.toLowerCase();
    if (timeframe === 'daily') timeframe = 'today';
    
    let endpoint = `/sun_sign_prediction/daily/${sign.toLowerCase()}`;
    if (timeframe === 'yesterday') {
      endpoint = `/sun_sign_prediction/daily/previous/${sign.toLowerCase()}`;
    } else if (timeframe === 'tomorrow') {
      endpoint = `/sun_sign_prediction/daily/next/${sign.toLowerCase()}`;
    } else if (timeframe === 'weekly') {
      endpoint = `/horoscope_prediction/weekly/${sign.toLowerCase()}`;
    } else if (timeframe === 'monthly') {
      endpoint = `/horoscope_prediction/monthly/${sign.toLowerCase()}`;
    } else if (timeframe === 'yearly') {
      // Yearly might not exist on this tier, fallback to monthly
      endpoint = `/horoscope_prediction/monthly/${sign.toLowerCase()}`;
    }

    const cacheKey = `horoscope_${sign.toLowerCase()}_${timeframe}_${new Date().toDateString()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}${endpoint}`,
        { timezone: 5.5 },
        { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
      );
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error("AstrologyAPI Horoscope Error:", error.message);
      throw error;
    }
  }

  async getPanchang(data) {
    const cacheKey = `panchang_${data.day}_${data.month}_${data.year}_${data.lat}_${data.lon}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const response = await axios.post(
      `${this.baseUrl}/advanced_panchang`,
      data,
      { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
    );
    this.cache.set(cacheKey, response.data);
    return response.data;
  }

  async getMatchmaking(data) {
    const response = await axios.post(
      `${this.baseUrl}/match_making_report`,
      data,
      { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  async getKundli(data) {
    // We need planetary details and ascendant
    const response = await axios.post(
      `${this.baseUrl}/planets`,
      data,
      { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
    );
    
    // Get general astro details (ascendant, varna, etc.)
    const astroResponse = await axios.post(
      `${this.baseUrl}/astro_details`,
      data,
      { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
    );

    // Get dosha
    const manglikResponse = await axios.post(
      `${this.baseUrl}/manglik`,
      data,
      { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
    ).catch(e => ({ data: { is_present: false, manglik_report: 'Could not fetch Manglik details.' } }));

    // Get chart SVG
    const chartResponse = await axios.post(
      `${this.baseUrl}/horo_chart_image/D1`,
      data, // Passing same time/location data
      { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
    ).catch(e => {
      console.error("Failed to fetch chart:", e.message);
      return { data: { svg: null } };
    });

    return {
      planets: response.data,
      astroDetails: astroResponse.data,
      manglik: manglikResponse.data,
      chartSvg: chartResponse.data?.svg
    };
  }

  async getMuhurat(data) {
    const cacheKey = `muhurat_${data.day}_${data.month}_${data.year}_${data.lat}_${data.lon}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const response = await axios.post(
      `${this.baseUrl}/chaughadiya_muhurta`,
      data,
      { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
    );
    this.cache.set(cacheKey, response.data);
    return response.data;
  }
}

export default new AstrologyService();
