var when = require('a').when;
var c = {};

when(c).then(it => {
	it('should both lock and unlock').assertDoesNotThrow(c.query.verify)
	it('should return error thrown by function').assertEqual(c.error, c.caughtError)
});