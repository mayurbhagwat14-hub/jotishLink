import axios from 'axios';

class SmsService {
  /**
   * Send an OTP SMS via INDIA SMS HUB
   * @param {string} phoneNumber - Recipient's mobile number
   * @param {string} otp - 4-digit or 6-digit OTP code
   */
  static async sendOtp(phoneNumber, otp) {
    const apiKey = process.env.INDIA_SMS_HUB_API_KEY;
    const senderId = process.env.INDIA_SMS_HUB_SENDER_ID || 'JYOTSH';
    const templateId = process.env.INDIA_SMS_HUB_TEMPLATE_ID;
    const baseUrl = process.env.INDIA_SMS_HUB_BASE_URL;

    const message = `Welcome to the V10 gym powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;

    // Console logging is crucial for local dev bypass and visual client inspection
    console.log(`[SMS SERVICE] Generated OTP for +91 ${phoneNumber}: ${otp}`);

    if (!apiKey || !baseUrl) {
      console.log('[SMS SERVICE] INDIA SMS HUB credentials missing. SMS send bypassed in local test mode.');
      return { success: true, mocked: true };
    }

    try {
      // SMSIndiaHub specific API structure
      const params = {
        APIKey: apiKey,
        senderid: senderId,
        channel: '2',
        DCS: '0',
        flashsms: '0',
        number: phoneNumber,
        text: message,
        route: '1'
      };

      // If a DLT Template ID is provided in .env, pass it along. (Usually key is templateid or dlttemplateid depending on provider)
      if (templateId) {
        params.templateid = templateId;
      }

      const response = await axios.get(baseUrl, { params });

      console.log(`[SMS SERVICE] INDIA SMS HUB Response:`, response.data);
      return { success: true, providerResponse: response.data };
    } catch (error) {
      console.error(`[SMS SERVICE] Failed to send SMS via INDIA SMS HUB: ${error.message}`);
      // Return success: false, but don't crash.
      return { success: false, error: error.message };
    }
  }
}

export default SmsService;
