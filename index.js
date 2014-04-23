var newParameterized = require('./table/query/newParameterized');
var newBoolean = require('./table/column/newBoolean');
var newDatabase = require('./newDatabase');

var filter = newParameterized('');
filter = newBoolean(filter);

var connectViaPool = function(connectionString) {
	return newDatabase(connectionString);
};

connectViaPool.filter = filter;

module.exports = connectViaPool;
