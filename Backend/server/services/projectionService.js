const { aiRequest } = require('./aiGateway');
const runProjection = (payload) => aiRequest('/api/v1/projection', { method: 'POST', payload });
const getCatalog = () => aiRequest('/api/v1/catalog');
module.exports = { runProjection, getCatalog };
