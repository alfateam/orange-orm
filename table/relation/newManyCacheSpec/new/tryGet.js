var parentRow = {};
function act(c){
	
	c.returned = c.sut.tryGet(parentRow);
}

module.exports = act;