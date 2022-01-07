let newParameterized = require('../query/newParameterized');
let getSessionContext = require('../getSessionContext');

module.exports = function() {
	let command = newParameterized(getSessionContext().begin || 'BEGIN');
	command.endEdit = empty;
	command.matches = empty;

	function empty() {}

	return command;

};
