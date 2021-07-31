// let getSessionSingleton = require('../../getSessionSingleton');

function getSqlTemplate(table, row) {
	if (table._insertTemplate)
		return table._insertTemplate;
	let columnNames = [];
	let regularColumnNames = [];
	// let returnNames;
	let values = [];
	let sql = 'INSERT INTO ' + table._dbName + ' (';
	addDiscriminators();
	addColumns();
	sql = sql + columnNames.join(',') + ') VALUES (' + values.join(',') + ')' ;
	table._insertTemplate = sql;
	console.log(sql);
	return sql;

	function addDiscriminators() {
		let discriminators = table._columnDiscriminators;
		for (let i = 0; i < discriminators.length; i++) {
			let parts = discriminators[i].split('=');
			columnNames.push(parts[0]);
			values.push(parts[1]);
		}
	}

	function addColumns() {
		let columns = table._columns;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			regularColumnNames.push(column._dbName);
			if (row['__' + column.alias] !== undefined) {
				columnNames.push(column._dbName);
				values.push('%s');
			}
		}
		// returnNames += ')';
	}
}

module.exports = getSqlTemplate;