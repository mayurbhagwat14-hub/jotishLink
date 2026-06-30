import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InvoiceService {
  /**
   * Generates a PDF invoice for an order
   * @param {Object} order - The populated Order document
   * @param {Object} res - Express response object to stream the PDF
   */
  static generateInvoice(order, res) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        
        // Setup response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="Invoice-${order._id.toString().substring(0, 8)}.pdf"`
        );

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Astrotalk Replica (JyotishLink)', { align: 'center' });
        doc.fontSize(10).text('123, Sample GST Address, New Delhi, India 110001', { align: 'center' });
        doc.text('GSTIN: 07AADCS2544M1Z2', { align: 'center' });
        doc.moveDown();
        doc.moveDown();

        doc.fontSize(16).text('TAX INVOICE', { align: 'center', underline: true });
        doc.moveDown();

        // Order Info & Customer Info
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        doc.fontSize(10);
        doc.text(`Order ID: ${order._id}`);
        doc.text(`Invoice Date: ${orderDate}`);
        if (order.invoiceNumber) {
          doc.text(`Invoice No: ${order.invoiceNumber}`);
        }
        
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Billed To:');
        doc.font('Helvetica').text(order.shippingAddress.fullName);
        doc.text(order.shippingAddress.addressLine);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
        doc.text(`Phone: ${order.shippingAddress.phone}`);
        doc.text(`Email: ${order.shippingAddress.email}`);
        doc.moveDown();

        // Table Header
        let y = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, y, { width: 150 });
        doc.text('HSN', 200, y, { width: 50 });
        doc.text('Qty', 260, y, { width: 30 });
        doc.text('Price', 300, y, { width: 60 });
        doc.text('GST %', 370, y, { width: 40 });
        doc.text('Total', 420, y, { width: 60, align: 'right' });
        
        doc.moveTo(50, y + 15).lineTo(500, y + 15).stroke();
        y += 20;

        // Items
        doc.font('Helvetica');
        let index = 0;
        for (const item of order.items) {
          const itemName = item.productId?.name || 'Unknown Item';
          const hsn = item.hsnCode || '000000';
          const qty = item.quantity;
          const price = item.price.toFixed(2);
          const gst = `${item.gstPercent || 18}%`;
          const total = (item.price * item.quantity).toFixed(2);

          doc.text(itemName, 50, y, { width: 150 });
          doc.text(hsn, 200, y, { width: 50 });
          doc.text(qty.toString(), 260, y, { width: 30 });
          doc.text(price, 300, y, { width: 60 });
          doc.text(gst, 370, y, { width: 40 });
          doc.text(total, 420, y, { width: 60, align: 'right' });
          
          y += 20;
          index++;
        }
        
        doc.moveTo(50, y).lineTo(500, y).stroke();
        y += 15;

        // Totals Breakdown
        doc.text('Subtotal:', 300, y, { width: 120 });
        doc.text(`Rs ${order.subtotal?.toFixed(2) || '0.00'}`, 420, y, { width: 60, align: 'right' });
        y += 15;

        if (order.discountAmount > 0) {
          doc.text(`Discount (${order.couponCode || 'Coupon'}):`, 300, y, { width: 120 });
          doc.text(`- Rs ${order.discountAmount.toFixed(2)}`, 420, y, { width: 60, align: 'right' });
          y += 15;
        }

        doc.text('Taxable Amount:', 300, y, { width: 120 });
        doc.text(`Rs ${order.taxableAmount?.toFixed(2) || '0.00'}`, 420, y, { width: 60, align: 'right' });
        y += 15;

        doc.text('GST Amount:', 300, y, { width: 120 });
        doc.text(`Rs ${order.gstAmount?.toFixed(2) || '0.00'}`, 420, y, { width: 60, align: 'right' });
        y += 15;

        if (order.shippingFee > 0) {
          doc.text('Shipping Fee:', 300, y, { width: 120 });
          doc.text(`Rs ${order.shippingFee.toFixed(2)}`, 420, y, { width: 60, align: 'right' });
          y += 15;
        }

        doc.moveTo(300, y).lineTo(500, y).stroke();
        y += 10;

        doc.font('Helvetica-Bold');
        doc.text('Grand Total:', 300, y, { width: 120 });
        doc.text(`Rs ${order.totalAmount.toFixed(2)}`, 420, y, { width: 60, align: 'right' });

        doc.moveDown();
        doc.moveDown();
        
        doc.font('Helvetica');
        doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, y);
        doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, y + 15);

        doc.moveDown(3);
        doc.fontSize(10).text('Thank you for shopping with us!', { align: 'center', italic: true });
        
        doc.end();
        
        res.on('finish', () => resolve(true));
        res.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default InvoiceService;
