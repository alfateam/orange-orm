let getSessionSingleton = require('../table/getSessionSingleton');

function lastInsertedSql(table, keyValues) {
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined)
			return `ROWID='${getSessionSingleton('lastRowid')}'`;
		else
			return column.eq(value);
	});

}

module.exports = lastInsertedSql;