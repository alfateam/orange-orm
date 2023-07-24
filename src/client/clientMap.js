function map(fn) {
	const handler = {
		get(target, prop) {
			if (prop === 'map') {
				return () => {
					return new Proxy(onFinal, handler);
				};
			} else if (typeof target[prop] !== 'undefined') {
				return target[prop];
			} else {
				return () => {
					return new Proxy({}, handler);
				};
			}
		},
		apply(target, _thisArg, argumentsList) {
			if (target === onFinal) {
				return target(...argumentsList);
			} else {
				return new Proxy({}, handler);
			}
		},
		set(target, prop, value) {
			target[prop] = value;
			return true;
		},
	};

	const dbMap = {
		http: (url) => url,
		pg: throwDb,
		postgres: throwDb,
		mssql: throwDb,
		mssqlNative: throwDb,
		mysql: throwDb,
		sap: throwDb,
		sqlite: throwDb,
	};

	function throwDb() {
		throw new Error('Cannot create pool for database outside node');
	}

	function onFinal(arg) {
		if (arg.db && typeof arg === 'function') {
			arg.db = arg.db(dbMap);
		}
		return fn(arg);
	}
}

module.exports = map;
