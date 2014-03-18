var when = require('a').when;
var c = {};

when('./execute',c)
	.it('should negotiate guidformat').assertDoesNotThrow(c.negotiateGuidFormat.verify)
	.it('shold return expected').assertEqual(c.expected,c.returned);