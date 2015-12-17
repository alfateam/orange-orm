var when = require('a').when;
var c = {};

when(c)
	.it('should return domainExitPromise').assertEqual(c.domainExit.promise, c.returned)
	.it('should push commitCommand').assertDoesNotThrow(c.pushCommand.verify)
	.it('should execute changes').assertDoesNotThrow(c.executeChanges.verify)
	.it('should throw in current domain').assertDoesNotThrow(c.domainExit.rejectInActiveDomain.verify)
	