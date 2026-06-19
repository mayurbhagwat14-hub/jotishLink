import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { fetchDailyHoroscope } from '../services/astrology.service.js';

// GET /api/astrology/daily-horoscope/:sign
export const getDailyHoroscope = asyncHandler(async (req, res) => {
  const { sign } = req.params;
  
  if (!sign) {
    throw new ApiError(400, 'Zodiac sign is required');
  }

  const validSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  if (!validSigns.includes(sign.toLowerCase())) {
    throw new ApiError(400, 'Invalid zodiac sign');
  }

  const horoscopeData = await fetchDailyHoroscope(sign);

  res.status(200).json(new ApiResponse(200, horoscopeData, 'Daily horoscope fetched successfully'));
});
