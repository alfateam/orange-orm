var newManyLeg;
var leg = {};
var sut;
function act(c){
	newManyLeg = c.newManyLeg;
	sut = c.sut;	
	newManyLeg.expect(sut).return(leg);
	c.leg = leg;
	c.returned = c.sut.toLeg();
}

act.base = '../new'
module.exports = act;