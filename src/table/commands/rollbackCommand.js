var newParameterized = require('../query/newParameterized');

var command = newParameterized('ROLLBACK');
function empty() {}

// @ts-ignore
command.endEdit = empty;
// @ts-ignore
command.matches = empty;

module.exports = command;


