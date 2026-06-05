import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel', // Can be User, Astrologer, Admin
    },
    userModel: {
      type: String,
      enum: ['User', 'Astrologer', 'Admin'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId, // The astrologer or object being modified
    },
    action: {
      type: String,
      required: true, // e.g., 'CREATE', 'UPDATE', 'DELETE', 'Astrologer Registered'
    },
    resource: {
      type: String, // e.g., 'Coupon', 'User', 'Product', 'Astrologer'
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
