var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;

    c.transformer.push = c.mock();
    c.expectedObject1 = {
        a: 1,
        b: 2
    };
    c.expectedObject2 = {
        a: 11,
        b: 22
    };
    c.chunk = {
        result: JSON.stringify(c.expectedObject1)
    };
    c.chunk2 = {
        result: JSON.stringify(c.expectedObject2)
    };
    c.enc = {};
    c.cb = c.mock();
    c.cb.expect().repeat(2);

    c.transformer.push.expect(c.expectedObject1);
    c.transformer.push.expect(c.expectedObject2);

    c.transformer._transform(c.chunk, c.enc, c.cb);
    c.transformer._transform(c.chunk2, c.enc, c.cb);
}

module.exports = act;
