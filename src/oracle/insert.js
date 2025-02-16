const newInsertCommand = require('../table/commands/newInsertCommand');
const newInsertCommandCore = require('./newInsertCommandCore');
const setSessionSingleton = require('../table/setSessionSingleton');
const newGetLastInsertedCommand = require('../table/commands/newGetLastInsertedCommand');
const executeQueries = require('../table/executeQueries');

function insert(context, table, row, options) {

	return new Promise((res, rej) => {
		const cmd = newInsertCommand(newInsertCommandCore.bind(null, context), table, row, options);
		cmd.disallowCompress = true;
		executeQueries(context, [cmd]).then((result) => result[0]).then(onResult).then(res, rej);

		function onResult([result]) {
			setSessionSingleton(context, 'lastRowid', result.lastRowid);
			const selectCmd = newGetLastInsertedCommand(context, table, row, cmd);
			return executeQueries(context, [selectCmd]).then((result) => res(result[0]));
		}

	});
}

module.exports = insert;
