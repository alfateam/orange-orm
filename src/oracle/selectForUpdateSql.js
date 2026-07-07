module.exports = function(_context, lock) {
	if (typeof lock === 'string')
		lock = { forUpdate: true };
	let sql = '';
	if (lock.forUpdate)
		sql = ' FOR UPDATE';
	if (lock.skipLocked)
		sql += ' SKIP LOCKED';
	return sql;
};
