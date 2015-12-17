var when = require('a').when;
var c = {};

when(c)
    .it('should return domainExit promise').assertEqual(c.domainExit.promise, c.returned)
    .it('should exit domain with error').assertDoesNotThrow(c.throwPromise.then.verify)
