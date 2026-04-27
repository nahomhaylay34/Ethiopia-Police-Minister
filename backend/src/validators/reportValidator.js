const Joi = require('joi');

const submitReport = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().required(),
  crime_type: Joi.string().valid('theft', 'assault', 'burglary', 'fraud', 'cybercrime', 'vandalism', 'missing person', 'other').required(),
  location: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  urgency_level: Joi.string().valid('low', 'medium', 'high', 'emergency').required(),
  occurrence_date: Joi.date().iso().required(),
  anonymous_reference: Joi.string().optional()
});

const updateReportStatus = Joi.object({
  status: Joi.string().valid('pending', 'under_review', 'investigating', 'resolved', 'closed').required()
});

module.exports = {
  submitReport,
  updateReportStatus
};
