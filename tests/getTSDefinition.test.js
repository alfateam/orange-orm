import { describe, expect, test } from 'vitest';

const ts = require('typescript');
const getTSDefinition = require('../src/getTSDefinition');
const map = require('./db');
const { resolve } = require('path');

const tableConfigs = Object.keys(map)
	.filter(name => map[name] && map[name]._dbName)
	.map(name => ({ name, table: map[name] }));

describe('generated TypeScript definition', () => {
	test.each([false, true])('emits valid ad-hoc relation declarations (namespace: %s)', isNamespace => {
		const source = getTSDefinition(tableConfigs, { isNamespace, isHttp: true });
		const diagnostics = compile(source, `generated-${isNamespace}.d.ts`);
		const errors = diagnostics
			.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
			.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));

		expect(errors).toEqual([]);
		expect(source).toContain('many(fetchingStrategy?: OrderLineAdHocStrategy<Root, Current>)');
		expect(source).toContain('Promise<OrderLineAdHocArray<Strategy>>');
		expect(source).toContain('context: AdHocFactoryContext<Root, OrderLineTableBase>');
		expect(source).toContain('where?: RawFilter | ((table: OrderLineTableBase) => RawFilter);');
		expect(source).toContain('root: Root;');
		expect(source).not.toContain('parent:');
	});

	test('types explicit Express table exposure and optional sync configuration', () => {
		const source = `
import type { ExpressConfig } from './generated-express';
const endpoint: ExpressConfig = { order: {}, orderLine: {} };
const disabled: ExpressConfig = { order: {}, sync: false };
const tuned: ExpressConfig = { order: {}, sync: { enabled: true, limits: { maxKeysPerBatch: 10 } } };
const disabledObject: ExpressConfig = { sync: { enabled: false } };
// @ts-expect-error Unknown tables cannot be exposed.
const unknown: ExpressConfig = { missingTable: {} };
`;
		const errors = compile(source, 'express-config-usage.ts', {
			'generated-express.d.ts': getTSDefinition(tableConfigs)
		})
			.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
			.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
		expect(errors).toEqual([]);
	});
});

function compile(source, fileName, extraSources = {}) {
	const options = {
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.CommonJS,
		strict: true,
		skipLibCheck: true,
		esModuleInterop: true
	};
	const host = ts.createCompilerHost(options);
	const getSourceFile = host.getSourceFile.bind(host);
	const readFile = host.readFile.bind(host);
	const fileExists = host.fileExists.bind(host);
	const files = new Map(Object.entries({ ...extraSources, [fileName]: source })
		.map(([name, text]) => [resolve(name), text]));
	host.fileExists = path => files.has(resolve(path)) || fileExists(path);
	host.readFile = path => files.get(resolve(path)) ?? readFile(path);
	host.getSourceFile = (path, languageVersion, ...rest) => files.has(resolve(path))
		? ts.createSourceFile(path, files.get(resolve(path)), languageVersion, true)
		: getSourceFile(path, languageVersion, ...rest);
	const program = ts.createProgram([fileName], options, host);
	return ts.getPreEmitDiagnostics(program);
}
