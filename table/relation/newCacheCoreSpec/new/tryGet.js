var parentRow = {};
function act(c){
	
	c.returned = c.sut.tryGet([1,2]);
}

module.exports = act;