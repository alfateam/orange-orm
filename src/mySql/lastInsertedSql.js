const getSessionSingleton = require('../table/getSessionSingleton');

function lastInsertedSql(table, keyValues) {
	const quote = getSessionSingleton('quote');
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined && column.tsType === 'NumberColumn')
			return `${quote(column._dbName)}=LAST_INSERT_ID()`;
		else
			return column.eq(value);
	});
}

module.exports = lastInsertedSql;
