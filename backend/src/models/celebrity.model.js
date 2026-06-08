import mongoose from 'mongoose';

const celebritySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    quote: {
      type: String,
      trim: true,
    },
    img: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Celebrity = mongoose.model('Celebrity', celebritySchema);
export default Celebrity;
