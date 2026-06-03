import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    discount: {
      type: String,
    },
    image: {
      type: String,
      default: '',
    },
    cloudinaryPublicId: {
      type: String,
    },
    img: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    minStock: {
      type: Number,
      default: 10,
    },
    sku: {
      type: String,
      trim: true,
    },
    sold: {
      type: Number,
      default: 0,
    },
    featuredSection: {
      type: String,
      enum: ['none', 'top_selling', 'newly_launch'],
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
