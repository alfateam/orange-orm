var a = require('a');

function act(c){
	c.mock = a.mock;
	c.requireMock = a.requireMock;
	c.expectRequire = a.expectRequire;
	c.then = a.then;
	
	c.Domain = c.requireMock('domain');
	c.negotiateForwardProperty = c.requireMock('./createDomain/negotiateForwardProperty');
	c.deferred = c.requireMock('deferred');
	c.events = c.requireMock('events');

	c.stubDomainExit = function() {
        c.emitter = {};
        c.events.expect().return(c.emitter);

        c.exitPromise = {};
        c.exitPromise.resolve = {};

        c.originalReject = {};
        c.exitPromise.reject = c.originalReject;
        c.deferred.expect().return(c.exitPromise);

        c.emitter.once = c.mock();
        c.emitter.once.expect('error', c.exitPromise.reject);
        c.emitter.once.expect('end', c.exitPromise.resolve);

        c.emitter.emit = {};
        c.emitError = {};
        c.emitter.emit.bind = c.mock();
        c.emitter.emit.bind.expect(c.emitter, 'error').return(c.emitError);
        c.emitEnd = {};
        c.emitter.emit.bind.expect(c.emitter, 'end').return(c.emitEnd);
    };

	c.sut = require('../createDomain');
}

module.exports = act;