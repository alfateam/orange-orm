async function validateDeleteAllowed({ row, options, table }) {
	if (options.readonly) {
		const e = new Error(`Cannot delete ${table._dbName} because it is readonly`);
		// @ts-ignore
		e.status = 405;
		throw e;
	}
	for (let p in options)
		if (isColumn(p, table))
			return;
		else if (isManyRelation(p, table)) {
			const childTable = table[p]._relation.childTable;
			const childOptions = inferOptions(options, p);
			const children = await row[p];
			for (let i = 0; i < children.length; i++) {
				const childRow = children[i];
				await validateDeleteAllowed({ row: childRow, options: childOptions, table: childTable });
			}
		}
		else if (isOneRelation(p, table)) {
			const childOptions = inferOptions(options, p);
			const childTable = table[p]._relation.childTable;
			let childRow = await row[p];
			await validateDeleteAllowed({ row: childRow, options: childOptions, table: childTable });
		}
}

function isColumn(name, table) {
	return table[name] && table[name].equal;
}

function isManyRelation(name, table) {
	return table[name] && table[name]._relation.isMany;
}

function isOneRelation(name, table) {
	return table[name] && table[name]._relation.isOne;
}

function inferOptions(defaults, property) {
	const parent = {};
	if ('readonly' in defaults)
		parent.readonly = defaults.readonly;
	if ('concurrency' in defaults)
		parent.concurrency = defaults.concurrency;
	return {...parent,  ...(defaults[property] || {})};
}

module.exports = validateDeleteAllowed;