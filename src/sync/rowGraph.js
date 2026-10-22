const stringify = require('../client/stringify');

function invalid(message) {
	return Object.assign(new Error(`syncById: ${message}`), { status: 400 });
}

// Resolve the graph from trusted mapping metadata on both sides of the wire.
function planGraph(tables, name, strategy = {}, depth = 0) {
	const table = tables && tables[name];
	if (!table || !table._primaryColumns?.length)
		throw invalid(`table "${name}" is not mapped or exposed.`);
	if (depth > 16)
		throw invalid('relation strategy is too deep.');
	if (!strategy || typeof strategy !== 'object' || Array.isArray(strategy))
		throw invalid('strategy must be an object.');
	const columns = table._columns.map(column => column.alias);
	const plan = { name, columns, keys: table._primaryColumns.map(column => column.alias), relations: [], strategy: {} };
	for (const key of Object.keys(strategy)) {
		const value = strategy[key];
		if (key === 'where' || key === 'limit' || key === 'offset')
			throw invalid(`"${key}" cannot restrict a complete relation.`);
		if (columns.includes(key) || key === 'orderBy')
			continue;
		const relation = Object.hasOwn(table._relations, key) && table._relations[key];
		if (!relation)
			throw invalid(`unsupported strategy property "${name}.${key}".`);
		if (value === false || value === undefined)
			continue;
		const target = relation.childTable;
		const targetName = Object.keys(tables).find(candidate => tables[candidate] === target);
		if (!targetName)
			throw invalid(`relation "${name}.${key}" is not exposed.`);
		const child = planGraph(tables, targetName, value === true ? {} : value, depth + 1);
		const join = relation.joinRelation || relation;
		const owned = !!relation.joinRelation;
		const sourceColumns = (owned ? table._primaryColumns : join.columns).map(column => column.alias);
		const targetColumns = (owned ? join.columns : target._primaryColumns).map(column => column.alias);
		if (!sourceColumns.length || sourceColumns.length !== targetColumns.length)
			throw invalid(`unsupported relation "${name}.${key}".`);
		plan.relations.push({ key, owned, sourceColumns, targetColumns, plan: child });
		plan.strategy[key] = child.strategy;
	}
	return plan;
}

function validateKey(plan, pk) {
	if (!Array.isArray(pk) || pk.length !== plan.keys.length || pk.some(value => value == null
		|| !['string', 'number', 'boolean'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)))
		throw invalid('supply every primary-key component.');
}

function keyOf(plan, row) {
	return plan.keys.map(key => row[key]);
}

function keyFilter(db, name, columns, keys) {
	return db.or(...keys.map(values => db.and(...columns.map((column, index) => db[name][column].eq(values[index])))));
}

// One batched query per selected relation path. Server filters are evaluated
// on the same transaction/identity as the root, including nested relations.
async function readGraph(db, plan, keys, resolveFilter, columns = plan.keys) {
	const unique = [...new Map(keys.filter(key => key.every(value => value != null))
		.map(key => [stringify(key), key])).values()];
	const rows = [];
	for (let offset = 0; offset < unique.length; offset += 200) {
		const filter = keyFilter(db, plan.name, columns, unique.slice(offset, offset + 200));
		const base = resolveFilter && await resolveFilter(db, plan.name);
		const table = resolveFilter ? db({ [plan.name]: { baseFilter: undefined } })[plan.name] : db[plan.name];
		const fetched = await table.getMany(base ? db.and(base, filter) : filter);
		rows.push(...fetched.map(row => Object.fromEntries(plan.columns.map(key => [key, row[key]]))));
	}
	const children = {};
	for (const relation of plan.relations) {
		children[relation.key] = await readGraph(db, relation.plan,
			rows.map(row => relation.sourceColumns.map(key => row[key])), resolveFilter, relation.targetColumns);
	}
	return { rows, children };
}

// Validate the full envelope before any local writes or removal decisions.
function validateGraph(plan, graph, keys, columns = plan.keys) {
	if (!graph || !Array.isArray(graph.rows) || !graph.children || typeof graph.children !== 'object')
		throw invalid('incomplete row graph response.');
	for (const row of graph.rows) {
		if (!row || typeof row !== 'object' || plan.columns.some(key => !Object.hasOwn(row, key)))
			throw invalid('row graph response is missing mapped columns.');
		validateKey(plan, keyOf(plan, row));
		if (keys && !keys.some(values => values.every((value, index) => stringify(value) === stringify(row[columns[index]]))))
			throw invalid('row graph response contains an unrelated row.');
	}
	for (const relation of plan.relations)
		validateGraph(relation.plan, graph.children[relation.key],
			graph.rows.map(row => relation.sourceColumns.map(key => row[key])), relation.targetColumns);
}

function flatten(plan, graph, result = new Map()) {
	for (const row of graph.rows) {
		const pk = keyOf(plan, row);
		result.set(stringify([plan.name, pk]), { table: plan.name, pk, op: 'U', row });
	}
	for (const relation of plan.relations)
		flatten(relation.plan, graph.children[relation.key], result);
	return result;
}

// Missing keys are rechecked under server visibility, including shared references.
// A changed relationship alone never authorizes deleting its previous target.
function knownKeys(plan, graph) {
	return [...flatten(plan, graph).values()].map(({ table, pk }) => ({ table, pk }));
}

function graphTables(plan) {
	return [...new Set([plan.name, ...plan.relations.flatMap(relation => graphTables(relation.plan))])];
}

module.exports = { planGraph, validateKey, readGraph, validateGraph, flatten, knownKeys, graphTables, keyOf, invalid };
