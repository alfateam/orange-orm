function lastInsertedSql(context, table, keyValues) {
	if (keyValues.some(value => value === undefined))
		return ['rowid IN (select last_insert_rowid())'];
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		return column.eq(context, value);
	});

}

module.exports = lastInsertedSql;
