var when = require('a').when;
var c = {};

when(c)
    .it('should merge id and connectionString').assertDeepEqual(c.expected, c.returned)