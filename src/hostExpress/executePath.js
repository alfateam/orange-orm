const createPatch = require('../client/createPatch');
const emptyFilter = require('../emptyFilter');
const negotiateRawSqlFilter = require('../table/column/negotiateRawSqlFilter');
let getMeta = require('./getMeta');
let isSafe = Symbol();

let _allowedOps = {
	and: true,
	or: true,
	not: true,
	AND: true,
	OR: true,
	NOT: true,
	equal: true,
	eq: true,
	EQ: true,
	notEqual: true,
	ne: true,
	NE: true,
	lessThan: true,
	lt: true,
	LT: true,
	lessThanOrEqual: true,
	le: true,
	LE: true,
	greaterThan: true,
	gt: true,
	GT: true,
	greaterThanOrEqual: true,
	ge: true,
	GE: true,
	between: true,
	in: true,
	IN: true,
	startsWith: true,
	iStartsWith: true,
	endsWith: true,
	iEndsWith: true,
	contains: true,
	iContains: true,
	iEqual: true,
	iEq: true,
	ieq: true,
	IEQ: true,
	exists: true,
	all: true,
	any: true,
	none: true,
	where: true,
	sum: true,
	avg: true,
	max: true,
	min: true,
	count: true,
	groupSum: true,
	groupAvg: true,
	groupMax: true,
	groupMin: true,
	groupCount: true,
	_aggregate: true,
	self: true,
};

