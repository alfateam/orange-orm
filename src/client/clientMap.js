function map(fn) {
	const handler = {
		get(target, prop) {
			if (prop === 'map') {
				return (...args) => {
					console.log(`Called method "${prop}" with arguments:`, args);
					return new Proxy(onFinal, handler);
				};
			} else if (typeof target[prop] !== 'undefined') {
				return target[prop];
			} else {
				return (...args) => {
					console.log(`Called method "${prop}" with arguments:`, args);
					return new Proxy({}, handler);
				};
			}
		},
		apply(target, _thisArg, argumentsList) {
			if (target === onFinal) {
				return target(...argumentsList);
			} else {
				console.log(`Called function "${target.name}" with arguments:`, argumentsList);
				return new Proxy({}, handler);
			}
		},
		set(target, prop, value) {
			console.log(`Set property "${prop}" to value:`, value);
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
