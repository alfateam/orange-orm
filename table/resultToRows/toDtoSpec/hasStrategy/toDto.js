function act(c) {
    c.strategy = {
        foo: {},
        bar: {},
        baz: {},
        orderBy: ['foo']
    };

    c.table = {};
    c.dto = {};
    c.row = {};
    c.createDto.expect(c.strategy, c.table, c.row).return(c.dto);

    c.dtoPromise = c.then();
    c.dtoPromise.resolve(c.dto);
    c.resultToPromise.expect(c.dto).return(c.dtoPromise);


    c.foo = {};
    c.row.foo = c.then();
    c.row.foo.resolve(c.foo);    

    c.fooDto = {};
    c.foo.toDto = c.mock();
    c.fooDtoPromise = c.then();
    c.fooDtoPromise.resolve(c.fooDto);
    c.foo.toDto.expect(c.strategy.foo).return(c.fooDtoPromise)

    c.bar = {};
    c.row.bar = c.then();
    c.row.bar.resolve(c.bar);    

    c.barDto = {};
    c.bar.toDto = c.mock();
    c.barDtoPromise = c.then();
    c.barDtoPromise.resolve(c.barDto);
    c.bar.toDto.expect(c.strategy.bar).return(c.barDtoPromise)

    c.baz = {};
    c.row.baz = c.then();
    c.row.baz.resolve(null);    

    c.sut(c.strategy, c.table, c.row).then(onOk, onError);

    function onOk(returned) {
        c.returned = returned;
    }

    function onError(e) {
        console.log(e.stack);
    }

}

module.exports = act;
