var when = require('a').when;
var c = {};

when(c)
    .it('should stringify to id').assertEqual(c.expected, JSON.stringify(c.returned))
    .it('should not change existing connection').assertNotEqual(c.connectionString, c.returned)