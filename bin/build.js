let url = require('url');
let compile = require('./compile');
let glob = require('glob');
let path = require('path');
let findNodeModules = require('findup-sync');
let fs = require('fs');
let util = require('util');
let writeFile = util.promisify(fs.writeFile);
let ts = require('typescript');
let moduleDefinition = require('module-definition');
require('isomorphic-fetch');


async function run(cwd) {
	for (let schemaTs of await findSchemaJs(cwd)) {
		try {
			await runSingle(schemaTs);
		}
		catch (e) {
			//ignore
		}
	}
}

async function runSingle(schemaTs) {
	let schemaJsPath;
	let isPureJs = false;
	if (!schemaTs)
		return;
	if (schemaTs.substring(schemaTs.length - 2) === 'js') {
		schemaJsPath = schemaTs;
		isPureJs = true;
	}
	console.log(`Rdb: found schema ${schemaTs}`);
	if (!schemaJsPath) {
		let nodeModules = findNodeModules('node_modules', { cwd: schemaTs});
		let outDir = path.join(nodeModules, '/.rdb');
		schemaJsPath = compile(schemaTs, { outDir });
		//todo delete outDir
	}
	let schemaJs;
	try {
		schemaJs = isPureJs ? await import(url.pathToFileURL(schemaJsPath)) : require(schemaJsPath);
	}
	catch (e) {
		console.log(e.stack);
	}
	if ('default' in schemaJs)
		schemaJs = schemaJs.default;
	if (!schemaJs.tables) {
		console.log('Rdb: no tables found.');
		return;
	}
	let defs = '';
	for (let name in schemaJs.tables) {
		let db = schemaJs.db || '';
		let table = schemaJs.tables[name];
		if (typeof table === 'string' && typeof db === 'string')
			defs += (await download(db + table)) || (await download(db + table + '.d.ts'));
		else if (table.ts)
			defs += table.ts(name);
	}
	let src = '';
	src += getPrefixTs(isPureJs, schemaJs.tables);
	if (isPureJs)
		src += startNamespace(schemaJs.tables);
	src += defs;
	src += getRdbClientTs(schemaJs.tables);
	if (isPureJs)
		src += '}}'; //with namespace
	else
		src += '}';
	let indexDts = path.join(path.dirname(schemaTs), isPureJs ? '/index.d.ts' : '/index.ts');
	let sourceFile = ts.createSourceFile(indexDts, src, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
	const printer = ts.createPrinter();
	await writeFile(indexDts, printer.printFile(sourceFile));
	if (isPureJs)
		await writeIndexJs(schemaJsPath);
	console.log('Rdb: created ts typings successfully.');

}

async function writeIndexJs(schemaJsPath) {
	const schema = path.basename(schemaJsPath);
	const indexJs = path.join(path.dirname(schemaJsPath), '/index' + path.extname(schemaJsPath));
	if (moduleDefinition.sync(schemaJsPath) === 'commonjs')
		await writeFile(indexJs, `module.exports = require('./${schema}');`);
	else
		await writeFile(indexJs, `export {default} from './${schema}';`);
}

async function findSchemaJs(cwd) {
	let options = {
		ignore: ['**/node_modules/**', '**/dist/**', '**/dev/**'],
		cwd
	};
	return new Promise(function(resolve, reject) {
		glob('**/*(rdb|db)*/**/schema.*(js|mjs|ts)', options, async function(err, files) {
			if (err)
				reject(err);
			else if (files.length === 0)
				resolve([]);
			else {
				files.sort((a, b) => {
					const aIsTs = a.substring(a.length - 2) === 'ts';
					const bIsTs = b.substring(b.length - 2) === 'ts';
					if (aIsTs && bIsTs)
						return 0;
					else if (aIsTs)
						return -1;
					else if (bIsTs)
						return 1;
					else
						return 0;
				});
				files = files.map(x => path.join(cwd, '/', x));
				resolve(files);
			}
		});
	});
}

function getPrefixTs(isPureJs) {
	if (isPureJs)
		return `
	/* tslint:disable */
	/* eslint-disable */
	import { RequestHandler} from 'express'; 
	import { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Express, Filter, RawFilter, Config, TablesConfig ResponseOptions, TransactionOptions } from 'rdb';
	export = r;
	declare function r(config: Config): r.RdbClient;

	`;

	return `
/* tslint:disable */
/* eslint-disable */
	import schema from './schema';
import { RequestHandler} from 'express'; 
import { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Express, Filter, RawFilter, Config, TablesConfig, ResponseOptions, TransactionOptions } from 'rdb';
export default schema as RdbClient;`;
}

function startNamespace(tables) {
	return `
	declare namespace r {${getTables()}
`;

	function getTables() {
		let result = '';
		for (let name in tables) {
			let Name = name.substring(0, 1).toUpperCase() + name.substring(1);
			result +=
				`
    	const ${name}: ${Name}Table;`;
		}
		result += `

        function beforeRequest(callback: (response: Response, options: ResponseOptions) => Promise<void> | void): void;
        function beforeResponse(callback: (response: Response, options: ResponseOptions) => Promise<void> | void): void;
        function reactive(proxyMethod: (obj: unknown) => unknown): void;
        function and(filter: Filter, ...filters: Filter[]): Filter;
        function or(filter: Filter, ...filters: Filter[]): Filter;
        function not(): Filter;
        function query(filter: RawFilter | string): Promise<unknown[]>;
        function query<T>(filter: RawFilter | string): Promise<T[]>;
		function transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
        const filter: Filter;`;
		return result;
	}
}

function getRdbClientTs(tables) {
	return `
	export interface RdbClient  {${getTables()}
	}
`;

	function getTables() {
		let result = '';
		for (let name in tables) {
			let Name = name.substring(0, 1).toUpperCase() + name.substring(1);
			result +=
				`
    	${name}: ${Name}Table;`;
		}
		result += `
		(config: Config): RdbClient;
        beforeRequest(callback: (response: Response, options: ResponseOptions) => Promise<void> | void): void;
        beforeResponse(callback: (response: Response, options: ResponseOptions) => Promise<void> | void): void;
        reactive(proxyMethod: (obj: unknown) => unknown): void;
        and(filter: Filter, ...filters: Filter[]): Filter;
        or(filter: Filter, ...filters: Filter[]): Filter;
        not(): Filter;
        query(filter: RawFilter | string): Promise<unknown[]>;
        query<T>(filter: RawFilter | string): Promise<T[]>;
		transaction(fn: (transaction: RdbClient) => Promise<unknown>, options?: TransactionOptions): Promise<void>;
        filter: Filter;`;
		return result;
	}
}

async function download(url) {
	// eslint-disable-next-line no-undef
	let request = new Request(url, { method: 'GET' });
	// eslint-disable-next-line no-undef
	let response = await fetch(request);

	if (response.status >= 200 && response.status < 300)
		return response.text && await response.text();
	return '';
}

module.exports = function(cwd) {
	run(cwd).then(null, console.log);
};