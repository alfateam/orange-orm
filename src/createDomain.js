let useHook = require('./useHook');
let cls;
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
	if (!cls)
		cls = require('node-cls');
	return cls.create('rdb');
}


function _createDomain() {
	if (useHook())
		return createOnContext();
	else
		return createDomain();

}

module.exports = _createDomain;