function map(index, _fn) {
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

	function dbMap(fn) {
		return fn(dbMap);
	}

	dbMap.http = (url) => url;
	dbMap.pg = throwDb;
	dbMap.postgres = throwDb;
	dbMap.mssql = throwDb;
	dbMap.mssqlNative = throwDb;
	dbMap.mysql = throwDb;
	dbMap.sap = throwDb;
	dbMap.sqlite = throwDb;

	function throwDb() {
		throw new Error('Cannot create pool for database outside node');
	}

	function onFinal(arg) {
		if (arg && arg.db && typeof arg.db === 'function') {
			return index({
				...arg,
				db: dbMap(arg.db),
				providers: dbMap
			});
		}

		return index({ ...arg, providers: dbMap });
	}

	onFinal.http = (url) => index({ db: url, providers: dbMap });
	onFinal.pg = () => index({ db: throwDb, providers: dbMap });
	onFinal.postgres = () => index({ db: throwDb, providers: dbMap });
	onFinal.mssql = () => index({ db: throwDb, providers: dbMap });
	onFinal.mssqlNative = () => index({ db: throwDb, providers: dbMap });
	onFinal.mysql = () => index({ db: throwDb, providers: dbMap });
	onFinal.sap = () => index({ db: throwDb, providers: dbMap });
	onFinal.sqlite = () => index({ db: throwDb, providers: dbMap });

	return new Proxy(onFinal, handler);
}

module.exports = map;
