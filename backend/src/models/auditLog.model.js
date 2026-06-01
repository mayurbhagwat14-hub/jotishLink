import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g., 'CREATE', 'UPDATE', 'DELETE'
    },
    resource: {
      type: String,
      required: true, // e.g., 'Coupon', 'User', 'Product'
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Request body or specific details
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
