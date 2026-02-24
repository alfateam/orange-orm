const fs = require('fs');
const path = require('path');
const url = require('url');
const compile = require('./compile');
const { buildChangeTrackingSql, setupChangeTracking } = require('../src/sync/setupChangeTracking');

async function generateTriggers(cwd, argv) {
	const options = parseArgs(argv);
	if (options.help) {
		printHelp();
		return;
	}

	const filePath = options.file
		? resolveFile(cwd, options.file)
		: findConfigFile(cwd);

	if (!filePath) {
		console.error('Orange: could not find db.ts/js or map.ts/js. Use --file to specify.');
		process.exitCode = 1;
		return;
	}

	let cleanup = () => {};
	try {
		const { mod, cleanup: tmpCleanup } = await loadModule(filePath);
		cleanup = tmpCleanup;

		const { db, tables } = resolveDbAndTables(mod);
		if (!tables || Object.keys(tables).length === 0) {
			console.error('Orange: no tables found in the loaded module.');
			process.exitCode = 1;
			return;
		}

		const { sql, trackedTables } = buildChangeTrackingSql(tables);
		if (options.sqlOnly) {
			process.stdout.write(sql);
			if (db && typeof db.close === 'function')
				await db.close();
			return;
		}

		if (!db || typeof db.query !== 'function') {
			console.error('Orange: no db connection found. Export a connected db or use --sql.');
			process.exitCode = 1;
			return;
		}

		await setupChangeTracking(db, tables);

		if (typeof db.close === 'function')
			await db.close();

		console.log(`Orange: created triggers for ${trackedTables} tables.`);
	} catch (err) {
		console.error(err?.stack || err?.message || err);
		process.exitCode = 1;
	} finally {
		try { cleanup(); } catch { /* noop */ }
	}
}

function parseArgs(argv) {
	const options = {
		sqlOnly: false,
		file: null,
		help: false
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--sql') {
			options.sqlOnly = true;
		} else if (arg === '--file' || arg === '-f') {
			const next = argv[i + 1];
			if (!next || next.startsWith('-')) {
				console.error('Orange: --file requires a path argument.');
				options.help = true;
				break;
			}
			options.file = next;
			i += 1;
		} else if (arg === '--help' || arg === '-h') {
			options.help = true;
		} else {
			console.error(`Orange: unknown argument "${arg}"`);
			options.help = true;
			break;
		}
	}

	return options;
}

function printHelp() {
	console.log([
		'Usage:',
		'  orange-orm sync:setup [--sql] [--file <path>]',
		'',
		'Options:',
		'  --sql        Print SQL to stdout and do not execute.',
		'  --file, -f   Path to db.ts/js or map.ts/js.',
		''
	].join('\n'));
}

function resolveFile(cwd, file) {
	if (!file)
		return null;
	return path.isAbsolute(file) ? file : path.join(cwd, file);
}

function findConfigFile(cwd) {
	const dbCandidates = [
		'db.ts', 'db.js', 'db.mjs', 'db.cjs', 'db.mts', 'db.cts'
	];
	const mapCandidates = [
		'map.ts', 'map.js', 'map.mjs', 'map.cjs', 'map.mts', 'map.cts'
	];

	const rootDb = findFirstExisting(cwd, dbCandidates);
	if (rootDb)
		return rootDb;

	const srcDb = findFirstExisting(path.join(cwd, 'src'), dbCandidates);
	if (srcDb)
		return srcDb;

	const rootMap = findFirstExisting(cwd, mapCandidates);
	if (rootMap)
		return rootMap;

	const srcMap = findFirstExisting(path.join(cwd, 'src'), mapCandidates);
	if (srcMap)
		return srcMap;

	return null;
}

function findFirstExisting(dir, candidates) {
	try {
		if (!fs.existsSync(dir))
			return null;
	} catch {
		return null;
	}
	for (const candidate of candidates) {
		const filePath = path.join(dir, candidate);
		if (fs.existsSync(filePath))
			return filePath;
	}
	return null;
}

async function loadModule(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	let outDir;
	let targetPath = filePath;

	if (ext === '.ts' || ext === '.mts' || ext === '.cts') {
		const nodeModules = findClosestNodeModules(filePath);
		outDir = path.join(nodeModules, '/.orange-orm-triggers', '/' + Date.now());
		targetPath = compile(filePath, { outDir });
		if (!targetPath)
			throw new Error(`Orange: failed to compile ${filePath}`);
	}

	const mod = await import(url.pathToFileURL(targetPath).href);
	const cleanup = () => {
		if (outDir)
			fs.rmSync(outDir, { recursive: true, force: true });
	};

	return { mod, cleanup };
}

function findClosestNodeModules(startPath) {
	const startDir = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);
	let currentDir = startDir;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const nodeModulesPath = path.join(currentDir, 'node_modules');
		if (fs.existsSync(nodeModulesPath))
			return nodeModulesPath;

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir)
			return path.join(startDir, 'node_modules');
		currentDir = parentDir;
	}
}

function resolveDbAndTables(mod) {
	const candidates = [
		mod,
		mod?.default,
		mod?.db,
		mod?.default?.db
	].filter(Boolean);

	let db = null;
	for (const c of candidates) {
		if (c && typeof c.query === 'function' && c.tables) {
			db = c;
			break;
		}
	}

	let tables = null;
	if (db?.tables)
		tables = db.tables;
	if (!tables) {
		for (const c of candidates) {
			tables = extractTablesFromValue(c);
			if (tables)
				break;
		}
	}

	return { db, tables };
}

function extractTablesFromValue(value) {
	if (!value || (typeof value !== 'object' && typeof value !== 'function'))
		return null;
	if (value.tables && typeof value.tables === 'object')
		return value.tables;

	const tables = {};
	for (const [name, table] of Object.entries(value)) {
		if (table && table._dbName && Array.isArray(table._primaryColumns))
			tables[name] = table;
	}
	return Object.keys(tables).length ? tables : null;
}

module.exports = generateTriggers;
module.exports.resolveDbAndTables = resolveDbAndTables;
