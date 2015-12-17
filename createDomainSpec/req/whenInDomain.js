var when = require('a').when;
var c = {};

when(c)
    .it('should forward properties of old domain').assertDoesNotThrow(c.negotiateForwardProperty.verify)
    .it('should return new domain').assertEqual(c.newDomain, c.returned)
    .it('should set domainExit to exitPromise').assertEqual(c.exitPromise, c.newDomain.domainExit)
    .it('should forward error and end to exitPromise').assertDoesNotThrow(c.emitter.once.verify)
    .it('should set exitPromise.resolve to emitEnd').assertEqual(c.emitEnd, c.exitPromise.resolve)
    .it('should set exitPromise.reject to emitError').assertEqual(c.emitError, c.exitPromise.reject)
    .it('should set exitPromise.rejectInActiveDomain').assertEqual(c.originalReject, c.exitPromise.rejectInActiveDomain)
    
    