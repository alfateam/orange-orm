function act(c) {
	c.pool.connect = c.mock();
    c.pool.connect.expectAnything().whenCalled(onConnect);
    c.raiseConnected = function() {};

    function onConnect(cb) {
        c.raiseConnected = cb;
    }

	c.onSuccess = c.mock();
	c.onError = c.mock();
    c.sut(c.onSuccess, c.onError);
}

module.exports = act;
