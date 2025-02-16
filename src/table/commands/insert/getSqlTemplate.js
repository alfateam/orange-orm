let getSessionContext = require('../../getSessionContext');
let quote = require('../../quote');

function getSqlTemplate(context, _table, _row) {
	let rdb = getSessionContext(context);
	if (rdb.insertSql)
		return rdb.insertSql.apply(null, arguments);
	else
		return getSqlTemplateDefault.apply(null, arguments);

}

function getSqlTemplateDefault(context, table, row) {
	let columnNames = [];
	let values = [];
	let sql = 'INSERT INTO ' + quote(context, table._dbName) + ' ';
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
			columnNames.push(quote(context, parts[0]));
			values.push(parts[1]);
		}
	}

	function addColumns() {
		let columns = table._columns;
		for (let i = 0; i < columns.length; i++) {
			let column = columns[i];
			if (row['__' + column.alias] !== undefined) {
				columnNames.push(quote(context, column._dbName));
				values.push('%s');
			}
		}
	}

	function lastInserted() {
		let rdb = getSessionContext(context);
		if (!rdb.lastInsertedIsSeparate && rdb.lastInsertedSql)
			return ' ' + rdb.lastInsertedSql(table);
		return '';
	}

	function outputInserted() {
		let rdb = getSessionContext(context);
		if (!rdb.lastInsertedIsSeparate && rdb.outputInsertedSql)
			return ' ' + rdb.outputInsertedSql(table) + ' ';
		return '';
	}

	function defaultValues() {
		let rdb = getSessionContext(context);
		let _default = rdb.insertDefault || 'DEFAULT VALUES';
		return `${_default}${lastInserted()}`;

	}
}

module.exports = getSqlTemplate;