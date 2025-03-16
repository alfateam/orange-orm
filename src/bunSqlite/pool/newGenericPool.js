/* eslint-disable no-prototype-builtins */
var defaults = require('../../poolDefaults');

var genericPool = require('../../generic-pool');
var sqlite;

function newGenericPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	var pool = genericPool.Pool({
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
		create: async function(cb) {
			try {
				try {
					if (!sqlite) {
						sqlite = await import('bun:sqlite');
						sqlite = sqlite.default || sqlite;

					}
				}
				catch (err) {
					return cb(err, null);
				}

				var client = new sqlite.Database(connectionString);
				client.poolCount = 0;
				cb(null, client);
			}
			catch(err) {
				return cb(err, null);
			}
		},

		destroy: function(client) {
			client.poolCount = undefined;
			client.close();
		}
	});
	//monkey-patch with connect method
	pool.connect = function(cb) {
		pool.acquire(function(err, client) {
			if(err)  return cb(err, null, function() {/*NOOP*/});
			client.poolCount++;
			cb(null, client, function(err) {
				if(err) {
					pool.destroy(client);
				} else {
					pool.release(client);
				}
			});
		});
	};
	return pool;
}

module.exports = newGenericPool;