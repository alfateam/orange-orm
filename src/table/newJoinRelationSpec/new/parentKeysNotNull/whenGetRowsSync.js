var when = require('a').when;
var c = {};

when(c)
    .it('should return rows').assertEqual(c.relatedRows, c.returned);
