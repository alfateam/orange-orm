let emptyFilter = require('../emptyFilter');
let negotiateRawSqlFilter = require('../table/column/negotiateRawSqlFilter');
let isSafe = Symbol();
let _ops = {
	and: emptyFilter.and,
	or: emptyFilter.or,
	not: emptyFilter.not,
	AND: emptyFilter.and,
	OR: emptyFilter.or,
	NOT: emptyFilter.not,
};

let allowedOps = {
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
	exists: true
};

async function executePath({ table, JSONFilter, baseFilter, customFilters = {}, request, response, allowEverything }) {
	//todo if (allowEverything)...
	let ops = { ..._ops, ...getCustomFilterPaths(customFilters), ...{ getManyDto, getMany } };
	let res = await parseFilter(JSONFilter);
	return res;

	async function parseFilter(json) {
		if (isFilter(json)) {
			let subFilters = [];
			for (let i = 0; i < json.args.length; i++) {
				subFilters.push(await parseFilter(json.args[i]));
			}
			return executePath(json.path, subFilters);
		}
		return json;

		function executePath(path, args) {
			if (path in ops) {
				if (!allowEverything)
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
			if (!allowedOps[op] && !allowEverything)
				throw new Error('Disallowed operator ' + op);
			for (let i = 0; i < pathArray.length; i++) {
				target = target[pathArray[i]];
			}
			let res = target.apply(null, args);
			setSafe(res);
			return res;
		}
	}

	async function getManyDto(filter, strategy) {
		validateStrategy(table, strategy);
		filter = negotiateRawSqlFilter(filter, table);
		if (typeof baseFilter === 'function') {
			baseFilter = await baseFilter(request, response);
		}
		if (baseFilter) {
			filter = filter.and(baseFilter);
		}
		let args = [filter].concat(Array.prototype.slice.call(arguments).slice(1));
		return table.getManyDto.apply(null, args);
	}

	async function getMany(filter, strategy) {
		validateStrategy(table, strategy);
		filter = negotiateRawSqlFilter(filter, table);
		if (typeof baseFilter === 'function') {
			baseFilter = await baseFilter(request, response);
		}
		if (baseFilter) {
			filter = filter.and(baseFilter);
		}
		let args = [filter].concat(Array.prototype.slice.call(arguments).slice(1));
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
	throw new Error('Invalid limit: ' + strategy.limit);
}

function validateOffset(strategy) {
	if (!('offset' in strategy) || Number.isInteger(strategy.offset))
		return;
	throw new Error('Invalid offset: ' + strategy.offset);
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
			if (!(col && col.equal))
				throw new Error('Unknown column: ' + p);
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
		if (filter.sql || typeof (filter) === 'string')
			throw new Error('Raw filters are disallowed');
		if (Array.isArray(filter))
			for (let i = 0; i < filter.length; i++) {
				validateArgs(filter[i]);
			}
	}

}

function getCustomFilterPaths(customFilters) {
	return getLeafNames(customFilters);

	function getLeafNames(obj, result = {}, current = 'customFilters.') {
		for (let p in obj) {
			if (typeof obj[p] === 'object' && obj[p] !== null)
				getLeafNames(obj[p], result, current + p + '.');
			else
				result[current + p] = obj[p];

		}
		return result;
	}
}

function isFilter(json) {
	return json instanceof Object && 'path' in json && 'args' in json;
}

function setSafe(o) {
	Object.defineProperty(o, 'isSafe', {
		value: isSafe,
		enumerable: false
	});



}
module.exports = executePath;