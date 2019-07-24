var EventEmitter = require('events');
let inspect = require('util').inspect;
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
}

let cls = {};
cls.createContext = createContext;
cls.getContext = getContext;

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

    async function run(cb) {
        return Promise.resolve(1).then(async () => {
            stack[ah.executionAsyncId()][ns] = c;
            let res = await cb();
            return res;
        });
    }

    function start() {
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

module.exports = cls;