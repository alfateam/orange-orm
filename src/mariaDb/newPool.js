const mySqlNewPool = require('../mySql/newPool');

function normalizeConnectionString(connectionString) {
	if (typeof connectionString === 'string' && connectionString.indexOf('mariadb://') === 0)
		return 'mysql://' + connectionString.slice('mariadb://'.length);
	return connectionString;
}

function newPool(connectionString, poolOptions) {
	return mySqlNewPool(normalizeConnectionString(connectionString), poolOptions);
}

module.exports = newPool;
