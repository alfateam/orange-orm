function act(c){
	c.releaseDbClient.expect().throw('error');
	
	c.sut();
}

module.exports = act;