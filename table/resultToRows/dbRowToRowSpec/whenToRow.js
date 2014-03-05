var when = require('a').when;
var c = {};

when(c)
.it('should create next row').assertDoesNotThrow(c.nextDbRowToRow.verify)
.it('should return row').assertEqual(c.expected, c.returned);
