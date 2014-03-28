function act(c){
	
	c.id = {};
	c.newId.expect().return(c.id);
	c.returned = c.sut(undefined);
}

module.exports = act;