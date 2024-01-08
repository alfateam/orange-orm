let newInsertCommand = require('../table/commands/newInsertCommand');
let pushCommand = require('../table/commands/pushCommand');

function insert({ table, row, options }, cb) {
	let cmd = newInsertCommand(table, row, options);
	pushCommand(cmd);
	// console.dir('parameters');
	// console.dir(cmd.parameters);
	cmd.onResult = onResult;
	cmd.disallowCompress = true;


	function onResult() {

	}
}

module.exports = insert;
