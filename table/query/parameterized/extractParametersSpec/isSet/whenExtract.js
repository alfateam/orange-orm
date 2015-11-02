var when = require('a').when;
var c = {};

when(c)
.it('should return argument unchanged').assertEqual(c.parameters, c.returned);
