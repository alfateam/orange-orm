var when = require('a').when;
var c = {};

when(c)
	.it('should end edit last Command').assertDoesNotThrow(c.lastCommand.endEdit.verify)
	.it('should return changeSet').assertEqual(c.changeSet, c.returned)
	.it('should set domain.changeSet to empty array').assertDeepEqual([], c.domain[c.changeSetId])
	;
