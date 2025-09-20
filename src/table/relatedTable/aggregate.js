function newAggregate(_relations) {

	function aggregate(context, fn) {
		//todo
		// const includeMany = tryGetSessionContext(context)?.engine === 'mssql';
		const includeMany = false;
		let { relations, alias } = extract(includeMany, _relations);
		const table = relations[relations.length - 1].childTable;
		if (!relations[0].isMany || includeMany)
			table._rootAlias = alias;

		try {
			const query = fn(table);
			delete table._rootAlias;
			return query;
		}
		catch (e) {
			delete table._rootAlias;
			throw e;
		}
	}
	return aggregate;

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

module.exports = newAggregate;