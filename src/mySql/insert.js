let newInsertCommand = require('../table/commands/newInsertCommand');
let newInsertCommandCore = require('../table/commands/newInsertCommandCore');
let newGetLastInsertedCommand = require('../table/commands/newGetLastInsertedCommand');
let executeQueries = require('../table/executeQueries');
let pushCommand = require('../table/commands/pushCommand');


function insertDefault(context, table, row, options) {
	let commands = [];
	let insertCmd = newInsertCommand(newInsertCommandCore.bind(null, context), table, row, options);
	insertCmd.disallowCompress = true;
	pushCommand(context, insertCmd);

	let selectCmd = newGetLastInsertedCommand(context, table, row, insertCmd);
	commands.push(selectCmd);

	return executeQueries(context, commands).then((result) => result[result.length - 1]);

}

module.exports = insertDefault;
