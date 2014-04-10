function act(c){
	c.returned = c.sut('ignore the args second time');
}

module.exports = act;