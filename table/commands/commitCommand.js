var newParameterized = require('../query/newParameterized');

var command = newParameterized('COMMIT');
function empty() {}

command.endEdit = empty;
command.matches = empty;

module.exports = command;