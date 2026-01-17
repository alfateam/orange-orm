async function validateDeleteAllowed({ row, options, table }) {
	if (options.readonly) {
		const e = new Error(`Cannot delete ${table._dbName} because it is readonly`);
		// @ts-ignore
		e.status = 405;
		throw e;
	}
	if (!hasReadonlyTrue(options))
		return;
	for (let p in options) {
		if (isManyRelation(p, table)) {
			const childTable = table[p]._relation.childTable;
			const childOptions = inferOptions(options, p);
			if (!hasReadonlyTrue(childOptions))
				continue;
			const children = await row[p];
			for (let i = 0; i < children.length; i++) {
				const childRow = children[i];
				await validateDeleteAllowed({ row: childRow, options: childOptions, table: childTable });
			}
		}
		else if (isOneRelation(p, table)) {
			const childOptions = inferOptions(options, p);
			if (!hasReadonlyTrue(childOptions))
				continue;
			const childTable = table[p]._relation.childTable;
			let childRow = await row[p];
			await validateDeleteAllowed({ row: childRow, options: childOptions, table: childTable });
		}
	}
}


function isManyRelation(name, table) {
	return table[name] && table[name]._relation && table[name]._relation.isMany;
}

function isOneRelation(name, table) {
	return table[name] && table[name]._relation && table[name]._relation.isOne;
}

function inferOptions(defaults, property) {
	const parent = {};
	if ('readonly' in defaults)
		parent.readonly = defaults.readonly;
	if ('concurrency' in defaults)
		parent.concurrency = defaults.concurrency;
	return {...parent,  ...(defaults[property] || {})};
}

function hasReadonlyTrue(options) {
	if (!options || options !== Object(options))
		return false;
	if (options.readonly === true)
		return true;
	for (let p in options) {
		const value = options[p];
		if (!value || value !== Object(value))
			continue;
		if (hasReadonlyTrue(value))
			return true;
	}
	return false;
}

module.exports = validateDeleteAllowed;
