import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    appName: { type: String, default: 'JyotishLink' },
    tagline: { type: String, default: 'Connect with the Stars' },
    supportEmail: { type: String, default: 'support@jyotishlink.com' },
    supportPhone: { type: String, default: '+91 9999999999' },
    commissionPercent: { type: Number, default: 30 }, // 30% platform cut
    newUserWalletBonus: { type: Number, default: 150 },
    minChatBalance: { type: Number, default: 10 },
    maintenanceMode: { type: Boolean, default: false },
    razorpayEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
