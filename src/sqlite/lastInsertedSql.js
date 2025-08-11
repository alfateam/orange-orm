function lastInsertedSql(context, table, keyValues) {
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined && (column.tsType === 'NumberColumn' || column.tsType === 'BigintColumn'))
			return 'rowid IN (select last_insert_rowid())';
		else
			return column.eq(context, value);
	});

}

module.exports = lastInsertedSql;