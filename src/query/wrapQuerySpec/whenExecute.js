var when = require('a').when;
var c = {};

when(c)
.it('should return object with sql as function').assertEqual(c.safeSql, c.returned.sql)
.it('should return object with parameters as array').assertEqual(c.safeParameters, c.returned.parameters)
