const supabase = require('../config/database');

const logAdminAction = async ({ adminId, action, entityType, entityId, details, ipAddress, userAgent }) => {
  const { error } = await supabase.from('audit_logs').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details || {},
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  if (error) throw error;
};

module.exports = {
  logAdminAction,
};
