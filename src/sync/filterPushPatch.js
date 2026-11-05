// Filter transport patches, never the patch used for the original local write.
// Local replay retains values on new rows (including NOT NULL columns), but
// excludes updates so a pulled server value wins over pending local edits.
function filterPushPatch(table, patches, replay = false) {
	if (!table || !Array.isArray(patches) || !hasExcludedColumns(table)) return patches;
	return patches.flatMap(patch => {
		if (!patch || typeof patch.path !== 'string') return [patch];
		const path = patch.path.split('/').slice(2).map(unescapePointer);
		let target = table, collection = false;
		for (let i = 0; i < path.length; i++) {
			const column = (target._columns || []).find(column => column.alias === path[i]);
			if (column) return column._sync?.push === false ? [] : [patch];
			const relation = target._relations?.[path[i]];
			if (!relation) return [patch];
			target = relation.childTable;
			collection = relation.isMany && i === path.length - 1;
			if (relation.isMany && !collection) i++;
		}
		const result = { ...patch };
		for (const key of ['value', 'oldValue']) {
			if (Object.hasOwn(patch, key))
				result[key] = stripValue(target, patch[key], collection,
					replay && patch.op === 'add' && key === 'value');
		}
		return [result];
	});
}

function stripValue(table, value, collection, preserve) {
	if (!value || typeof value !== 'object' || preserve) return value;
	if (Array.isArray(value)) return value.map(row => stripValue(table, row, false, false));
	const result = {};
	for (const key of Object.keys(value)) {
		if (collection) {
			result[key] = key === '__patchType' ? value[key] : stripValue(table, value[key], false, false);
			continue;
		}
		const column = (table._columns || []).find(column => column.alias === key);
		if (column?._sync?.push === false) continue;
		const relation = table._relations?.[key];
		result[key] = relation ? stripValue(relation.childTable, value[key], relation.isMany, false) : value[key];
	}
	return result;
}

function hasExcludedColumns(table, visited = new Set()) {
	if (visited.has(table)) return false;
	visited.add(table);
	return (table._columns || []).some(column => column._sync?.push === false)
		|| Object.values(table._relations || {}).some(relation => hasExcludedColumns(relation.childTable, visited));
}

function unescapePointer(value) {
	return value.replace(/~1/g, '/').replace(/~0/g, '~');
}

module.exports = filterPushPatch;
