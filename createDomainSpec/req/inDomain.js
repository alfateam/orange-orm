var a = require('a');

function act(c) {
    c.domain = {};
    c.Domain.active = c.domain;

    c.newDomain = {};
    c.Domain.create = c.mock();
    c.Domain.create.expect().return(c.newDomain);

    c.newBar = {};
    c.baz = {};

    c.domain.foo = {};
    c.domain.bar = {};
    c.domain.baz = {};

    c.negotiateForwardProperty.expect(c.domain, c.newDomain, 'foo');
    c.negotiateForwardProperty.expect(c.domain, c.newDomain, 'bar');
    c.negotiateForwardProperty.expect(c.domain, c.newDomain, 'baz');

    c.stubDomainExit();

    c.returned = c.sut();
}

module.exports = act;
