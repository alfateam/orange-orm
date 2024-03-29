const negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');

function newWhere(table) {

	function where(fn) {
		let arg = typeof fn === 'function' ? fn(table) : fn;
		return negotiateRawSqlFilter(arg);
	}
	return where;
}

module.exports = newWhere;