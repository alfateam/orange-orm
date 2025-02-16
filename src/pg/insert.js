let newInsertCommand = require('../table/commands/newInsertCommand');
let newInsertCommandCore = require('../table/commands/newInsertCommandCore');
let executeQueries = require('../table/executeQueries');


function insertDefault(context, table, row, options) {
	let insertCmd = newInsertCommand(newInsertCommandCore.bind(null, context), table, row, options);
	insertCmd.disallowCompress = true;

	return executeQueries(context, [insertCmd]).then((result) => result[result.length - 1]);

}

module.exports = insertDefault;
