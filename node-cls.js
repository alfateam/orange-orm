const fs = require('fs');
const log = (str) => fs.writeSync(1, `${str}\n`);


let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);

if (major < 8)
    return;

let ah = require('async_hooks');
let stack = {};
let hook = ah.createHook({
    init,
    destroy
});
hook.enable();
process.rdbstack = stack;

function init(asyncId, type, triggerId) {
    stack[asyncId] = {
        parent: triggerId
    };
}

function destroy(asyncId) {
    // delete stack[asyncId];
    // log('destroy ' + asyncId);
}

let cls = {};
cls._stack = stack;
cls.createContext = createContext;
cls.getContext = getContext;
cls.exitContext = exitContext;
process.cls = cls;

function createContext(ns) {
    let c = {};

    Object.defineProperty(c, 'run', {
        enumerable: false,
        writable: false,
        value: run
    });

    Object.defineProperty(c, 'start', {
        enumerable: false,
        writable: false,
        value: start
    });

    return c

    function run(cb) {
        return Promise.resolve(1)
            .then(() => stack[ah.executionAsyncId()][ns] = c)
            .then(cb);
    }

    function start() {
        if (major < 12)
            throw new Error("start() is not supported in nodejs < v12.0.0")
        return Promise.resolve(1).then(() => {
            stack[ah.executionAsyncId()][ns] = c;
        });
    }
}

function getContext(ns, asyncId, cur = []) {
    asyncId = asyncId || ah.executionAsyncId();
    let current = stack[asyncId];
    if (!current)
        throw new Error('Context \'' + ns + '\' not found ');
    if (current[ns])
        return current[ns];
    if (current.parent) {
        cur.push(current.parent);
        return getContext(ns, current.parent, cur);
    }
    throw new Error('Context \'' + ns + '\' not found');
}

function exitContext(ns, asyncId) {
    asyncId = asyncId || ah.executionAsyncId();
    let current = stack[asyncId];
    if (!current)
        throw new Error('Context \'' + ns + '\' not found ');
    if (current[ns])
        return delete current[ns];
    if (current.parent) {
        return exitContext(ns, current.parent);
    }
    throw new Error('Context \'' + ns + '\' not found');
}

module.exports = cls;