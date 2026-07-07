const quote = require('../table/quote');

module.exports = function(context, lock) {
	if (typeof lock === 'string')
		lock = { aliases: [lock], forUpdate: true };
	let sql = '';
	if (lock.forUpdate) {
		sql = ' FOR UPDATE';
		if (lock.aliases && lock.aliases.length > 0)
			sql += ' OF ' + lock.aliases.map(alias => quote(context, alias)).join(', ');
	}
	if (lock.skipLocked)
		sql += ' SKIP LOCKED';
	return sql;
};
