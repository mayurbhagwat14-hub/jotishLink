import axios from 'axios';

class AiService {
  constructor() {
    this.userId = process.env.ASTROLOGY_API_USER_ID;
    this.apiKey = process.env.ASTROLOGY_API_KEY;
    this.baseUrl = 'https://json.astrologyapi.com/v1';
  }

  async getChatResponse(message, context = []) {
    const msg = message.toLowerCase();

    // Very basic parsing for demo: check if they provided a year
    const yearMatch = message.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      // Attempt to call Astrology API
      try {
        if (!this.userId || !this.apiKey || this.userId === 'dummy_user_id') {
          return "I see you've provided your birth details. The stars indicate a strong Venus placement. Your career prospects are looking bright soon. (Note: Valid AstrologyAPI keys are needed for real data).";
        }

        // Dummy data payload for now (since extracting exact lat/lon from raw text without NLP is error-prone)
        // In a full implementation, you'd parse DD/MM/YYYY, HH:MM, and use a Geocoding API for lat/lon.
        const data = {
          day: 12,
          month: 12,
          year: parseInt(yearMatch[0], 10),
          hour: 10,
          min: 30,
          lat: 28.6139,
          lon: 77.2090,
          tzone: 5.5
        };

        const auth = Buffer.from(`${this.userId}:${this.apiKey}`).toString('base64');
        const response = await axios.post(`${this.baseUrl}/astro_details`, data, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        const astroData = response.data;
        if (astroData) {
          return `I have analyzed your chart! Your ascendant (Lagna) is ${astroData.ascendant || 'Unknown'} and your sign is ${astroData.sign || 'Unknown'}. Varna is ${astroData.Varna || 'Unknown'}. The stars look favorable for upcoming financial endeavors.`;
        }
      } catch (error) {
        console.error('Astrology API Error:', error.response?.data || error.message);
        return "I encountered an error analyzing your chart. Please try again later.";
      }
    }

    return this._getMockResponse(message);
  }

  _getMockResponse(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('marriage') || msg.includes('love')) {
      return "I can see strong Venus influences in your chart. Love and marriage prospects look very promising, but patience is required. Please share your exact Date, Time, and Place of birth.";
    }
    if (msg.includes('career') || msg.includes('job') || msg.includes('money')) {
      return "Jupiter's position indicates upcoming opportunities for financial growth. A career shift might be on the horizon soon. Have you been feeling stuck lately? Share your birth details for a deeper look.";
    }
    if (msg.includes('health')) {
      return "Your health house shows some minor stress. Meditation and connecting with nature will help balance your energies. Provide your birth details (DD/MM/YYYY) so I can check your current planetary dasha.";
    }
    if (msg.includes('hello') || msg.includes('hi')) {
      return "Namaste! I am here to help guide you on love, career, health, and more. Please share your Date of Birth (e.g. 1995) so I can cast your chart.";
    }

    const genericResponses = [
      "The planetary alignments suggest a period of transformation for you. Tell me more about what's bothering you, or provide your birth year so I can cast your Kundli.",
      "I see a mix of energies in your birth chart right now. Focus on positive thoughts.",
      "Saturn's influence is teaching you some hard lessons, but the outcome will be rewarding.",
      "The stars indicate that you should trust your intuition on this matter. What does your heart say?"
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }
}

export default new AiService();
