const { MissingPerson, Fugitive, User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// ─── Missing Persons ────────────────────────────────────────────────────────

exports.getMissingPersons = catchAsync(async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : { status: 'active' };

  const records = await MissingPerson.findAll({
    where,
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'PostedBy', attributes: ['id', 'full_name'], required: false }]
  });

  res.status(200).json({ success: true, data: { missing_persons: records } });
});

exports.getMissingPerson = catchAsync(async (req, res, next) => {
  const record = await MissingPerson.findByPk(req.params.id);
  if (!record) return next(new AppError('Missing person record not found', 404));
  res.status(200).json({ success: true, data: { missing_person: record } });
});

exports.createMissingPerson = catchAsync(async (req, res) => {
  const {
    name, age, gender, last_seen_wearing, description,
    last_seen_location, date_missing, contact, photo_url, case_ref
  } = req.body;

  // Auto-generate case_ref if not provided
  const generatedRef = case_ref || `MP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const record = await MissingPerson.create({
    name, age, gender, last_seen_wearing, description,
    last_seen_location, date_missing, contact,
    photo_url: photo_url || null,
    case_ref: generatedRef,
    posted_by: req.user.id,
    status: 'active'
  });

  res.status(201).json({ success: true, data: { missing_person: record } });
});

exports.updateMissingPerson = catchAsync(async (req, res, next) => {
  const record = await MissingPerson.findByPk(req.params.id);
  if (!record) return next(new AppError('Missing person record not found', 404));

  const fields = [
    'name', 'age', 'gender', 'last_seen_wearing', 'description',
    'last_seen_location', 'date_missing', 'contact', 'photo_url',
    'case_ref', 'status'
  ];
  fields.forEach(f => { if (req.body[f] !== undefined) record[f] = req.body[f]; });
  await record.save();

  res.status(200).json({ success: true, data: { missing_person: record } });
});

exports.deleteMissingPerson = catchAsync(async (req, res, next) => {
  const record = await MissingPerson.findByPk(req.params.id);
  if (!record) return next(new AppError('Missing person record not found', 404));
  await record.destroy();
  res.status(204).json({ success: true, data: null });
});

// ─── Fugitives ──────────────────────────────────────────────────────────────

exports.getFugitives = catchAsync(async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : { status: 'active' };

  const records = await Fugitive.findAll({
    where,
    order: [['created_at', 'DESC']],
    include: [{ model: User, as: 'PostedBy', attributes: ['id', 'full_name'], required: false }]
  });

  res.status(200).json({ success: true, data: { fugitives: records } });
});

exports.getFugitive = catchAsync(async (req, res, next) => {
  const record = await Fugitive.findByPk(req.params.id);
  if (!record) return next(new AppError('Fugitive record not found', 404));
  res.status(200).json({ success: true, data: { fugitive: record } });
});

exports.createFugitive = catchAsync(async (req, res) => {
  const {
    name, alias, age, gender, crime_committed, crime_details,
    last_seen_location, last_seen_date, description,
    warning_level, photo_url, case_ref, reward
  } = req.body;

  const generatedRef = case_ref || `FUG-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const record = await Fugitive.create({
    name, alias, age, gender, crime_committed,
    crime_details, last_seen_location, last_seen_date, description,
    warning_level: warning_level || 'WANTED FOR ARREST',
    photo_url: photo_url || null,
    case_ref: generatedRef,
    reward: reward || null,
    posted_by: req.user.id,
    status: 'active'
  });

  res.status(201).json({ success: true, data: { fugitive: record } });
});

exports.updateFugitive = catchAsync(async (req, res, next) => {
  const record = await Fugitive.findByPk(req.params.id);
  if (!record) return next(new AppError('Fugitive record not found', 404));

  const fields = [
    'name', 'alias', 'age', 'gender', 'crime_committed', 'crime_details',
    'last_seen_location', 'last_seen_date', 'description',
    'warning_level', 'photo_url', 'case_ref', 'reward', 'status'
  ];
  fields.forEach(f => { if (req.body[f] !== undefined) record[f] = req.body[f]; });
  await record.save();

  res.status(200).json({ success: true, data: { fugitive: record } });
});

exports.deleteFugitive = catchAsync(async (req, res, next) => {
  const record = await Fugitive.findByPk(req.params.id);
  if (!record) return next(new AppError('Fugitive record not found', 404));
  await record.destroy();
  res.status(204).json({ success: true, data: null });
});
