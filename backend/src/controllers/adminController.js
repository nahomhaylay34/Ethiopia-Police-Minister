const { Report, User, Case, AuditLog, Alert } = require('../models');
const catchAsync = require('../utils/catchAsync');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');
const { signEmailToken } = require('../utils/tokenUtils');
const { buildVerificationEmail, sendEmail } = require('../utils/emailService');
const { notifyUserByEmail, notifyRole } = require('../utils/notificationService');

const buildDateRange = (query) => {
  const dateRange = query.date_range || 'month';
  const now = query.end_date ? new Date(query.end_date) : new Date();
  let startDate;

  switch (dateRange) {
    case 'today':
      startDate = new Date(now);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'year':
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      startDate = query.start_date ? new Date(query.start_date) : new Date(now);
      break;
    case 'month':
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
  }

  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return previous === null ? 0 : ((current - previous) / previous) * 100;
};

exports.getStats = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = buildDateRange(req.query);
  const rangeMs = endDate.getTime() - startDate.getTime();
  const previousStart = new Date(startDate.getTime() - rangeMs - 1);
  const previousEnd = new Date(endDate.getTime() - rangeMs - 1);

  const reportFilter = { created_at: { [Op.between]: [startDate, endDate] } };
  const previousReportFilter = { created_at: { [Op.between]: [previousStart, previousEnd] } };
  const caseFilter = { created_at: { [Op.between]: [startDate, endDate] } };

  const [totalReports, totalCases, totalUsers, previousTotalReports] = await Promise.all([
    Report.count({ where: reportFilter }),
    Case.count({ where: caseFilter }),
    User.count(),
    Report.count({ where: previousReportFilter })
  ]);

  const reportStatusRows = await Report.findAll({
    where: reportFilter,
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
    group: ['status']
  });

  const caseStatusRows = await Case.findAll({
    where: caseFilter,
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
    group: ['status']
  });

  const urgencyRows = await Report.findAll({
    where: reportFilter,
    attributes: ['urgency_level', [sequelize.fn('COUNT', sequelize.col('urgency_level')), 'count']],
    group: ['urgency_level']
  });

  const officerCount = await User.count({ where: { role: 'officer' } });
  const activeOfficerCount = officerCount; // no leave data currently available
  const officerCaseLoadRows = await Case.findAll({
    where: { assigned_to: { [Op.ne]: null } },
    attributes: ['assigned_to', [sequelize.fn('COUNT', sequelize.col('assigned_to')), 'count']],
    group: ['assigned_to']
  });

  const totalCitizens = await User.count({ where: { role: 'citizen' } });
  const verifiedCitizens = await User.count({ where: { role: 'citizen', is_verified: true } });
  const newCitizensThisPeriod = await User.count({ where: { role: 'citizen', created_at: { [Op.between]: [startDate, endDate] } } });
  const anonymousReports = await Report.count({ where: { user_id: null } });

  const closedCaseAverage = await Case.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.literal('TIMESTAMPDIFF(HOUR, opened_at, closed_at)')), 'avg_hours']],
    where: {
      status: 'closed',
      closed_at: { [Op.between]: [startDate, endDate] }
    }
  });

  const mostProductiveOfficer = await Case.findOne({
    attributes: ['assigned_to', [sequelize.fn('COUNT', sequelize.col('assigned_to')), 'resolved_cases']],
    where: { status: 'closed', assigned_to: { [Op.ne]: null } },
    group: ['assigned_to'],
    order: [[sequelize.literal('resolved_cases'), 'DESC']],
    limit: 1
  });

  const mostProductive = mostProductiveOfficer
    ? {
        user_id: mostProductiveOfficer.assigned_to,
        name: null,
        resolved_cases: parseInt(mostProductiveOfficer.dataValues.resolved_cases, 10)
      }
    : { user_id: null, name: null, resolved_cases: 0 };

  if (mostProductive.user_id) {
    const userRecord = await User.findByPk(mostProductive.user_id);
    mostProductive.name = userRecord ? userRecord.full_name : 'Unknown Officer';
  }

  const reportStatusCounts = reportStatusRows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.dataValues.count, 10);
    return acc;
  }, {});

  const caseStatusCounts = caseStatusRows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.dataValues.count, 10);
    return acc;
  }, {});

  const urgencyCounts = urgencyRows.reduce((acc, row) => {
    acc[row.urgency_level] = parseInt(row.dataValues.count, 10);
    return acc;
  }, {});

  const percentageChange = {
    total: calculateChange(totalReports, previousTotalReports),
    pending: calculateChange(reportStatusCounts.pending || 0, 0),
    investigating: calculateChange(reportStatusCounts.investigating || 0, 0),
    resolved: calculateChange(reportStatusCounts.resolved || 0, 0),
    closed: calculateChange(reportStatusCounts.closed || 0, 0)
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      totalReports,
      totalCases,
      totalUsers,
      resolutionRate: totalReports > 0 ? ((reportStatusCounts.resolved || 0) / totalReports) * 100 : 0,
      reports: {
        total: totalReports,
        pending: reportStatusCounts.pending || 0,
        investigating: reportStatusCounts.investigating || 0,
        resolved: reportStatusCounts.resolved || 0,
        closed: reportStatusCounts.closed || 0,
        percentage_change: percentageChange
      },
      cases: {
        total: totalCases,
        open: caseStatusCounts.open || 0,
        investigation: caseStatusCounts.investigation || 0,
        awaiting_approval: caseStatusCounts.awaiting_approval || 0,
        closed: caseStatusCounts.closed || 0,
        average_resolution_days: closedCaseAverage?.dataValues?.avg_hours ? parseFloat((parseFloat(closedCaseAverage.dataValues.avg_hours) / 24).toFixed(1)) : 0,
        percentage_change: {
          total: 0,
          open: 0,
          closed: 0
        }
      },
      officers: {
        total: officerCount,
        active: activeOfficerCount,
        on_leave: 0,
        average_case_load: officerCaseLoadRows.length > 0 ? officerCaseLoadRows.reduce((sum, row) => sum + parseInt(row.dataValues.count, 10), 0) / officerCaseLoadRows.length : 0,
        most_productive: mostProductive
      },
      citizens: {
        total: totalCitizens,
        active: verifiedCitizens,
        new_this_period: newCitizensThisPeriod,
        verified: verifiedCitizens,
        anonymous_reports: anonymousReports
      },
      urgency_breakdown: {
        low: urgencyCounts.low || 0,
        medium: urgencyCounts.medium || 0,
        high: urgencyCounts.high || 0,
        emergency: urgencyCounts.emergency || 0
      },
      performance_metrics: {
        response_time_avg_hours: closedCaseAverage?.dataValues?.avg_hours ? parseFloat(closedCaseAverage.dataValues.avg_hours) : 0,
        resolution_rate: totalReports > 0 ? ((reportStatusCounts.resolved || 0) / totalReports) * 100 : 0,
        citizen_satisfaction: 0
      },
      time_period: {
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
        label: req.query.date_range || 'month'
      }
    },
    timestamp: new Date().toISOString()
  });
});

