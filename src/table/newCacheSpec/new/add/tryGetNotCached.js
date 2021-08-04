var parentRow = {};

function act(c){
	c.returned = c.sut.tryGet([c.cachedValue, 'bar']);
}

module.exports = act;