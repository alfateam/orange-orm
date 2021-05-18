let emptyFilter = require('../emptyFilter');

let ops = {
	and: emptyFilter.and,
	or: emptyFilter.or,
	not: emptyFilter.not,
	AND: emptyFilter.and,
	OR: emptyFilter.or,
	NOT: emptyFilter.not
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
	exists: true,
};

function createFilter(table, JSONFilter) {
	return parseFilter(JSONFilter);

	function parseFilter(json) {
		if (isFilter(json)) {
			let subFilters = [];
			for (let i = 0; i < json.args.length; i++) {
				subFilters.push(parseFilter(json.args[i]));
			}
			return executePath(json.path, subFilters);
		}
		return json;
	}

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

function isFilter(json) {
	return json instanceof Object && 'path' in json && 'args' in json;
}
module.exports = createFilter;