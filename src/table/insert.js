let getSessionContext = require('./getSessionContext');
let newRow = require('./commands/newRow');
let insertDefault = require('./insertDefault');

function insert({ table, options }, arg) {
	// return insertDefault.apply(null, arguments);
	if (Array.isArray(arg)) {
		let all = [];
		for (let i = 0; i < arg.length; i++) {
			all.push(insert(table, arg[i]));
		}
		return Promise.all(all);
	}
	let args = [table].slice.call(arguments);
	let row = newRow.apply(null, args);
	let hasPrimary = getHasPrimary(table, row);
	if (hasPrimary) {
		row = table._cache.tryAdd(row);
	}
	expand(table, row);
	Object.defineProperty(row, 'then', {
		value: then,
		writable: true,
		enumerable: false,
		configurable: true
	});
	const context = getSessionContext();
	const insertP = (context.insert || insertDefault)(table, row, options).then(onResult);


	// }
	// else {
	// 	// Non-PG case, use Promise
	// 	result = new Promise((resolve, reject) => {
	// 		([result]) => {
	// 			row.hydrate(result);
	// 			if (!hasPrimary) {
	// 				row = table._cache.tryAdd(row);
	// 			}
	// 			table._cache.tryAdd(row);
	// 			resolve(row);qq
	// 		};
	// 	});
	// }

	async function then(fn, efn) {
		delete row.then;
		return insertP.then(() => fn(row), efn);
	}

	return row;

	function onResult([result]) {
		row.hydrate(result);
		if (!hasPrimary)
			row = table._cache.tryAdd(row);
		table._cache.tryAdd(row);
		return row;
	}
}

function expand(table, row) {
	let relationName;
	let visitor = {};
	visitor.visitJoin = function() { };

	visitor.visitMany = function() {
		row.expand(relationName);
	};

	visitor.visitOne = function() {
		row.expand(relationName);
	};

	for (relationName in table._relations) {
		let relation = table._relations[relationName];
		relation.accept(visitor);
	}
}

function getHasPrimary(table, row) {
	for (let i = 0; i < table._primaryColumns.length; i++) {
		let column = table._primaryColumns[i];
		if (row[column.alias] === null) {
			return false;
		}
	}
	return true;
}

module.exports = insert;
