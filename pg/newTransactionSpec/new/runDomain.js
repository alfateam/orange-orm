function act(c) {

    c.pg.connect.expect(c.connectionString).expectAnything().whenCalled(onConnect);
    c.raiseConnected = function() {};

    function onConnect(_, cb) {
        c.raiseConnected = cb;
    }

	c.onSuccess = c.mock();
	c.onError = c.mock();
    c.sut(c.onSuccess, c.onError);
}

module.exports = act;
