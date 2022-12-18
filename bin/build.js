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
let getTSDefinition = require('../src/getTSDefinition');
require('isomorphic-fetch');


async function run(cwd) {
	for (let schemaTs of await findSchemaJs(cwd)) {
		await runSingle(schemaTs);
	}
}

async function runSingle(schemaTs) {
	let outDir;
	try {

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
			let nodeModules = findNodeModules('node_modules', { cwd: schemaTs });
			outDir = path.join(nodeModules, '/.rdb', '/' + new Date().getUTCMilliseconds());
			schemaJsPath = compile(schemaTs, { outDir });
		}
		let schemaJs = isPureJs ? await import(url.pathToFileURL(schemaJsPath)) : require(schemaJsPath);
		if ('default' in schemaJs)
			schemaJs = schemaJs.default;
		if (!schemaJs.tables) {
			console.log('Rdb: no tables found.');
			return;
		}
		let src = '';
		if (typeof schemaJs.db === 'string') {
			src = ((await tryDownload(schemaJs.db + '.d.ts', isPureJs) || await download(schemaJs.db, isPureJs)));
		}
		else {
			let tsArg = Object.keys(schemaJs.tables).map(x => {
				return { table: schemaJs.tables[x], name: x };
			});
			src = getTSDefinition(tsArg);
		}
		let indexDts = path.join(path.dirname(schemaTs), isPureJs ? '/index.d.ts' : '/index.ts');
		let sourceFile = ts.createSourceFile(indexDts, src, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
		const printer = ts.createPrinter();
		await writeFile(indexDts, printer.printFile(sourceFile));
		if (isPureJs)
			await writeIndexJs(schemaJsPath);

		console.log('Rdb: created ts typings successfully.');
	}
	catch(e) {
		console.dir(e);
	}

	if (outDir)
		fs.rmSync(outDir, { recursive: true, force: true });
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
		ignore: ['**/node_modules/**', '**/dist/**', '**/dev/**', '**/deploy/**', '**/build/**'],
		cwd
	};
	return new Promise(function (resolve, reject) {
		glob('**/schema.*(js|mjs|ts)', options, async function (err, files) {
			// glob('**/*(rdb|db)*/**/schema.*(js|mjs|ts)', options, async function(err, files) {
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
	import { RequestHandler } from 'express'; 
	import { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Express, Filter, RawFilter, Config, TablesConfig ResponseOptions, TransactionOptions, Pool } from 'rdb';
	export { RequestHandler } from 'express';
	export { Concurrency, Express, Filter, RawFilter, Config, TablesConfig, ResponseOptions, TransactionOptions, Pool } from 'rdb';
	export = r;
	declare function r(config: Config): r.RdbClient;

	`;

	return `
/* tslint:disable */
/* eslint-disable */
	import schema from './schema';
import { RequestHandler} from 'express'; 
import { BooleanColumn, JSONColumn, UUIDColumn, DateColumn, NumberColumn, BinaryColumn, StringColumn, Concurrency, Express, Filter, RawFilter, Config, TablesConfig, ResponseOptions, TransactionOptions, Pool } from 'rdb';
export default schema as RdbClient;`;
}

function tryDownload(_url, _isNamespace) {
	try {
		return download.apply(null, arguments).then((res) => res, () => '');
	}
	// eslint-disable-next-line no-empty
	catch (e) {
	}
}

async function download(url, isNamespace) {
	url = `${url}?isNamespace=${isNamespace}`;
	console.log(`Rdb: downloading from  ${url}`);
	// eslint-disable-next-line no-undef
	let request = new Request(url, { method: 'GET' });
	// eslint-disable-next-line no-undef
	let response = await fetch(request);

	if (response.status >= 200 && response.status < 300)
		return response.text && await response.text();
	else
		throw new Error('No config found at ' + url);
}

module.exports = function (cwd) {
	run(cwd).then(null, console.log);
};