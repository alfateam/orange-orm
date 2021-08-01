function lastInsertedSql(table, keyValues) {
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined && column.tsType === 'NumberColumn')
			return `${column._dbName}=LAST_INSERT_ID`;
		else
			return column.eq(value);
	});
}

module.exports = lastInsertedSql;
