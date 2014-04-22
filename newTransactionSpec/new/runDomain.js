
function act(c){	
	
	c.pg.connect.expect(c.connectionString).expectAnything().whenCalled(onConnect);
	c.raiseConnected = function() {};

	function onConnect(cb) {
		c.raiseConnected = cb;
	}

	c.begin.expect();

	c.run();
}

module.exports = act;