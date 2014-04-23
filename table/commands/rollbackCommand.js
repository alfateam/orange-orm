var newParameterized = require('../query/newParameterized');

var command = newParameterized('ROLLBACK');
function empty() {};

command.endEdit = empty;
command.matches = empty;

module.exports = command;


