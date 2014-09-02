var mock = require('a').mock;
var requireMock = require('a').requireMock;

function act(c) {
    c.row = {};

    c.extractDto.expect(c.strategy, c.table, c.initialDto).return(c.dto);

    c.nullPromise = c.then();
    c.nullPromise.resolve();
    c.resultToPromise.expect(null).return(c.nullPromise);

    stubTable();

    function stubTable() {
        c.customerRelation = {};
        c.linesRelation = {};
        c.barRelation = {};
        c.relations = {
            customer: c.customerRelation,
            lines: c.linesRelation,
            bar: c.barRelation
        };
        c.table._relations = c.relations

        c.customerRelation.accept = mock();
        c.customerRelation.accept.expectAnything().whenCalled(onCustomer);

        function onCustomer(visitor) {
            visitor.visitJoin(c.customerRelation);
        }

        c.barRelation.accept = mock();
        c.barRelation.accept.expectAnything().whenCalled(onBar);

        function onBar(visitor) {
            visitor.visitOne(c.barRelation);
        }

        c.linesRelation.accept = mock();
        c.linesRelation.accept.expectAnything().whenCalled(onlines);

        function onlines(visitor) {
            visitor.visitMany(c.linesRelation);
        }
    }

    stubRelated();

    function stubRelated() {
        c.lines = {};
        c.row.lines = c.lines;
        c.lines.then = mock();        
        c.linesToDto = {};          
        c.newManyRelatedToDto.expect("lines", c.linesRelation, c.strategy, c.dto).return (c.linesToDto);
        c.linesMapper = c.then();
        c.linesMapper.resolve();
        c.lines.then.expect(c.linesToDto).return(c.linesMapper);

        c.customer = {};
        c.row.customer = c.customer;
        c.customer.then = mock();
        c.customerToDto = {};
        c.newSingleRelatedToDto.expect("customer", c.customerRelation, c.strategy, c.dto).return (c.customerToDto);
        c.customerMapper = c.then();
        c.customerMapper.resolve();
        c.customer.then.expect(c.customerToDto).return (c.customerMapper);

        c.bar = {};
        c.row.bar = c.bar;
        c.bar.then = mock();
        c.barToDto = {};
        c.newSingleRelatedToDto.expect("bar", c.barRelation, c.strategy, c.dto).return (c.barToDto);
        c.barMapper = c.then();
        c.barMapper.resolve();
        c.bar.then.expect(c.barToDto).return (c.barMapper);
    }

    c.mapFields.expect(c.strategy, c.table, c.row, c.dto);

    c.sut(c.row).then(function(dto){
        c.returned = dto;
    });
}

module.exports = act;