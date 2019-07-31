let fs = require('fs');
let inspect = require('util').inspect;
let ah = require('async_hooks');

let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);

if (major < 8)
    return;

let stack = {};
let cls = function(ns) {
    if (arguments.length === 0)
        throw new Error("Missing namespace");

    let wrapper = {
        run: (fn) => {
            let c = cls.createContext(ns);
            return c.run(fn);
        }
    };
    return wrapper;
};

cls._stack = stack;
cls.createContext = createContext;
cls.getContext = getContext;
cls.exitContext = exitContext;
cls.debug = false;
cls.printStack = function() {
    log(inspect(stack, true, 3));
}

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
                stack[ah.executionAsyncId()].contexts[ns] = c;
                return cb();
            })
    }

    function start() {
        if (major < 12)
            throw new Error("start() is not supported in nodejs < v12.0.0")
        return Promise.resolve(1).then(() => {
            stack[ah.executionAsyncId()].contexts[ns] = c;
        });
    }
}

function getAllContexts(asyncId, obj) {
    obj = obj || {};
    if (!stack[asyncId])
        return;
    for (var ns in stack[asyncId].contexts) {
        if (!obj[ns]) {
            obj[ns] = stack[asyncId].contexts[ns];
        }
    }
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
    if (current.contexts[ns])
        return current.contexts[ns];
    if (current.parent) {
        cur.push(current.parent);
        return getContext(ns, current.parent, cur);
    }
    throw new Error('Context \'' + ns + '\' not found');
}

function exitContext(ns) {
    log('exit Context')
    let asyncId = ah.executionAsyncId();
    let context = getContext(ns);
    let node = stack[asyncId];
    if (node && node.contexts[ns] === context)
        delete node.contexts[ns];
    exitContextUp(context, ns, asyncId);
}

function exitContextUp(context, ns, asyncId) {
    if (!stack[asyncId])
        return;
    log('exit ' + asyncId);
    let parentId = stack[asyncId].parent;
    let parent = stack[parentId];
    if (parent) {
        if (parent.contexts[ns] === context)
            delete parent.contexts[ns];
        else if (parent.contexts[ns])
            return;
        exitContextUp(context, ns, parentId);
    }
}

let hook = ah.createHook({
    init,
    destroy
});
hook.enable();

function init(asyncId, type, triggerId) {
    let node = {
        contexts: {}
    };
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
        stack[triggerId].children[asyncId] = node;
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
                child.contexts[ns] = child.contexts[ns] || contexts[ns];
            }
        }
    }

    delete stack[asyncId];
}

module.exports = cls;