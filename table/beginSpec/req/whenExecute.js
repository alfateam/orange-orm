var when = require('a').when;
var c = {};

when(c)
	.it('should reset changeSet').assertDoesNotThrow(c.resetChangeSet.verify)
	.it('should push beginCommand').assertDoesNotThrow(c.pushCommand.verify)
;