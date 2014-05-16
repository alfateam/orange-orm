var tryGetFromDbById = require('./tryGetFromDbById');

function get()  {
	return tryGetFromDbById.apply(null,arguments).then(onResult);

	function onResult(row) {
		if (row === null)
			throw new Error("Row not found.")
		return row;
	}
}

module.exports = get;