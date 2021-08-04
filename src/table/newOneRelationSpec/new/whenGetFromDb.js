var when = require('a').when;
var c = {};

when(c)
    .it('should return result from db').assertEqual(c.expected, c.returned)
