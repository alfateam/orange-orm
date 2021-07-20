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

async function executePath({table, JSONFilter, baseFilter, customFilters = {}, request, response}) {
	let ops = {..._ops, ...getCustomFilterPaths(customFilters), ...{getManyDto, getMany: getManyDto}};
	try {
		let res = await parseFilter(JSONFilter);
		return res;

	}
	catch(e) {
		console.log(e.stack);
		throw e;
	}

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
				validateArgs(args);
				let op =  ops[path].apply(null, args);
				if (op.then)
					return op.then((o) => {
						o.isSafe = isSafe;
						return o;
					});
				op.isSafe = isSafe;
				return op;
			}
			let pathArray = path.split('.');
			let target = table;
			let op = pathArray[pathArray.length - 1];
			if (!allowedOps[op])
				throw new Error('Disallowed operator ' + op);
			for (let i = 0; i < pathArray.length; i++) {
				target = target[pathArray[i]];
			}
			let res =  target.apply(null, args);
			res.isSafe = isSafe;
			return res;
		}
	}

	async function getManyDto(filter) {
		filter = negotiateRawSqlFilter(filter, table);
		if (typeof baseFilter === 'function') {
			baseFilter = await baseFilter(request, response);
		}
		if (baseFilter)	{
			filter = filter.and(baseFilter);
		}
		let args = [filter].concat(Array.prototype.slice.call(arguments).slice(1));
		return table.getManyDto.apply(null, args);
	}

}

function validateArgs() {
	for (let i = 0; i < arguments.length; i++) {
		const filter = arguments[i];
		if (!filter)
			continue;
		if (filter && filter.isSafe === isSafe)
			continue;
		if (filter.sql || typeof(filter) === 'string')
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
		for(let p in obj) {
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
module.exports = executePath;