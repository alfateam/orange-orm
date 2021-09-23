function lastInsertedSql(table, keyValues) {
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined && column.tsType === 'NumberColumn')
			return `${column._dbName}=@@identity`;
		else
			return column.eq(value);
	});

	//todo
	// select @@identity
}

module.exports = lastInsertedSql;
