import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import astrologyService from '../services/astrology.service.js';

// Helper to get current day, month, year, hour, min
const getCurrentTimeData = () => {
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    hour: now.getHours(),
    min: now.getMinutes(),
    lat: 28.6139, // Default to Delhi
    lon: 77.2090,
    tzone: 5.5
  };
};

// GET /api/tools/panchang
export const getPanchang = asyncHandler(async (req, res) => {
  const data = getCurrentTimeData();
  const panchangRaw = await astrologyService.getPanchang(data);
  
  const panchang = {
    sunrise: panchangRaw.sunrise || '06:00 AM',
    sunset: panchangRaw.sunset || '06:30 PM',
    tithi: panchangRaw.tithi?.details?.tithi_name || 'Pratipada',
    nakshatra: panchangRaw.nakshatra?.details?.nak_name || 'Ashwini',
    yoga: panchangRaw.yog?.details?.yog_name || 'Vishkambha',
    karana: panchangRaw.karan?.details?.karan_name || 'Bava',
    rahuKaal: typeof panchangRaw.rahukaal === 'object' && panchangRaw.rahukaal
      ? `${panchangRaw.rahukaal.start} - ${panchangRaw.rahukaal.end}`
      : (panchangRaw.rahukaal || '12:00 PM - 01:30 PM')
  };

  return res.status(200).json(new ApiResponse(200, panchang, 'Panchang fetched'));
});

// GET /api/tools/muhurat
export const getMuhurat = asyncHandler(async (req, res) => {
  const data = getCurrentTimeData();
  
  // Fetch both Panchang and Muhurat (Chaughadiya) data
  const [panchangRaw, rawMuhurat] = await Promise.all([
    astrologyService.getPanchang(data),
    astrologyService.getMuhurat(data)
  ]);
  
  const muhurats = [];

  // 1. Abhijit Muhurat
  if (panchangRaw?.abhijit_muhurta) {
    muhurats.push({
      name: 'Abhijit Muhurat',
      time: `${panchangRaw.abhijit_muhurta.start} - ${panchangRaw.abhijit_muhurta.end}`,
      isGood: true
    });
  }

  // 2. Amrit Kaal (From Chaughadiya Day)
  if (rawMuhurat?.chaughadiya?.day) {
    const amrit = rawMuhurat.chaughadiya.day.find(m => m.muhurta === 'Amrit');
    if (amrit) {
      muhurats.push({
        name: 'Amrit Kaal',
        time: amrit.time,
        isGood: true
      });
    }
  }

  // 3. Brahma Muhurat (Approx 1h 36m before sunrise)
  if (panchangRaw?.sunrise) {
    try {
      let timeStr = panchangRaw.sunrise.trim();
      let ampm = timeStr.slice(-2).toUpperCase();
      let timeParts = timeStr.replace(/[^0-9:]/g, '').split(':').map(Number);
      let sh = timeParts[0] || 0;
      let sm = timeParts[1] || 0;
      let ss = timeParts[2] || 0;
      
      if (ampm === 'PM' && sh !== 12) sh += 12;
      if (ampm === 'AM' && sh === 12) sh = 0;
      
      let dateStart = new Date(); 
      dateStart.setHours(sh, sm, ss);
      if (isNaN(dateStart.getTime())) throw new Error("Invalid Date");
      
      dateStart.setMinutes(dateStart.getMinutes() - 96);
      let dateEnd = new Date(dateStart);
      dateEnd.setMinutes(dateEnd.getMinutes() + 48);
      
      const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      muhurats.push({
        name: 'Brahma Muhurat',
        time: `${formatTime(dateStart)} - ${formatTime(dateEnd)}`,
        isGood: true
      });
    } catch (e) {
      // ignore parsing error
    }
  }

  // 4. Rahu Kaal
  if (panchangRaw?.rahukaal) {
    muhurats.push({
      name: 'Rahu Kaal',
      time: typeof panchangRaw.rahukaal === 'object' 
        ? `${panchangRaw.rahukaal.start} - ${panchangRaw.rahukaal.end}` 
        : panchangRaw.rahukaal,
      isGood: false
    });
  }

  // 5. Yama Gandam
  if (panchangRaw?.yamghant_kaal) {
    muhurats.push({
      name: 'Yama Gandam',
      time: typeof panchangRaw.yamghant_kaal === 'object' 
        ? `${panchangRaw.yamghant_kaal.start} - ${panchangRaw.yamghant_kaal.end}` 
        : panchangRaw.yamghant_kaal,
      isGood: false
    });
  }

  // Fallback if APIs failed
  if (muhurats.length === 0) {
    muhurats.push(
      { name: 'Abhijit Muhurat', time: '11:45 AM - 12:30 PM', isGood: true },
      { name: 'Amrit Kaal', time: '02:15 PM - 03:50 PM', isGood: true },
      { name: 'Brahma Muhurat', time: '04:30 AM - 05:18 AM', isGood: true },
      { name: 'Rahu Kaal', time: '10:30 AM - 12:00 PM', isGood: false },
      { name: 'Yama Gandam', time: '03:00 PM - 04:30 PM', isGood: false }
    );
  }

  return res.status(200).json(new ApiResponse(200, muhurats, 'Muhurat fetched'));
});

