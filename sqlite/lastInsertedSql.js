let sql = 'rowid IN (select last_insert_rowid())';

function lastInsertedSql() {
	return sql;
}

module.exports = lastInsertedSql;