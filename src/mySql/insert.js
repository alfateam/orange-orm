let newInsertCommand = require('../table/commands/newInsertCommand');
let newInsertCommandCore = require('../table/commands/newInsertCommandCore');
let newGetLastInsertedCommand = require('../table/commands/newGetLastInsertedCommand');
let executeQueries = require('../table/executeQueries');
let pushCommand = require('../table/commands/pushCommand');


function insertDefault(table, row, options) {
	let commands = [];
	let insertCmd = newInsertCommand(newInsertCommandCore, table, row, options);
	insertCmd.disallowCompress = true;
	pushCommand(insertCmd);

	let selectCmd = newGetLastInsertedCommand(table, row, insertCmd);
	commands.push(selectCmd);

	return executeQueries(commands).then((result) => result[result.length - 1]);

}

module.exports = insertDefault;
