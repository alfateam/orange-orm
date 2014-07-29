var when = require('a').when;
var c = {};

when(c)
    .it('should not get far relatives').assertEqual(c.expected, c.returned)
