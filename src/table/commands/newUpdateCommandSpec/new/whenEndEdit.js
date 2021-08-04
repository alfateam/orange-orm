var when = require('a').when;
var c = {};

when(c)
	.it('should unsubscribe field changed').assertDoesNotThrow(c.row.unsubscribeChanged.verify)
	.it('should get sql').assertDoesNotThrow(c.createCommand.verify)
	;