function act(c){		
	c.emptyPromise = {};
	c.newPromise.expect().return(c.emptyPromise);

	c.returned = c.sut([]);
}


module.exports = act;