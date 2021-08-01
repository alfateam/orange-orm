let sql = 'rowid IN (select last_insert_rowid())';

function lastInsertedSql(table) {
	return sql;
}

module.exports = lastInsertedSql;