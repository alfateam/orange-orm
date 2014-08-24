var when = require('a').when;
var c = {};

when(c)
	.it('should set value on context').assertEqual(c.expected, c.context.foo)
