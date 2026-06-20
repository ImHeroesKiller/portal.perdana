/**
 * Dedicated entry for GET /api/db/projects.
 * Delegates to the shared collection handler with fail-soft empty-array fallback.
 */
const handler = require('./[collection]/index.js');

module.exports = async function projectsHandler(req, res) {
  req.query = { ...(req.query || {}), collection: 'projects' };
  return handler(req, res);
};