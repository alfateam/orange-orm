let getSessionSingleton = require('../table/getSessionSingleton');

function lastInsertedSql(context,table, keyValues) {
	return keyValues.map((value,i) => {
		let column = table._primaryColumns[i];
		if (value === undefined)
			return `ROWID='${getSessionSingleton(context, 'lastRowid')}'`;
		else
			return column.eq(context, value);
	});

}

module.exports = lastInsertedSql;