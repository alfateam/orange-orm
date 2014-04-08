var when = require('a').when;
var c = {};

when(c)
	.it('should set subscribeAdded to emitAdded.add').assertEqual(c.emitAdded.add, c.sut.subscribeAdded)
	.it('should set subscribeRemoved to emitRemoved.add').assertEqual(c.emitRemoved.add, c.sut.subscribeRemoved)
	;