exports.getTrends = catchAsync(async (req, res, next) => {
  const trends = await Report.findAll({
    attributes: [
      [sequelize.fn('YEAR', sequelize.col('created_at')), 'year'],
      [sequelize.fn('MONTH', sequelize.col('created_at')), 'month'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['year', 'month'],
    order: [['year', 'ASC'], ['month', 'ASC']]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      trends
    },
    timestamp: new Date().toISOString()
  });
});

exports.getCrimeDistribution = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = buildDateRange(req.query);
  const includePercentages = req.query.include_percentages !== 'false';
  const groupBy = req.query.group_by || 'type';

  const where = { created_at: { [Op.between]: [startDate, endDate] } };
  const distributionRows = await Report.findAll({
    where,
    attributes: ['crime_type', [sequelize.fn('COUNT', sequelize.col('crime_type')), 'count']],
    group: ['crime_type'],
    order: [[sequelize.literal('count'), 'DESC']]
  });

  const total = distributionRows.reduce((sum, row) => sum + parseInt(row.dataValues.count, 10), 0);
  const colorMap = {
    theft: '#FF6B6B',
    assault: '#4ECDC4',
    burglary: '#FFD93D',
    fraud: '#45B7D1',
    cybercrime: '#6A82FB',
    vandalism: '#F67019',
    'missing person': '#9B5DE5',
    other: '#2EC4B6'
  };

  const distribution = distributionRows.map((row) => {
    const count = parseInt(row.dataValues.count, 10);
    return {
      crime_type: row.crime_type,
      label: row.crime_type.replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
      percentage: includePercentages && total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
      trend: '+0.0%',
      color: colorMap[row.crime_type] || '#A0AEC0',
      subcategories: []
    };
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      distribution,
      total_reports: total,
      last_updated: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

exports.getStatusDistribution = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = buildDateRange(req.query);
  const reportType = req.query.report_type || 'all';
  const where = { created_at: { [Op.between]: [startDate, endDate] } };

  if (reportType === 'citizen') {
    where.user_id = { [Op.ne]: null };
  } else if (reportType === 'anonymous') {
    where.user_id = null;
  }

  const statusRows = await Report.findAll({
    where,
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
    group: ['status']
  });

  const total = statusRows.reduce((sum, row) => sum + parseInt(row.dataValues.count, 10), 0);
  const statusLabels = {
    pending: 'Pending Review',
    under_review: 'Under Review',
    investigating: 'Investigating',
    resolved: 'Resolved',
    closed: 'Closed'
  };

  const distribution = statusRows.map((row) => {
    const count = parseInt(row.dataValues.count, 10);
    const percentage = total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
    const colorMap = {
      pending: '#FFA500',
      under_review: '#FFC107',
      investigating: '#17A2B8',
      resolved: '#28A745',
      closed: '#6C757D'
    };

    return {
      status: row.status,
      label: statusLabels[row.status] || row.status,
      count,
      percentage,
      average_duration_days: 0,
      color: colorMap[row.status] || '#A0AEC0'
    };
  });

  const activeCases = await Case.count({
    where: { status: { [Op.ne]: 'closed' } }
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      distribution,
      metrics: {
        total_active_cases: activeCases,
        average_processing_time_days: 0,
        backlog_count: distribution.find((item) => item.status === 'pending')?.count || 0,
        efficiency_score: total > 0 ? parseFloat(((distribution.find((item) => item.status === 'resolved')?.count || 0) / total * 100).toFixed(2)) : 0
      },
      status_flow: {
        pending_to_review: 0,
        review_to_investigating: 0,
        investigating_to_resolved: 0,
        resolved_to_closed: 0
      }
    },
    timestamp: new Date().toISOString()
  });
});

