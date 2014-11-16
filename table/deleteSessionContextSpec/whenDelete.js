var when = require('a').when;
var c = {};

when(c)
.it('should should delete rdb property from domain').assertEqual(false, 'rdb' in process.domain)
