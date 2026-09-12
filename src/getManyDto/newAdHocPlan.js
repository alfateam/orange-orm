const emptyFilter = require('../emptyFilter');
const { isAdHocRelation, ownerScopeMarker } = require('../adHocRelation');
const clone = require('rfdc/default');
const getSessionSingleton = require('../table/getSessionSingleton');
const getManyDtoScoped = require('./getManyDtoScoped');
const validatePagination = require('../table/query/validatePagination');

module.exports = function newAdHocPlan({
	context,
	rootTable,
	sourceStrategy,
	tables,
	parseFilter,
	negotiateStrategy,
	resolveBaseFilter
}) {
	const strategy = JSON.parse(JSON.stringify(sourceStrategy || {}));
	const hiddenColumns = new Map();
	const selectionModes = new Map();
	const scopeDefinitions = new Map([
		['root', { table: rootTable, strategy }]
	]);
	registerScopes(rootTable, strategy);
	prepare(rootTable, strategy);

	return {
		strategy: stripAdHocRelations(rootTable, strategy),
		materialize
	};

	async function materialize(rows) {
		await populateAdHocRelations(
			rows.map(row => ({ row, root: row, scopes: Object.create(null) })),
			rootTable,
			strategy
		);
		stripHiddenColumns(rows, rootTable, strategy);
		return rows;
	}

	function registerScopes(currentTable, currentStrategy) {
		if (!currentStrategy || typeof currentStrategy !== 'object')
			return;
		for (let name in currentStrategy) {
			const value = currentStrategy[name];
			if (isAdHocRelation(value)) {
				const scopeName = value[ownerScopeMarker];
				if (typeof scopeName !== 'string' || !/^s[1-9][0-9]*$/.test(scopeName))
					throwBadRequest('Ad-hoc relation is missing its lexical owner scope');
				const existing = scopeDefinitions.get(scopeName);
				if (existing && (existing.table !== currentTable || existing.strategy !== currentStrategy))
					throwBadRequest(`Ad-hoc lexical scope '${scopeName}' is ambiguous`);
				scopeDefinitions.set(scopeName, { table: currentTable, strategy: currentStrategy });
				registerScopes(resolveAdHocTable(value.table), value.strategy || {});
			}
			else if (currentTable._relations[name] && value && typeof value === 'object')
				registerScopes(currentTable._relations[name].childTable, value);
		}
	}

	function prepare(currentTable, currentStrategy) {
		if (!currentStrategy || typeof currentStrategy !== 'object')
			return;
		validatePagination(currentStrategy);
		for (let name in currentStrategy) {
			const value = currentStrategy[name];
			if (isAdHocRelation(value)) {
				const targetTable = resolveAdHocTable(value.table);
				const refs = collectOwnedScopeRefs(value.strategy);
				addScopeTableKeys(refs);
				for (const [scopeName, columns] of refs.columns) {
					const definition = getScopeDefinition(scopeName);
					for (const column of columns)
						includeColumn(definition.table, definition.strategy, column);
				}
				prepare(targetTable, value.strategy || {});
			}
			else if (currentTable._relations[name] && value && typeof value === 'object')
				prepare(currentTable._relations[name].childTable, value);
		}
	}

	function collectOwnedScopeRefs(value, result = { columns: new Map(), tables: new Set() }) {
		if (!value || typeof value !== 'object' || isAdHocRelation(value))
			return result;
		if (Array.isArray(value)) {
			for (const item of value)
				collectOwnedScopeRefs(item, result);
			return result;
		}
		if (typeof value.__columnRef === 'string') {
			const scopePath = parseScopePath(value.__columnRef);
			if (scopePath) {
				if (scopePath.path.includes('.'))
					result.tables.add(scopePath.scopeName);
				else
					getScopeColumns(result, scopePath.scopeName).add(scopePath.path);
			}
		}
		if (typeof value.path === 'string') {
			const scopePath = parseScopePath(value.path);
			if (scopePath)
				result.tables.add(scopePath.scopeName);
		}
		for (let name in value)
			collectOwnedScopeRefs(value[name], result);
		return result;
	}

	function hasOwnedScopeRefs(value) {
		const refs = collectOwnedScopeRefs(value);
		return refs.columns.size > 0 || refs.tables.size > 0;
	}

	function addScopeTableKeys(refs) {
		for (const scopeName of refs.tables) {
			const definition = getScopeDefinition(scopeName);
			for (const column of definition.table._primaryColumns)
				getScopeColumns(refs, scopeName).add(column.alias);
		}
	}

	function getScopeColumns(refs, scopeName) {
		let columns = refs.columns.get(scopeName);
		if (!columns) {
			columns = new Set();
			refs.columns.set(scopeName, columns);
		}
		return columns;
	}

	function getScopeDefinition(scopeName) {
		const definition = scopeDefinitions.get(scopeName);
		if (!definition)
			throwBadRequest(`Ad-hoc lexical scope '${scopeName}' is invalid`);
		return definition;
	}

	function parseScopePath(path) {
		const rootMatch = /^\$root\.(.+)$/.exec(path);
		if (rootMatch)
			return { scopeName: 'root', path: rootMatch[1] };
		const lexicalMatch = /^\$scope\.([^.]+)\.(.+)$/.exec(path);
		return lexicalMatch
			? { scopeName: lexicalMatch[1], path: lexicalMatch[2] }
			: undefined;
	}

	function resolveAdHocTable(name) {
		const target = tables?.[name];
		if (!target || !target._primaryColumns)
			throwBadRequest(`Ad-hoc relation target '${name}' is not mapped or exposed`);
		return target;
	}

	function stripAdHocRelations(currentTable, currentStrategy) {
		if (!currentStrategy || typeof currentStrategy !== 'object')
			return currentStrategy;
		const result = {};
		for (let name in currentStrategy) {
			const value = currentStrategy[name];
			if (isAdHocRelation(value))
				continue;
			if (currentTable._relations[name] && value && typeof value === 'object')
				result[name] = stripAdHocRelations(currentTable._relations[name].childTable, value);
			else
				result[name] = value;
		}
		return result;
	}

	async function populateAdHocRelations(pairs, currentTable, currentStrategy) {
		if (!currentStrategy || pairs.length === 0)
			return;

		for (let name in currentStrategy) {
			const value = currentStrategy[name];
			if (isAdHocRelation(value))
				await populateDescriptor(name, value);
			else if (currentTable._relations[name] && value && typeof value === 'object') {
				const childPairs = [];
				for (const pair of pairs) {
					const child = pair.row?.[name];
					if (Array.isArray(child)) {
						for (const row of child)
							if (row)
								childPairs.push(inheritScopes(row, pair));
					}
					else if (child)
						childPairs.push(inheritScopes(child, pair));
				}
				await populateAdHocRelations(childPairs, currentTable._relations[name].childTable, value);
			}
		}

		async function populateDescriptor(name, descriptor) {
			const targetTable = resolveAdHocTable(descriptor.table);
			const ownerScopeName = descriptor[ownerScopeMarker];
			const ownerPairs = pairs.map(pair => bindOwnerScope(pair, ownerScopeName));
			const childPairs = [];
			if (!hasOwnedScopeRefs(descriptor.strategy)) {
				const rows = await fetchDescriptorRows(descriptor, targetTable);
				for (const pair of ownerPairs) {
					const attached = descriptor.__rdbAdHocRelation === 'many'
						? clone(rows)
						: (rows.length ? clone(rows[0]) : null);
					pair.row[name] = attached;
					addChildPairs(attached, pair);
				}
				await populateChildren();
				return;
			}

			if (canUseScopedBatch(descriptor)) {
				const attachedRows = await fetchDescriptorRowsScoped(
					descriptor,
					targetTable,
					ownerPairs
				);
				for (let i = 0; i < ownerPairs.length; i++) {
					const pair = ownerPairs[i];
					const rows = attachedRows[i];
					const attached = descriptor.__rdbAdHocRelation === 'many' ? rows : (rows[0] || null);
					pair.row[name] = attached;
					addChildPairs(attached, pair);
				}
				await populateChildren();
				return;
			}

			for (const pair of ownerPairs) {
				const scope = createScope(pair);
				const rows = await fetchDescriptorRows(descriptor, targetTable, scope);
				pair.row[name] = descriptor.__rdbAdHocRelation === 'many'
					? rows
					: (rows[0] || null);
				addChildPairs(pair.row[name], pair);
			}
			await populateChildren();

			function addChildPairs(value, ownerPair) {
				const rows = Array.isArray(value) ? value : value ? [value] : [];
				for (const row of rows)
					childPairs.push(inheritScopes(row, ownerPair));
			}

			async function populateChildren() {
				await populateAdHocRelations(childPairs, targetTable, descriptor.strategy || {});
			}
		}
	}

	function bindOwnerScope(pair, scopeName) {
		getScopeDefinition(scopeName);
		return {
			row: pair.row,
			root: pair.root,
			scopes: { ...pair.scopes, [scopeName]: pair.row }
		};
	}

	function inheritScopes(row, pair) {
		return {
			row,
			root: pair.root,
			scopes: { ...pair.scopes }
		};
	}

	function canUseScopedBatch(descriptor) {
		const descriptorStrategy = descriptor.strategy || {};
		const outsideWhere = { ...descriptorStrategy };
		delete outsideWhere.where;
		return !!descriptorStrategy.where && hasOwnedScopeRefs(descriptorStrategy.where)
			&& !hasOwnedScopeRefs(outsideWhere);
	}

	async function fetchDescriptorRowsScoped(descriptor, targetTable, pairs) {
		const result = pairs.map(() => []);
		const refs = collectOwnedScopeRefs(descriptor.strategy.where);
		addScopeTableKeys(refs);
		const { scope, scopeColumns, scopeTables } = createVirtualScope(refs);
		const scopeGroups = createScopeGroups(pairs, scopeColumns);
		const rowsByGroup = scopeGroups.map(() => []);
		const targetBaseFilter = await resolveBaseFilter(descriptor.table, targetTable);
		const queryStrategy = JSON.parse(JSON.stringify(descriptor.strategy || {}));
		const jsonWhere = queryStrategy.where;
		delete queryStrategy.where;
		delete queryStrategy.limit;
		delete queryStrategy.offset;
		const executionStrategy = stripAdHocRelations(targetTable, queryStrategy);
		await negotiateStrategy(executionStrategy, targetTable, scope);
		const scopeFilter = await parseFilter(jsonWhere, targetTable, scope);
		const filter = targetBaseFilter || emptyFilter;

		const maxParameters = getSessionSingleton(context, 'maxParameters');
		const parametersPerPair = Math.max(1, scopeColumns.length);
		const fixedParameters = (filter?.parameters?.length || 0)
			+ (scopeFilter?.parameters?.length || 0);
		const chunkSize = maxParameters
			? Math.max(1, Math.min(200, Math.floor((maxParameters - fixedParameters) / parametersPerPair)))
			: 200;
		const start = descriptor.strategy?.offset || 0;
		const limit = descriptor.__rdbAdHocRelation === 'one' ? 1 : descriptor.strategy?.limit;
		const databasePaginates = getSessionSingleton(context, 'engine') !== 'sap'
			&& (start > 0 || limit !== undefined);
		for (let offset = 0; offset < scopeGroups.length; offset += chunkSize) {
			const scopeRows = scopeGroups.slice(offset, offset + chunkSize).map(group =>
				({ ownerId: group.groupId, ...group.scopeRows }));
			const rows = await getManyDtoScoped({
				context,
				table: targetTable,
				filter,
				scopeFilter,
				strategy: executionStrategy,
				scopeColumns,
				scopeTables,
				scopeRows,
				offset: start,
				limit
			});
			for (const { ownerId, row } of rows)
				if (row)
					rowsByGroup[ownerId].push(row);
		}

		const end = limit === undefined ? undefined : start + limit;
		for (const group of scopeGroups) {
			const rows = databasePaginates
				? rowsByGroup[group.groupId]
				: rowsByGroup[group.groupId].slice(start, end);
			for (const pairIndex of group.pairIndexes)
				result[pairIndex] = clone(rows);
		}
		return result;
	}

	function createScopeGroups(pairs, scopeColumns) {
		const groups = [];
		const groupsByKey = new Map();
		for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
			const pair = pairs[pairIndex];
			const scopeRow = createScopeRows(pair);
			const key = createScopeKey(scopeColumns, scopeRow);
			let group = key === undefined ? undefined : groupsByKey.get(key);
			if (!group) {
				group = {
					groupId: groups.length,
					scopeRows: scopeRow,
					pairIndexes: []
				};
				groups.push(group);
				if (key !== undefined)
					groupsByKey.set(key, group);
			}
			group.pairIndexes.push(pairIndex);
		}
		return groups;
	}

	function createScopeKey(scopeColumns, scopeRow) {
		try {
			const values = new Array(scopeColumns.length);
			for (let index = 0; index < scopeColumns.length; index++) {
				const scopeColumn = scopeColumns[index];
				let value = scopeColumn.value(scopeRow);
				if (value !== null && value !== undefined
					&& typeof scopeColumn.column.encode?.direct === 'function')
					value = scopeColumn.column.encode.direct(context, value);
				const canonical = canonicalizeScopeValue(value);
				if (canonical === undefined)
					return;
				values[index] = [index, canonical];
			}
			return JSON.stringify(values);
		}
		catch (_error) {
			return;
		}
	}

	function createVirtualScope(refs) {
		const scope = Object.create(null);
		const scopeColumns = [];
		for (const [scopeName, columns] of refs.columns) {
			const definition = getScopeDefinition(scopeName);
			scope[scopeName] = {
				row: {},
				table: definition.table,
				alias: refs.tables.has(scopeName) ? `__rdb_scope_${scopeName}` : undefined
			};
			for (const name of columns) {
				const alias = `c${scopeColumns.length}`;
				const column = scope[scopeName].table[name];
				scope[scopeName].row[name] = getManyDtoScoped.newScopeColumnRef(context, alias);
				scopeColumns.push({
					alias,
					scopeName,
					name,
					column,
					value: row => row[scopeName][name]
				});
			}
		}
		const scopeTables = [...refs.tables].map(scopeName => ({
			scopeName,
			table: scope[scopeName].table,
			alias: scope[scopeName].alias
		}));
		return { scope, scopeColumns, scopeTables };
	}

	function createScope(pair) {
		const scope = {
			root: { row: pair.root, table: rootTable }
		};
		for (const [scopeName, row] of Object.entries(pair.scopes))
			scope[scopeName] = { row, table: getScopeDefinition(scopeName).table };
		return scope;
	}

	function createScopeRows(pair) {
		return {
			root: pair.root,
			...pair.scopes
		};
	}

	function includeColumn(targetTable, targetStrategy, name) {
		const column = targetTable[name];
		if (!column || typeof column._toFilterArg !== 'function')
			throwBadRequest(`Unknown scope column '${name}' on table '${targetTable._dbName}'`);

		let mode = selectionModes.get(targetStrategy);
		if (!mode) {
			mode = { hasIncludes: targetTable._columns.some(col => targetStrategy[col.alias] === true) };
			selectionModes.set(targetStrategy, mode);
		}
		const isPrimaryColumn = targetTable._primaryColumns.includes(column);
		const wasVisible = targetStrategy[name] !== false
			&& (isPrimaryColumn || !mode.hasIncludes || targetStrategy[name] === true);
		if (!wasVisible) {
			let hidden = hiddenColumns.get(targetStrategy);
			if (!hidden) {
				hidden = new Set();
				hiddenColumns.set(targetStrategy, hidden);
			}
			hidden.add(name);
			targetStrategy[name] = true;
		}
	}

	async function fetchDescriptorRows(descriptor, targetTable, scope) {
		const queryStrategy = JSON.parse(JSON.stringify(descriptor.strategy || {}));
		if (descriptor.__rdbAdHocRelation === 'one')
			queryStrategy.limit = 1;
		const executionStrategy = stripAdHocRelations(targetTable, queryStrategy);
		await negotiateStrategy(executionStrategy, targetTable, scope);
		let filter = emptyFilter;
		const targetBaseFilter = await resolveBaseFilter(descriptor.table, targetTable);
		if (targetBaseFilter)
			filter = filter.and(context, targetBaseFilter);
		return targetTable.getManyDto(context, filter, executionStrategy);
	}

	function stripHiddenColumns(rows, currentTable, currentStrategy) {
		if (!currentStrategy || !Array.isArray(rows))
			return;
		const hidden = hiddenColumns.get(currentStrategy);
		for (const row of rows) {
			if (!row)
				continue;
			if (hidden)
				for (const name of hidden) {
					delete row[name];
					const prototype = Object.getPrototypeOf(row);
					if (prototype && Object.prototype.hasOwnProperty.call(prototype, name))
						delete prototype[name];
				}
			for (let name in currentStrategy) {
				const value = currentStrategy[name];
				if (isAdHocRelation(value)) {
					const child = row[name];
					const childRows = Array.isArray(child) ? child : child ? [child] : [];
					stripHiddenColumns(childRows, resolveAdHocTable(value.table), value.strategy || {});
				}
				else if (currentTable._relations[name] && value && typeof value === 'object') {
					const child = row[name];
					const childRows = Array.isArray(child) ? child : child ? [child] : [];
					stripHiddenColumns(childRows, currentTable._relations[name].childTable, value);
				}
			}
		}
	}
};

