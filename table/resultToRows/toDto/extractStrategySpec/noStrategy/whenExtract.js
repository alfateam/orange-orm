var when = require('a').when;
var c = {};

when(c)
	.it('should include all hasOne and many relations recursively').assertDeepEqual(c.expected, c.returned)	
	;
