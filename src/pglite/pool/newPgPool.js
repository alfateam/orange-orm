/* eslint-disable no-prototype-builtins */
// Simplified pool creator using URL API and handling search_path param

const log = require('../../table/log');
const defaults = require('../../poolDefaults');
const genericPool = require('../../generic-pool');
let PGlite;

function newPgPool(connectionString, poolOptions = {}) {
	let { connStr, searchPath } = extractSearchPath(connectionString);

	//@ts-ignore
	const pool = genericPool.Pool({
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log,

		create: async (cb) => {
			try {
				if (!PGlite) ({ PGlite } = await import('@electric-sql/pglite'));
				const client = connStr === undefined ? new PGlite() : new PGlite(connStr);
				client.poolCount = 0;
				await applySearchPath(client, searchPath);
				cb(null, client);
			} catch (err) {
				cb(err, null);
			}
		},

		destroy: (client) => {
			client._destroying = true;
			client.poolCount = undefined;
			client.end();
		},
	});

	pool.connect = (cb) => {
		pool.acquire((err, client) => {
			if (err) return cb(err, null, () => { });
			client.poolCount++;
			cb(null, client, (releaseErr) => {
				releaseErr ? pool.destroy(client) : pool.release(client);
			});
		});
	};

	return pool;
}

async function applySearchPath(client, searchPath) {
	if (searchPath) {
		const sql = `SET search_path TO ${searchPath}`;
		log.emitQuery({ sql, parameters: [] });
		await client.exec(sql);
	}
}

function extractSearchPath(connectionString) {
	let connStr = connectionString;
	let searchPath;

	// Guard: nothing to do
	if (typeof connectionString !== 'string' || connectionString.length === 0) {
		return { connStr, searchPath };
	}

	// Split on the *first* "?" only
	const qPos = connectionString.indexOf('?');
	if (qPos === -1) {
		// No query-string segment
		return { connStr, searchPath };
	}

	const pathPart = connectionString.slice(0, qPos);
	const qsPart = connectionString.slice(qPos + 1);

	// Robust query-string handling via URLSearchParams
	const params = new URLSearchParams(qsPart);

	const paramName = 'search_path';

	if (paramName) {
		searchPath = params.get(paramName);
		params.delete(paramName);
	}

	// Re-assemble the cleaned connection string
	const remainingQs = params.toString();
	connStr = remainingQs ? `${pathPart}?${remainingQs}` : pathPart;

	return { connStr, searchPath };
}


module.exports = newPgPool;
