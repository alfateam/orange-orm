/* eslint-disable no-prototype-builtins */
// Simplified pool creator using URL API and handling search_path param

const log = require('../../table/log');
const defaults = require('../../poolDefaults');
const genericPool = require('../../generic-pool');
const { URL } = require('url');
let SQL;

function newPgPool(connectionString, poolOptions = {}) {
	let searchPath;
	let connStr = connectionString;

	try {
		const url = new URL(connectionString);
		const paramName = url.searchParams.has('search_path')
			? 'search_path'
			: url.searchParams.has('searchPath')
				? 'searchPath'
				: null;
		if (paramName) {
			searchPath = url.searchParams.get(paramName);
			url.searchParams.delete(paramName);
			connStr = url.toString();
		}
	} catch {
		// Non-URL string; leave as-is
	}

	//@ts-ignore
	const pool = genericPool.Pool({
		min: poolOptions.min || 0,
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log,

		create: async (cb) => {
			try {
				if (!SQL) ({ SQL } = await import('bun'));
				const client = new SQL(connStr);
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
			if (err) return cb(err, null, () => {});
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
		await client.unsafe(sql);
	}
}

module.exports = newPgPool;
