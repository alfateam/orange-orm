var when = require('a').when;
var c = {};

when(c)
	.it('should set changeSet on domain to empty array').assertDeepEqual(c.domain[c.changeSetId], [])
	;
