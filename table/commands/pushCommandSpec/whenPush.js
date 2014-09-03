var when = require('a').when;
var c = {};

when(c)
	.it('should notify dirty').assertDoesNotThrow(c.notifyDirty.verify)
	.it('should push command to changeSet').assertDoesNotThrow(c.changeSet.push.verify)