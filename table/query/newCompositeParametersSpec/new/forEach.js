var callback = {};

function act(c) {
	c.collection.forEach = c.mock();
	c.collection.forEach.expect(callback).return();
	c.sut.forEach(callback);
}

act.base = '../new';
module.exports = act;