// POST /api/tools/matchmaking
export const checkMatchmaking = asyncHandler(async (req, res) => {
  const { boyName, girlName, boyDob, girlDob } = req.body;

  // Assuming boyDob and girlDob are in "YYYY-MM-DDTHH:mm" format or similar
  const bDate = new Date(boyDob || Date.now());
  const gDate = new Date(girlDob || Date.now());

  const data = {
    m_day: bDate.getDate(),
    m_month: bDate.getMonth() + 1,
    m_year: bDate.getFullYear(),
    m_hour: bDate.getHours() || 12,
    m_min: bDate.getMinutes() || 0,
    m_lat: 28.6139,
    m_lon: 77.2090,
    m_tzone: 5.5,
    f_day: gDate.getDate(),
    f_month: gDate.getMonth() + 1,
    f_year: gDate.getFullYear(),
    f_hour: gDate.getHours() || 12,
    f_min: gDate.getMinutes() || 0,
    f_lat: 28.6139,
    f_lon: 77.2090,
    f_tzone: 5.5,
  };

  const matchData = await astrologyService.getMatchmaking(data);

  const matchmaking = {
    boyName, 
    girlName,
    matchedGunas: matchData.ashtakoota?.received_points || 0,
    totalGunas: 36,
    verdict: matchData.conclusion?.match_report || 'Match calculation successful.',
    isManglikMatch: matchData.manglik?.status ?? true,
    hasRajjuDosha: matchData.rajju_dosha?.status || false,
    hasVedhaDosha: matchData.vedha_dosha?.status || false,
  };

  return res.status(200).json(
    new ApiResponse(200, matchmaking, 'Matchmaking result')
  );
});

