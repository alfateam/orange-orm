/* eslint-disable no-prototype-builtins */
//slightly modified code from github.com/brianc/node-postgres
var log = require('../../table/log');

var defaults = require('../../poolDefaults');
var genericPool = require('../../generic-pool');
var SQL;
var parseSearchPathParam = require('../../pg/pool/parseSearchPathParam');

function newPgPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};

	// @ts-ignore
	var pool = genericPool.Pool({
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log,
		create: async function(cb) {
			try {
				if (!SQL)
					({ SQL } = await import('bun'));
				var client = new SQL(connectionString);
				client.poolCount = 0;
				negotiateSearchPath(client, connectionString).then(() => cb(null, client), e => cb(e, client));
			}
			catch(e) {
				return cb(e, null);
			}
		},
		destroy: function(client) {
			client._destroying = true;
			client.poolCount = undefined;
			client.end();
		}
	});
	//monkey-patch with connect method
	pool.connect = function(cb) {
		pool.acquire(function(err, client) {
			if (err) return cb(err, null, function() {
				/*NOOP*/
			});
			client.poolCount++;
			cb(null, client, function(err) {
				if (err) {
					pool.destroy(client);
				} else {
					pool.release(client);
				}
			});
		});
	};
	return pool;
}

function negotiateSearchPath(client, connectionString) {
	const searchPath = parseSearchPathParam(connectionString);
	if (searchPath) {
		const sql = `set search_path to ${searchPath}`;
		log.emitQuery({sql, parameters: []});
		return client.unsafe(sql);
	}
	else
		return Promise.resolve();
}

module.exports = newPgPool;