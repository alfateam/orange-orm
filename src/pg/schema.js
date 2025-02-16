var query = require('../query');

function executeSchema(context, schema) {
	if (!schema)
		throw new Error('Missing schema');
	if (!Array.isArray(schema))
		schema = [schema];
	return query(context, 'SET LOCAL search_path TO ' + schema.join(','));
}

module.exports = executeSchema;