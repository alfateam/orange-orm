var expected = {};

function act(c) {
	c.resultPromise.then.expectAnything().whenCalled(onResult);

	function onResult(cb) {
		try {
			cb(null);	
		}
		catch (e)
		{
			c.thrownMsg = e.message;

		}
		
	}	
	c.get();
}

module.exports = act;