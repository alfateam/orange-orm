const newInsertCommand = require('../table/commands/newInsertCommand');
const newInsertCommandCore = require('./newInsertCommandCore');
const setSessionSingleton = require('../table/setSessionSingleton');
const newGetLastInsertedCommand = require('../table/commands/newGetLastInsertedCommand');
const executeQueries = require('../table/executeQueries');

function insert(table, row, options) {

	return new Promise((res, rej) => {
		const cmd = newInsertCommand(newInsertCommandCore, table, row, options);
		cmd.disallowCompress = true;
		executeQueries([cmd]).then((result) => result[0]).then(onResult).then(res, rej);

		function onResult([result]) {
			setSessionSingleton('lastRowid', result.lastRowid);
			const selectCmd = newGetLastInsertedCommand(table, row, cmd);
			return executeQueries([selectCmd]).then((result) => res(result[0]));
		}

	});
}

module.exports = insert;
