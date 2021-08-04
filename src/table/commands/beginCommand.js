var newParameterized = require('../query/newParameterized');

var command = newParameterized('BEGIN');
function empty() {}

command.endEdit = empty;
command.matches = empty;

module.exports = command;