// POST /api/tools/horoscope
export const getHoroscope = asyncHandler(async (req, res) => {
  const { sign, period = 'today' } = req.body;
  
  // Fetch Daily Data (used for main UI)
  const rawData = await astrologyService.getPeriodHoroscope(sign || 'aries', period);

  // Fetch Also Check Data (Weekly/Monthly)
  // We'll just fetch weekly and monthly and send it down so the UI can switch instantly
  const [weeklyRaw, monthlyRaw] = await Promise.all([
    astrologyService.getPeriodHoroscope(sign || 'aries', 'weekly').catch(() => null),
    astrologyService.getPeriodHoroscope(sign || 'aries', 'monthly').catch(() => null)
  ]);

  if (!rawData || (!rawData.prediction && !rawData.prediction_date)) {
    throw new Error('Failed to fetch horoscope from AstrologyAPI');
  }

  // Consistent hashing for lucky numbers/colors based on sign + date
  const dateStr = rawData.prediction_date || new Date().toISOString();
  let dateHash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    dateHash += dateStr.charCodeAt(i) * (i + 1); // multiply by index to make hash wildly different between "15", "16", "17"
  }
  const seed = (sign || 'Aries').length * 13 + dateHash * 7;
  const colors = ['#f97316', '#fbbf24', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#14b8a6', '#f43f5e'];

  // Generate consistent pseudo-random monthly data based on sign and current month
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const monthlySeed = (sign || 'Aries').length * 5 + new Date().getMonth() * 11;
  
  const monthlyOverviews = [
    `This month brings a wave of positive energy for ${sign}. Focus on your long-term goals and stay patient.`,
    `A transformative month ahead for ${sign}. Embrace changes and trust your intuition in making big decisions.`,
    `This is a period of reflection and growth for ${sign}. Take time to understand your inner needs.`,
    `Career and finances take the spotlight this month for ${sign}. Hard work will start showing visible results.`
  ];
  
  const monthlyLove = [
    `Social life will be active this month. Single ${sign}s might meet someone special.`,
    `Communication is key in relationships this month. Spend quality time with your loved ones.`,
    `A month of romance and passion. Let your guard down and express your true feelings.`,
    `Focus on self-love this month. Healthy boundaries will improve all your relationships.`
  ];

  // Format weekly date range
  let weeklyDateStr = 'This Week';
  if (weeklyRaw?.week_start_date) {
    const parts = weeklyRaw.week_start_date.split('-'); // typically DD-MM-YYYY
    if (parts.length === 3) {
      const startDate = new Date(parts[2], parts[1] - 1, parts[0]);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const formatOptions = { day: 'numeric', month: 'short' };
      weeklyDateStr = `${startDate.toLocaleDateString('en-GB', formatOptions)} - ${endDate.toLocaleDateString('en-GB', formatOptions)}`;
    } else {
      weeklyDateStr = weeklyRaw.week_start_date;
    }
  }

  const predictionText = typeof rawData.prediction === 'string' 
    ? rawData.prediction 
    : (rawData.prediction?.emotions || rawData.prediction?.personal_life || 'A beautiful day awaits you.');

  const horoscopeData = {
    sign: sign || 'Aries',
    period,
    date: rawData.prediction_date || new Date().toDateString(),
    prediction: predictionText,
    luckyNumber: (seed % 9) + 1,
    luckyColors: [colors[seed % colors.length], colors[(seed + 3) % colors.length]],
    luckyTime: `${(seed % 12) + 1}:00 PM`,
    mood: ['🤩', '😎', '😌', '🤔', '🥳', '😇', '🤠'][seed % 7],
    love: { score: 60 + (seed % 40) + '%', text: rawData.prediction?.personal_life || 'Good day for relationships.' },
    career: { score: 60 + ((seed+7) % 40) + '%', text: rawData.prediction?.profession || 'Steady progress at work.' },
    health: { score: 60 + ((seed+13) % 40) + '%', text: rawData.prediction?.health || 'Health is stable.' },
    money: { score: 60 + ((seed+19) % 40) + '%', text: rawData.prediction?.luck || 'Financial luck is moderate.' },
    travel: { score: 60 + ((seed+23) % 40) + '%', text: rawData.prediction?.travel || 'Travel is favorable.' },
    
    // Additional data for Also Check section
    alsoCheck: {
      weekly: {
        date: weeklyDateStr,
        overview: weeklyRaw?.prediction?.[0] || 'A promising week ahead.',
        love: weeklyRaw?.prediction?.[1] || 'Relationships take focus this week.'
      },
      monthly: {
        date: currentMonth,
        overview: monthlyOverviews[monthlySeed % monthlyOverviews.length],
        love: monthlyLove[(monthlySeed + 1) % monthlyLove.length]
      },
      yearly: {
        date: new Date().getFullYear().toString(),
        overview: `The year ${new Date().getFullYear()} is a major stepping stone for ${sign}. Expect significant transformations and long-term achievements to finally take root.`,
        love: `Relationships this year will demand honesty and deeper commitment for ${sign}. Patience will lead to lasting bonds.`
      }
    }
  };

  return res.status(200).json(
    new ApiResponse(200, horoscopeData, 'Horoscope fetched')
  );
});

// POST /api/tools/kundli
export const getKundli = asyncHandler(async (req, res) => {
  const { name, dob, timeOfBirth, placeOfBirth, gender } = req.body;

  // Expected format for dob "YYYY-MM-DD", timeOfBirth "HH:mm"
  const bDate = new Date(dob || Date.now());
  const [hour, min] = timeOfBirth ? timeOfBirth.split(':').map(Number) : [12, 0];

  const data = {
    day: bDate.getDate(),
    month: bDate.getMonth() + 1,
    year: bDate.getFullYear(),
    hour: hour || 12,
    min: min || 0,
    lat: 28.6139,
    lon: 77.2090,
    tzone: 5.5
  };

  const kundliData = await astrologyService.getKundli(data);

  return res.status(200).json(
    new ApiResponse(200, {
      name: name || 'User',
      dob,
      timeOfBirth,
      gender,
      ascendant: kundliData.astroDetails?.ascendant || 'Unknown',
      moonSign: kundliData.astroDetails?.sign || 'Unknown',
      nakshatra: kundliData.astroDetails?.Naksahtra || 'Unknown',
      isManglik: kundliData.manglik?.is_present || false,
      summary: kundliData.manglik?.manglik_report || 'Your Kundli has been generated successfully. Consult an astrologer for deeper insights.',
      planets: kundliData.planets,
      chartSvg: kundliData.chartSvg
    }, 'Kundli generated')
  );
});
