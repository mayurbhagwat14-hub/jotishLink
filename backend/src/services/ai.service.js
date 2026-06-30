import astrologyService from './astrology.service.js';
import User from '../models/user.model.js';
import ChatSession from '../models/chatSession.model.js';

class AiService {
  async getChatResponse(message, userId = null, chatSession = null) {
    const msg = message.toLowerCase();
    
    // Improved Hinglish detection based on common Hinglish conversational words
    const isHinglish = msg.match(/kaise|kya|kab|shadi|paisa|kare|hai|ho|raha|mera|meri|mujhe|ka|ki|ko|naukri|pyaar|batao|apna|apni|hoga|milegi|kuch|nhi|nhi|se|aur|thoda|thodi|baba|pandit|kripya|ji|dhanyawad|shukriya|namaste/i);

    // 1. Fetch user details if userId is provided
    let user = null;
    if (userId) {
      try {
        user = await User.findById(userId);
      } catch (err) {
        console.error('Error fetching user for AI chat:', err);
      }
    }

    // 2. Parse birth details
    const birthDetails = this._parseBirthDetails(user);

    // 3. Check for existing session ID from chatSession
    let session_id = chatSession?.botSessionId || null;

    // 4. Try querying AstrologyAPI Astro-Chat API
    try {
      const apiKey = process.env.ASTROLOGY_API_KEY;
      if (!apiKey) {
        throw new Error('ASTROLOGY_API_KEY missing in environment');
      }

      const url = 'https://json-chat.astrologyapi.com/api/chat';
      
      // We query in English to get Latin/English text responses, but customize instructions
      let apiLanguage = 'en';
      
      // If we detect Hinglish query, we append prompt instructions to q
      let finalQuestion = `${message} (Instructions: Keep your response extremely short, concise, and conversational, like a WhatsApp chat message. Maximum 1 or 2 short sentences. Do not write long paragraphs.)`;
      if (isHinglish) {
        finalQuestion = `${message} (Instructions: Please reply directly in friendly Hinglish - Hindi language written in Latin/English characters. Do not use Devnagari script. Talk like a friendly human astrologer. Keep your response extremely short, concise, and conversational, like a WhatsApp chat message. Maximum 1 or 2 short sentences. Do not write long paragraphs.)`;
      }

      const payload = {
        language: apiLanguage,
        name: birthDetails.name,
        day: birthDetails.day,
        month: birthDetails.month,
        year: birthDetails.year,
        hour: birthDetails.hour,
        min: birthDetails.min,
        place: birthDetails.place,
        lat: birthDetails.lat,
        lon: birthDetails.lon,
        tzone: birthDetails.tzone,
        q: finalQuestion
      };

      if (session_id) {
        payload.session_id = session_id;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-astrologyapi-key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 200) {
        const json = await response.json();
        const replyText = json.response;
        const newSessionId = json.session_id;

        // Save new session_id to database if it changed/was returned
        if (newSessionId && chatSession && chatSession.botSessionId !== newSessionId) {
          try {
            await ChatSession.findByIdAndUpdate(chatSession._id, { botSessionId: newSessionId });
            chatSession.botSessionId = newSessionId; // update local object reference
          } catch (e) {
            console.error('Error saving botSessionId:', e);
          }
        }

        if (replyText) {
          return replyText;
        }
      } else {
        console.warn(`AstrologyAPI Chat API returned status ${response.status}`);
      }
    } catch (error) {
      console.error('AstrologyAPI Chat Error:', error);
    }

    // 5. Fallback: If AstrologyAPI fails, fall back to our local rule-based/mock engine
    console.log('Falling back to local AI service responses');
    return this._getFallbackResponse(message, isHinglish, birthDetails);
  }

