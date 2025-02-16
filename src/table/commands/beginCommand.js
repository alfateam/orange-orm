let newParameterized = require('../query/newParameterized');
let getSessionContext = require('../getSessionContext');

module.exports = function(context) {
	let command = newParameterized(getSessionContext(context).begin || 'BEGIN');
	command.endEdit = empty;
	command.matches = empty;

	function empty() {}

	return command;

};
