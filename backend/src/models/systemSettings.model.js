import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    appName: { type: String, default: 'JyotishLink' },
    appLogo: { type: String, default: '' },
    appLogoPublicId: { type: String, default: '' },
    tagline: { type: String, default: 'Connect with the Stars' },
    supportEmail: { type: String, default: 'support@jyotishlink.com' },
    supportPhone: { type: String, default: '+91 9999999999' },
    astrologerBannerMessage: { type: String, default: 'Will I have love or arranged marriage?' },
    commissionRates: {
      chat: { type: Number, default: 30 },
      audioCall: { type: Number, default: 30 },
      videoCall: { type: Number, default: 30 },
      pooja: { type: Number, default: 20 },
      storeProduct: { type: Number, default: 10 },
    },
    newUserWalletBonus: { type: Number, default: 0 },
    minChatBalance: { type: Number, default: 10 },
    maintenanceMode: { type: Boolean, default: false },
    razorpayEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    freeChatDuration: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
