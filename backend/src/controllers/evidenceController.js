const { Evidence } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.uploadEvidence = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one file.', 400));
  }

  const evidenceFiles = req.files.map(file => ({
    report_id: req.body.report_id,
    file_url: `/uploads/${file.filename}`,
    file_type: file.mimetype,
    file_size: file.size,
    uploaded_by: req.user.id
  }));

  const newEvidence = await Evidence.bulkCreate(evidenceFiles);

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: {
      evidence: newEvidence
    },
    timestamp: new Date().toISOString()
  });
});

exports.getEvidence = catchAsync(async (req, res, next) => {
  const evidence = await Evidence.findByPk(req.params.id);

  if (!evidence) {
    return next(new AppError('No evidence found with that ID', 404));
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      evidence
    },
    timestamp: new Date().toISOString()
  });
});

exports.deleteEvidence = catchAsync(async (req, res, next) => {
  const evidence = await Evidence.findByPk(req.params.id);

  if (!evidence) {
    return next(new AppError('No evidence found with that ID', 404));
  }

  // TODO: Delete file from filesystem

  await evidence.destroy();

  res.status(204).json({
    success: true,
    statusCode: 204,
    data: null,
    timestamp: new Date().toISOString()
  });
});
