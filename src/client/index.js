const createPatch = require('./createPatch');
const stringify = require('./stringify');
const cloneFromDb = require('./cloneFromDb');
const netAdapter = require('./netAdapter');
const toKeyPositionMap = require('./toKeyPositionMap');
const rootMap = new WeakMap();
const fetchingStrategyMap = new WeakMap();
const targetKey = Symbol();
const map = require('./clientMap');
const clone = require('rfdc/default');
const createAxiosInterceptor = require('./axiosInterceptor');
const flags = require('../flags');
const newSyncClient = require('./syncClient');

function rdbClient(options = {}) {
	flags.useLazyDefaults = false;
	if (options.pg)
		options = { db: options };
	let transaction = options.transaction;
	let _reactive = options.reactive;
	let providers = options.providers || {};
	let baseUrl = options.db;
	if (typeof providers === 'function')
		baseUrl = typeof options.db === 'function' ? providers(options.db) : options.db;
	const axiosInterceptor = createAxiosInterceptor();

	function client(_options = {}) {
		if (_options.pg)
			_options = { db: _options };
		return rdbClient({ ...options, ..._options });
	}

	client.reactive = (cb => _reactive = cb);
	client.map = map.bind(null, client);
	Object.defineProperty(client, 'metaData', {
		get: getMetaData,
		enumerable: true,
		configurable: false
	});
	client.interceptors = axiosInterceptor;
	client.createPatch = _createPatch;
	client.table = table;
	client.or = column('or');
	client.and = column('and');
	client.not = column('not');
	client.filter = {
		or: client.or,
		and: client.and,
		not: client.not,
		toJSON: function() {
			return;
		}
	};
	client.query = query;
	client.function = sqliteFunction;
	client.transaction = runInTransaction;
	client.db = baseUrl;
	client.mssql = onProvider.bind(null, 'mssql');
	client.mssqlNative = onProvider.bind(null, 'mssqlNative');
	client.pg = onProvider.bind(null, 'pg');
	client.pglite = onProvider.bind(null, 'pglite');
	client.postgres = onProvider.bind(null, 'postgres');
	client.d1 = onProvider.bind(null, 'd1');
	client.sqlite = onProvider.bind(null, 'sqlite');
	client.sap = onProvider.bind(null, 'sap');
	client.oracle = onProvider.bind(null, 'oracle');
	client.http = onProvider.bind(null, 'http');//todo
	client.mysql = onProvider.bind(null, 'mysql');
	client.express = express;
	client.hono = hono;
	client.syncClient = newSyncClient(client, getDb, axiosInterceptor);
	client.close = close;

	function close() {
		return client.db.end ? client.db.end() : Promise.resolve();
	}

	function onProvider(name, ...args) {
		let db = providers[name].apply(null, args);
		return client({ db });
	}

	if (options.tables) {
		// for (let name in options.tables) {
		// 	client[name] = table(options.tables[name], name, { ...readonly, ...clone(options[name]) });
		// }
		client.tables = options.tables;
		// return client;
	}
	// else {
	let handler = {
		get(_target, property,) {
			if (property in client)
				return Reflect.get(...arguments);
			else {
				const readonly = { readonly: options.readonly, concurrency: options.concurrency };
				return table(options?.tables?.[property] || baseUrl, property, { ...readonly, ...clone(options[property]) });
			}
		}

	};
	return new Proxy(client, handler);
	// }

	function getMetaData() {
		const result = { readonly: options.readonly, concurrency: options.concurrency };
		for (let name in options.tables) {
			result[name] = getMetaDataTable(options.tables[name], inferOptions(options, name));
		}
		return result;
	}

	function inferOptions(defaults, property) {
		const parent = {};
		if ('readonly' in defaults)
			parent.readonly = defaults.readonly;
		if ('concurrency' in defaults)
			parent.concurrency = defaults.concurrency;
		return { ...parent, ...(defaults[property] || {}) };
	}


	function getMetaDataTable(table, options) {
		const result = {};
		for (let i = 0; i < table._columns.length; i++) {
			const name = table._columns[i].alias;
			result[name] = inferOptions(options, name);
		}
		for (let name in table._relations) {
			if (!isJoinRelation(name, table))
				result[name] = getMetaDataTable(table._relations[name].childTable, inferOptions(options, name));
		}

		return result;

		function isJoinRelation(name, table) {
			return table[name] && table[name]._relation.columns;
		}
	}

	async function query() {
		const adapter = netAdapter(baseUrl, undefined, { tableOptions: { db: baseUrl, transaction } });
		return adapter.query.apply(null, arguments);
	}

	async function sqliteFunction() {
		const adapter = netAdapter(baseUrl, undefined, { tableOptions: { db: baseUrl, transaction } });
		return adapter.sqliteFunction.apply(null, arguments);
	}

	function express(arg) {
		if (providers.express) {
			return providers.express(client, { ...options, ...arg });
		}
		else
			throw new Error('Cannot host express clientside');
	}

	function hono(arg) {
		if (providers.hono) {
			return providers.hono(client, { ...options, ...arg });
		}
		else
			throw new Error('Cannot host hono clientside');
	}



	function _createPatch(original, modified, ...restArgs) {
		if (!Array.isArray(original)) {
			original = [original];
			modified = [modified];
		}
		let args = [original, modified, ...restArgs];
		return createPatch(...args);
	}

	async function getDb() {
		let db = baseUrl;
		if (typeof db === 'function') {
			let dbPromise = db();
			if (dbPromise.then)
				db = await dbPromise;
			else
				db = dbPromise;
		}

		return db;
	}

	async function runInTransaction(fn, _options) {
		let db = await getDb();
		if (!db.createTransaction)
			throw new Error('Transaction not supported through http');
		const transaction = db.createTransaction(_options);

		try {
			const nextClient = client({ transaction });
			const result = await fn(nextClient);
			transaction.done = true;
			await transaction(transaction.commit);
			return result;
		}
		catch (e) {
			await transaction(transaction.rollback.bind(null, e));
		}
	}

	function table(url, tableName, tableOptions) {
		tableOptions = tableOptions || {};
		tableOptions = { db: baseUrl, ...tableOptions, transaction };
		let meta;
		let c = {
			count,
			getMany,
			aggregate: groupBy,
			distinct,
			getAll,
			getOne,
			getById,
			proxify,
			update,
			replace,
			updateChanges,
			insert,
			insertAndForget,
			delete: _delete,
			deleteCascade,
			patch,
			expand,
		};


		let handler = {
			get(_target, property,) {
				if (property in c)
					return Reflect.get(...arguments);
				else
					return column(property);
			}

		};
		let _table = new Proxy(c, handler);
		return _table;

		function expand() {
			return c;
		}

		async function getAll() {
			let _getMany = getMany.bind(null, undefined);
			return _getMany.apply(null, arguments);
		}

		async function getMany(_, strategy) {
			let metaPromise = getMeta();
			if (looksLikeFetchStrategy(_) && (strategy === undefined || !looksLikeFetchStrategy(strategy))) {
				let meta = await metaPromise;
				if (!isPrimaryKeyObject(meta, _)) {
					let _strategy = _;
					_ = strategy;
					strategy = _strategy;
				}
			}
			strategy = extractFetchingStrategy({}, strategy);
			let args = [_, strategy].concat(Array.prototype.slice.call(arguments).slice(2));
			let rows = await getManyCore.apply(null, args);
			await metaPromise;
			return proxify(rows, strategy, true);
		}

		async function groupBy(strategy) {
			return executeGroupBy('aggregate', strategy);
		}

		async function distinct(strategy) {
			return executeGroupBy('distinct', strategy);
		}

		async function executeGroupBy(path, strategy) {
			let args = negotiateGroupBy(null, strategy);
			let body = stringify({
				path,
				args
			});
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			return adapter.post(body);
		}

		async function count(_) {
			let args = [_].concat(Array.prototype.slice.call(arguments).slice(1));
			let body = stringify({
				path: 'count',
				args
			});
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			return adapter.post(body);
		}

		function isRawFilter(value) {
			return value && typeof value === 'object'
				&& (typeof value.sql === 'string' || typeof value.sql === 'function');
		}

		function looksLikeFetchStrategy(value) {
			if (!value || typeof value !== 'object' || Array.isArray(value))
				return false;
			if (isRawFilter(value))
				return false;
			if (Object.keys(value).length === 0)
				return true;
			if ('where' in value || 'orderBy' in value || 'limit' in value || 'offset' in value)
				return true;
			for (let key in value) {
				const v = value[key];
				if (typeof v === 'boolean')
					return true;
				if (v && typeof v === 'object' && !Array.isArray(v))
					return true;
			}
			return false;
		}

		function isPrimaryKeyObject(meta, value) {
			if (!value || typeof value !== 'object' || Array.isArray(value))
				return false;
			if (isRawFilter(value))
				return false;
			const keyNames = meta?.keys?.map(key => key.name);
			if (!keyNames || keyNames.length === 0)
				return false;
			const keys = Object.keys(value);
			if (keys.length === 0)
				return false;
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (!keyNames.includes(key))
					return false;
				const val = value[key];
				if (val && typeof val === 'object' && !(val instanceof Date))
					return false;
			}
			return true;
		}

		function normalizeGetOneArgs(meta, filter, strategy) {
			if (looksLikeFetchStrategy(filter) && (strategy === undefined || !looksLikeFetchStrategy(strategy))) {
				if (!isPrimaryKeyObject(meta, filter))
					return { filter: strategy, strategy: filter };
			}
			return { filter, strategy };
		}

		async function getOne(filter, strategy) {
			let metaPromise = getMeta();
			let meta = await metaPromise;
			let normalized = normalizeGetOneArgs(meta, filter, strategy);
			filter = normalized.filter;
			strategy = extractFetchingStrategy({}, normalized.strategy);
			let _strategy = { ...strategy, ...{ limit: 1 } };
			let args = [filter, _strategy].concat(Array.prototype.slice.call(arguments).slice(2));
			let rows = await getManyCore.apply(null, args);
			if (rows.length === 0)
				return;
			return proxify(rows[0], strategy, true);
		}

		async function getById() {
			if (arguments.length === 0)
				return;
			let meta = await getMeta();
			let keyFilter = client.filter;
			for (let i = 0; i < meta.keys.length; i++) {
				let keyName = meta.keys[i].name;
				let keyValue = arguments[i];
				keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
			}
			let args = [keyFilter].concat(Array.prototype.slice.call(arguments).slice(meta.keys.length));
			return getOne.apply(null, args);
		}

		async function getManyCore() {
			let args = negotiateWhere.apply(null, arguments);
			let body = stringify({
				path: 'getManyDto',
				args
			});
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			return adapter.post(body);
		}

		function negotiateWhere(_, strategy, ...rest) {
			const args = Array.prototype.slice.call(arguments);
			if (strategy)
				return [_, negotiateWhereSingle(strategy), ...rest];
			else
				return args;


		}

		function negotiateWhereSingle(_strategy, path = '') {
			if (typeof _strategy !== 'object' || _strategy === null)
				return _strategy;

			if (Array.isArray(_strategy)) {
				return _strategy.map(item => negotiateWhereSingle(item, path));
			}

			const strategy = { ..._strategy };
			for (let name in _strategy) {
				if (name === 'where' && typeof strategy[name] === 'function')
					strategy.where = column(path + 'where')(strategy.where); // Assuming `column` is defined elsewhere.
				else if (typeof strategy[name] === 'function') {
					strategy[name] = aggregate(path, strategy[name]);
				}
				else
					strategy[name] = negotiateWhereSingle(_strategy[name], path + name + '.');
			}
			return strategy;
		}



		function negotiateGroupBy(_, strategy, ...rest) {
			const args = Array.prototype.slice.call(arguments);
			if (strategy)
				return [_, where(strategy), ...rest];
			else
				return args;

			function where(_strategy, path = '') {
				if (typeof _strategy !== 'object' || _strategy === null)
					return _strategy;

				if (Array.isArray(_strategy)) {
					return _strategy.map(item => where(item, path));
				}

				const strategy = { ..._strategy };
				for (let name in _strategy) {
					if (name === 'where' && typeof strategy[name] === 'function')
						strategy.where = column(path + 'where')(strategy.where); // Assuming `column` is defined elsewhere.
					else if (typeof strategy[name] === 'function') {
						strategy[name] = groupByAggregate(path, strategy[name]);
					}
					else
						strategy[name] = where(_strategy[name], path + name + '.');
				}
				return strategy;
			}

		}





		async function _delete() {
			let args = Array.prototype.slice.call(arguments);
			let body = stringify({
				path: 'delete',
				args
			});
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			return adapter.post(body);
		}

		async function deleteCascade() {
			let args = Array.prototype.slice.call(arguments);
			let body = stringify({
				path: 'deleteCascade',
				args
			});
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			return adapter.post(body);
		}

		async function update(_row, _where, strategy) {
			let args = [_row, negotiateWhereSingle(_where), negotiateWhereSingle(strategy)];
			let body = stringify({
				path: 'update',
				args
			});
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			const result =  await adapter.post(body);
			if (strategy)
				return proxify(result, strategy);
		}

		async function replace(_row, strategy) {
			let args = [_row, negotiateWhereSingle(strategy)];
			let body = stringify({
				path: 'replace',
				args
			});
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			const result =  await adapter.post(body);
			if (strategy)
				return proxify(result, strategy);
		}

		async function updateChanges(rows, oldRows, ...rest) {
			const concurrency = undefined;
			const args = [concurrency].concat(rest);
			if (Array.isArray(rows)) {
				const proxy = await getMany.apply(null, [rows, ...rest]);
				proxy.splice.apply(proxy, [0, proxy.length, ...rows]);
				await proxy.saveChanges.apply(proxy, args);
				return proxy;
			}
			else {
				let proxy = proxify([oldRows], args[0]);
				proxy.splice.apply(proxy, [0, 1, rows]);
				await proxy.saveChanges.apply(proxy, args);
				return proxify(proxy[0], args[0]);
			}
		}

		async function insert(rows, ...rest) {
			const concurrency = undefined;
			const args = [concurrency].concat(rest);
			if (Array.isArray(rows)) {
				let proxy = proxify([], rest[0]);
				proxy.splice.apply(proxy, [0, 0, ...rows]);
				await proxy.saveChanges.apply(proxy, args);
				return proxy;
			}
			else {
				let proxy = proxify([], args[0]);
				proxy.splice.apply(proxy, [0, 0, rows]);
				await proxy.saveChanges.apply(proxy, args);
				return proxify(proxy[0], rest[0]);
			}
		}

		async function insertAndForget(rows) {
			const concurrency = undefined;
			let args = [concurrency, { insertAndForget: true }];
			if (Array.isArray(rows)) {
				let proxy = proxify([], args[0]);
				proxy.splice.apply(proxy, [0, 0, ...rows]);
				await proxy.saveChanges.apply(proxy, args);
			}
			else {
				let proxy = proxify([], args[0]);
				proxy.splice.apply(proxy, [0, 0, rows]);
				await proxy.saveChanges.apply(proxy, args);
			}
		}


		function proxify(itemOrArray, strategy, fast) {
			if (Array.isArray(itemOrArray))
				return proxifyArray(itemOrArray, strategy, fast);
			else
				return proxifyRow(itemOrArray, strategy, fast);
		}

		function proxifyArray(array, strategy, fast) {
			let _array = array;
			if (_reactive)
				array = _reactive(array);
			let handler = {
				get(_target, property) {
					if (property === 'toJSON')
						return () => {
							return toJSON(array);
						};
					else if (property === 'save' || property === 'saveChanges')
						return saveArray.bind(null, array);
					else if (property === 'delete')
						return deleteArray.bind(null, array);
					else if (property === 'refresh')
						return refreshArray.bind(null, array);
					else if (property === 'clearChanges')
						return clearChangesArray.bind(null, array);
					else if (property === 'acceptChanges')
						return acceptChangesArray.bind(null, array);
					else if (property === targetKey)
						return _array;
					else
						return Reflect.get.apply(_array, arguments);
				}

			};

			let watcher = onChange(array, () => {
				rootMap.set(array, { json: cloneFromDb(array, fast), strategy, originalArray: [...array] });
			});
			let innerProxy = new Proxy(watcher, handler);
			if (strategy !== undefined) {
				const { limit, ...cleanStrategy } = { ...strategy };
				fetchingStrategyMap.set(array, cleanStrategy);
			}
			return innerProxy;
		}

		function proxifyRow(row, strategy, fast) {
			let handler = {
				get(_target, property,) {
					if (property === 'save' || property === 'saveChanges') //call server then acceptChanges
						return saveRow.bind(null, row);
					else if (property === 'delete') //call server then remove from json and original
						return deleteRow.bind(null, row);
					else if (property === 'refresh') //refresh from server then acceptChanges
						return refreshRow.bind(null, row);
					else if (property === 'clearChanges') //refresh from json, update original if present
						return clearChangesRow.bind(null, row);
					else if (property === 'acceptChanges') //remove from json
						return acceptChangesRow.bind(null, row);
					else if (property === 'toJSON')
						return () => {
							return toJSON(row);
						};
					else if (property === targetKey)
						return row;
					else
						return Reflect.get(...arguments);
				}

			};
			let watcher = onChange(row, () => {
				rootMap.set(row, { json: cloneFromDb(row, fast), strategy });
			});
			let innerProxy = new Proxy(watcher, handler);
			fetchingStrategyMap.set(row, strategy);
			return innerProxy;
		}

		function toJSON(row, _meta = meta) {
			if (!row)
				return null;
			if (!_meta)
				return row;
			if (Array.isArray(row)) {
				return row.map(x => toJSON(x, _meta));
			}
			let result = {};
			for (let name in row) {
				if (name in _meta.relations)
					result[name] = toJSON(row[name], _meta.relations[name]);
				else if (name in _meta.columns) {
					if (_meta.columns[name].serializable)
						result[name] = row[name];
				}
				else
					result[name] = row[name];
			}
			return result;
		}




		async function getMeta() {
			if (meta)
				return meta;
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			meta = await adapter.get();

			while (hasUnresolved(meta)) {
				meta = parseMeta(meta);
			}
			return meta;

			function parseMeta(meta, map = new Map()) {
				if (typeof meta === 'number') {
					return map.get(meta) || meta;
				}
				map.set(meta.id, meta);
				for (let p in meta.relations) {
					meta.relations[p] = parseMeta(meta.relations[p], map);
				}
				return meta;
			}

			function hasUnresolved(meta, set = new WeakSet()) {
				if (typeof meta === 'number')
					return true;
				else if (set.has(meta))
					return false;
				else {
					set.add(meta);
					return Object.values(meta.relations).reduce((prev, current) => {
						return prev || hasUnresolved(current, set);
					}, false);
				}
			}


		}

		async function saveArray(array, concurrencyOptions, strategy) {
			let deduceStrategy = false;
			let json = rootMap.get(array)?.json;
			if (!json)
				return;
			strategy = extractStrategy({ strategy }, array);
			strategy = extractFetchingStrategy(array, strategy);

			let meta = await getMeta();
			const patch = createPatch(json, array, meta);
			if (patch.length === 0)
				return;
			let body = stringify({ patch, options: { strategy, ...tableOptions, ...concurrencyOptions, deduceStrategy } });
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			let p = adapter.patch(body);
			if (strategy?.insertAndForget) {
				await p;
				return;
			}

			let updatedPositions = extractChangedRowsPositions(array, patch, meta);
			let insertedPositions = getInsertedRowsPosition(array);
			let { changed, strategy: newStrategy } = await p;
			copyIntoArray(changed, array, [...insertedPositions, ...updatedPositions]);
			rootMap.set(array, { json: cloneFromDb(array), strategy: newStrategy, originalArray: [...array] });
		}

		async function patch(patch, concurrencyOptions, strategy) {
			let deduceStrategy = false;
			if (patch.length === 0)
				return;
			let body = stringify({ patch, options: { strategy, ...tableOptions, ...concurrencyOptions, deduceStrategy } });
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			await adapter.patch(body);
			return;
		}

		function extractChangedRowsPositions(rows, patch, meta) {
			const positions = [];
			const originalSet = new Set(rootMap.get(rows).originalArray);
			const positionsAdded = {};
			const keyPositionMap = toKeyPositionMap(rows, meta);
			for (let i = 0; i < patch.length; i++) {
				const element = patch[i];
				const pathArray = element.path.split('/');
				const position = keyPositionMap[pathArray[1]];
				if (position >= 0 && originalSet.has(rows[position]) && !positionsAdded[position]) {
					positions.push(position);
					positionsAdded[position] = true;
				}
			}
			return positions;
		}

		function getInsertedRowsPosition(array) {
			const positions = [];
			const originalSet = new Set(rootMap.get(array).originalArray);
			for (let i = 0; i < array.length; i++) {
				if (!originalSet.has(array[i]))
					positions.push(i);
			}
			return positions;
		}

		function copyInto(from, to) {
			for (let i = 0; i < from.length; i++) {
				for (let p in from[i]) {
					to[i][p] = from[i][p];
				}
			}
		}

		function copyIntoArray(from, to, positions) {
			for (let i = 0; i < from.length; i++) {
				to[positions[i]] = from[i];
			}
		}


		function extractStrategy(options, obj) {
			if (options?.strategy !== undefined)
				return options.strategy;
			if (obj) {
				let context = rootMap.get(obj);
				if (context?.strategy !== undefined) {
					// @ts-ignore
					let { limit, ...strategy } = { ...context.strategy };
					return strategy;
				}
			}
		}

		function extractFetchingStrategy(obj, strategy) {
			if (strategy !== undefined)
				return strategy;
			else if (fetchingStrategyMap.get(obj) !== undefined) {
				// @ts-ignore
				const { limit, ...strategy } = { ...fetchingStrategyMap.get(obj) };
				return strategy;
			}
		}

		function clearChangesArray(array) {
			let json = rootMap.get(array)?.json;
			if (!json)
				return;
			let old = cloneFromDb(json);
			array.splice(0, old.length, ...old);
		}

		function acceptChangesArray(array) {
			const map = rootMap.get(array);
			if (!map)
				return;
			map.json = cloneFromDb(array);
			map.originalArray = [...array];
		}

		async function deleteArray(array, options) {
			if (array.length === 0)
				return;
			let meta = await getMeta();
			let patch = createPatch(array, [], meta);
			let body = stringify({ patch, options });
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			let { strategy } = await adapter.patch(body);
			array.length = 0;
			rootMap.set(array, { json: cloneFromDb(array), strategy });
		}

		function setMapValue(rowsMap, keys, row, index) {
			let keyValue = row[keys[0].name];
			if (keys.length > 1) {
				let subMap = rowsMap.get(keyValue);
				if (!subMap) {
					subMap = new Map();
					rowsMap.set(keyValue, subMap);
				}
				setMapValue(subMap, keys.slice(1), row, index);
			}
			else
				rowsMap.set(keyValue, index);
		}

		function getMapValue(rowsMap, keys, row) {
			let keyValue = row[keys[0].name];
			if (keys.length > 1)
				return getMapValue(rowsMap.get(keyValue), keys.slice(1));
			else
				return rowsMap.get(keyValue);
		}

		async function refreshArray(array, strategy) {
			clearChangesArray(array);
			strategy = extractStrategy({ strategy }, array);
			strategy = extractFetchingStrategy(array, strategy);
			if (array.length === 0)
				return;
			let meta = await getMeta();
			let filter = client.filter;
			let rowsMap = new Map();
			for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
				let row = array[rowIndex];
				let keyFilter = client.filter;
				for (let i = 0; i < meta.keys.length; i++) {
					let keyName = meta.keys[i].name;
					let keyValue = row[keyName];
					keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
				}
				setMapValue(rowsMap, meta.keys, row, rowIndex);
				filter = filter.or(keyFilter);
			}
			let rows = await getManyCore(filter, strategy);
			let removedIndexes = new Set();
			if (array.length !== rows.length)
				for (var i = 0; i < array.length; i++) {
					removedIndexes.add(i);
				}
			for (let i = 0; i < rows.length; i++) {
				let row = rows[i];
				let originalIndex = getMapValue(rowsMap, meta.keys, row);
				if (array.length !== rows.length)
					removedIndexes.delete(originalIndex);
				array[originalIndex] = row;
			}
			let offset = 0;
			for (let i of removedIndexes) {
				array.splice(i + offset, 1);
				offset--;
			}
			rootMap.set(array, { json: cloneFromDb(array), strategy, originalArray: [...array] });
			fetchingStrategyMap.set(array, strategy);
		}

		async function deleteRow(row, options) {
			let strategy = extractStrategy(options, row);
			let meta = await getMeta();
			let patch = createPatch([row], [], meta);
			let body = stringify({ patch, options });
			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			await adapter.patch(body);
			rootMap.set(row, { strategy });
		}

		async function saveRow(row, concurrencyOptions, strategy) {
			let deduceStrategy;
			if (arguments.length < 3)
				deduceStrategy = false;
			strategy = extractStrategy({ strategy }, row);
			strategy = extractFetchingStrategy(row, strategy);

			let json = rootMap.get(row)?.json;
			if (!json)
				return;
			let meta = await getMeta();

			let patch = createPatch([json], [row], meta);
			if (patch.length === 0)
				return;

			let body = stringify({ patch, options: { ...tableOptions, ...concurrencyOptions, strategy, deduceStrategy } });

			let adapter = netAdapter(url, tableName, { axios: axiosInterceptor, tableOptions });
			let { changed, strategy: newStrategy } = await adapter.patch(body);
			copyInto(changed, [row]);
			rootMap.set(row, { json: cloneFromDb(row), strategy: newStrategy });
		}

		async function refreshRow(row, strategy) {
			clearChangesRow(row);
			strategy = extractStrategy({ strategy }, row);
			strategy = extractFetchingStrategy(row, strategy);

			let meta = await getMeta();
			let keyFilter = client.filter;
			for (let i = 0; i < meta.keys.length; i++) {
				let keyName = meta.keys[i].name;
				let keyValue = row[keyName];
				keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
			}
			let rows = await getManyCore(keyFilter, strategy);
			for (let p in row) {
				delete row[p];
			}
			if (rows.length === 0)
				return;
			for (let p in rows[0]) {
				row[p] = rows[0][p];
			}
			rootMap.set(row, { json: cloneFromDb(row), strategy });
			fetchingStrategyMap.set(row, strategy);
		}

		function acceptChangesRow(row) {
			const data = rootMap.get(row);
			if (!data)
				return;
			const { strategy } = data;
			rootMap.set(row, { json: cloneFromDb(row), strategy });
		}

		function clearChangesRow(row) {
			let json = rootMap.get(row)?.json;
			if (!json)
				return;
			let old = cloneFromDb(json);
			for (let p in row) {
				delete row[p];
			}
			for (let p in old) {
				row[p] = old[p];
			}
		}
	}
}

