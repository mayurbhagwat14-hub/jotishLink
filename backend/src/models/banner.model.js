import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
    },
    position: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pages: {
      type: [String],
      enum: ['Home', 'Home_Middle', 'Store'],
      default: ['Home'],
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
