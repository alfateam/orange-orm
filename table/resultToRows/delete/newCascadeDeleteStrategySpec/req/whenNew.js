var when = require('a').when;
var c = {};

when(c)
	.it('should add sub strategies').assertDoesNotThrow(c.newNextCascadeDeleteStrategy.verify)
	.it('should return strategy').assertEqual(c.strategy, c.returned)
