let useHook = require('./useHook');
let cls = require('./node-cls');
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

function createOnContext() {
	return cls.createContext('rdb');
}

if (useHook)
    module.exports = createOnContext;
else
    module.exports = createDomain;