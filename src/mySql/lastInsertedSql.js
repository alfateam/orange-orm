const quote = require('./quote');

function lastInsertedSql(context,table, keyValues) {
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined && column.tsType === 'NumberColumn')
			return `${quote(column._dbName)}=LAST_INSERT_ID()`;
		else
			return column.eq(context, value);
	});
}

module.exports = lastInsertedSql;
