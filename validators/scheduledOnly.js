// validators/scheduledOnly.js
const Joi = require('joi');

const schema = Joi.object({
  rowId: Joi.string().required(),
  vessel_name: Joi.string().min(1).required(),
  imo: Joi.string().length(7).pattern(/^\d+$/).required(),
  state: Joi.string().required()
});

function validateScheduledRows(rows) {
  const errors = [];

  rows.forEach((row) => {
    if (row.state !== '已安排') return;

    const { error } = schema.validate(row);
    if (error) {
      errors.push({
        rowId: row.rowId,
        message: error.details[0].message
      });
    }
  });

  return errors;
}

module.exports = validateScheduledRows;