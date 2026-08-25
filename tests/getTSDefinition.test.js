import { describe, expect, test } from 'vitest';

const ts = require('typescript');
const getTSDefinition = require('../src/getTSDefinition');
const map = require('./db');

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
		expect(source).toContain('many(fetchingStrategy?: OrderLineAdHocStrategy)');
		expect(source).toContain('Promise<OrderLineAdHocArray<Strategy>>');
		expect(source).toContain('root: AdHocScopeTable; parent: AdHocScopeTable');
	});
});

function compile(source, fileName) {
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
	host.fileExists = path => path === fileName || fileExists(path);
	host.readFile = path => path === fileName ? source : readFile(path);
	host.getSourceFile = (path, languageVersion, ...rest) => path === fileName
		? ts.createSourceFile(path, source, languageVersion, true)
		: getSourceFile(path, languageVersion, ...rest);
	const program = ts.createProgram([fileName], options, host);
	return ts.getPreEmitDiagnostics(program);
}
