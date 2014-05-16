var expected = {};

function act(c) {
	c.expected = expected;
	c.row = {};
	c.resultPromise.then.expectAnything().whenCalled(onResult).return(c.expected);

	function onResult(cb) {
		c.returned = cb(c.row);
	}	
	c.get();
}

module.exports = act;