function lastInsertedSql(table, keyValues) {
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined && column.tsType === 'NumberColumn')
			return 'rowid IN (select last_insert_rowid())';
		else
			return column.eq(value);
	});

}

module.exports = lastInsertedSql;