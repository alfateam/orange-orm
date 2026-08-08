const getSessionSingleton = require('../getSessionSingleton');
const parseOrderBy = require('./parseOrderBy');

function extractOrderBy(context, span) {
	const entries = parseOrderBy(span.orderBy, Object.keys(span.aggregates));
	if (entries.length === 0)
		return '';

	const quote = getSessionSingleton(context, 'quote');
	return ' order by ' + entries
		.map(({ alias, direction }) => quote(alias) + direction)
		.join(',');
}

module.exports = extractOrderBy;