  _parseBirthDetails(user) {
    const defaults = {
      name: user?.name || 'Guest User',
      day: 15,
      month: 8,
      year: 1995,
      hour: 12,
      min: 0,
      place: user?.placeOfBirth || 'Delhi',
      lat: '28.6139',
      lon: '77.2090',
      tzone: '5.5'
    };

    if (user?.dob) {
      try {
        const parts = user.dob.split('-'); // YYYY-MM-DD
        if (parts.length === 3) {
          defaults.year = parseInt(parts[0], 10);
          defaults.month = parseInt(parts[1], 10);
          defaults.day = parseInt(parts[2], 10);
        }
      } catch (e) {
        console.error('Error parsing user dob:', e);
      }
    }

    if (user?.timeOfBirth) {
      try {
        const tob = user.timeOfBirth.trim();
        const ampmMatch = tob.match(/(am|pm)/i);
        if (ampmMatch) {
          const timeParts = tob.replace(/(am|pm)/i, '').trim().split(':');
          let hr = parseInt(timeParts[0], 10);
          const mn = parseInt(timeParts[1], 10);
          const isPm = ampmMatch[0].toLowerCase() === 'pm';
          if (isPm && hr < 12) hr += 12;
          if (!isPm && hr === 12) hr = 0;
          defaults.hour = hr;
          defaults.min = mn;
        } else {
          const parts = tob.split(':');
          if (parts.length >= 2) {
            defaults.hour = parseInt(parts[0], 10);
            defaults.min = parseInt(parts[1], 10);
          }
        }
      } catch (e) {
        console.error('Error parsing user timeOfBirth:', e);
      }
    }

    if (user?.placeOfBirth) {
      const placeLower = user.placeOfBirth.toLowerCase();
      if (placeLower.includes('mumbai') || placeLower.includes('bombay')) {
        defaults.lat = '19.0760';
        defaults.lon = '72.8777';
      } else if (placeLower.includes('delhi') || placeLower.includes('ncr')) {
        defaults.lat = '28.6139';
        defaults.lon = '77.2090';
      } else if (placeLower.includes('bangalore') || placeLower.includes('bengaluru')) {
        defaults.lat = '12.9716';
        defaults.lon = '77.5946';
      } else if (placeLower.includes('kolkata') || placeLower.includes('calcutta')) {
        defaults.lat = '22.5726';
        defaults.lon = '88.3639';
      } else if (placeLower.includes('chennai') || placeLower.includes('madras')) {
        defaults.lat = '13.0827';
        defaults.lon = '80.2707';
      } else if (placeLower.includes('pune')) {
        defaults.lat = '18.5204';
        defaults.lon = '73.8567';
      } else if (placeLower.includes('hyderabad')) {
        defaults.lat = '17.3850';
        defaults.lon = '78.4867';
      }
    }

    return defaults;
  }

  async _getFallbackResponse(message, isHinglish, birthDetails) {
    const msg = message.toLowerCase();
    
    // Check if we can fetch live fallback details using astrologyService
    try {
      const data = {
        day: birthDetails.day,
        month: birthDetails.month,
        year: birthDetails.year,
        hour: birthDetails.hour,
        min: birthDetails.min,
        lat: parseFloat(birthDetails.lat),
        lon: parseFloat(birthDetails.lon),
        tzone: parseFloat(birthDetails.tzone)
      };

      const kundli = await astrologyService.getKundli(data);
      const { astroDetails, manglik } = kundli;
      
      let response = "";
      
      if (isHinglish) {
        response += `Maine aapke birth details ke hisaab se aapki kundli ka details check kiya hai. 🪐\n\n`;
        
        if (astroDetails) {
          response += `Aapka Lagna **${astroDetails.ascendant || 'Unknown'}** hai aur Moon Sign (Rashi) **${astroDetails.sign || 'Unknown'}** hai. Aapka janm **${astroDetails.Naksahtra || 'Unknown'}** Nakshatra ke under hua hai. ✨\n\n`;
        }
        
        if (manglik) {
          if (manglik.is_present) {
            response += `Manglik Status: Aapki kundli me Manglik Dosh dikh raha hai. Ghabrane ki baat nahi hai, par shaadi se pehle kundli milan zaroor karwayein. 🙏\n\n`;
          } else {
            response += `Manglik Status: Ekdum shubh! Aapki kundli me koi Manglik Dosh nahi hai, jo relationship ke liye kafi supportive hai. 🌸\n\n`;
          }
        }
        
        if (msg.includes('marriage') || msg.includes('love') || msg.includes('shadi') || msg.includes('pyaar')) {
          response += `Love & Marriage: Aapki kundli me Shukra (Venus) ki sthiti kafi favorable lag rahi hai. Prem aur rishton ke liye aane wala samay kafi sundar yog bana raha hai. ❤️`;
        } else if (msg.includes('career') || msg.includes('job') || msg.includes('money') || msg.includes('paisa') || msg.includes('naukri')) {
          response += `Career & Finance: Shani (Saturn) ki position indicate karti hai ki aapki mehnat ka fal thoda samay lekar milega. Jald hi aapko growth dekhne ko milegi. 💼`;
        } else {
          response += `🔮 Grahon ki dasha me badlaav ho raha hai jo aapke liye positive rahega. Agar aap love life, career ya health ke baare me kuch specific puchna chahte hain, toh bejijhak puchein!`;
        }
      } else {
        response += `I have carefully analyzed your live chart based on your birth details. Here is what the stars show: 🪐\n\n`;
        
        if (astroDetails) {
          response += `Your Ascendant (Lagna) is **${astroDetails.ascendant || 'Unknown'}** and your Moon Sign (Rashi) is **${astroDetails.sign || 'Unknown'}**. You were born under the **${astroDetails.Naksahtra || 'Unknown'}** Nakshatra. ✨\n\n`;
        }
        
        if (manglik) {
          if (manglik.is_present) {
            response += `Regarding Manglik Status: There is a Manglik influence in your chart. It is recommended to get proper compatibility done before marriage. 🙏\n\n`;
          } else {
            response += `Regarding Manglik Status: Wonderful news! Your chart is free from Manglik Dosha, bringing harmonious energy to your relationships. 🌸\n\n`;
          }
        }
        
        if (msg.includes('marriage') || msg.includes('love') || msg.includes('shadi') || msg.includes('pyaar')) {
          response += `Love & Marriage: Venus, the planet of love, is placed well. Auspicious times are coming soon for matters of the heart. ❤️`;
        } else if (msg.includes('career') || msg.includes('job') || msg.includes('money') || msg.includes('paisa') || msg.includes('naukri')) {
          response += `Career & Finance: Saturn's alignment shows that your dedicated efforts will bring long-term security. Expect career upgrades in the near future. 💼`;
        } else {
          response += `🔮 The current transits point toward a phase of personal growth. Feel free to ask any specific questions you have about love, career, or health!`;
        }
      }
      
      return response;

    } catch (error) {
      console.error('Astro Error:', error);
      return this._getFallbackResponseOld(message, isHinglish);
    }
  }

