var getSessionContext = require('./getSessionContext');

module.exports = function(context, name) {
	const rdb = getSessionContext(context);
	return rdb[name];
};