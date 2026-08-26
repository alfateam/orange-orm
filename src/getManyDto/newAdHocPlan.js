const emptyFilter = require('../emptyFilter');
const { isAdHocRelation } = require('../adHocRelation');
const clone = require('rfdc/default');
const getSessionSingleton = require('../table/getSessionSingleton');
const getManyDtoScoped = require('./getManyDtoScoped');

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
	prepare(rootTable, strategy, strategy);

	return {
		strategy: stripAdHocRelations(rootTable, strategy),
		materialize
	};

	async function materialize(rows) {
		await populateAdHocRelations(rows.map(row => ({ row, root: row })), rootTable, strategy);
		stripHiddenColumns(rows, rootTable, strategy);
		return rows;
	}

	function prepare(currentTable, currentStrategy, rootStrategy) {
		if (!currentStrategy || typeof currentStrategy !== 'object')
			return;
		for (let name in currentStrategy) {
			const value = currentStrategy[name];
			if (isAdHocRelation(value)) {
				const targetTable = resolveAdHocTable(value.table);
				const refs = collectOwnedScopeRefs(value.strategy);
				for (const column of refs.root)
					includeColumn(rootTable, rootStrategy, column);
				for (const column of refs.parent)
					includeColumn(currentTable, currentStrategy, column);
				prepare(targetTable, value.strategy || {}, rootStrategy);
			}
			else if (currentTable._relations[name] && value && typeof value === 'object')
				prepare(currentTable._relations[name].childTable, value, rootStrategy);
		}
	}

	function collectOwnedScopeRefs(value, result = { root: new Set(), parent: new Set() }) {
		if (!value || typeof value !== 'object' || isAdHocRelation(value))
			return result;
		if (Array.isArray(value)) {
			for (const item of value)
				collectOwnedScopeRefs(item, result);
			return result;
		}
		if (typeof value.__columnRef === 'string') {
			const match = /^\$(root|parent)\.([^.]+)$/.exec(value.__columnRef);
			if (match)
				result[match[1]].add(match[2]);
		}
		for (let name in value)
			collectOwnedScopeRefs(value[name], result);
		return result;
	}

	function hasOwnedScopeRefs(value) {
		const refs = collectOwnedScopeRefs(value);
		return refs.root.size > 0 || refs.parent.size > 0;
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
								childPairs.push({ row, root: pair.root });
					}
					else if (child)
						childPairs.push({ row: child, root: pair.root });
				}
				await populateAdHocRelations(childPairs, currentTable._relations[name].childTable, value);
			}
		}

		async function populateDescriptor(name, descriptor) {
			const targetTable = resolveAdHocTable(descriptor.table);
			const childPairs = [];
			if (!hasOwnedScopeRefs(descriptor.strategy)) {
				const rows = await fetchDescriptorRows(descriptor, targetTable);
				for (const pair of pairs) {
					const attached = descriptor.__rdbAdHocRelation === 'many'
						? clone(rows)
						: (rows.length ? clone(rows[0]) : null);
					pair.row[name] = attached;
					addChildPairs(attached, pair.root);
				}
				await populateChildren();
				return;
			}

			if (canUseScopedBatch(descriptor)) {
				const attachedRows = await fetchDescriptorRowsScoped(
					descriptor,
					targetTable,
					currentTable,
					pairs
				);
				for (let i = 0; i < pairs.length; i++) {
					const pair = pairs[i];
					const rows = attachedRows[i];
					const attached = descriptor.__rdbAdHocRelation === 'many' ? rows : (rows[0] || null);
					pair.row[name] = attached;
					addChildPairs(attached, pair.root);
				}
				await populateChildren();
				return;
			}

			for (const pair of pairs) {
				const scope = createScope(pair, currentTable);
				const rows = await fetchDescriptorRows(descriptor, targetTable, scope);
				pair.row[name] = descriptor.__rdbAdHocRelation === 'many'
					? rows
					: (rows[0] || null);
				addChildPairs(pair.row[name], pair.root);
			}
			await populateChildren();

			function addChildPairs(value, ownerRoot) {
				const rows = Array.isArray(value) ? value : value ? [value] : [];
				for (const row of rows)
					childPairs.push({ row, root: ownerRoot });
			}

			async function populateChildren() {
				await populateAdHocRelations(childPairs, targetTable, descriptor.strategy || {});
			}
		}
	}

	function canUseScopedBatch(descriptor) {
		const descriptorStrategy = descriptor.strategy || {};
		const outsideWhere = { ...descriptorStrategy };
		delete outsideWhere.where;
		return !!descriptorStrategy.where && hasOwnedScopeRefs(descriptorStrategy.where)
			&& !hasOwnedScopeRefs(outsideWhere);
	}

	async function fetchDescriptorRowsScoped(descriptor, targetTable, ownerTable, pairs) {
		const result = pairs.map(() => []);
		const refs = collectOwnedScopeRefs(descriptor.strategy.where);
		const { scope, scopeColumns } = createVirtualScope(refs, ownerTable);
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
			? Math.max(1, Math.min(100, Math.floor((maxParameters - fixedParameters) / parametersPerPair)))
			: 100;
		const start = descriptor.strategy?.offset || 0;
		const limit = descriptor.__rdbAdHocRelation === 'one' ? 1 : descriptor.strategy?.limit;
		const databasePaginates = getSessionSingleton(context, 'engine') !== 'sap'
			&& (start > 0 || limit !== undefined);
		for (let offset = 0; offset < pairs.length; offset += chunkSize) {
			const scopeRows = pairs.slice(offset, offset + chunkSize).map((pair, index) => ({
				ownerId: offset + index,
				root: pair.root,
				parent: pair.row
			}));
			const rows = await getManyDtoScoped({
				context,
				table: targetTable,
				filter,
				scopeFilter,
				strategy: executionStrategy,
				scopeColumns,
				scopeRows,
				offset: start,
				limit
			});
			for (const { ownerId, row } of rows)
				if (row)
					result[ownerId].push(row);
		}

		for (let i = 0; i < pairs.length; i++) {
			const end = limit === undefined ? undefined : start + limit;
			result[i] = clone(databasePaginates ? result[i] : result[i].slice(start, end));
		}
		return result;
	}

	function createVirtualScope(refs, ownerTable) {
		const scope = {
			root: { row: {}, table: rootTable },
			parent: { row: {}, table: ownerTable }
		};
		const scopeColumns = [];
		for (const scopeName of ['root', 'parent'])
			for (const name of refs[scopeName]) {
				const alias = `c${scopeColumns.length}`;
				const column = scope[scopeName].table[name];
				scope[scopeName].row[name] = getManyDtoScoped.newScopeColumnRef(context, alias);
				scopeColumns.push({
					alias,
					column,
					value: row => row[scopeName][name]
				});
			}
		return { scope, scopeColumns };
	}

	function createScope(pair, ownerTable) {
		return {
			root: { row: pair.root, table: rootTable },
			parent: { row: pair.row, table: ownerTable }
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

function throwBadRequest(message) {
	const error = new Error(message);
	error.status = 400;
	throw error;
}
