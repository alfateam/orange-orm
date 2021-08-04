var when = require('a').when;
var c = {};

when(c).then(function(it) {
	it('should return rows').assertEqual(c.rows,c.returned);	
});