function tableProxy() {
	let handler = {
		get(_target, property,) {
			return column(property);
		}

	};
	return new Proxy({}, handler);
}

function aggregate(path, arg) {

	const c = {
		sum,
		count,
		avg,
		max,
		min
	};

	let handler = {
		get(_target, property,) {
			if (property in c)
				return Reflect.get(...arguments);
			else {
				subColumn = column(path + '_aggregate');
				return column(property);
			}
		}

	};
	let subColumn;
	const proxy = new Proxy(c, handler);

	const result = arg(proxy);

	if (subColumn)
		return subColumn(result.self());
	else
		return result;


	function sum(fn) {
		return column(path + '_aggregate')(fn(column('')).groupSum());
	}
	function avg(fn) {
		return column(path + '_aggregate')(fn(column('')).groupAvg());
	}
	function max(fn) {
		return column(path + '_aggregate')(fn(column('')).groupMax());
	}
	function min(fn) {
		return column(path + '_aggregate')(fn(column('')).groupMin());
	}
	function count(fn) {
		return column(path + '_aggregate')(fn(column('')).groupCount());
	}
}

function groupByAggregate(path, arg) {

	const c = {
		sum,
		count,
		avg,
		max,
		min
	};

	let handler = {
		get(_target, property,) {
			if (property in c)
				return Reflect.get(...arguments);
			else {
				subColumn = column(path + '_aggregate');
				return column(property);
			}
		}

	};
	let subColumn;
	const proxy = new Proxy(c, handler);

	const result = arg(proxy);

	if (subColumn)
		return subColumn(result.self());
	else
		return result;


	function sum(fn) {
		return column(path + '_aggregate')(fn(column('')).sum());
	}
	function avg(fn) {
		return column(path + '_aggregate')(fn(column('')).avg());
	}
	function max(fn) {
		return column(path + '_aggregate')(fn(column('')).max());
	}
	function min(fn) {
		return column(path + '_aggregate')(fn(column('')).min());
	}
	function count(fn) {
		return column(path + '_aggregate')(fn(column('')).count());
	}
}

