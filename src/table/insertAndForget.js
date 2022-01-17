let executeQueries = require('./executeQueries');
let newRow = require('./commands/newRow');
let newInsertCommand = require('./commands/newInsertCommand');
let pushCommand = require('./commands/pushCommand');

function insertAndForget(table, arg) {
	if (Array.isArray(arg))
		for (let i = 0; i < arg.length; i++) {
			let row = newRow.apply(null, [table, arg[i]]);
			let cmd = newInsertCommand(table, row, {insertAndForget: true});
			pushCommand(cmd);
		}
	else {
		let args = [].slice.call(arguments);
		let row = newRow.apply(null, args);
		let cmd = newInsertCommand(table, row, {insertAndForget: true});
		pushCommand(cmd);
	}
	return executeQueries([]);
}

module.exports = insertAndForget;