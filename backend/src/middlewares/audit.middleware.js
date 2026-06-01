import AuditLog from '../models/auditLog.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const auditLogMiddleware = asyncHandler(async (req, res, next) => {
  // We only log mutating actions (POST, PUT, PATCH, DELETE)
  if (req.method !== 'GET') {
    // Determine action based on HTTP method
    let action = 'UNKNOWN';
    if (req.method === 'POST') action = 'CREATE';
    else if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
    else if (req.method === 'DELETE') action = 'DELETE';

    // Try to extract resource from the URL (e.g., /api/admin/coupons -> 'coupons')
    const pathParts = req.originalUrl.split('?')[0].split('/');
    let resource = pathParts[pathParts.length - 1];
    
    // If the last part is an ID or "status", take the preceding part
    if (resource === 'status' || resource === 'refund' || /^[a-fA-F0-9]{24}$/.test(resource) || !isNaN(resource)) {
      resource = pathParts[pathParts.length - 2];
    }
    
    // Remove query params if any
    resource = resource.split('?')[0].toUpperCase();

    // Mask sensitive fields in details
    const details = { ...req.body };
    if (details.password) details.password = '***';
    if (details.oldPassword) details.oldPassword = '***';
    if (details.newPassword) details.newPassword = '***';

    // Run asynchronously without blocking the request
    try {
      if (req.user && req.user.role === 'admin') {
        await AuditLog.create({
          adminId: req.user._id,
          action,
          resource,
          details,
          ipAddress: req.ip || req.connection.remoteAddress,
        });
      }
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }

  next();
});
