const { Report, Evidence, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const { notifyUserByEmail, notifyRole } = require('../utils/notificationService');

exports.submitReport = catchAsync(async (req, res, next) => {
  console.log('req.user in submitReport:', req.user);
  const { title, description, crime_type, location, urgency_level, occurrence_date, anonymous_reference } = req.body;

  const newReport = await Report.create({
    user_id: req.user ? req.user.id : null,
    title,
    description,
    crime_type,
    location,
    urgency_level,
    occurrence_date,
    anonymous_reference
  });
  console.log('newReport after creation:', newReport);

  await notifyUserByEmail({
    user: req.user,
    type: 'system_alert',
    title: 'Potential crime reported',
    content: `Your potential crime report \"${newReport.title}\" was successfully submitted and will be reviewed by officers for preliminary evaluation.`,
    metadata: { reportId: newReport.id }
  });

  await notifyRole({
    role: 'officer',
    type: 'status_update',
    title: 'New potential crime tip received',
    content: `A new potential crime report has been submitted by ${req.user?.full_name}.`,
    metadata: { reportId: newReport.id }
  });

  await notifyRole({
    role: 'detective',
    type: 'status_update',
    title: 'New report received',
    content: `A new report has been submitted by ${req.user?.full_name}.`,
    metadata: { reportId: newReport.id }
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: {
      report: newReport
    },
    timestamp: new Date().toISOString()
  });
});

exports.getReports = catchAsync(async (req, res, next) => {
  const { crime_type, status, urgency_level, user_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (crime_type) where.crime_type = crime_type;
  if (status) where.status = status;
  if (urgency_level) where.urgency_level = urgency_level;
  
  if (req.user.role === 'citizen') {
    where.user_id = req.user.id;
  } else if (user_id) {
    where.user_id = user_id;
  }

  const { count, rows } = await Report.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
    include: [{ model: User, attributes: ['id', 'full_name'] }, { model: Evidence }]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      reports: rows
    },
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    },
    timestamp: new Date().toISOString()
  });
});

exports.getReport = catchAsync(async (req, res, next) => {
  const report = await Report.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['id', 'full_name'] }, { model: Evidence }]
  });

  if (!report) {
    return next(new AppError('No report found with that ID', 404));
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      report
    },
    timestamp: new Date().toISOString()
  });
});

exports.updateReportStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const report = await Report.findByPk(req.params.id);

  if (!report) {
    return next(new AppError('No report found with that ID', 404));
  }

  const oldStatus = report.status;
  report.status = status;
  await report.save();

  if (oldStatus !== status && report.user_id) {
    const receiver = await User.findByPk(report.user_id);
    if (receiver) {
      // General status update notification
      let content = `The status of your report "${report.title}" has been updated to: ${status.replace('_', ' ')}.`;
      
      if (status === 'rejected') {
        content = `Your report "${report.title}" has been reviewed and unfortunately rejected.`;
      } else if (status === 'case_created') {
        content = `A case has been officially created based on your report "${report.title}". Thank you for your assistance.`;
      } else if (status === 'under_review' || status === 'investigating') {
        content = `Your report "${report.title}" is now under review/investigation by an officer.`;
        
        // Also send a direct message from the officer
        const { Message } = require('../models');
        await Message.create({
          sender_id: req.user.id,
          receiver_id: report.user_id,
          content: `Hello, I am reviewing your report regarding "${report.title}". Please let me know if you have any additional information.`,
        });
      }

      await require('../utils/notificationService').notifyUserByEmail({
        user: receiver,
        type: 'status_update',
        title: `Update on your report: ${report.title}`,
        content: content,
        metadata: { reportId: report.id, newStatus: status }
      });
    }
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      report
    },
    timestamp: new Date().toISOString()
  });
});

exports.deleteReport = catchAsync(async (req, res, next) => {
  const report = await Report.findByPk(req.params.id);

  if (!report) {
    return next(new AppError('No report found with that ID', 404));
  }

  await report.destroy();

  res.status(204).json({
    success: true,
    statusCode: 204,
    data: null,
    timestamp: new Date().toISOString()
  });
});
