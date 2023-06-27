import { test, expect } from 'vitest';

let createPatch = require('../src/client/createPatch');

test('updateAndInsertArray should order patches by insert, update with position, delete', () => {
	let a = { id: 2, date: 'original' };
	let aChanged = { id: 2, date: 'changed', too: 'yes' };
	let b = { id: 1, date: 'originalb' };
	let bChanged = { id: 1, date: 'changedb', too: 'yesb' };
	let cInserted = { id: 'c', date: 'someDateC' };
	let dInserted = { id: 'd', date: 'someDateD' };
	let eDeleted = { id: 0, date: 'delete me' };
	let fDeleted = { id: -1, date: 'delete me too' };
	let updatePatch = createPatch([eDeleted, a, b, fDeleted], [dInserted, aChanged, bChanged, cInserted]);
	expect(updatePatch).toEqual([
		{ 'op': 'add', 'path': '/["d"]', 'value': { 'date': 'someDateD', 'id': 'd' } },
		{ 'op': 'add', 'path': '/["c"]', 'value': { 'date': 'someDateC', 'id': 'c' } },
		{ 'op': 'replace', 'path': '/[1]/date', 'value': 'changedb', 'oldValue': 'originalb' },
		{ 'op': 'add', 'path': '/[1]/too', 'value': 'yesb' },
		{ 'op': 'replace', 'path': '/[2]/date', 'value': 'changed', 'oldValue': 'original' },
		{ 'op': 'add', 'path': '/[2]/too', 'value': 'yes' },
		{ 'op': 'remove', 'path': '/[-1]', 'oldValue': { 'id': -1, 'date': 'delete me too' } },
		{ 'op': 'remove', 'path': '/[0]', 'oldValue': { 'id': 0, 'date': 'delete me' } },
	]
	);

});

test('updateArray', () => {
	let a = { id: 1, date: 'original' };
	let b = { id: 1, date: 'changed' };
	let updatePatch = createPatch([a], [b]);
	expect(updatePatch).toEqual([{ 'op': 'replace', 'path': '/[1]/date', 'value': 'changed', 'oldValue': 'original' }]);
});

test('update non-id pk', () => {
	let a = { otherPk: 1, date: 'original' };
	let b = { otherPk: 1, date: 'changed' };
	let updatePatch = createPatch([a], [b], { keys: [{ name: 'otherPk' }] });
	expect(updatePatch).toEqual([{ 'op': 'replace', 'path': '/[1]/date', 'value': 'changed', 'oldValue': 'original' }]);
});

test('update nested composite pk', () => {
	let a = { otherPk: 1, date: 'original', lines: [{ linePk: 22, otherPk: 1, foo: '_foo' }, { linePk: 23, otherPk: 1, foo: 'original' }] };
	let b = { otherPk: 1, date: 'original', lines: [{ linePk: 22, otherPk: 1, foo: '_foo' }, { linePk: 23, otherPk: 1, foo: 'changed' }] };
	let updatePatch = createPatch([a], [b], { keys: [{ name: 'otherPk' }], relations: { lines: { keys: [{ name: 'otherPk' }, { name: 'linePk' }] } } });
	expect(updatePatch).toEqual([{ 'op': 'replace', 'path': '/[1]/lines/[1,23]/foo', 'value': 'changed', 'oldValue': 'original' }]);
});

test('insert sequence', () => {
	let a = { otherPk: 2, some: 'a' };
	let b = { otherPk: 1, some: 'b' };
	let updatePatch = createPatch([], [a, b], { keys: [{ name: 'otherPk' }], relations: { lines: { keys: [{ name: 'otherPk' }, { name: 'linePk' }] } } });
	expect(updatePatch).toEqual([{ 'op': 'add', 'path': '/[2]', 'value': a }, { 'op': 'add', 'path': '/[1]', 'value': b }]);
});

test('updateDate', () => {
	let a = { id: 1, date: new Date('2020-10-13') };
	let b = { id: 1, date: new Date('2020-10-12') };
	let aIso = toIsoString(a.date);
	let bIso = toIsoString(b.date);
	let updatePatch = createPatch([a], [b]);
	expect(updatePatch).toEqual([{ 'op': 'replace', 'path': '/[1]/date', 'value': bIso, 'oldValue': aIso }]);
});

function toIsoString(date) {
	let tzo = -date.getTimezoneOffset();
	let dif = tzo >= 0 ? '+' : '-';

	function pad(num) {
		let norm = Math.floor(Math.abs(num));
		return (norm < 10 ? '0' : '') + norm;
	}

	function padMilli(d) {
		return (d.getMilliseconds() + '').padStart(3, '0');
	}

	return date.getFullYear() +
		'-' + pad(date.getMonth() + 1) +
		'-' + pad(date.getDate()) +
		'T' + pad(date.getHours()) +
		':' + pad(date.getMinutes()) +
		':' + pad(date.getSeconds()) +
		'.' + padMilli(date) +
		dif + pad(tzo / 60) +
		':' + pad(tzo % 60);
}