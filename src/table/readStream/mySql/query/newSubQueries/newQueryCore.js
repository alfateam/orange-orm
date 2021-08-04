var newSingleQuery = require('./newSingleQueryCore');
var newSubQueries = require('../newSubQueries');

function newQueryCore(table,span,alias) {
	var subQueries = newSubQueries(table,span,alias);
	return newSingleQuery(table,alias,subQueries);
}

module.exports = newQueryCore;