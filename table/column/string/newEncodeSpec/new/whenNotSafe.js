var when = require('a').when;
var c = {};

when(c)
.it('should add param to parameters collection').assertDoesNotThrow(c.parameters.add.verify)
.it('should return param').assertEqual(c.param, c.returned);