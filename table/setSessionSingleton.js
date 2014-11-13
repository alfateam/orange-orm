var getSessionContext = require('./getSessionContext');

module.exports = function(name, value) {
	getSessionContext()[name] = value;
};