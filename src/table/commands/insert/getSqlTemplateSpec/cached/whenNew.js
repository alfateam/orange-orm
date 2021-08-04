var when = require('a').when;
var c = {};

when(c)
    .it('should return cached command').assertEqual(c.table._insertTemplate, c.returned)
