let getSessionContext = require('../../getSessionContext');
let quote = require('../../quote');

function getSqlTemplate(_table, _row) {
	let context = getSessionContext();
	if (context.insertSql)
		return context.insertSql.apply(null, arguments);
	else
		return getSqlTemplateDefault.apply(null, arguments);

}

function getSqlTemplateDefault(table, row) {
	let columnNames = [];
	let values = [];
	let sql = 'INSERT INTO ' + quote(table._dbName) + ' ';
	addDiscriminators();
	addColumns();
	if (columnNames.length === 0)
		sql += `${outputInserted()}${defaultValues()}${lastInserted()}`;
	else
		sql = sql + '('+ columnNames.join(',') + ') ' + outputInserted() +  'VALUES (' + values.join(',') + ')' + lastInserted() ;
	return sql;

	function addDiscriminators() {
		let discriminators = table._columnDiscriminators;
		for (let i = 0; i < discriminators.length; i++) {
			let parts = discriminators[i].split('=');
			columnNames.push(quote(parts[0]));
			values.push(parts[1]);
		}
	}

	function addColumns() {
		let columns = table._columns;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			if (row['__' + column.alias] !== undefined) {
				columnNames.push(quote(column._dbName));
				values.push('%s');
			}
		}
	}

	function lastInserted() {
		let context = getSessionContext();
		if (!context.lastInsertedIsSeparate && context.lastInsertedSql)
			return ' ' + context.lastInsertedSql(table);
		return '';
	}

	function outputInserted() {
		let context = getSessionContext();
		if (!context.lastInsertedIsSeparate && context.outputInsertedSql)
			return ' ' + context.outputInsertedSql(table) + ' ';
		return '';
	}

	function defaultValues() {
		let context = getSessionContext();
		let _default = context.insertDefault || 'DEFAULT VALUES';
		return `${_default}${lastInserted()}`;

	}
}

module.exports = getSqlTemplate;