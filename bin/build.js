let url = require('url');
let compile = require('./compile');
let path = require('path');
let findNodeModules = require('findup-sync');
let fs = require('fs');
let util = require('util');
let writeFile = util.promisify(fs.writeFile);
let ts = require('typescript');
let moduleDefinition = require('module-definition');
let getTSDefinition = require('../src/getTSDefinition');
const _axios = require('axios');
const axios = _axios.default ? _axios.default.create() : _axios.create();

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
		console.log(`Orange: found schema ${schemaTs}`);
		if (!schemaJsPath) {
			let nodeModules = findNodeModules('node_modules', { cwd: schemaTs });
			outDir = path.join(nodeModules, '/.rdb', '/' + new Date().getUTCMilliseconds());
			schemaJsPath = compile(schemaTs, { outDir });
		}
		let schemaJs = isPureJs ? await import(url.pathToFileURL(schemaJsPath)) : require(schemaJsPath);
		if ('default' in schemaJs)
			schemaJs = schemaJs.default;
		if (!schemaJs.tables) {
			console.log('Orange: no tables found.');
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

		console.log('Orange: created ts typings successfully.');
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
	let ignoredDirNames = {
		node_modules: true,
		dist: true,
		dev: true,
		deploy: true,
		build: true
	};
	let files = [];
	scanForSchemaFiles(cwd, ignoredDirNames, files);
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
	return files;
}

function scanForSchemaFiles(currentDir, ignoredDirNames, results) {
	for (let entry of fs.readdirSync(currentDir)) {
		const fullPath = path.join(currentDir, entry);
		let stat;
		try {
			stat = fs.statSync(fullPath);
		}
		catch (e) {
			continue;
		}
		if (stat.isDirectory()) {
			if (ignoredDirNames[entry])
				continue;
			scanForSchemaFiles(fullPath, ignoredDirNames, results);
			continue;
		}

		if (entry === 'schema.js' || entry === 'schema.mjs' || entry === 'schema.ts')
			results.push(fullPath);
	}
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
	console.log(`Orange: downloading from  ${url}`);
	// eslint-disable-next-line no-undef
	try {
		let response = await axios.get(url);
		return response.data;
	}
	catch(e) {
		throw new Error('No config found at ' + url);
	}
}

module.exports = function(cwd) {
	run(cwd).then(null, console.log);
};
