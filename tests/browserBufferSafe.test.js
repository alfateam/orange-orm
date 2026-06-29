import { describe, expect, test } from 'vitest';

const purifyBinary = require('../src/table/column/binary/purify');
const newBinaryEncode = require('../src/table/column/binary/newEncode');
const toCompareObject = require('../src/toCompareObject');

describe('browser Buffer safety', () => {
	test('handles browser and worker runtimes without Buffer', () => {
		withoutGlobalBuffer(() => {
			expect(purifyBinary('AQID')).toBe('AQID');
			expect(toCompareObject({ id: 1, value: 'test' })).toEqual({ id: 1, value: 'test' });
		});
	});

	test('decodes binary base64 without Buffer', () => {
		withoutGlobalBuffer(() => {
			const encode = newBinaryEncode({});
			const parameter = encode({ rdb: {} }, 'AQID');

			expect(parameter.parameters[0]).toBeInstanceOf(Uint8Array);
			expect(Array.from(parameter.parameters[0])).toEqual([1, 2, 3]);
		});
	});
});

function withoutGlobalBuffer(fn) {
	const previous = Object.getOwnPropertyDescriptor(globalThis, 'Buffer');
	Object.defineProperty(globalThis, 'Buffer', {
		value: undefined,
		configurable: true,
		writable: true
	});
	try {
		return fn();
	}
	finally {
		if (previous)
			Object.defineProperty(globalThis, 'Buffer', previous);
		else
			delete globalThis.Buffer;
	}
}
