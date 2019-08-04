var promise = require('../../table/promise');
var EventEmitter = require('events').EventEmitter;

var defaults = require('./defaults');
var genericPool = require('generic-pool');
var sqlite = require('sqlite3');

function newGenericPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	var factory = {
		create: function() {
			return promise(function(resolve, reject) {
				var client = new sqlite.Database(connectionString, onConnected);

				function onConnected(err) {
					if (err)
						return reject(err);
					client.poolCount = 0;
					resolve(client);
				}
			});
		},
		destroy: function(client) {
			return promise(function(resolve, reject) {
				try {
					client.poolCount = undefined;
					client.close();
					resolve();
				} catch (e) {
					reject(e);
				}
			});

		}
	};
	var pool = genericPool.createPool(factory, {
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
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
				cb(err, null, function() {});
			});
	};
	return pool;
}

module.exports = newGenericPool;