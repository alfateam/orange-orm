function act(c) {
    c.strategy = null;
    c.row = {};

    c.table = {};
    c.dto = {};
    c.createDto.expect(c.strategy, c.table, c.row).return(c.dto);

    c.dtoPromise = c.then();
    c.dtoPromise.resolve(c.dto);
    c.resultToPromise.expect(c.dto).return(c.dtoPromise);

    c.sut(c.strategy, c.table, c.row).then(onOk, console.log);

    function onOk(returned) {
    	c.returned = returned;
    }

}

module.exports = act;
