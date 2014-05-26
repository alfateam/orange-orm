var when = require('a').when;
var c = {};

when(c)
.it('should return nullPromise').assertStrictEqual(c.nullPromise, c.returned)
;
