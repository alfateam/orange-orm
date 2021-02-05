var when = require('a').when;
var c = {};

when(c).then(it => {
	it('should both lock and unlock').assertDoesNotThrow(c.query.verify)
	it('should return result from function').assertEqual(c.expected, c.returned)
});