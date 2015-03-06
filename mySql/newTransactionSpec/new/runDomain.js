function act(c) {

	c.pool.connect = c.mock();
	c.pool.connect.expectAnything().whenCalled(onConnected);

    c.raiseConnected = function() {};

	function onConnected(cb) {
		c.raiseConnected = cb;
	}

	c.onSuccess = c.mock();
	c.onError = c.mock();
    c.sut(c.onSuccess, c.onError);
}

module.exports = act;
