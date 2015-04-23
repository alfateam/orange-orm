var requireMock = require('a').requireMock;

function toPromise(c) {
	c.result = {};

	require('../resultToPromise')(c.result).then(onResult);

	function onResult(returned) {
		c.returned = returned;
	}

}

module.exports = toPromise;