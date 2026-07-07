function selectForUpdateSql() {
	return '';
}

selectForUpdateSql.tableHint = function(_context, lock) {
	const hints = [];
	if (lock.forUpdate)
		hints.push('UPDLOCK');
	if (lock.skipLocked) {
		hints.push('READPAST');
		hints.push('ROWLOCK');
	}
	if (hints.length === 0)
		return '';
	return ' WITH (' + hints.join(', ') + ')';
};

module.exports = selectForUpdateSql;
