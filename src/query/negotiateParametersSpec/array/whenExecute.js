var when = require('a').when;
var c = {};

when(c)
.it('should return input').assertEqual(c.parameters, c.returned)
