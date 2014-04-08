var parentRow = {};
function act(c){
	
	c.returned = c.sut.tryRemove([1,2]);
}

module.exports = act;