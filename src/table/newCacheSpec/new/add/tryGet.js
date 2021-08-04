var parentRow = {};

function act(c){
	c.returned = c.sut.tryGet([c.cachedValue, c.cachedValue2]);
}
module.exports = act;