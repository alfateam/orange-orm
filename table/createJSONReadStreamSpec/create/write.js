var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.expectRequire = a.expectRequire;
    c.then = a.then;

    c.transformer.push = c.mock();
    c.chunk = {
        result: {
            a: 1,
            b: 2
        }
    };
    c.chunk2 = {
        result: {
            foo: 11,
            bar: 22
        }
    };
    c.enc = {};
    c.cb = c.mock();
    c.cb.expect().repeat(3);

    c.transformer.push.expect('[');
    c.transformer.push.expect(c.chunk.result);
    c.transformer.push.expect(',' + c.chunk2.result);
    c.transformer.push.expect(']');

    c.transformer._transform(c.chunk, c.enc, c.cb);
    c.transformer._transform(c.chunk2, c.enc, c.cb);
    c.transformer._flush(c.cb);
}

module.exports = act;
