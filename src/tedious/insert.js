const { parameters } = require('../emptyFilter');
let newInsertCommand = require('../table/commands/newInsertCommand');
// let newGetLastInsertedCommand = require('../table/commands/newGetLastInsertedCommand');
let pushCommand = require('../table/commands/pushCommand');

function insert({ table, row, options }, cb) {
	let cmd = newInsertCommand(table, row, options);
	pushCommand(cmd);
	// let selectCmd;
	// if (getSessionContext().lastInsertedIsSeparate) {
	// 	selectCmd = newGetLastInsertedCommand(table, row, cmd);
	// 	pushCommand(selectCmd);
	// 	selectCmd.onResult = onResult;
	// }
	// else {
	console.dir('parameters');
	console.dir(cmd.parameters);
	cmd.onResult = cb;
	cmd.disallowCompress = true;
	// }
}

module.exports = insert;
