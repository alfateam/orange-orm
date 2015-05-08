var Domain = require('domain');
var negotiateForwardProperty = require('./createDomain/negotiateForwardProperty');

function createDomain() {
	var oldDomain = Domain.active || {};
	var domain = Domain.create();
	var ownProperties = Object.getOwnPropertyNames(oldDomain);
	ownProperties.forEach(function(propName) {
		negotiateForwardProperty(oldDomain, domain, propName);
	});
	return domain;
}

module.exports = createDomain;