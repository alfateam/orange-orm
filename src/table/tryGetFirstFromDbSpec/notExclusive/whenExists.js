var when = require('a').when;
var c  = {};

when(c).then(function(it) {
	it('returns first row').assertEqual(c.row1,c.returned);	
});