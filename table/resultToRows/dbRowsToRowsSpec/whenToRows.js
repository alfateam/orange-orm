var when = require('a').when;
var c = {};

when(c)
	.it('should return rowArray').assertStrictEqual(c.rowArray, c.returned)
    .it('should return rows').assertDeepEqual(c.expected, c.returned)
