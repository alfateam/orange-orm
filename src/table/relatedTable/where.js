const negotiateRawSqlFilter = require('../column/negotiateRawSqlFilter');

function newWhere(_relations, _depth) {

	function where(context, fn) {
		const includeMany = false;
		let { relations, alias } = extract(includeMany, _relations);
		const table = relations[relations.length - 1].childTable;
		if (!relations[0].isMany || includeMany)
			table._rootAlias = alias;

		try {
			let arg = typeof fn === 'function' ? fn(table) : fn;
			let anyFilter = negotiateRawSqlFilter(context, arg);
			delete table._rootAlias;
			return anyFilter;
		}
		catch (e) {
			delete table._rootAlias;
			throw e;
		}
	}
	return where;

	function extract(includeMany, relations) {
		let alias = relations[0].toLeg().table._dbName;
		let result = [];
		for (let i = 0; i < relations.length; i++) {
			if (relations[i].isMany && !includeMany) {
				result = [relations[i]];
				alias = relations[i].toLeg().table._dbName;
			}
			else {
				result.push(relations[i]);
				alias += relations[i].toLeg().name;
			}
		}
		return { relations: result, alias };
	}

}

module.exports = newWhere;