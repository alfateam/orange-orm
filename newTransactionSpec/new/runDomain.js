function act(c) {

    c.pg.connect.expect(c.connectionString).expectAnything().whenCalled(onConnect);
    c.raiseConnected = function() {};

    function onConnect(_, cb) {
        c.raiseConnected = cb;
    }

    c.begin.expect();

	c.onSuccess = c.mock();
	c.onError = c.mock();
    c.sut(c.onSuccess, c.onError);
    c.run();
}

module.exports = act;
