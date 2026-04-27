const { AuditLog } = require('../models');

const auditLogger = (action, entity_type) => async (req, res, next) => {
  const originalJson = res.json;

  res.json = async function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        await AuditLog.create({
          user_id: req.user ? req.user.id : null,
          action,
          entity_type,
          entity_id: req.params.id || (body.data && body.data.id) || null,
          old_data: res.locals.oldData || null,
          new_data: body.data || null,
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      } catch (error) {
        console.error('Audit logging failed:', error);
      }
    }
    originalJson.call(this, body);
  };

  next();
};

module.exports = auditLogger;