  _getFallbackResponseOld(message, isHinglish) {
    const msg = message.toLowerCase();
    
    if (isHinglish) {
      if (msg.includes('marriage') || msg.includes('love') || msg.includes('shadi') || msg.includes('pyaar')) {
        return "Aapki kundli mein Shukra (Venus) ki dasha kafi active dikh rahi hai. Prem aur shaadi ke acche chances hain par thoda patience zaroori hai. **Kripya apna profile details complete karein** taaki main detail me check kar saku! ❤️";
      }
      if (msg.includes('career') || msg.includes('job') || msg.includes('money') || msg.includes('paisa') || msg.includes('naukri')) {
        return "Brihaspati (Jupiter) ki position financial growth aur job opportunities ke liye kafi positive lag rahi hai. **Kripya apna profile details complete karein** taaki main planetary transition check karke batata hu! 💼";
      }
      if (msg.includes('health') || msg.includes('swasthya') || msg.includes('tabiyat')) {
        return "Grahon ki sthiti health me thoda stress show kar rahi hai. Apni daily routine me yoga ya meditation shuru karein. 🙏";
      }
      if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste') || msg.includes('pranam')) {
        return "Pranam! 🙏 Main aapka Astrologer hu. Main aapko aapki life, love, career aur health par guidance de sakta hu. ✨";
      }
      if (msg.includes('kaise ho') || msg.includes('kya hal')) {
        return "Main bilkul badhiya hu, aap bataiye! 😊 Aaj aap grahon se kya janna chahte hain?";
      }
      
      return "Main aapki grah dasha samajhne ke liye taiyaar hu! Kripya career, love life, ya health ke baare me koi sawal puchein. 🌌";
    } else {
      if (msg.includes('marriage') || msg.includes('love') || msg.includes('shadi') || msg.includes('pyaar')) {
        return "I can see active Venus influences in your chart. Love and marriage prospects look very promising, but patience is required. ❤️";
      }
      if (msg.includes('career') || msg.includes('job') || msg.includes('money') || msg.includes('paisa') || msg.includes('naukri')) {
        return "Jupiter's alignment shows high potential for financial growth and new job opportunities. 💼";
      }
      if (msg.includes('health') || msg.includes('swasthya') || msg.includes('tabiyat')) {
        return "Your health house indicates some minor stress or physical exhaustion. Consider including meditation in your routine. 🙏";
      }
      if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste') || msg.includes('pranam')) {
        return "Hello! 🙏 I am your Astrologer. I can guide you on love life, career, finances, and health. ✨";
      }
      if (msg.includes('how are you') || msg.includes('how do you do')) {
        return "I am doing great, thank you! 😊 What would you like to know from the stars today?";
      }
      
      return "I'm ready to analyze your cosmic chart! Please ask me specifically about your career, love life, or health. 🌌";
    }
  }
}

export default new AiService();
