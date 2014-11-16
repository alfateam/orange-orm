function act(c){
	c.releaseDbClient.expect();
	
	c.sut();
}

module.exports = act;