import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    astrologerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Astrologer',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
      trim: true,
      default: '',
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Ensure one review per user per astrologer
reviewSchema.index({ astrologerId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
