const Joi = require('joi');

const createCase = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  report_ids: Joi.array().items(Joi.string().uuid()).optional(),
  assigned_to: Joi.string().uuid().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  crime_type: Joi.string().valid('theft', 'assault', 'burglary', 'fraud', 'cybercrime', 'vandalism', 'missing_person', 'other').optional(),
  status: Joi.string().valid('open', 'under_investigation', 'awaiting_court', 'closed').optional(),
  incident_date: Joi.date().iso().optional(),
  location: Joi.string().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  suspects: Joi.array().items(Joi.object({
    full_name: Joi.string().required(),
    national_id: Joi.string().optional(),
    photo_url: Joi.string().uri().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    criminal_status: Joi.string().valid('unknown', 'suspected', 'arrested', 'convicted', 'released').optional(),
    role: Joi.string().optional()
  })).optional()
});

const assignCase = Joi.object({
  user_id: Joi.string().uuid().required()
});

const addCaseNote = Joi.object({
  note: Joi.string().required(),
  update_type: Joi.string().optional()
});

module.exports = {
  createCase,
  assignCase,
  addCaseNote
};
