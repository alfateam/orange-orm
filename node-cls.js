let fs = require('fs');
let inspect = require('util').inspect;
let ah = require('async_hooks');

let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);

if (major < 8)
    return;

let stack = {};
let cls = {};
cls._stack = stack;
cls.createContext = createContext;
cls.getContext = getContext;
cls.exitContext = exitContext;

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
            .then(() => {
                log('start context ' + ah.executionAsyncId());
                stack[ah.executionAsyncId()][ns] = c;
                return cb();
            })
    }

    function start() {
        if (major < 12)
            throw new Error("start() is not supported in nodejs < v12.0.0")
        return Promise.resolve(1).then(() => {
            stack[ah.executionAsyncId()][ns] = c;
        });
    }
}

function getAllContexts(asyncId, obj) {
    obj = obj || {};
    for (var ns in stack[asyncId]) {
        if (ns !== 'parent' && ns !== 'children' && ns !== 'id' && !obj[ns]) {
            obj[ns] = stack[asyncId][ns];
        }
    }
    if (stack[asyncId] && stack[asyncId].parent)
        getAllContexts(stack[asyncId].parent, obj);
    return obj;
}

function getContext(ns, asyncId, cur = []) {
    asyncId = asyncId || ah.executionAsyncId();
    let current = stack[asyncId];
    if (!current) {

        let out = [];
        for (var i in cur) {
            let id = cur[i];
            out.push(inspect(stack[id], false, 1));
        }
        throw new Error('Context \'' + ns + '\' not found ' + cur + ' ' + out.join(', '));
    }
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

let hook = ah.createHook({
    init,
    destroy
});
hook.enable();

function init(asyncId, type, triggerId) {
    let node = {};
    Object.defineProperty(node, 'id', {
        enumerable: false,
        value: asyncId
    });
    Object.defineProperty(node, 'parent', {
        enumerable: false,
        value: triggerId
    });
    Object.defineProperty(node, 'children', {
        enumerable: false,
        value: {}
    });
    stack[asyncId] = node;
    if (stack[triggerId]) {
        let contexts = getAllContexts(triggerId)
        stack[triggerId].children[asyncId] = node;
        for (let ns in contexts) {
            node[ns] = contexts[ns];
        }
    }
}

function log(str) {
    if (cls.debug)
        fs.writeSync(1, `${str}\n`);
}

function destroy(asyncId) {
    log('destroy ' + asyncId);
    if (stack[asyncId]) {
        let contexts = getAllContexts(asyncId)
        for(let childId in stack[asyncId].children) {
            let child = stack[asyncId].children[childId];
            for(let ns in contexts) {
                child[ns] = child[ns] || contexts[ns];
            }
        }
    }


    delete stack[asyncId];
}

cls.debug = false;

module.exports = cls;