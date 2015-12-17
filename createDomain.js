var Domain = require('domain');
var negotiateForwardProperty = require('./createDomain/negotiateForwardProperty');
var deferred = require('deferred');
var EventEmitter = require('events');

function createDomain() {
	var domainExit = deferred();

	var emitter = new EventEmitter();
	emitter.once('error', domainExit.reject);
	emitter.once('end', domainExit.resolve);

	domainExit.rejectInActiveDomain = domainExit.reject;
	domainExit.reject = emitter.emit.bind(emitter, 'error');
	domainExit.resolve = emitter.emit.bind(emitter, 'end');

	var domain = Domain.create();
	domain.domainExit = domainExit;

	var oldDomain = Domain.active || {};
	var ownProperties = Object.getOwnPropertyNames(oldDomain);
	ownProperties.forEach(function(propName) {
		negotiateForwardProperty(oldDomain, domain, propName);
	});
	return domain;
}

module.exports = createDomain;