const isColumnProxyKey = '__isColumnProxy';
const columnPathKey = '__columnPath';
const columnRefKey = '__columnRef';

function column(path, ...previous) {
	function c() {
		let args = [];
		for (let i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] === 'function') {
				if (arguments[i][isColumnProxyKey])
					args[i] = { [columnRefKey]: arguments[i][columnPathKey] };
				else
					args[i] = arguments[i](tableProxy(path.split('.').slice(0, -1).join('.')));
			}
			else
				args[i] = arguments[i];
		}
		args = previous.concat(Array.prototype.slice.call(args));
		let result = { path, args };
		let handler = {
			get(_target, property) {
				if (property === 'toJSON')
					return result.toJSON;
				else if (property === 'then')
					return;
				if (property in result)
					return Reflect.get(...arguments);
				else
					return column(property, result);

			}
		};
		return new Proxy(result, handler);
	}
	let handler = {
		get(_target, property) {
			if (property === isColumnProxyKey)
				return true;
			if (property === columnPathKey)
				return path;
			if (property === 'toJSON')
				return Reflect.get(...arguments);
			else if (property === 'then')
				return;
			else {
				const nextPath = path ? path + '.' : '';
				return column(nextPath + property);
			}
		}

	};
	return new Proxy(c, handler);

}

function onChange(target, onChange) {

	let  notified = false;
	const handler = {
		get(target, prop, receiver) {
			const value = Reflect.get(target, prop, receiver);
			if (value instanceof Date)
				return value;
			if (typeof value === 'object' && value !== null) {
				return new Proxy(value, handler);
			}
			return value;
		},
		set(target, prop, value, receiver) {
			if (!notified) {
				notified = true;
				onChange(JSON.stringify(target));
			}
			return Reflect.set(target, prop, value, receiver);

		},
		deleteProperty(target, prop) {
			if (!notified) {
				notified = true;
				onChange(JSON.stringify(target));
			}
			return Reflect.deleteProperty(target, prop);
		}
	};

	return new Proxy(target, handler);
}


module.exports = rdbClient();
