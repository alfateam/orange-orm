const negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');

function newWhere(table) {

	function where(context, fn) {
		let arg = typeof fn === 'function' ? fn(table) : fn;
		return negotiateRawSqlFilter(context, arg, table, true);
	}
	return where;
}

module.exports = newWhere;
