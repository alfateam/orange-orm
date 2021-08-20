// @ts-nocheck
/* eslint-disable no-prototype-builtins */
var EventEmitter = require('events').EventEmitter;

var defaults = require('./defaults');
var genericPool = require('../../generic-pool');
var mssql = require('msnodesqlv8');

function newGenericPool(connectionString, poolOptions) {
	poolOptions = poolOptions || {};
	var pool = genericPool.Pool({
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
		create: function(cb) {
			var client;
			mssql.open(connectionString, onConnected);

			function onConnected(err, _client) {
				if(err)
					return cb(err, null);
				client = _client;
				client.poolCount = 0;
				return cb(null, client);
			}
		},

		destroy: function(client) {
			client.poolCount = undefined;
			client.close();
		}
	});
	//mixin EventEmitter to pool
	EventEmitter.call(pool);
	for(var key in EventEmitter.prototype) {
		if(EventEmitter.prototype.hasOwnProperty(key)) {
			pool[key] = EventEmitter.prototype[key];
		}
	}
	//monkey-patch with connect method
	pool.connect = function(cb) {
		var domain = process.domain;
		pool.acquire(function(err, client) {
			if(domain) {
				cb = domain.bind(cb);
			}
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