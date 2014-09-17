function act(c){
	c.onSuccess.expect();
	c.connection = {};
	c.release = {};
	c.connection.release = c.release;
	c.raiseConnected(null, c.connection, c.release);
}

module.exports = act;