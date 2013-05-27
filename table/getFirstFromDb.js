var tryGet = require('./tryGetFirstFromDb');

function get()  {
	var row = tryGet.apply(null,arguments);
	if (row === null)
		throw("Row not found.")
	return row;
}

module.exports = get;