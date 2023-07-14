// @ts-nocheck
/* eslint-disable no-prototype-builtins */
var EventEmitter = require('events').EventEmitter;

var defaults = require('./defaults');
var genericPool = require('../../generic-pool');
var mysql = require('mysql2');

function newGenericPool(connectionString, poolOptions) {
	if (typeof connectionString === 'string')
		connectionString = connectionString + '?dateStrings=true';
	else
		connectionString.dateStrings = true;
	poolOptions = poolOptions || {};
	var pool = genericPool.Pool({
		max: poolOptions.size || poolOptions.poolSize || defaults.poolSize,
		idleTimeoutMillis: poolOptions.idleTimeout || defaults.poolIdleTimeout,
		reapIntervalMillis: poolOptions.reapIntervalMillis || defaults.reapIntervalMillis,
		log: poolOptions.log || defaults.poolLog,
		create: function(cb) {
			var innerPool = mysql.createPool(connectionString);
			return cb(null, innerPool);
			// innerPool.getConnection(onConnected);

			// function onConnected(err, client) {
			// 	console.dir('onConnected');
			// 	if(err)
			// 		return cb(err, null);
			// 	client.poolCount = 0;
			// 	return cb(null, client);
			// }
		},

		destroy: function(client) {
			client.poolCount = undefined;
			client.end();
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