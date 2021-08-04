var relation = {};

function act(c){	
	c.returned = c.sut([relation]);
}

module.exports = act;