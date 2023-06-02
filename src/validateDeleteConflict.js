// @ts-nocheck
/* eslint-disable */
let { inspect } = require('util');
let assert = require('assert');
const toCompareObject = require('./toCompareObject');

async function validateDeleteConflict({ row, oldValue, options, table }) {
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
						assert.deepEqual(oldValue[p], toCompareObject(row[p]));						
				}
				catch (e) {
					throw new Error(`The field ${p} was changed by another user. Expected ${inspect(oldValue[p], false, 10)}, but was ${inspect(row[p], false, 10)}.`);
				}
			}
		}
		else if (isManyRelation(p, table)) {
			const childTable = table[p]._relation.childTable;
			for (let name in oldValue[p]) {
				if (name === '__patchType')
					continue;
				let childRow = await childTable.tryGetById.apply(null, JSON.parse(name));
				if (!childRow)
					throw new Error(`${p} with id ${name} was deleted by another user`);
				if (! await validateDeleteConflict({ row: childRow, oldValue: oldValue[p][name], defaultConcurrency, concurrency: concurrency[p], table: childTable }))
					return false;
			}
		}
		else if (isOneRelation(p, table)) {
			const childTable = table[p]._relation.childTable;
			let childRow = await row[p];
			if (!childRow)
				throw new Error(`${p} was deleted by another user`);
			if (! await validateDeleteConflict({ row: childRow, oldValue: oldValue[p], defaultConcurrency, concurrency: concurrency[p], table: childTable }))
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
	if (date1 && date2 ) {
		date1 = new Date(date1);
		date2 = new Date(date2);
		assert.deepEqual(date1.getTime(), date2.getTime());
	}
	else
		assert.deepEqual(date1, date2);
}

module.exports = validateDeleteConflict;