import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import axios from 'axios';

// Helper: build Swiss Ephemeris / Panchang data (mocked with real structure)
const todayPanchang = () => {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const tithis = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
    'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya'];
  const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
    'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
  const yogas = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shoola', 'Ganda'];

  const dayIndex = now.getDay();
  const tithiIndex = now.getDate() % 15;
  const nakshatraIndex = Math.floor((now.getDate() + now.getMonth()) % 27);
  const yogaIndex = Math.floor((now.getDate() + now.getMonth() * 2) % 10);

  return {
    date: now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    vaar: days[dayIndex],
    tithi: tithis[tithiIndex],
    nakshatra: nakshatras[nakshatraIndex],
    yoga: yogas[yogaIndex],
    sunrise: '06:05 AM',
    sunset: '07:12 PM',
    moonrise: '09:30 AM',
    moonset: '10:15 PM',
    rahuKaal: '12:00 PM - 01:30 PM',
    gulikaKaal: '07:30 AM - 09:00 AM',
    yamaGanda: '10:30 AM - 12:00 PM',
    abhijitMuhurat: '11:52 AM - 12:44 PM',
    paksha: tithiIndex < 15 ? 'Shukla Paksha' : 'Krishna Paksha',
    auspiciousTime: ['09:00 AM - 10:30 AM', '02:00 PM - 03:30 PM'],
    inauspiciousTime: ['12:00 PM - 01:30 PM'],
  };
};

// GET /api/tools/panchang
export const getPanchang = asyncHandler(async (req, res) => {
  const panchang = todayPanchang();
  return res.status(200).json(new ApiResponse(200, { panchang }, 'Panchang fetched'));
});

// GET /api/tools/muhurat
export const getMuhurat = asyncHandler(async (req, res) => {
  const muhurats = [
    { name: 'Vivah Muhurat', time: '11:30 AM - 01:00 PM', quality: 'Excellent', date: 'Today' },
    { name: 'Griha Pravesh', time: '09:00 AM - 10:30 AM', quality: 'Good', date: 'Today' },
    { name: 'Business Start', time: '07:00 AM - 08:00 AM', quality: 'Good', date: 'Today' },
    { name: 'Vehicle Purchase', time: '10:30 AM - 12:00 PM', quality: 'Average', date: 'Today' },
    { name: 'Namkaran', time: '08:00 AM - 09:00 AM', quality: 'Excellent', date: 'Tomorrow' },
  ];
  return res.status(200).json(new ApiResponse(200, { muhurats }, 'Muhurat fetched'));
});

// POST /api/tools/matchmaking
export const checkMatchmaking = asyncHandler(async (req, res) => {
  const { boyName, girlName, boyDob, girlDob } = req.body;

  // Deterministic match score based on names
  const nameScore = (str) => str.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const combined = nameScore(boyName || 'A') + nameScore(girlName || 'B');
  const gunas = Math.min(36, Math.max(18, combined % 36));

  const matchDetails = [
    { aspect: 'Varna', score: Math.min(1, gunas % 4), max: 1, desc: 'Spiritual compatibility' },
    { aspect: 'Vashya', score: Math.min(2, gunas % 5), max: 2, desc: 'Dominance & control' },
    { aspect: 'Tara', score: Math.min(3, gunas % 6), max: 3, desc: 'Destiny & health' },
    { aspect: 'Yoni', score: Math.min(4, gunas % 5), max: 4, desc: 'Physical compatibility' },
    { aspect: 'Graha Maitri', score: Math.min(5, gunas % 7), max: 5, desc: 'Mental compatibility' },
    { aspect: 'Gana', score: Math.min(6, gunas % 7), max: 6, desc: 'Nature & temperament' },
    { aspect: 'Bhakut', score: Math.min(7, gunas % 8), max: 7, desc: 'Love & prosperity' },
    { aspect: 'Nadi', score: Math.min(8, gunas % 9), max: 8, desc: 'Health & progeny' },
  ];

  const totalScore = matchDetails.reduce((s, d) => s + d.score, 0);
  const verdict = totalScore >= 28 ? 'Excellent Match' : totalScore >= 22 ? 'Good Match' : totalScore >= 18 ? 'Average Match' : 'Below Average';

  return res.status(200).json(
    new ApiResponse(200, {
      boyName, girlName,
      totalGunas: totalScore,
      maxGunas: 36,
      verdict,
      matchDetails,
      recommendation: verdict === 'Excellent Match'
        ? 'The couple shares strong compatibility. This match is highly recommended.'
        : 'Consult with our expert astrologers for personalized guidance.',
    }, 'Matchmaking result')
  );
});

// POST /api/tools/horoscope
export const getHoroscope = asyncHandler(async (req, res) => {
  const { sign, period = 'daily' } = req.body;

  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  const horoscopeData = {
    sign: sign || 'Aries',
    period,
    prediction: `Today brings exciting opportunities for ${sign || 'you'}. The stars are aligned in your favor. Trust your intuition and take calculated risks. Love life looks promising with Venus in your favor. Financially, avoid major investments today. Health: Focus on mental well-being and practice meditation.`,
    luckyNumber: Math.floor(Math.random() * 9) + 1,
    luckyColor: ['Red', 'Blue', 'Yellow', 'Green', 'Orange', 'Purple'][Math.floor(Math.random() * 6)],
    luckyDay: ['Monday', 'Wednesday', 'Friday'][Math.floor(Math.random() * 3)],
    compatibility: signs[Math.floor(Math.random() * 12)],
    categories: {
      love: `Romance blooms. Express your feelings openly.`,
      career: `Professional growth is on the horizon. New projects bring recognition.`,
      health: `Maintain energy with balanced diet and rest.`,
      finance: `Be cautious with spending. Savings look promising.`,
    },
    planets: {
      sun: 'Aries',
      moon: 'Cancer',
      mercury: 'Taurus',
      venus: 'Pisces',
      mars: 'Capricorn',
    },
  };

  return res.status(200).json(new ApiResponse(200, { horoscope: horoscopeData }, 'Horoscope fetched'));
});

// POST /api/tools/kundli
export const getKundli = asyncHandler(async (req, res) => {
  const { name, dob, timeOfBirth, placeOfBirth, gender } = req.body;

  // Mock kundli with real structure
  const planetList = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const rashis = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya'];

  const nameHash = (name || 'User').split('').reduce((s, c) => s + c.charCodeAt(0), 0);

  const planets = planetList.map((planet, i) => ({
    planet,
    rashi: rashis[(nameHash + i) % 12],
    house: ((nameHash + i) % 12) + 1,
    degree: parseFloat(((nameHash * (i + 1)) % 30).toFixed(2)),
    nakshatra: nakshatras[(nameHash + i) % 8],
    retrograde: i > 5 && nameHash % 2 === 0,
  }));

  const doshas = {
    mangalDosha: nameHash % 3 === 0,
    kaalSarpDosha: nameHash % 5 === 0,
    pitrDosha: nameHash % 7 === 0,
  };

  return res.status(200).json(
    new ApiResponse(200, {
      name: name || 'User',
      dob,
      timeOfBirth,
      placeOfBirth,
      gender,
      planets,
      doshas,
      ascendant: { rashi: rashis[nameHash % 12], degree: parseFloat((nameHash % 30).toFixed(2)) },
      mahadasha: { planet: planetList[nameHash % 9], startDate: '2022-01-01', endDate: '2039-01-01' },
      summary: `Your Kundli reveals a ${doshas.mangalDosha ? 'Manglik' : 'non-Manglik'} profile. Consult our expert astrologers for a detailed reading and remedies tailored for you.`,
    }, 'Kundli generated')
  );
});
