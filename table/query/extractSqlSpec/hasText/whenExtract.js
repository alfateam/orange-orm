var when = require('a').when;
var c = {};

when(c)
.it('should return text unchanged').assertEqual(c.text,c.returned);
