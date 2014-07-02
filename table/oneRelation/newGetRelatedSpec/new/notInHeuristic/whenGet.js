var when = require('a').when;
var c = {};

when(c)
	.it('should set expanded').assertOk(c.sut.expanded)
    .it('should return related row').assertEqual(c.expected, c.returned)
