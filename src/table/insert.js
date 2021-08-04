let getSessionContext = require('./getSessionContext');
let executeQueries = require('./executeQueries');
let newRow = require('./commands/newRow');
let newInsertCommand = require('./commands/newInsertCommand');
let newGetLastInsertedCommand = require('./commands/newGetLastInsertedCommand');
let pushCommand = require('./commands/pushCommand');

function insert(table) {
	let args = [].slice.call(arguments);
	let row = newRow.apply(null, args);
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
	function then(fn) {
		delete row.then;
		return executeQueries([]).then(() => fn(row));
	}

	function onResult([result]) {
		table._cache.tryRemove(row);
		row.hydrate(result);
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

module.exports = insert;