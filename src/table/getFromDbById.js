let tryGetFromDbById = require('./tryGetFromDbById');

function get(table, ...ids) {
	return tryGetFromDbById.apply(null, arguments).then((row) => onResult(table, row, ids));
}

get.exclusive = function(table, ...ids) {
	return tryGetFromDbById.exclusive.apply(null, arguments).then((row) => onResult(table, row, ids));
};

function onResult(table, row, id) {
	if (row === null)
		throw new Error(`${table._dbName  }: Row with id ${id} not found.`);
	return row;
}

module.exports = get;