exports.getOfficerLoad = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = buildDateRange(req.query);
  const roleFilter = { [Op.in]: ['officer', 'detective'] };

  const officers = await User.findAll({
    where: {
      role: req.query.role ? req.query.role : roleFilter
    },
    attributes: ['id', 'full_name', 'role']
  });

  const casePriorityRows = await Case.findAll({
    where: { assigned_to: { [Op.ne]: null } },
    attributes: ['assigned_to', 'priority', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['assigned_to', 'priority']
  });

  const officerRecords = await Promise.all(
    officers.map(async (officer) => {
      const activeCases = await Case.count({
        where: { assigned_to: officer.id, status: { [Op.ne]: 'closed' } }
      });
      const totalAssigned = await Case.count({
        where: { assigned_to: officer.id }
      });
      const resolvedThisMonth = await Case.count({
        where: {
          assigned_to: officer.id,
          status: 'closed',
          closed_at: { [Op.between]: [startDate, endDate] }
        }
      });
      const pendingReports = await Case.count({
        where: { assigned_to: officer.id, status: 'open' }
      });

      const casesByPriority = {};
      casePriorityRows
        .filter((row) => row.assigned_to === officer.id)
        .forEach((row) => {
          casesByPriority[row.priority] = parseInt(row.dataValues.count, 10);
        });

      const overloadStatus = activeCases > 15 ? 'overloaded' : activeCases < 5 ? 'underloaded' : 'normal';
      const efficiencyScore = totalAssigned > 0 ? parseFloat(((resolvedThisMonth / totalAssigned) * 100).toFixed(1)) : 0;

      return {
        user_id: officer.id,
        name: officer.full_name,
        badge_number: null,
        role: officer.role,
        department: null,
        active_cases: activeCases,
        total_assigned: totalAssigned,
        resolved_this_month: resolvedThisMonth,
        pending_reports: pendingReports,
        average_resolution_days: 0,
        efficiency_score: efficiencyScore,
        overload_status: overloadStatus,
        cases_by_priority: {
          low: casesByPriority.low || 0,
          medium: casesByPriority.medium || 0,
          high: casesByPriority.high || 0,
          emergency: casesByPriority.emergency || 0
        }
      };
    })
  );

  const totalOfficers = officerRecords.length;
  const totalActiveCases = officerRecords.reduce((sum, item) => sum + item.active_cases, 0);
  const officersOverloaded = officerRecords.filter((item) => item.overload_status === 'overloaded').length;
  const officersUnderloaded = officerRecords.filter((item) => item.overload_status === 'underloaded').length;
  const officersOptimal = totalOfficers - officersOverloaded - officersUnderloaded;

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      officers: officerRecords,
      summary: {
        total_officers: totalOfficers,
        total_active_cases: totalActiveCases,
        average_case_load: totalOfficers > 0 ? parseFloat((totalActiveCases / totalOfficers).toFixed(1)) : 0,
        officers_overloaded: officersOverloaded,
        officers_underloaded: officersUnderloaded,
        officers_optimal: officersOptimal,
        recommended_adjustments: officerRecords
          .filter((item) => item.overload_status === 'overloaded')
          .slice(0, 3)
          .map((item) => `Reassign cases from ${item.name} to balance workload`)
      },
      heatmap_data: {
        by_hour: {},
        by_day: {}
      }
    },
    timestamp: new Date().toISOString()
  });
});

exports.getAlerts = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const alerts = await Alert.findAll({
    limit,
    order: [['created_at', 'DESC']]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      alerts
    },
    timestamp: new Date().toISOString()
  });
});


