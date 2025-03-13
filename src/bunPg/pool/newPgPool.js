/* eslint-disable no-prototype-builtins */
//slightly modified code from github.com/brianc/node-postgres
var log = require('../../table/log');

var defaults = require('../../poolDefaults');
var genericPool = require('../../generic-pool');
var pg;
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
				if (!pg) {
					const bunImport = await import('bun');
					const { sql } = bunImport.default || bunImport;
					pg = sql;
				}
			}
			catch(e) {
				return cb(e, null);
			}
			var client = new pg.Client(connectionString);
			client.connect(function(err) {
				if (err) return cb(err, null);

				//handle connected client background errors by emitting event
				//via the pg object and then removing errored client from the pool
				client.on('error', function(e) {
					pool.emit('error', e, client);

					// If the client is already being destroyed, the error
					// occurred during stream ending. Do not attempt to destroy
					// the client again.
					if (!client._destroying) {
						pool.destroy(client);
					}
				});

				// Remove connection from pool on disconnect
				client.on('end', function(_e) {
					// Do not enter infinite loop between pool.destroy
					// and client 'end' event...
					if (!client._destroying) {
						pool.destroy(client);
					}
				});
				client.poolCount = 0;
				negotiateSearchPath(client, connectionString, (err) => cb(err, client));

			});
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

function negotiateSearchPath(client, connectionString, cb) {
	const searchPath = parseSearchPathParam(connectionString);
	if (searchPath) {
		const sql = `set search_path to ${searchPath}`;
		log.emitQuery({sql, parameters: []});
		return client.query(sql, cb);
	}
	else
		cb();


}

module.exports = newPgPool;