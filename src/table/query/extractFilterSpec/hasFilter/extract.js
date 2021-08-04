
function act(c){	
	c.filter  = {};
	c.returned = c.sut(c.filter);
}

module.exports = act;