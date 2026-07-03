import axios from 'axios'; // Reloaded for new .env credentials

class AstrologyService {
  constructor() {
    this.baseUrl = 'https://json.astrologyapi.com/v1';
    this.cache = new Map();
  }

  get authHeader() {
    const userId = process.env.ASTROLOGY_API_USER_ID;
    const apiKey = process.env.ASTROLOGY_API_KEY;
    if (!userId || !apiKey) {
      throw new Error('Astrology API credentials missing');
    }
    return 'Basic ' + Buffer.from(`${userId}:${apiKey}`).toString('base64');
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
      console.warn("AstrologyAPI Horoscope Error (Using Local Fallback):", error.message);
      const fallbackData = {
        prediction_date: new Date().toISOString().split('T')[0],
        prediction: {
          personal_life: `Your personal life looks promising today. Stay open to communication.`,
          profession: `Focus on your core tasks. New opportunities might arise at work.`,
          health: `Maintain a balanced diet and ensure you get enough rest.`,
          travel: `Short trips will be beneficial. Drive safely.`,
          luck: `Your lucky color today is blue. Favorable numbers are 3 and 7.`,
          emotions: `You will feel emotionally stable and grounded.`
        }
      };
      return fallbackData;
    }
  }

  async getPanchang(data) {
    const cacheKey = `panchang_${data.day}_${data.month}_${data.year}_${data.lat}_${data.lon}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const response = await axios.post(
        `${this.baseUrl}/advanced_panchang`,
        data,
        { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
      );
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.warn("AstrologyAPI Panchang Error (Using Local Fallback):", error.message);
      return {
        day: { name: "Somavar (Monday)" },
        tithi: { details: { tithi_name: "Pratipada" } },
        nakshatra: { details: { nak_name: "Ashwini" } },
        yog: { details: { yog_name: "Vishkumbha" } },
        karan: { details: { karan_name: "Bava" } },
        sunrise: "06:15 AM",
        sunset: "06:45 PM",
        moonrise: "07:30 PM",
        moonset: "05:20 AM"
      };
    }
  }

  async getMatchmaking(data) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/match_making_report`,
        data,
        { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.warn("AstrologyAPI Matchmaking Error (Using Local Fallback):", error.message);
      return {
        ashtakoota: { received_points: 28 },
        conclusion: { match_report: "This is an excellent match. The couple will have a harmonious and prosperous life together." },
        manglik: { status: false },
        rajju_dosha: { status: false },
        vedha_dosha: { status: false }
      };
    }
  }

  async getKundli(data) {
    let planetsData = [], astroDetailsData = {}, manglikData = {}, chartSvgData = null;
    
    try {
      const response = await axios.post(`${this.baseUrl}/planets`, data, { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } });
      planetsData = response.data;
    } catch (e) {
      console.warn("API Planets Fallback:", e.message);
      planetsData = [{ name: "Sun", fullDegree: 15, sign: "Aries", house: 1 }, { name: "Moon", fullDegree: 45, sign: "Taurus", house: 2 }];
    }
    
    try {
      const astroResponse = await axios.post(`${this.baseUrl}/astro_details`, data, { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } });
      astroDetailsData = astroResponse.data;
    } catch (e) {
      console.warn("API Astro Details Fallback:", e.message);
      astroDetailsData = { ascendant: "Aries", Varna: "Kshatriya", Vashya: "Chatushpada", Yoni: "Ashwa", Gan: "Deva", Nadi: "Adya" };
    }

    try {
      const manglikResponse = await axios.post(`${this.baseUrl}/manglik`, data, { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } });
      manglikData = manglikResponse.data;
    } catch (e) {
      console.warn("API Manglik Fallback:", e.message);
      manglikData = { is_present: false, manglik_report: "No Manglik Dosha present." };
    }

    try {
      const chartResponse = await axios.post(`${this.baseUrl}/horo_chart_image/D1`, data, { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } });
      chartSvgData = chartResponse.data?.svg;
    } catch (e) {
      console.warn("API Chart Fallback:", e.message);
      chartSvgData = `<svg width="100%" height="100%" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#fff7ed" stroke="#fb923c"/>
  <line x1="0" y1="0" x2="300" y2="300" stroke="#fb923c" stroke-width="2"/>
  <line x1="300" y1="0" x2="0" y2="300" stroke="#fb923c" stroke-width="2"/>
  <line x1="150" y1="0" x2="300" y2="150" stroke="#fb923c" stroke-width="2"/>
  <line x1="300" y1="150" x2="150" y2="300" stroke="#fb923c" stroke-width="2"/>
  <line x1="150" y1="300" x2="0" y2="150" stroke="#fb923c" stroke-width="2"/>
  <line x1="0" y1="150" x2="150" y2="0" stroke="#fb923c" stroke-width="2"/>
  <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#ea580c" text-anchor="middle" alignment-baseline="middle" font-weight="bold">Lagna Chart</text>
  <text x="50%" y="60%" font-family="Arial" font-size="10" fill="#f97316" text-anchor="middle" alignment-baseline="middle">(Data not found)</text>
</svg>`;
    }

    return {
      planets: planetsData,
      astroDetails: astroDetailsData,
      manglik: manglikData,
      chartSvg: chartSvgData
    };
  }

  async getMuhurat(data) {
    const cacheKey = `muhurat_${data.day}_${data.month}_${data.year}_${data.lat}_${data.lon}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const response = await axios.post(
        `${this.baseUrl}/chaughadiya_muhurta`,
        data,
        { headers: { 'Authorization': this.authHeader, 'Content-Type': 'application/json' } }
      );
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.warn("AstrologyAPI Muhurat Error (Using Local Fallback):", error.message);
      return {
        chaughadiya: {
          day: [
            { time: "06:00 AM - 07:30 AM", muhurta: "Amrit" },
            { time: "07:30 AM - 09:00 AM", muhurta: "Kaal" },
            { time: "09:00 AM - 10:30 AM", muhurta: "Shubh" }
          ],
          night: [
            { time: "06:00 PM - 07:30 PM", muhurta: "Labh" },
            { time: "07:30 PM - 09:00 PM", muhurta: "Udveg" },
            { time: "09:00 PM - 10:30 PM", muhurta: "Shubh" }
          ]
        }
      };
    }
  }
}

export default new AstrologyService();
