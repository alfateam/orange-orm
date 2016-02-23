function act(c){
	try {	
		c.returned = c.sut(c.query);
	} catch(e) {
		c.thrownMessage = e.message;
	}
}

act.base = '../object';
module.exports = act;