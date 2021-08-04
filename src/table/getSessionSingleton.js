var getSessionContext = require('./getSessionContext');

module.exports = function(name) {
	return getSessionContext()[name];
};