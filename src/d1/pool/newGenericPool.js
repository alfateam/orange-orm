/* eslint-disable no-prototype-builtins */
var EventEmitter = require('events').EventEmitter;

var defaults = require('./defaults');
var genericPool = require('../../generic-pool');

function newGenericPool(d1Database, poolOptions) {
	poolOptions = poolOptions || {};
	// @ts-ignore
	var pool = genericPool.Pool({
		max: 1,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
		create: function(cb) {
			var client = {d1: d1Database, poolCount: 0};

			return cb(null, client);
		},

		destroy: function() {
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