var query = require('../query');

function executeSchema(schema) {
	if (!schema)
		throw new Error('Missing schema');
	if (!Array.isArray(schema))
		schema = [schema];
	return query('SET LOCAL search_path TO ' + schema.join(','));
}

module.exports = executeSchema;