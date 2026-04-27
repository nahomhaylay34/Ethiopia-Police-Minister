const { Case, Report, User, CaseUpdate, CaseReport, Suspect, Evidence, EvidenceCustody } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { Op } = require('sequelize');
const { notifyUserByEmail } = require('../utils/notificationService');

const generateCaseNumber = async () => {
  const pad = (n) => n.toString().padStart(4, '0');
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  let attempt = 0;
  while (attempt < 10) {
    const suffix = pad(Math.floor(Math.random() * 10000));
    const candidate = `CASE-${y}${m}${d}-${suffix}`;
    const existing = await Case.findOne({ where: { case_number: candidate } });
    if (!existing) return candidate;
    attempt++;
  }
  return `CASE-${Date.now()}`; // fallback
};

exports.createCase = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    report_ids,
    assigned_to,
    priority,
    crime_type,
    incident_date,
    location,
    latitude,
    longitude,
    suspects,
    crime_details,
    other_charges
  } = req.body;

  const case_number = await generateCaseNumber();

  const newCase = await Case.create({
    case_number,
    title,
    description,
    assigned_to,
    priority,
    crime_type,
    incident_date,
    location,
    latitude,
    longitude,
    status: req.body.status || 'open'
  });

  if (report_ids && report_ids.length > 0) {
    await newCase.addReports(report_ids);
  }

  // Link suspects if provided
  if (Array.isArray(suspects) && suspects.length > 0) {
    for (const s of suspects) {
      if (!s || !s.full_name) continue;
      let suspect = null;
      if (s.national_id) {
        suspect = await Suspect.findOne({ where: { national_id: s.national_id } });
      }
      if (!suspect) {
        suspect = await Suspect.create({
          full_name: s.full_name,
          national_id: s.national_id || null,
          photo_url: s.photo_url || null,
          phone: s.phone || null,
          address: s.address || null,
          criminal_status: s.criminal_status || 'unknown'
        });
      }
      if (suspect) {
        await newCase.addSuspect(suspect.id, { through: { role: s.role || null } });
      }
    }
  }

  // Handle evidence from reports if any
  if (report_ids && report_ids.length > 0) {
    const reportEvidence = await Evidence.findAll({ where: { report_id: { [Op.in]: report_ids } } });
    if (reportEvidence.length > 0) {
      for (const evidence of reportEvidence) {
        evidence.case_id = newCase.id;
        await evidence.save();
        
        // Track chain of custody
        await EvidenceCustody.create({
          evidence_id: evidence.id,
          user_id: req.user.id,
          action: 'linked_to_case',
          notes: `Evidence from report linked to Case ${newCase.case_number}`,
          to_location: 'System Case File'
        });
      }
    }

    // Auto-message citizen reporters
    const reports = await Report.findAll({ where: { id: { [Op.in]: report_ids } } });
    const { Message } = require('../models');
    for (const report of reports) {
      if (report.user_id) {
        await Message.create({
          sender_id: assigned_to || req.user.id,
          receiver_id: report.user_id,
          content: `Your report "${report.title}" has been escalated to an active case (${case_number}), and I will be handling the investigation moving forward. You can send any related information directly to me here.`
        });

        // Update status and send email notification
        report.status = 'case_created';
        await report.save();
        
        const reporter = await User.findByPk(report.user_id);
        if (reporter) {
          await notifyUserByEmail({
            user: reporter,
            type: 'status_update',
            title: `Update on your report: ${report.title}`,
            content: `A case (${case_number}) has been officially created based on your report "${report.title}". Thank you for your assistance.`,
            metadata: { reportId: report.id, newStatus: 'case_created' }
          });
        }
      }
    }
  }

  if (assigned_to) {
    const assignedOfficer = await User.findByPk(assigned_to);
    if (assignedOfficer) {
      await notifyUserByEmail({
        user: assignedOfficer,
        type: 'assignment',
        title: 'New case assigned',
        content: `Case ${newCase.case_number} has been assigned to you.`,
        metadata: { caseId: newCase.id }
      });
    }
  }

  await notifyUserByEmail({
    user: req.user,
    type: 'system_alert',
    title: 'Criminal case created',
    content: `Case ${newCase.case_number} has been created successfully.`,
    metadata: { caseId: newCase.id }
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: {
      case: newCase
    },
    timestamp: new Date().toISOString()
  });
});

exports.updateCase = catchAsync(async (req, res, next) => {
  const caseData = await Case.findByPk(req.params.id);
  if (!caseData) {
    return next(new AppError('No case found with that ID', 404));
  }

  const updateFields = [
    'title', 'description', 'assigned_to', 'priority', 'status',
    'crime_type', 'incident_date', 'location', 'latitude', 'longitude',
    'crime_details', 'other_charges'
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      caseData[field] = req.body[field];
    }
  });

  await caseData.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      case: caseData
    },
    timestamp: new Date().toISOString()
  });
});

