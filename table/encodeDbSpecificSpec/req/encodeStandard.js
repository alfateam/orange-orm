function act(c){
	c.value = {};
		
	c.getSessionSingleton.expect('encodeBoolean').return();
	c.returned = c.sut('Boolean', c.value)
}

module.exports = act;