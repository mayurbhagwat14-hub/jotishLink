import astrologyService from './astrology.service.js';

class AiService {
  async getChatResponse(message, context = []) {
    const msg = message.toLowerCase();
    const isHinglish = msg.match(/kaise|kya|kab|shadi|paisa|kare|hai|ho|raha|mera|meri|mujhe|ka|ki|ko/i);

    // Very basic parsing for demo: check if they provided a year
    const yearMatch = message.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      try {
        const data = {
          day: 15, // Defaulting if not extracted via NLP
          month: 8,
          year: parseInt(yearMatch[0], 10),
          hour: 10,
          min: 30,
          lat: 28.6139,
          lon: 77.2090,
          tzone: 5.5
        };

        const kundli = await astrologyService.getKundli(data);
        const { astroDetails, manglik, planets } = kundli;
        
        let response = isHinglish 
          ? `✨ **Kundli Analysis Pura Hua** ✨\n\nMaine aapke birth year ${data.year} ke hisaab se analysis kiya hai. Ye rahe results:\n\n`
          : `✨ **Astrological Analysis Complete** ✨\n\nI have carefully analyzed your cosmic blueprint based on the birth year ${data.year}. Here are the key insights:\n\n`;
        
        if (astroDetails) {
          response += isHinglish
            ? `🔹 **Aapki Kundli:** Aapka Lagna **${astroDetails.ascendant || 'Unknown'}** aur Rashi **${astroDetails.sign || 'Unknown'}** hai. Aap **${astroDetails.Naksahtra || 'Unknown'}** Nakshatra me paida hue hain.\n\n`
            : `🔹 **Your Cosmic Identity:** Your Ascendant (Lagna) is **${astroDetails.ascendant || 'Unknown'}** and your Moon Sign (Rashi) is **${astroDetails.sign || 'Unknown'}**. You are born under the **${astroDetails.Naksahtra || 'Unknown'}** Nakshatra.\n\n`;
        }
        
        if (manglik) {
          if (manglik.is_present) {
            response += isHinglish
              ? `🔹 **Manglik Dosh:** Aapki kundli me Manglik dosh hai. Shaadi se pehle kundli milan zaroor karwayein.\n\n`
              : `🔹 **Manglik Status:** You have a Manglik Dosha present in your chart. This means you should be extra careful and seek proper matching before making marital commitments.\n\n`;
          } else {
            response += isHinglish
              ? `🔹 **Manglik Dosh:** Achhi khabar! Aapki kundli me koi Manglik dosh nahi hai.\n\n`
              : `🔹 **Manglik Status:** Good news! Your chart is free from Manglik Dosha, bringing harmony to your future relationships.\n\n`;
          }
        }
        
        if (msg.includes('marriage') || msg.includes('love') || msg.includes('shadi') || msg.includes('pyaar')) {
          response += isHinglish
            ? `💕 **Love & Marriage:** Shukra (Venus) ki sthiti achhi hai. Sahi waqt ka intezaar karein, aane wale mahine rishton ke liye bahut achhe hain.`
            : `💕 **Regarding Love & Marriage:** Venus, the planet of love, indicates that patience will bring the right partner. The upcoming months look highly favorable for relationship matters.`;
        } else if (msg.includes('career') || msg.includes('job') || msg.includes('money') || msg.includes('paisa') || msg.includes('naukri')) {
          response += isHinglish
            ? `💼 **Career & Finance:** Shani ki sthiti mehnat ka fal degi. Thodi deri ho sakti hai, par jald hi financial growth milegi.`
            : `💼 **Regarding Career & Finance:** Saturn's current transit suggests that hard work will pay off immensely. You may face temporary delays, but a major breakthrough is on the horizon.`;
        } else {
          response += isHinglish
            ? `🔮 **General Guidance:** Grahon ki dasha badlaav dikha rahi hai. Agar love ya career ke baare me koi sawal hai toh puchein!`
            : `🔮 **General Guidance:** The planetary alignments suggest a period of transformation. Trust your intuition. If you have specific questions about love or career, just ask!`;
        }
        
        return response;

      } catch (error) {
        console.error('Astro Error:', error);
        return isHinglish 
          ? "Abhi server me thodi dikkat hai, kripya thodi der baad try karein."
          : "I encountered an error connecting to the cosmic servers. Please try again later.";
      }
    }

    return this._getMockResponse(message, isHinglish);
  }

  _getMockResponse(message, isHinglish) {
    const msg = message.toLowerCase();
    
    if (msg.includes('marriage') || msg.includes('love') || msg.includes('shadi') || msg.includes('pyaar')) {
      return isHinglish 
        ? "Aapki kundli mein Venus ki sthiti achhi hai. Love aur marriage ke chances acche hain par thoda patience chahiye. **Kripya apna Birth Year (jaise 1995) batayein** taaki main detail me dekh saku!"
        : "I can see strong Venus influences in your chart. Love and marriage prospects look very promising, but patience is required. **Please share your birth year (e.g., 1995)** so I can fetch your real Kundli data!";
    }
    if (msg.includes('career') || msg.includes('job') || msg.includes('money') || msg.includes('paisa') || msg.includes('naukri')) {
      return isHinglish
        ? "Jupiter ki position financial growth dikha rahi hai. **Kripya apna Birth Year (jaise 1990) batayein** taaki main grahon ki dasha check kar saku."
        : "Jupiter's position indicates upcoming opportunities for financial growth. **Please share your birth year (e.g., 1990)** for a deeper, personalized look into your planetary dashas.";
    }
    if (msg.includes('health') || msg.includes('swasthya') || msg.includes('tabiyat')) {
      return isHinglish
        ? "Health me thodi tension dikh rahi hai. Meditation se aaram milega. **Apna Birth Year batayein** detail me dekhne ke liye."
        : "Your health house shows some minor stress. Meditation will help. **Provide your birth year** so I can check your exact astrological details.";
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste') || msg.includes('kaise')) {
      return isHinglish
        ? "Namaste! Main aapka Astrologer hu. Main aapko love, career aur health pe guide kar sakta hu. **Kripya apna Birth Year (jaise 1995) batayein** taaki main aapki kundli bana saku!"
        : "Namaste! I am your Astrologer. I can guide you on love, career, health, and more. **Please share your Birth Year (e.g. 1995)** so I can cast your live chart!";
    }

    return isHinglish
      ? "Grahon ki chaal samajhne ke liye, **kripya apna Birth Year (jaise 1992) batayein** ya career, love, health ke baare me puchein."
      : "The stars are full of mysteries. To give you an accurate reading, **please provide your birth year (e.g., 1992)** or ask specifically about your career, love, or health.";
  }
}

export default new AiService();
