var when = require('a').when;
var c = {};

when('./new',c)
	.it('should add sub commands').assertDoesNotThrow(c.addSubCommands.verify)
	.it('should push singleCommand to queries').assertDoesNotThrow(c.queries.push.verify)
	.it('returns queries').assertEqual(c.queries,c.returned)