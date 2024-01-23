let newInsertCommand = require('../table/commands/newInsertCommand');
let newInsertCommandCore = require('../table/commands/newInsertCommandCore');
let executeQueries = require('../table/executeQueries');

async function insertDefault(table, row, options) {
	let insertCmd = newInsertCommand(newInsertCommandCore, table, row, options);
	insertCmd.disallowCompress = true;

	return executeQueries([insertCmd]).then((result) => result[result.length - 1]);

}

module.exports = insertDefault;
