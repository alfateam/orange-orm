function act(c){		
	c.expected = {};
	c.setSessionSingleton.expect('changes', []).whenCalled(onSet);

	function onSet(_,changeSet) {
		c.changeSet = changeSet;
	}
	c.changeSet = {};

	c.executeQuery.expect(c.beginCommand).return(c.expected);

	c.returned = c.sut();
}


module.exports = act;