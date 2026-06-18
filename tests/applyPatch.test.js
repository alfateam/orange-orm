import { describe, test, expect } from 'vitest';
const applyPatch = require('../src/applyPatch');
const toCompareObject = require('../src/toCompareObject');

describe('applyPatch structural equality with different key order', () => {
	test('different key order', () => {
		const context = { rdb: { engine: 'sap' } };
		const column = { tsType: 'JSONColumn' };
		const dto = { data: { a: 1, b: 2 } };
		const changes = [
			{ op: 'replace', path: '/data', value: toCompareObject({ a: 1, b: 2, c: 3 }), oldValue: toCompareObject({ b: 2, a: 1 }) }
		];
		
		const result = applyPatch({ options: {}, context }, dto, changes, column);
		expect(result.data).toEqual({ a: 1, b: 2, c: 3 });
	});

	test('conflict error when structurally different', () => {
		const context = { rdb: { engine: 'sap' } };
		const column = { tsType: 'JSONColumn' };
		const dto = { data: { a: 1, b: 2 } };
		const changes = [
			{ op: 'replace', path: '/data', value: toCompareObject({ a: 1, b: 2, c: 3 }), oldValue: toCompareObject({ b: 3, a: 1 }) }
		];
		
		expect(() => {
			applyPatch({ options: {}, context }, dto, changes, column);
		}).toThrow('The row was changed by another user.');
	});

	test('deeply nested structures different order', () => {
		const context = { rdb: { engine: 'sap' } };
		const column = { tsType: 'JSONColumn' };
		const dto = { data: { x: [1, { y: 2, z: 3 }] } };
		const changes = [
			{ op: 'replace', path: '/data', value: toCompareObject({ x: [1, { y: 2, z: 4 }] }), oldValue: toCompareObject({ x: [1, { z: 3, y: 2 }] }) }
		];

		const result = applyPatch({ options: {}, context }, dto, changes, column);
		expect(result.data).toEqual({ x: [1, { y: 2, z: 4 }] });
	});

	test('fails if nested structures are different', () => {
		const context = { rdb: { engine: 'sap' } };
		const column = { tsType: 'JSONColumn' };
		const dto = { data: { x: [1, { y: 2, z: 3 }] } };
		const changes = [
			{ op: 'replace', path: '/data', value: toCompareObject({ x: [1, { y: 2, z: 4 }] }), oldValue: toCompareObject({ x: [1, { z: 3, y: 5 }] }) }
		];

		expect(() => {
			applyPatch({ options: {}, context }, dto, changes, column);
		}).toThrow('The row was changed by another user.');
	});
});
