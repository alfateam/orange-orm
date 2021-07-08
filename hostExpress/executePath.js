let emptyFilter = require('../emptyFilter');

let _ops = {
	and: emptyFilter.and,
	or: emptyFilter.or,
	not: emptyFilter.not,
	AND: emptyFilter.and,
	OR: emptyFilter.or,
	NOT: emptyFilter.not,
};

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

function executePath({table, JSONFilter, baseFilter, customFilters = {}, request, response}) {
	let ops = {..._ops, customFilters: customFilters, ...{getManyDto, getMany: getManyDto}};
	let allowedOps = getAllowedOps(customFilters);
	return parseFilter(JSONFilter);

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
			if (path in ops)
				return ops[path].apply(null, args);
			let target = table;
			let pathArray = path.split('.');
			let op = pathArray[pathArray.length - 1];
			if (!allowedOps[op])
				throw new Error('Disallowed operator ' + op);
			for (let i = 0; i < pathArray.length; i++) {
				target = target[pathArray[i]];
			}
			return target.apply(null, args);
		}
	}

	async function getManyDto(filter) {
		if (typeof baseFilter === 'function') {
			baseFilter = await baseFilter(request, response);
		}
		if (baseFilter)	{
			filter = filter ?  filter.and(baseFilter) : baseFilter;
		}
		let args = [filter].concat(Array.prototype.slice.call(arguments).slice(1));
		return table.getManyDto.apply(null, args);
	}

}

function getAllowedOps(customFilters) {
	return {..._allowedOps,...getLeafNames(customFilters)};

	function getLeafNames(obj, result = {}){
		for(let p in obj) {
			if (typeof obj[p] === 'object' && obj[p] !== null)
				getLeafNames(obj[p], result);
			else
				result[p] = true;
		}
		return result;
	}
}

function isFilter(json) {
	return json instanceof Object && 'path' in json && 'args' in json;
}
module.exports = executePath;