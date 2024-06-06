let outputInsertedSql = require('./outputInsertedSql');
let mergeSql = require('./mergeSql');


function getSqlTemplate(_table, _row, options) {
	if (hasConcurrency(_table, options) && hasColumns())
		return mergeSql.apply(null, arguments);
	else
		return insertSql.apply(null, arguments);

	function hasColumns() {
		for(let p in _row) {
			let alias = _table[p]?.alias;
			if (alias &&  _row['__' + alias] !== undefined && _table[p]?.equal)
				return true;
		}
	}
}

function hasConcurrency(table,options) {
	for (let i = 0; i < table._primaryColumns.length; i++) {
		const concurrency = options[table._primaryColumns[i]]?.concurrency;
		if ( concurrency === 'skipOnConflict' || concurrency === 'overwrite' )
			return true;
	}
	return options.concurrency === 'skipOnConflict' || options.concurrency === 'overwrite';
}

function insertSql(table, row) {
	let columnNames = [];
	let regularColumnNames = [];
	let values = [];
	let sql = 'INSERT INTO "' + table._dbName + '" ';
	addDiscriminators();
	addColumns();
	if (columnNames.length === 0)
		sql += `${outputInserted()} (${table._primaryColumns[0]._dbName}) VALUES(DEFAULT)`;
	else
		sql = sql + '('+ columnNames.join(',') + ')' + outputInserted() +  'VALUES (' + values.join(',') + ')';
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
				if (column.tsType === 'DateColumn')
					values.push('TO_TIMESTAMP(%s, \'YYYY-MM-DD"T"HH24:MI:SS.FF6\')');
				else
					values.push('%s');
			}
		}
	}


	function outputInserted() {

		return ' ' + outputInsertedSql(table) + ' ';
	}

}

module.exports = getSqlTemplate;