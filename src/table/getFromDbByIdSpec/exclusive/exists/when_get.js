var when = require('a').when;
var c = {};

when(c).then(function(it) {
	it('returns row').assertEqual(c.row, c.returned);
})