var when = require('a').when;
var c = {};

when(c)
	.it('should return dtoArray').assertEqual(c.dtoArray, c.returned)
    .it('should map dtos').assertDeepEqual(c.expected, c.returned)
