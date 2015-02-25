var when = require('a').when;
var c = {};

when(c)
    .it('should stringify to id').assertEqual(c.expected, JSON.stringify(c.returned))
