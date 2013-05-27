var tryGetFromDbById = require('./tryGetFromDbById');

function get()  {
	var row = tryGetFromDbById.apply(null,arguments);
	if (row === null)
		throw("Row not found.")
	return row;
}

module.exports = get;