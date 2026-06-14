import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only rate an astrologer once (optional but good practice)
ratingSchema.index({ userId: 1, astrologerId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
