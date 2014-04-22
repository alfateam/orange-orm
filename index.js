var newParameterized = require('./table/query/newParameterized');
var newBoolean = require('./colum/newBoolean');
var newDatabase = require('./newDatabase');

var filter = newParameterized('');
filter = newBoolean(filter);

var connectViaPool = function(connectionString) {
	return newDatabase(connectionString);
};

connectViaPool.filter = filter;

module.exports = connectViaPool;