function _executePath(context, ...rest) {

	const _ops = {
		and: emptyFilter.and.bind(null, context),
		or: emptyFilter.or.bind(null, context),
		not: emptyFilter.not.bind(null, context),
		AND: emptyFilter.and.bind(null, context),
		OR: emptyFilter.or.bind(null, context),
		NOT: emptyFilter.not.bind(null, context),
	};

	return executePath(...rest);

	async function executePath({ table, JSONFilter, baseFilter, customFilters = {}, request, response, readonly, disableBulkDeletes, isHttp, client }) {
		let allowedOps = { ..._allowedOps, insert: !readonly, ...extractRelations(getMeta(table)) };
		let ops = { ..._ops, ...getCustomFilterPaths(customFilters), getManyDto, getMany, aggregate, count, delete: _delete, cascadeDelete, update, replace };

		let res = await parseFilter(JSONFilter, table);
		if (res === undefined)
			return {};
		else
			return res;

		function parseFilter(json, table) {
			if (isFilter(json)) {
				let subFilters = [];

				let anyAllNone = tryGetAnyAllNone(json.path, table);
				if (anyAllNone) {
					if (isHttp)
						validateArgs(json.args[0]);
					const f = anyAllNone(context, x => parseFilter(json.args[0], x));
					if(!('isSafe' in f))
						f.isSafe = isSafe;
					return f;
				}
				else {
					for (let i = 0; i < json.args.length; i++) {
						subFilters.push(parseFilter(json.args[i], nextTable(json.path, table)));
					}
				}
				return executePath(json.path, subFilters);
			}
			else if (Array.isArray(json)) {
				const result = [];
				for (let i = 0; i < json.length; i++) {
					result.push(parseFilter(json[i], table));
				}
				return result;
			}
			return json;

			function tryGetAnyAllNone(path, table) {
				path = path.split('.');
				for (let i = 0; i < path.length; i++) {
					table = table[path[i]];
				}

				let ops = new Set(['all', 'any', 'none', 'where', '_aggregate']);
				// let ops = new Set(['all', 'any', 'none', 'where']);
				let last = path.slice(-1)[0];
				if (ops.has(last) || (table && (table._primaryColumns || (table.any && table.all))))
					return table;
			}

			function executePath(path, args) {
				if (path in ops) {
					if (isHttp)
						validateArgs(args);
					let op = ops[path].apply(null, args);
					if (op.then)
						return op.then((o) => {
							setSafe(o);
							return o;
						});
					setSafe(op);
					return op;
				}
				let pathArray = path.split('.');
				let target = table;
				let op = pathArray[pathArray.length - 1];
				if (!allowedOps[op] && isHttp) {

					let e = new Error('Disallowed operator ' + op);
					// @ts-ignore
					e.status = 403;
					throw e;

				}
				for (let i = 0; i < pathArray.length; i++) {
					target = target[pathArray[i]];
				}

				if (!target)
					throw new Error(`Method '${path}' does not exist`);
				let res = target.apply(null, [context, ...args]);
				setSafe(res);
				return res;
			}
		}

		async function invokeBaseFilter() {
			if (typeof baseFilter === 'function') {
				const res = await baseFilter.apply(null, [bindDb(client), request, response]);
				if (!res)
					return;
				const JSONFilter = JSON.parse(JSON.stringify(res));
				//@ts-ignore
				return executePath({ table, JSONFilter, request, response });
			}
			else
				return;
		}

		function getCustomFilterPaths(customFilters) {
			return getLeafNames(customFilters);

			function getLeafNames(obj, result = {}, current = 'customFilters.') {
				for (let p in obj) {
					if (typeof obj[p] === 'object' && obj[p] !== null)
						getLeafNames(obj[p], result, current + p + '.');
					else
						result[current + p] = resolveFilter.bind(null, obj[p]);
				}
				return result;
			}

			async function resolveFilter(fn, ...args) {
				const context = { db: bindDb(client), request, response };
				let res = fn.apply(null, [context, ...args]);
				if (res.then)
					res = await res;
				const JSONFilter = JSON.parse(JSON.stringify(res));
				//@ts-ignore
				return executePath({ table, JSONFilter, request, response });
			}
		}

		function nextTable(path, table) {
			path = path.split('.');
			let ops = new Set(['all', 'any', 'none']);
			let last = path.slice(-1)[0];
			if (ops.has(last)) {
				for (let i = 0; i < path.length - 1; i++) {
					table = table[path[i]];
				}
				return table;
			}
			else {
				let lastObj = table;
				for (let i = 0; i < path.length; i++) {
					if (lastObj)
						lastObj = lastObj[path[i]];
				}
				if (lastObj?._shallow)
					return lastObj._shallow;
				else return table;
			}
		}

		async function _delete(filter) {
			if (readonly || disableBulkDeletes) {
				let e = new Error('Bulk deletes are not allowed. Parameter "disableBulkDeletes" must be true.');
				// @ts-ignore
				e.status = 403;
				throw e;
			}
			filter = negotiateFilter(filter);
			const _baseFilter = await invokeBaseFilter();
			if (_baseFilter)
				filter = filter.and(context, _baseFilter);
			let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
			return table.delete.apply(null, args);
		}

		async function cascadeDelete(filter) {
			if (readonly || disableBulkDeletes) {
				const e = new Error('Bulk deletes are not allowed. Parameter "disableBulkDeletes" must be true.');
				// @ts-ignore
				e.status = 403;
				throw e;

			}
			filter = negotiateFilter(filter);
			const _baseFilter = await invokeBaseFilter();
			if (_baseFilter)
				filter = filter.and(context, _baseFilter);
			let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
			return table.cascadeDelete.apply(null, args);
		}

		function negotiateFilter(filter) {
			if (filter)
				return negotiateRawSqlFilter(context, filter, table, true);
			else
				return emptyFilter;
		}

		async function count(filter, strategy) {
			validateStrategy(table, strategy);
			filter = negotiateFilter(filter);
			const _baseFilter = await invokeBaseFilter();
			if (_baseFilter)
				filter = filter.and(context, _baseFilter);
			let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
			return table.count.apply(null, args);
		}

		async function getManyDto(filter, strategy) {
			validateStrategy(table, strategy);
			filter = negotiateFilter(filter);
			const _baseFilter = await invokeBaseFilter();
			if (_baseFilter)
				filter = filter.and(context, _baseFilter);
			let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
			await negotiateWhereAndAggregate(strategy);
			return table.getManyDto.apply(null, args);
		}

		async function replace(subject, strategy = { insertAndForget: true }) {
			validateStrategy(table, strategy);
			const refinedStrategy = objectToStrategy(subject, {}, table);
			const JSONFilter2 = {
				path: 'getManyDto',
				args: [subject, refinedStrategy]
			};
			const originals = await executePath({ table, JSONFilter: JSONFilter2, baseFilter, customFilters, request, response, readonly, disableBulkDeletes, isHttp, client });
			const meta = getMeta(table);
			const patch = createPatch(originals, Array.isArray(subject) ? subject : [subject], meta);
			const { changed } = await table.patch(context, patch, { strategy });
			if (Array.isArray(subject))
				return changed;
			else
				return changed[0];
		}

		async function update(subject, whereStrategy, strategy = { insertAndForget: true }) {
			validateStrategy(table, strategy);
			const refinedWhereStrategy = objectToStrategy(subject, whereStrategy, table);
			const JSONFilter2 = {
				path: 'getManyDto',
				args: [null, refinedWhereStrategy]
			};
			const rows = await executePath({ table, JSONFilter: JSONFilter2, baseFilter, customFilters, request, response, readonly, disableBulkDeletes, isHttp, client });
			const originals = new Array(rows.length);
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				originals[i] = { ...row };
				for (let p in subject) {
					row[p] = subject[p];
				}
			}
			const meta = getMeta(table);
			const patch = createPatch(originals, rows, meta);
			const { changed } = await table.patch(context, patch, { strategy });
			return changed;
		}

		function objectToStrategy(object, whereStrategy, table, strategy = {}) {
			strategy = { ...whereStrategy, ...strategy };
			if (Array.isArray(object)) {
				for (let i = 0; i < object.length; i++) {
					objectToStrategy(object[i], table, strategy);
				}
				return;
			}
			for (let name in object) {
				const relation = table[name]?._relation;
				if (relation && !relation.columns) {//notJoin, that is one or many
					strategy[name] = {};
					objectToStrategy(object[name], whereStrategy?.[name], table[name], strategy[name]);
				}
				else
					strategy[name] = true;
			}
			return strategy;
		}


		async function aggregate(filter, strategy) {
			validateStrategy(table, strategy);
			filter = negotiateFilter(filter);
			const _baseFilter = await invokeBaseFilter();
			if (_baseFilter)
				filter = filter.and(context, _baseFilter);
			let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
			await negotiateWhereAndAggregate(strategy);
			return table.aggregate.apply(null, args);
		}



		async function negotiateWhereAndAggregate(strategy) {
			if (typeof strategy !== 'object')
				return;

			for (let name in strategy) {
				const target = strategy[name];
				if (isFilter(target))
					strategy[name] = await parseFilter(strategy[name], table);
				else
					await negotiateWhereAndAggregate(strategy[name]);
			}

		}

		async function getMany(filter, strategy) {
			validateStrategy(table, strategy);
			filter = negotiateFilter(filter);
			const _baseFilter = await invokeBaseFilter();
			if (_baseFilter)
				filter = filter.and(context, _baseFilter);
			let args = [context, filter].concat(Array.prototype.slice.call(arguments).slice(1));
			await negotiateWhereAndAggregate(strategy);
			return table.getMany.apply(null, args);
		}

	}

	function validateStrategy(table, strategy) {
		if (!strategy || !table)
			return;

		for (let p in strategy) {
			validateOffset(strategy);
			validateLimit(strategy);
			validateOrderBy(table, strategy);
			validateStrategy(table[p], strategy[p]);
		}
	}

	function validateLimit(strategy) {
		if (!('limit' in strategy) || Number.isInteger(strategy.limit))
			return;
		const e = new Error('Invalid limit: ' + strategy.limit);
		// @ts-ignore
		e.status = 400;
	}

	function validateOffset(strategy) {
		if (!('offset' in strategy) || Number.isInteger(strategy.offset))
			return;
		const e = new Error('Invalid offset: ' + strategy.offset);
		// @ts-ignore
		e.status = 400;
		throw e;
	}

	function validateOrderBy(table, strategy) {
		if (!('orderBy' in strategy) || !table)
			return;
		let orderBy = strategy.orderBy;
		if (!Array.isArray(orderBy))
			orderBy = [orderBy];
		orderBy.reduce(validate, []);

		function validate(_, element) {
			let parts = element.split(' ').filter(x => {
				x = x.toLowerCase();
				return (!(x === '' || x === 'asc' || x === 'desc'));
			});
			for (let p of parts) {
				let col = table[p];
				if (!(col && col.equal)) {
					const e = new Error('Unknown column: ' + p);
					// @ts-ignore
					e.status = 400;
					throw e;
				}
			}
		}
	}

	function validateArgs() {
		for (let i = 0; i < arguments.length; i++) {
			const filter = arguments[i];
			if (!filter)
				continue;
			if (filter && filter.isSafe === isSafe)
				continue;
			if (filter.sql || typeof (filter) === 'string') {
				const e = new Error('Raw filters are disallowed');
				// @ts-ignore
				e.status = 403;
				throw e;
			}
			if (Array.isArray(filter))
				for (let i = 0; i < filter.length; i++) {

					validateArgs(filter[i]);
				}
		}

	}

	function isFilter(json) {
		return json instanceof Object && 'path' in json && 'args' in json;
	}

	function setSafe(o) {
		if (o instanceof Object)
			Object.defineProperty(o, 'isSafe', {
				value: isSafe,
				enumerable: false

			});
	}

	function extractRelations(obj) {
		let flattened = {};

		function helper(relations) {
			Object.keys(relations).forEach(key => {

				flattened[key] = true;

				if (typeof relations[key] === 'object' && Object.keys(relations[key]?.relations)?.length > 0) {
					helper(relations[key].relations);
				}
			});
		}

		helper(obj.relations);

		return flattened;
	}

	function bindDb(client) {
		var domain = context;
		let p = domain.run(() => true);

		function run(fn) {
			return p.then(domain.run.bind(domain, fn));
		}

		return client({ transaction: run });

	}
}
module.exports = _executePath;