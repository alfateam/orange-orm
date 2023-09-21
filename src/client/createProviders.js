const connectionCache = new WeakMap();


function createProviders(index) {

	function dbMap(fn) {
		fn = new Proxy(fn, {});
		return (() => negotiateCachedPool(fn, dbMap));
	}

	Object.defineProperty(dbMap, 'pg', {
		get:  function() {
			return createPool.bind(null, 'pg');
		}
	});
	Object.defineProperty(dbMap, 'postgres', {
		get:  function() {
			return createPool.bind(null, 'pg');
		}
	});
	Object.defineProperty(dbMap, 'mssql', {
		get:  function() {
			return createPool.bind(null, 'mssql');
		}
	});
	Object.defineProperty(dbMap, 'mssqlNative', {
		get:  function() {
			return createPool.bind(null, 'mssqlNative');
		}
	});
	Object.defineProperty(dbMap, 'mysql', {
		get:  function() {
			return createPool.bind(null, 'mysql');
		}
	});
	Object.defineProperty(dbMap, 'sap', {
		get:  function() {
			return createPool.bind(null, 'sap');
		}
	});
	Object.defineProperty(dbMap, 'sqlite', {
		get:  function() {
			return createPool.bind(null, 'sqlite');
		}
	});
	Object.defineProperty(dbMap, 'http', {
		get:  function() {
			return createPool.bind(null, 'http');
		}
	});

	dbMap.express = index.express;

	function createPool(providerName, ...args) {
		const provider = index[providerName];
		return provider.apply(null, args);
	}

	return dbMap;

}

function negotiateCachedPool(fn, providers) {
	let cache = connectionCache.get(fn);
	if (!cache) {
		cache = {};
		connectionCache.set(fn, cache);
	}

	const dbMap = {
		get pg() {
			return createPool.bind(null, 'pg');
		},
		get postgres() {
			return createPool.bind(null, 'pg');
		},
		get mssql() {
			return createPool.bind(null, 'mssql');
		},
		get mssqlNative() {
			return createPool.bind(null, 'mssqlNative');
		},
		get mysql() {
			return createPool.bind(null, 'mysql');
		},
		get sap() {
			return createPool.bind(null, 'sap');
		},
		get sqlite() {
			return createPool.bind(null, 'sqlite');
		},
		get http() {
			return createPool.bind(null, 'http');
		}
	};

	function createPool(providerName, ...args) {
		const key = JSON.stringify(args);
		if (!cache[providerName])
			cache[providerName] = {};
		let pool = cache[providerName][key];
		if (!pool) {
			pool = providers[providerName].apply(null, args);
			cache[providerName][key] = pool;
		}
		return pool;
	}
	return fn(dbMap);
}



module.exports = createProviders;