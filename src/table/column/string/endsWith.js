var endsWithCore = require('./endsWithCore');

module.exports = (context, ...rest) => endsWithCore.apply(null, [context, 'LIKE', ...rest]);