exports.addCaseCharge = catchAsync(async (req, res, next) => {
  const { additional_charge } = req.body;
  const caseData = await Case.findByPk(req.params.id);

  if (!caseData) {
    return next(new AppError('No case found with that ID', 404));
  }

  const existingCharges = caseData.other_charges ? caseData.other_charges.split(';').map(c => c.trim()).filter(Boolean) : [];
  existingCharges.push(additional_charge);
  caseData.other_charges = existingCharges.join('; ');

  await caseData.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      case: caseData
    },
    timestamp: new Date().toISOString()
  });
});

exports.mergeCases = catchAsync(async (req, res, next) => {
  const { primary_case_id, secondary_case_ids } = req.body;

  const primaryCase = await Case.findByPk(primary_case_id);
  if (!primaryCase) {
    return next(new AppError('Primary case not found', 404));
  }

  const secondaryCases = await Case.findAll({ where: { id: { [Op.in]: secondary_case_ids } } });
  if (secondaryCases.length !== secondary_case_ids.length) {
    return next(new AppError('One or more secondary cases not found', 404));
  }

  for (const secondaryCase of secondaryCases) {
    const reports = await secondaryCase.getReports();
    await primaryCase.addReports(reports);
    await secondaryCase.destroy();
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Cases merged successfully',
    timestamp: new Date().toISOString()
  });
});

exports.getCaseTimeline = catchAsync(async (req, res, next) => {
  const caseUpdates = await CaseUpdate.findAll({
    where: { case_id: req.params.id },
    order: [['created_at', 'ASC']],
    include: [{ model: User, attributes: ['id', 'full_name'] }]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      timeline: caseUpdates
    },
    timestamp: new Date().toISOString()
  });
});

exports.getCases = catchAsync(async (req, res, next) => {
  const { status, assigned_to, case_number, national_id, full_name, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (assigned_to) where.assigned_to = assigned_to;
  if (case_number) where.case_number = case_number;

  const cases = await Case.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['opened_at', 'DESC']],
    include: [
      { model: User, as: 'Officer', attributes: ['id', 'full_name'] },
      { model: Report, include: [{ model: User, attributes: ['id', 'full_name', 'national_id'] }] },
      { model: Suspect, through: { attributes: ['role'] } },
      { model: Evidence }
    ]
  });

  const filteredCases = cases.filter((c) => {
    if (national_id) {
      const matchesNational = c.Reports?.some((report) => report.User?.national_id?.toLowerCase().includes(national_id.toLowerCase()));
      if (!matchesNational) return false;
    }
    if (full_name) {
      const matchesName = c.Reports?.some((report) => report.User?.full_name?.toLowerCase().includes(full_name.toLowerCase()));
      if (!matchesName) return false;
    }
    return true;
  });

  const total = filteredCases.length;

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      cases: filteredCases,
      total
    },
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  });
});

exports.getCase = catchAsync(async (req, res, next) => {
  const caseData = await Case.findByPk(req.params.id, {
    include: [
      { model: User, as: 'Officer', attributes: ['id', 'full_name'] },
      { model: Report },
      { model: CaseUpdate },
      { model: Suspect, through: { attributes: ['role'] } },
      {
        model: Evidence,
        include: [{ model: EvidenceCustody }]
      }
    ]
  });

  if (!caseData) {
    return next(new AppError('No case found with that ID', 404));
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      case: caseData
    },
    timestamp: new Date().toISOString()
  });
});

exports.assignCase = catchAsync(async (req, res, next) => {
  const { user_id } = req.body;
  const caseData = await Case.findByPk(req.params.id);

  if (!caseData) {
    return next(new AppError('No case found with that ID', 404));
  }

  caseData.assigned_to = user_id;
  await caseData.save();

  const assignedOfficer = await User.findByPk(user_id);
  if (assignedOfficer) {
    await notifyUserByEmail({
      user: assignedOfficer,
      type: 'assignment',
      title: 'Case assignment update',
      content: `You have been assigned to case ${caseData.case_number}.`,
      metadata: { caseId: caseData.id }
    });
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      case: caseData
    },
    timestamp: new Date().toISOString()
  });
});

exports.addCaseNote = catchAsync(async (req, res, next) => {
  const { note, update_type } = req.body;
  const caseData = await Case.findByPk(req.params.id);

  if (!caseData) {
    return next(new AppError('No case found with that ID', 404));
  }

  const update = await CaseUpdate.create({
    case_id: req.params.id,
    user_id: req.user.id,
    update_type: update_type || 'Note',
    notes: note
  });

  if (caseData.crime_type === 'missing person' || caseData.crime_type === 'missing_person' || update_type === 'Sighting') {
    const reports = await caseData.getReports();
    for (const report of reports) {
      if (report.user_id) {
        const reporter = await User.findByPk(report.user_id);
        if (reporter) {
          await require('../utils/notificationService').notifyUserByEmail({
            user: reporter,
            type: 'sighting_update',
            title: `Update on Missing Person Case: ${caseData.title}`,
            content: `A new update/sighting has been reported for the missing person case you submitted. Details: ${note}`,
            metadata: { caseId: caseData.id }
          });
        }
      }
    }
  }

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: {
      update
    },
    timestamp: new Date().toISOString()
  });
});
