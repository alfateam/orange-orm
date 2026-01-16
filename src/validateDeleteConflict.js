// @ts-nocheck
/* eslint-disable */
const toCompareObject = require('./toCompareObject');

async function validateDeleteConflict({ context, row, oldValue, options, table }) {
	for (let p in oldValue) {
		if (isColumn(p, table)) {
			const option = inferOptions(options, p);
			let strategy = option.concurrency || 'optimistic';
			if ((strategy === 'optimistic')) {
				try {
					const column = table[p];
					if (column?.tsType === 'DateColumn') {
						assertDatesEqual(oldValue[p], toCompareObject(row[p]));
					}
					else
						assertDeepEqual(oldValue[p], toCompareObject(row[p]));						
				}
				catch (e) {
					throw new Error(`The field ${p} was changed by another user. Expected ${inspect(oldValue[p])}, but was ${inspect(row[p])}.`);
				}
			}
		}
		else if (isManyRelation(p, table)) {
			const childTable = table[p]._relation.childTable;
			for (let name in oldValue[p]) {
				if (name === '__patchType')
					continue;
				let childRow = await childTable.tryGetById.apply(null, [context, ...JSON.parse(name)]);
				if (!childRow)
					throw new Error(`${p} with id ${name} was deleted by another user`);
				if (! await validateDeleteConflict({ context, row: childRow, oldValue: oldValue[p][name], options: inferOptions(options, p), table: childTable }))
					return false;
			}
		}
		else if (isOneRelation(p, table)) {
			const childTable = table[p]._relation.childTable;
			let childRow = await row[p];
			if (!childRow)
				throw new Error(`${p} was deleted by another user`);
			if (! await validateDeleteConflict({ context, row: childRow, oldValue: oldValue[p], options: inferOptions(options, p), table: childTable }))
				return false;
		}

	}
	return true;
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

function assertDatesEqual(date1, date2) {
	if (date1 && date2) {
		const parts1 = date1.split('T');
		const time1parts = (parts1[1] || '').split(/[-+.]/);
		const parts2 = date2.split('T');
		const time2parts = (parts2[1] || '').split(/[-+.]/);
		while (time1parts.length !== time2parts.length) {
			if (time1parts.length > time2parts.length)
				time1parts.pop();
			else if (time1parts.length < time2parts.length)
				time2parts.pop();
		}
		date1 = `${parts1[0]}T${time1parts[0]}`;
		date2 = `${parts2[0]}T${time2parts[0]}`;
	}
	assertDeepEqual(date1, date2);
}

function assertDeepEqual(a, b) {
	if (JSON.stringify(a) !== JSON.stringify(b))
		throw new Error('A, b are not equal');
}

function inspect(obj) {
	return JSON.stringify(obj, null, 2);
}

module.exports = validateDeleteConflict;