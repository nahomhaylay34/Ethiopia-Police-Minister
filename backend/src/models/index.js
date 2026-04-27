'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const basename = path.basename(__filename);
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file));
    let model;
    if (typeof modelDef === 'function') {
      try {
        model = modelDef(sequelize, Sequelize.DataTypes);
      } catch (err) {
        if (err instanceof TypeError && /class constructor/i.test(err.message)) {
          model = modelDef;
        } else {
          throw err;
        }
      }
    } else {
      model = modelDef;
    }
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Minimal associations required by controllers
if (db.User && db.AuditLog) {
  db.User.hasMany(db.AuditLog, { foreignKey: 'user_id' });
  db.AuditLog.belongsTo(db.User, { foreignKey: 'user_id' });
}

// Case <-> Officer (User)
if (db.Case && db.User) {
  db.Case.belongsTo(db.User, { as: 'Officer', foreignKey: 'assigned_to' });
}

// Report <-> User
if (db.Report && db.User) {
  db.Report.belongsTo(db.User, { foreignKey: 'user_id' });
  db.User.hasMany(db.Report, { foreignKey: 'user_id' });
}

// Case <-> Report through CaseReport
if (db.Case && db.Report && db.CaseReport) {
  db.Case.belongsToMany(db.Report, { through: db.CaseReport, foreignKey: 'case_id', otherKey: 'report_id' });
  db.Report.belongsToMany(db.Case, { through: db.CaseReport, foreignKey: 'report_id', otherKey: 'case_id' });
}

// Evidence relations (Report or Case)
if (db.Report && db.Evidence) {
  db.Report.hasMany(db.Evidence, { foreignKey: 'report_id' });
  db.Evidence.belongsTo(db.Report, { foreignKey: 'report_id' });
}
if (db.Case && db.Evidence) {
  db.Case.hasMany(db.Evidence, { foreignKey: 'case_id' });
  db.Evidence.belongsTo(db.Case, { foreignKey: 'case_id' });
}
if (db.Evidence && db.EvidenceCustody) {
  db.Evidence.hasMany(db.EvidenceCustody, { foreignKey: 'evidence_id' });
  db.EvidenceCustody.belongsTo(db.Evidence, { foreignKey: 'evidence_id' });
}
if (db.User && db.EvidenceCustody) {
  db.User.hasMany(db.EvidenceCustody, { foreignKey: 'user_id' });
  db.EvidenceCustody.belongsTo(db.User, { foreignKey: 'user_id' });
}

// Case <-> Suspect through CaseSuspect
if (db.Case && db.Suspect && db.CaseSuspect) {
  db.Case.belongsToMany(db.Suspect, { through: db.CaseSuspect, foreignKey: 'case_id', otherKey: 'suspect_id' });
  db.Suspect.belongsToMany(db.Case, { through: db.CaseSuspect, foreignKey: 'suspect_id', otherKey: 'case_id' });
}

// Message <-> User (Sender / Receiver)
if (db.Message && db.User) {
  db.Message.belongsTo(db.User, { as: 'Sender', foreignKey: 'sender_id' });
  db.Message.belongsTo(db.User, { as: 'Receiver', foreignKey: 'receiver_id' });
  db.User.hasMany(db.Message, { as: 'SentMessages', foreignKey: 'sender_id' });
  db.User.hasMany(db.Message, { as: 'ReceivedMessages', foreignKey: 'receiver_id' });
}

// MissingPerson <-> User (PostedBy)
if (db.MissingPerson && db.User) {
  db.MissingPerson.belongsTo(db.User, { as: 'PostedBy', foreignKey: 'posted_by' });
  db.User.hasMany(db.MissingPerson, { foreignKey: 'posted_by' });
}

// Fugitive <-> User (PostedBy)
if (db.Fugitive && db.User) {
  db.Fugitive.belongsTo(db.User, { as: 'PostedBy', foreignKey: 'posted_by' });
  db.User.hasMany(db.Fugitive, { foreignKey: 'posted_by' });
}

module.exports = db;
