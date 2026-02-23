const reportService = require('./reportService');

const getReports = (filters) => reportService.getReports(filters);

const resolveReport = (payload) => reportService.resolveReport(payload);

module.exports = {
  getReports,
  resolveReport,
};