exports.exportData = catchAsync(async (req, res, next) => {
  const reports = await Report.findAll({
    include: [{ model: User, attributes: ['id', 'full_name', 'email'] }]
  });

  const fields = ['id', 'title', 'description', 'crime_type', 'location', 'status', 'occurrence_date', 'user.full_name', 'user.email'];
  const json2csv = new (require('json2csv').Parser)({ fields });
  const csv = json2csv.parse(reports);

  res.header('Content-Type', 'text/csv');
  res.attachment('reports.csv');
  res.send(csv);
});

exports.getAuditLogs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
    include: [{ model: User, attributes: ['id', 'full_name', 'email'] }]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      logs: rows
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

exports.getUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: { exclude: ['password_hash'] },
    order: [['created_at', 'DESC']]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      users
    },
    timestamp: new Date().toISOString()
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const {
    email,
    password,
    full_name,
    phone,
    national_id,
    address,
    role,
    is_verified,
    is_locked
  } = req.body;

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.id !== user.id) {
      return next(new AppError('User with this email already exists', 409));
    }
  }

  const allowedRoles = ['citizen', 'officer', 'detective', 'admin'];
  if (role && !allowedRoles.includes(role)) {
    return next(new AppError('Invalid role', 400));
  }

  if (email !== undefined) user.email = email;
  if (password) user.password_hash = password;
  if (full_name !== undefined) user.full_name = full_name;
  if (phone !== undefined) user.phone = phone;
  if (national_id !== undefined) user.national_id = national_id;
  if (address !== undefined) user.address = address;
  if (role !== undefined) user.role = role;
  if (is_verified !== undefined) user.is_verified = is_verified;
  if (is_locked !== undefined) user.is_locked = is_locked;

  await user.save();

  await notifyUserByEmail({
    user,
    type: 'system_alert',
    title: 'Your account has been updated',
    content: `An administrator has updated your account details. If you did not expect this change, please contact support.`,
    metadata: { updatedBy: req.user.id }
  });

  user.password_hash = undefined;

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      user
    },
    timestamp: new Date().toISOString()
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const { email, password, full_name, phone, national_id, address, role } = req.body;

  if (!email || !password || !full_name || !phone || !national_id || !address || !role) {
    return next(new AppError('All user fields are required', 400));
  }

  const allowedRoles = ['citizen', 'officer', 'detective', 'admin'];
  if (!allowedRoles.includes(role)) {
    return next(new AppError('Invalid role. Admin can only create citizen, officer, detective or admin users.', 400));
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 409));
  }

  const newUser = await User.create({
    email,
    password_hash: password,
    full_name,
    phone,
    national_id,
    address,
    role,
    is_verified: true
  });

  const emailToken = signEmailToken(newUser.id);
  const verificationEmail = buildVerificationEmail(newUser, emailToken);

  try {
    await sendEmail({
      to: newUser.email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html
    });
  } catch (err) {
    console.error('Email verification send error for admin user: ', err);
  }

  await notifyUserByEmail({
    user: newUser,
    type: 'system_alert',
    title: 'New account created',
    content: `Your account was created by admin and a verification email was sent to ${newUser.email}.`,
    metadata: { createdBy: req.user.id }
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        is_verified: newUser.is_verified
      }
    },
    timestamp: new Date().toISOString()
  });
});

exports.createAnnouncement = catchAsync(async (req, res, next) => {
  const { title, content, target_role } = req.body;
  if (!title || !content) {
    return next(new AppError('Title and content are required for announcement', 400));
  }

  if (target_role && target_role !== 'all') {
    await notifyRole({ role: target_role, type: 'system_alert', title: `Announcement: ${title}`, content });
  } else {
    await notifyRole({ role: 'citizen', type: 'system_alert', title: `Announcement: ${title}`, content });
    await notifyRole({ role: 'officer', type: 'system_alert', title: `Announcement: ${title}`, content });
    await notifyRole({ role: 'detective', type: 'system_alert', title: `Announcement: ${title}`, content });
  }

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Announcement sent to users',
    timestamp: new Date().toISOString()
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from deleting themselves or the help center
  if (user.id === req.user.id) {
    return next(new AppError('You cannot delete your own account', 403));
  }

  if (user.email === 'helpcenter@cms.com') {
    return next(new AppError('You cannot delete the system Help Center account', 403));
  }

  await notifyUserByEmail({
    user,
    type: 'system_alert',
    title: 'Your account has been deleted',
    content: `An administrator has deleted your account from the system. If you believe this is an error, please contact support.`,
    metadata: { deletedBy: req.user.id }
  });

  await user.destroy();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'User deleted successfully',
    timestamp: new Date().toISOString()
  });
});