function canonicalizeScopeValue(value, seen = new Set()) {
	if (value === undefined)
		return ['undefined'];
	if (value === null)
		return ['null'];

	const type = typeof value;
	if (type === 'string')
		return ['string', value];
	if (type === 'boolean')
		return ['boolean', value];
	if (type === 'bigint')
		return ['bigint', value.toString()];
	if (type === 'number') {
		if (Number.isNaN(value))
			return ['number', 'NaN'];
		if (value === Infinity)
			return ['number', 'Infinity'];
		if (value === -Infinity)
			return ['number', '-Infinity'];
		if (Object.is(value, -0))
			return ['number', '-0'];
		return ['number', String(value)];
	}
	if (type !== 'object')
		return;

	const bytes = getBinaryBytes(value);
	if (bytes)
		return ['binary', binaryToBase64(bytes)];
	if (value instanceof Date) {
		const timestamp = Date.prototype.getTime.call(value);
		return Number.isNaN(timestamp)
			? undefined
			: ['date', Date.prototype.toISOString.call(value)];
	}
	if (seen.has(value))
		return;

	seen.add(value);
	try {
		if (Array.isArray(value)) {
			const ownKeys = Reflect.ownKeys(value);
			for (const key of ownKeys)
				if (key !== 'length' && !isArrayIndex(key, value.length))
					return;

			const items = new Array(value.length);
			for (let index = 0; index < value.length; index++) {
				const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
				if (!descriptor) {
					items[index] = ['hole'];
					continue;
				}
				if (!Object.prototype.hasOwnProperty.call(descriptor, 'value'))
					return;
				const item = canonicalizeScopeValue(descriptor.value, seen);
				if (item === undefined)
					return;
				items[index] = item;
			}
			return ['array', items];
		}

		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null)
			return;
		const ownKeys = Reflect.ownKeys(value);
		if (ownKeys.some(key => typeof key !== 'string'))
			return;
		const keys = ownKeys.sort();
		const entries = new Array(keys.length);
		for (let index = 0; index < keys.length; index++) {
			const key = keys[index];
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor?.enumerable
				|| !Object.prototype.hasOwnProperty.call(descriptor, 'value'))
				return;
			const item = canonicalizeScopeValue(descriptor.value, seen);
			if (item === undefined)
				return;
			entries[index] = [key, item];
		}
		return ['object', entries];
	}
	finally {
		seen.delete(value);
	}
}

function getBinaryBytes(value) {
	if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value))
		return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
	if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array)
		return value;
	if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer)
		return new Uint8Array(value);
}

function binaryToBase64(bytes) {
	if (typeof Buffer !== 'undefined')
		return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
	if (typeof btoa !== 'undefined') {
		let binary = '';
		for (const byte of bytes)
			binary += String.fromCharCode(byte);
		return btoa(binary);
	}
	throw new Error('No base64 encoder is available');
}

function isArrayIndex(key, length) {
	if (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key))
		return false;
	const index = Number(key);
	return Number.isSafeInteger(index) && index < length;
}

function throwBadRequest(message) {
	const error = new Error(message);
	error.status = 400;
	throw error;
}
