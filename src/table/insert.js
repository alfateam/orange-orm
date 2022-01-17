let getSessionContext = require('./getSessionContext');
let executeQueries = require('./executeQueries');
let newRow = require('./commands/newRow');
let newInsertCommand = require('./commands/newInsertCommand');
let newGetLastInsertedCommand = require('./commands/newGetLastInsertedCommand');
let pushCommand = require('./commands/pushCommand');

function insert(table, arg) {
	if (Array.isArray(arg)) {
		let all = [];
		for (let i = 0; i < arg.length; i++) {
			all.push(insert(table, arg[i]));
		}
		return Promise.all(all);
	}
	let args = [].slice.call(arguments);
	let row = newRow.apply(null, args);
	let hasPrimary = getHasPrimary(table, row);
	if (hasPrimary)
		row = table._cache.tryAdd(row);
	let cmd = newInsertCommand(table, row);

	pushCommand(cmd);
	expand(table, row);
	Object.defineProperty(row, 'then', {
		value: then,
		writable: true,
		enumerable: false,
		configurable: true
	});

	let selectCmd;
	if (getSessionContext().lastInsertedIsSeparate) {
		selectCmd = newGetLastInsertedCommand(table, row, cmd);
		pushCommand(selectCmd);
		selectCmd.onResult = onResult;
	}
	else {
		cmd.onResult = onResult;
		cmd.disallowCompress = true;
	}

	return row;
	function then(fn,efn) {
		delete row.then;
		return executeQueries([]).then(() => fn(row), efn);
	}

	function onResult([result]) {
		row.hydrate(result);
		if (!hasPrimary)
			row = table._cache.tryAdd(row);
		table._cache.tryAdd(row);
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
		if (row[column.alias] === null)
			return;
	}
	return true;

}

module.exports = insert;