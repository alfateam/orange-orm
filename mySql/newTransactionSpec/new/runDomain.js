function act(c) {

	c.pool.getConnection = c.mock();
	c.pool.getConnection.expectAnything().whenCalled(onGetConnection);

    c.raiseConnected = function() {};

	function onGetConnection(cb) {
		c.raiseConnected = cb;
	}

	c.onSuccess = c.mock();
	c.onError = c.mock();
    c.sut(c.onSuccess, c.onError);
}

module.exports = act;
