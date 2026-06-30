import Product from '../models/product.model.js';
import Coupon from '../models/coupon.model.js';
import SystemSettings from '../models/systemSettings.model.js';

class PricingService {
  /**
   * Calculates the exact breakdown of an order based on items and a coupon.
   * Everything is evaluated real-time against the DB to prevent frontend tampering.
   * 
   * @param {Array} items - Array of { productId, quantity }
   * @param {String} couponCode - Optional coupon code
   * @param {Object} userDetails - Optional { userId, isFirstOrder } for advanced validation
   * @returns {Object} Comprehensive pricing breakdown
   */
  static async calculateOrderPricing(items = [], couponCode = null, userDetails = null) {
    if (!items || items.length === 0) {
      return this._getEmptyBreakdown();
    }

    // Fetch dynamic settings from Admin Panel
    let settings = await SystemSettings.findOne();
    if (!settings) {
       settings = await SystemSettings.create({});
    }
    const flatShippingRate = settings.flatShippingFee !== undefined ? settings.flatShippingFee : 50;
    const defaultGstRate = settings.defaultGstPercent !== undefined ? settings.defaultGstPercent : 18;

    let subtotal = 0;
    let shippingFee = 0;
    const validatedItems = [];

    // 1. Validate Products & Calculate Base Pricing
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.inStock || product.stock < item.quantity) {
        throw new Error(`Product ${product ? product.name : item.productId} is unavailable or out of stock.`);
      }

      // We use the current real-time price from the DB
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      if (!product.isFreeShipping) {
         // Apply dynamic shipping fee per unique product (or flat, customizable later)
         shippingFee += flatShippingRate; 
      }

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
        gstPercent: product.gstPercent !== undefined && product.gstPercent !== null ? product.gstPercent : defaultGstRate,
        hsnCode: product.hsnCode || '000000',
        weight: product.weight || 0,
        discountApplied: 0,
        taxableAmount: 0,
        gstAmount: 0,
        costPrice: product.costPrice || 0
      });
    }

    // 2. Validate & Apply Coupon
    let couponDiscount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      
      if (!coupon) {
        throw new Error('Invalid or inactive coupon code.');
      }
      
      if (coupon.expiryDate && new Date() > coupon.expiryDate) {
        throw new Error('This coupon has expired.');
      }

      if (coupon.usageLimit > 0 && coupon.currentUsage >= coupon.usageLimit) {
        throw new Error('This coupon has reached its global usage limit.');
      }

      if (coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) {
        throw new Error(`Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`);
      }

      if (userDetails && coupon.usagePerUser > 0) {
        const userUsage = coupon.usedBy?.find(u => u.userId.toString() === userDetails.userId.toString());
        if (userUsage && userUsage.count >= coupon.usagePerUser) {
          throw new Error('You have already used this coupon the maximum allowed times.');
        }
      }

      if (coupon.isFirstOrderOnly && userDetails && !userDetails.isFirstOrder) {
        throw new Error('This coupon is only valid for first-time orders.');
      }

      // Calculate the discount
      if (coupon.discountType === 'fixed') {
        couponDiscount = coupon.discountPercent; // repurpose field for fixed amount
      } else {
        couponDiscount = (subtotal * coupon.discountPercent) / 100;
        if (coupon.maxDiscount > 0 && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      }

      if (couponDiscount > subtotal) {
        couponDiscount = subtotal; // Cannot discount more than subtotal
      }
      
      appliedCoupon = coupon;
    }

    // 3. Distribute Discount & Calculate GST precisely per item
    let totalTaxableAmount = 0;
    let totalGstAmount = 0;

    for (let i = 0; i < validatedItems.length; i++) {
      const item = validatedItems[i];
      
      // Proportional discount distribution
      const itemWeight = item.total / subtotal; 
      const itemDiscount = couponDiscount * itemWeight;
      
      item.discountApplied = parseFloat(itemDiscount.toFixed(2));
      item.taxableAmount = parseFloat((item.total - item.discountApplied).toFixed(2));
      
      // Calculate GST (Exclusive: Added on top of taxable amount)
      item.gstAmount = parseFloat(((item.taxableAmount * item.gstPercent) / 100).toFixed(2));
      
      totalTaxableAmount += item.taxableAmount;
      totalGstAmount += item.gstAmount;
    }

    // Fix floating point errors
    totalTaxableAmount = parseFloat(totalTaxableAmount.toFixed(2));
    totalGstAmount = parseFloat(totalGstAmount.toFixed(2));

    const grandTotal = parseFloat((totalTaxableAmount + totalGstAmount + shippingFee).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      productDiscount: 0, 
      couponDiscount: parseFloat(couponDiscount.toFixed(2)),
      taxableAmount: totalTaxableAmount,
      gstAmount: totalGstAmount,
      shippingFee,
      grandTotal,
      appliedCoupon,
      items: validatedItems
    };
  }

  static _getEmptyBreakdown() {
    return {
      subtotal: 0,
      productDiscount: 0,
      couponDiscount: 0,
      taxableAmount: 0,
      gstAmount: 0,
      shippingFee: 0,
      grandTotal: 0,
      appliedCoupon: null,
      items: []
    };
  }
}

export default PricingService;
