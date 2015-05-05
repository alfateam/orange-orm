var when = require('a').when;
var c = {};

when(c)
    .it('should return null').assertEqual(null, c.returned);
