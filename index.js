var newParameterized = require('./table/query/newParameterized');
var newBoolean = require('./table/column/newBoolean');
var newDatabase = require('./newDatabase');
var table = require('./table');

var filter = newParameterized('');
filter = newBoolean(filter);

var connectViaPool = function(connectionString) {
	return newDatabase(connectionString);
};
connectViaPool.table = table;

connectViaPool.filter = filter;

module.exports = connectViaPool;
