var startsWithCore = require('./startsWithCore');

module.exports = (context, ...rest) => startsWithCore.apply(null, [context, 'ILIKE', ...rest]);