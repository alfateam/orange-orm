var when = require('a').when;
var c = {};

when(c)
.it('should return empty array').assertDeepEqual([], c.returned);
