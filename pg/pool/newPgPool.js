//slightly modified code from github.com/brianc/node-postgres
var promise = require('../../table/promise');
var EventEmitter = require('events').EventEmitter;
var defaults = require('./defaults');
var genericPool = require('generic-pool');
var pg = require('pg');

function newPgPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	var factory = {
		create: function() {
			return promise(function(resolve, reject) {
				var client = new pg.Client(connectionString);
				client.connect(function(err) {
					if (err) return reject(err);

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
					client.on('end', function() {
					// Do not enter infinite loop between pool.destroy
					// and client 'end' event...
						if (!client._destroying) {
							pool.destroy(client);
						}
					});
					client.poolCount = 0;

					return resolve(client);
				});
			});
		},
		destroy: function(client) {
			return promise(function(resolve, reject) {
				try {
					client._destroying = true;
					client.poolCount = undefined;
					client.end();
					resolve();
				}
				catch(e) {
					reject(e);
				}
			});
		}
	};
	var pool = genericPool.createPool(factory, {
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog
	});
	//mixin EventEmitter to pool
	EventEmitter.call(pool);
	for (var key in EventEmitter.prototype) {
		if (EventEmitter.prototype.hasOwnProperty.call(EventEmitter, key)) {
			pool[key] = EventEmitter.prototype[key];
		}
	}
	//monkey-patch with connect method
	pool.connect = function(cb) {
		var domain = process.domain;
		if (domain) {
			cb = domain.bind(cb);
		}
		pool.acquire()
			.then(function(client) {
				client.poolCount++;
				cb(null, client, function(err) {
					if (err) {
						pool.destroy(client);
					} else {
						pool.release(client);
					}
				});

			})
			.then(null, function(err) {
				cb(err, null);
			});
	};
	return pool;
}

module.exports = newPgPool;