import mongoose from 'mongoose';

const astrologerDraftSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      index: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    draftData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const AstrologerDraft = mongoose.model('AstrologerDraft', astrologerDraftSchema);
export default AstrologerDraft;
