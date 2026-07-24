import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    reviews: {
      type: Number,
      default: 0,
      min: [0, 'Reviews count cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    minStock: {
      type: Number,
      default: 10,
      min: [0, 'Minimum stock cannot be negative']
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
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be at least 0.1']
    },
    length: {
      type: Number,
      required: [true, 'Length is required'],
      min: [0.1, 'Length must be at least 0.1']
    },
    breadth: {
      type: Number,
      required: [true, 'Breadth is required'],
      min: [0.1, 'Breadth must be at least 0.1']
    },
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [0.1, 'Height must be at least 0.1']
    },
    gstPercent: {
      type: Number,
      default: null,
      min: [0, 'GST percent cannot be negative'],
      max: [100, 'GST percent cannot exceed 100']
    },
    hsnCode: {
      type: String,
      default: '000000',
    },
    isFreeShipping: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
