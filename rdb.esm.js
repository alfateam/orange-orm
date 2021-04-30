(() => {
  var __commonJS = (cb, mod) => () => (mod || cb((mod = {exports: {}}).exports, mod), mod.exports);

  // (disabled):pg/newDatabase
  var require_newDatabase = __commonJS(() => {
  });

  // (disabled):hostExpress
  var require_hostExpress = __commonJS(() => {
  });

  // flags.js
  var require_flags = __commonJS((exports, module) => {
    var flags = {
      useProxy: true
    };
    module.exports = flags;
  });

  // (disabled):mySql/newDatabase
  var require_newDatabase2 = __commonJS(() => {
  });

  // http/newDatabase.js
  var require_newDatabase3 = __commonJS((exports, module) => {
    var flags = require_flags();
    function newDatabase(connectionString) {
      flags.url = connectionString;
      let c = {};
      return c;
    }
    module.exports = newDatabase;
  });

  // table/query/extractSql.js
  var require_extractSql = __commonJS((exports, module) => {
    function extract(sql) {
      if (sql)
        return sql;
      return "";
    }
    module.exports = extract;
  });

  // table/query/parameterized/extractParameters.js
  var require_extractParameters = __commonJS((exports, module) => {
    function extract(parameters) {
      if (parameters) {
        return parameters.slice(0);
      }
      return [];
    }
    module.exports = extract;
  });

  // table/query/newParameterized.js
  var require_newParameterized = __commonJS((exports, module) => {
    var extractSql = require_extractSql();
    var extractParameters = require_extractParameters();
    var nextParameterized = function(text, params) {
      nextParameterized = require_newParameterized();
      return nextParameterized(text, params);
    };
    function Parameterized(text, parameters) {
      this._text = text;
      this.parameters = parameters;
    }
    Parameterized.prototype.sql = function() {
      return this._text;
    };
    Parameterized.prototype.prepend = function(other) {
      if (other.sql) {
        var params = other.parameters.concat(this.parameters);
        return nextParameterized(other.sql() + this._text, params);
      } else
        return nextParameterized(other + this._text, this.parameters);
    };
    Parameterized.prototype.append = function(other) {
      if (other.sql) {
        var params = this.parameters.concat(other.parameters);
        return nextParameterized(this._text + other.sql(), params);
      } else
        return nextParameterized(this._text + other, this.parameters);
    };
    module.exports = function(text, parameters) {
      text = extractSql(text);
      parameters = extractParameters(parameters);
      return new Parameterized(text, parameters);
    };
  });

  // table/column/negotiateRawSqlFilter.js
  var require_negotiateRawSqlFilter = __commonJS((exports, module) => {
    var newParameterized = function() {
      newParameterized = require_newParameterized();
      return newParameterized.apply(null, arguments);
    };
    var newBoolean = function() {
      newBoolean = require_newBoolean();
      return newBoolean.apply(null, arguments);
    };
    function negotiateRawSqlFilter(filter) {
      var params = [];
      if (filter) {
        if (filter.and)
          return filter;
        if (filter.sql) {
          var sql = filter.sql;
          if (typeof filter.sql === "function") {
            sql = filter.sql();
          }
          params.push(sql, filter.parameters);
        } else
          params = [filter];
      } else {
        params = [filter];
      }
      var parameterized = newParameterized.apply(null, params);
      return newBoolean(parameterized);
    }
    module.exports = negotiateRawSqlFilter;
  });

  // table/column/negotiateNextAndFilter.js
  var require_negotiateNextAndFilter = __commonJS((exports, module) => {
    function negotiateNextAndFilter(filter, other) {
      if (!other.sql())
        return filter;
      return filter.append(" AND ").append(other);
    }
    module.exports = negotiateNextAndFilter;
  });

  // table/column/negotiateNextOrFilter.js
  var require_negotiateNextOrFilter = __commonJS((exports, module) => {
    function negotiateNextOrFilter(filter, other) {
      if (!other.sql())
        return filter;
      return filter.prepend("(").append(" OR ").append(other).append(")");
    }
    module.exports = negotiateNextOrFilter;
  });

  // table/column/newBoolean.js
  var require_newBoolean = __commonJS((exports, module) => {
    var nextNewBoolean = _nextNewBoolean;
    var negotiateRawSqlFilter = require_negotiateRawSqlFilter();
    var negotiateNextAndFilter = require_negotiateNextAndFilter();
    var negotiateNextOrFilter = require_negotiateNextOrFilter();
    function newBoolean(filter) {
      var c = {};
      c.sql = filter.sql.bind(filter);
      c.parameters = filter.parameters;
      c.append = function(other) {
        var nextFilter = filter.append(other);
        return nextNewBoolean(nextFilter);
      };
      c.prepend = function(other) {
        var nextFilter = filter.prepend(other);
        return nextNewBoolean(nextFilter);
      };
      c.and = function(other) {
        other = negotiateRawSqlFilter(other);
        var nextFilter = negotiateNextAndFilter(filter, other);
        var next = nextNewBoolean(nextFilter);
        for (var i = 1; i < arguments.length; i++) {
          next = next.and(arguments[i]);
        }
        return next;
      };
      c.or = function(other) {
        other = negotiateRawSqlFilter(other);
        var nextFilter = negotiateNextOrFilter(filter, other);
        var next = nextNewBoolean(nextFilter);
        for (var i = 1; i < arguments.length; i++) {
          next = next.or(arguments[i]);
        }
        return next;
      };
      c.not = function() {
        var nextFilter = filter.prepend("NOT (").append(")");
        return nextNewBoolean(nextFilter);
      };
      return c;
    }
    function _nextNewBoolean(filter) {
      nextNewBoolean = require_newBoolean();
      return nextNewBoolean(filter);
    }
    module.exports = newBoolean;
  });

  // table/column/encodeFilterArg.js
  var require_encodeFilterArg = __commonJS((exports, module) => {
    function encodeFilterArg(column, arg) {
      if (column.encode.safe)
        return column.encode.safe(arg);
      else
        return column.encode(arg);
    }
    module.exports = encodeFilterArg;
  });

  // table/column/equal.js
  var require_equal = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var nullOperator = " is ";
    var encodeFilterArg = require_encodeFilterArg();
    function equal(column, arg, alias) {
      var operator = "=";
      var encoded = encodeFilterArg(column, arg);
      if (encoded.sql() == "null")
        operator = nullOperator;
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = equal;
  });

  // table/column/notEqual.js
  var require_notEqual = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var encodeFilterArg = require_encodeFilterArg();
    var nullOperator = " is not ";
    function notEqual(column, arg, alias) {
      var operator = "<>";
      var encoded = encodeFilterArg(column, arg);
      if (encoded.sql() == "null")
        operator = nullOperator;
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = notEqual;
  });

  // table/column/lessThan.js
  var require_lessThan = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var encodeFilterArg = require_encodeFilterArg();
    function lessThanOrEqual(column, arg, alias) {
      var operator = "<";
      var encoded = encodeFilterArg(column, arg);
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = lessThanOrEqual;
  });

  // table/column/lessThanOrEqual.js
  var require_lessThanOrEqual = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var encodeFilterArg = require_encodeFilterArg();
    function lessThanOrEqual(column, arg, alias) {
      var operator = "<=";
      var encoded = encodeFilterArg(column, arg);
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = lessThanOrEqual;
  });

  // table/column/greaterThan.js
  var require_greaterThan = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var encodeFilterArg = require_encodeFilterArg();
    function greaterThan(column, arg, alias) {
      var operator = ">";
      var encoded = encodeFilterArg(column, arg);
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = greaterThan;
  });

  // table/column/greaterThanOrEqual.js
  var require_greaterThanOrEqual = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var encodeFilterArg = require_encodeFilterArg();
    function greaterThanOrEqual(column, arg, alias) {
      var operator = ">=";
      var encoded = encodeFilterArg(column, arg);
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = greaterThanOrEqual;
  });

  // table/column/in.js
  var require_in = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    var newBoolean = require_newBoolean();
    var encodeFilterArg = require_encodeFilterArg();
    function _in(column, values, alias) {
      var filter;
      if (values.length === 0) {
        filter = newParameterized("1=2");
        return newBoolean(filter);
      }
      var firstPart = alias + "." + column._dbName + " in ";
      var parameterized = newParameterized(firstPart);
      var separator = "(";
      for (var i = 0; i < values.length; i++) {
        var encoded = encodeFilterArg(column, values[i]);
        parameterized = parameterized.append(separator).append(encoded);
        separator = ",";
      }
      filter = parameterized.append(")");
      return newBoolean(filter);
    }
    module.exports = _in;
  });

  // table/column/extractAlias.js
  var require_extractAlias = __commonJS((exports, module) => {
    function extract(table, optionalAlias) {
      if (optionalAlias)
        return optionalAlias;
      return table._dbName;
    }
    module.exports = extract;
  });

  // table/column/newColumn.js
  var require_newColumn = __commonJS((exports, module) => {
    var equal = require_equal();
    var notEqual = require_notEqual();
    var lessThan = require_lessThan();
    var lessThanOrEqual = require_lessThanOrEqual();
    var greaterThan = require_greaterThan();
    var greaterThanOrEqual = require_greaterThanOrEqual();
    var _in = require_in();
    var _extractAlias = require_extractAlias();
    module.exports = function(table, name) {
      var c = {};
      var extractAlias = _extractAlias.bind(null, table);
      c._dbName = name;
      c.alias = name;
      c.dbNull = null;
      table._columns.push(c);
      table[name] = c;
      c.equal = function(arg, alias) {
        alias = extractAlias(alias);
        return equal(c, arg, alias);
      };
      c.notEqual = function(arg, alias) {
        alias = extractAlias(alias);
        return notEqual(c, arg, alias);
      };
      c.lessThan = function(arg, alias) {
        alias = extractAlias(alias);
        return lessThan(c, arg, alias);
      };
      c.lessThanOrEqual = function(arg, alias) {
        alias = extractAlias(alias);
        return lessThanOrEqual(c, arg, alias);
      };
      c.greaterThan = function(arg, alias) {
        alias = extractAlias(alias);
        return greaterThan(c, arg, alias);
      };
      c.greaterThanOrEqual = function(arg, alias) {
        alias = extractAlias(alias);
        return greaterThanOrEqual(c, arg, alias);
      };
      c.between = function(from, to, alias) {
        alias = extractAlias(alias);
        from = c.greaterThanOrEqual(from, alias);
        to = c.lessThanOrEqual(to, alias);
        return from.and(to);
      };
      c.in = function(arg, alias) {
        alias = extractAlias(alias);
        return _in(c, arg, alias);
      };
      c.eq = c.equal;
      c.EQ = c.eq;
      c.ne = c.notEqual;
      c.NE = c.ne;
      c.gt = c.greaterThan;
      c.GT = c.gt;
      c.ge = c.greaterThanOrEqual;
      c.GE = c.ge;
      c.lt = c.lessThan;
      c.LT = c.lt;
      c.le = c.lessThanOrEqual;
      c.LE = c.le;
      return c;
    };
  });

  // node_modules/uri-js/dist/es5/uri.all.js
  var require_uri_all = __commonJS((exports, module) => {
    /** @license URI.js v4.4.1 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
    (function(global2, factory) {
      typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : factory(global2.URI = global2.URI || {});
    })(exports, function(exports2) {
      "use strict";
      function merge() {
        for (var _len = arguments.length, sets = Array(_len), _key = 0; _key < _len; _key++) {
          sets[_key] = arguments[_key];
        }
        if (sets.length > 1) {
          sets[0] = sets[0].slice(0, -1);
          var xl = sets.length - 1;
          for (var x = 1; x < xl; ++x) {
            sets[x] = sets[x].slice(1, -1);
          }
          sets[xl] = sets[xl].slice(1);
          return sets.join("");
        } else {
          return sets[0];
        }
      }
      function subexp(str) {
        return "(?:" + str + ")";
      }
      function typeOf(o) {
        return o === void 0 ? "undefined" : o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase();
      }
      function toUpperCase(str) {
        return str.toUpperCase();
      }
      function toArray(obj) {
        return obj !== void 0 && obj !== null ? obj instanceof Array ? obj : typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj) : [];
      }
      function assign(target, source) {
        var obj = target;
        if (source) {
          for (var key in source) {
            obj[key] = source[key];
          }
        }
        return obj;
      }
      function buildExps(isIRI2) {
        var ALPHA$$ = "[A-Za-z]", CR$ = "[\\x0D]", DIGIT$$ = "[0-9]", DQUOTE$$ = "[\\x22]", HEXDIG$$2 = merge(DIGIT$$, "[A-Fa-f]"), LF$$ = "[\\x0A]", SP$$ = "[\\x20]", PCT_ENCODED$2 = subexp(subexp("%[EFef]" + HEXDIG$$2 + "%" + HEXDIG$$2 + HEXDIG$$2 + "%" + HEXDIG$$2 + HEXDIG$$2) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$2 + "%" + HEXDIG$$2 + HEXDIG$$2) + "|" + subexp("%" + HEXDIG$$2 + HEXDIG$$2)), GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]", SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]", RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$), UCSCHAR$$ = isIRI2 ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]", IPRIVATE$$ = isIRI2 ? "[\\uE000-\\uF8FF]" : "[]", UNRESERVED$$2 = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$), SCHEME$ = subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"), USERINFO$ = subexp(subexp(PCT_ENCODED$2 + "|" + merge(UNRESERVED$$2, SUB_DELIMS$$, "[\\:]")) + "*"), DEC_OCTET$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("[1-9]" + DIGIT$$) + "|" + DIGIT$$), DEC_OCTET_RELAXED$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("0?[1-9]" + DIGIT$$) + "|0?0?" + DIGIT$$), IPV4ADDRESS$ = subexp(DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$), H16$ = subexp(HEXDIG$$2 + "{1,4}"), LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$), IPV6ADDRESS1$ = subexp(subexp(H16$ + "\\:") + "{6}" + LS32$), IPV6ADDRESS2$ = subexp("\\:\\:" + subexp(H16$ + "\\:") + "{5}" + LS32$), IPV6ADDRESS3$ = subexp(subexp(H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{4}" + LS32$), IPV6ADDRESS4$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,1}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{3}" + LS32$), IPV6ADDRESS5$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,2}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{2}" + LS32$), IPV6ADDRESS6$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,3}" + H16$) + "?\\:\\:" + H16$ + "\\:" + LS32$), IPV6ADDRESS7$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,4}" + H16$) + "?\\:\\:" + LS32$), IPV6ADDRESS8$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,5}" + H16$) + "?\\:\\:" + H16$), IPV6ADDRESS9$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,6}" + H16$) + "?\\:\\:"), IPV6ADDRESS$ = subexp([IPV6ADDRESS1$, IPV6ADDRESS2$, IPV6ADDRESS3$, IPV6ADDRESS4$, IPV6ADDRESS5$, IPV6ADDRESS6$, IPV6ADDRESS7$, IPV6ADDRESS8$, IPV6ADDRESS9$].join("|")), ZONEID$ = subexp(subexp(UNRESERVED$$2 + "|" + PCT_ENCODED$2) + "+"), IPV6ADDRZ$ = subexp(IPV6ADDRESS$ + "\\%25" + ZONEID$), IPV6ADDRZ_RELAXED$ = subexp(IPV6ADDRESS$ + subexp("\\%25|\\%(?!" + HEXDIG$$2 + "{2})") + ZONEID$), IPVFUTURE$ = subexp("[vV]" + HEXDIG$$2 + "+\\." + merge(UNRESERVED$$2, SUB_DELIMS$$, "[\\:]") + "+"), IP_LITERAL$ = subexp("\\[" + subexp(IPV6ADDRZ_RELAXED$ + "|" + IPV6ADDRESS$ + "|" + IPVFUTURE$) + "\\]"), REG_NAME$ = subexp(subexp(PCT_ENCODED$2 + "|" + merge(UNRESERVED$$2, SUB_DELIMS$$)) + "*"), HOST$ = subexp(IP_LITERAL$ + "|" + IPV4ADDRESS$ + "(?!" + REG_NAME$ + ")|" + REG_NAME$), PORT$ = subexp(DIGIT$$ + "*"), AUTHORITY$ = subexp(subexp(USERINFO$ + "@") + "?" + HOST$ + subexp("\\:" + PORT$) + "?"), PCHAR$ = subexp(PCT_ENCODED$2 + "|" + merge(UNRESERVED$$2, SUB_DELIMS$$, "[\\:\\@]")), SEGMENT$ = subexp(PCHAR$ + "*"), SEGMENT_NZ$ = subexp(PCHAR$ + "+"), SEGMENT_NZ_NC$ = subexp(subexp(PCT_ENCODED$2 + "|" + merge(UNRESERVED$$2, SUB_DELIMS$$, "[\\@]")) + "+"), PATH_ABEMPTY$ = subexp(subexp("\\/" + SEGMENT$) + "*"), PATH_ABSOLUTE$ = subexp("\\/" + subexp(SEGMENT_NZ$ + PATH_ABEMPTY$) + "?"), PATH_NOSCHEME$ = subexp(SEGMENT_NZ_NC$ + PATH_ABEMPTY$), PATH_ROOTLESS$ = subexp(SEGMENT_NZ$ + PATH_ABEMPTY$), PATH_EMPTY$ = "(?!" + PCHAR$ + ")", PATH$ = subexp(PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$), QUERY$ = subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*"), FRAGMENT$ = subexp(subexp(PCHAR$ + "|[\\/\\?]") + "*"), HIER_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$), URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"), RELATIVE_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$), RELATIVE$ = subexp(RELATIVE_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"), URI_REFERENCE$ = subexp(URI$ + "|" + RELATIVE$), ABSOLUTE_URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?"), GENERIC_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", RELATIVE_REF$ = "^(){0}" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", ABSOLUTE_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?$", SAMEDOC_REF$ = "^" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", AUTHORITY_REF$ = "^" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?$";
        return {
          NOT_SCHEME: new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
          NOT_USERINFO: new RegExp(merge("[^\\%\\:]", UNRESERVED$$2, SUB_DELIMS$$), "g"),
          NOT_HOST: new RegExp(merge("[^\\%\\[\\]\\:]", UNRESERVED$$2, SUB_DELIMS$$), "g"),
          NOT_PATH: new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$2, SUB_DELIMS$$), "g"),
          NOT_PATH_NOSCHEME: new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$2, SUB_DELIMS$$), "g"),
          NOT_QUERY: new RegExp(merge("[^\\%]", UNRESERVED$$2, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
          NOT_FRAGMENT: new RegExp(merge("[^\\%]", UNRESERVED$$2, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
          ESCAPE: new RegExp(merge("[^]", UNRESERVED$$2, SUB_DELIMS$$), "g"),
          UNRESERVED: new RegExp(UNRESERVED$$2, "g"),
          OTHER_CHARS: new RegExp(merge("[^\\%]", UNRESERVED$$2, RESERVED$$), "g"),
          PCT_ENCODED: new RegExp(PCT_ENCODED$2, "g"),
          IPV4ADDRESS: new RegExp("^(" + IPV4ADDRESS$ + ")$"),
          IPV6ADDRESS: new RegExp("^\\[?(" + IPV6ADDRESS$ + ")" + subexp(subexp("\\%25|\\%(?!" + HEXDIG$$2 + "{2})") + "(" + ZONEID$ + ")") + "?\\]?$")
        };
      }
      var URI_PROTOCOL = buildExps(false);
      var IRI_PROTOCOL = buildExps(true);
      var slicedToArray = function() {
        function sliceIterator(arr, i) {
          var _arr = [];
          var _n = true;
          var _d = false;
          var _e = void 0;
          try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);
              if (i && _arr.length === i)
                break;
            }
          } catch (err) {
            _d = true;
            _e = err;
          } finally {
            try {
              if (!_n && _i["return"])
                _i["return"]();
            } finally {
              if (_d)
                throw _e;
            }
          }
          return _arr;
        }
        return function(arr, i) {
          if (Array.isArray(arr)) {
            return arr;
          } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
          } else {
            throw new TypeError("Invalid attempt to destructure non-iterable instance");
          }
        };
      }();
      var toConsumableArray = function(arr) {
        if (Array.isArray(arr)) {
          for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++)
            arr2[i] = arr[i];
          return arr2;
        } else {
          return Array.from(arr);
        }
      };
      var maxInt = 2147483647;
      var base = 36;
      var tMin = 1;
      var tMax = 26;
      var skew = 38;
      var damp = 700;
      var initialBias = 72;
      var initialN = 128;
      var delimiter = "-";
      var regexPunycode = /^xn--/;
      var regexNonASCII = /[^\0-\x7E]/;
      var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
      var errors = {
        overflow: "Overflow: input needs wider integers to process",
        "not-basic": "Illegal input >= 0x80 (not a basic code point)",
        "invalid-input": "Invalid input"
      };
      var baseMinusTMin = base - tMin;
      var floor = Math.floor;
      var stringFromCharCode = String.fromCharCode;
      function error$1(type) {
        throw new RangeError(errors[type]);
      }
      function map(array, fn) {
        var result = [];
        var length = array.length;
        while (length--) {
          result[length] = fn(array[length]);
        }
        return result;
      }
      function mapDomain(string, fn) {
        var parts = string.split("@");
        var result = "";
        if (parts.length > 1) {
          result = parts[0] + "@";
          string = parts[1];
        }
        string = string.replace(regexSeparators, ".");
        var labels = string.split(".");
        var encoded = map(labels, fn).join(".");
        return result + encoded;
      }
      function ucs2decode(string) {
        var output = [];
        var counter = 0;
        var length = string.length;
        while (counter < length) {
          var value = string.charCodeAt(counter++);
          if (value >= 55296 && value <= 56319 && counter < length) {
            var extra = string.charCodeAt(counter++);
            if ((extra & 64512) == 56320) {
              output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
            } else {
              output.push(value);
              counter--;
            }
          } else {
            output.push(value);
          }
        }
        return output;
      }
      var ucs2encode = function ucs2encode2(array) {
        return String.fromCodePoint.apply(String, toConsumableArray(array));
      };
      var basicToDigit = function basicToDigit2(codePoint) {
        if (codePoint - 48 < 10) {
          return codePoint - 22;
        }
        if (codePoint - 65 < 26) {
          return codePoint - 65;
        }
        if (codePoint - 97 < 26) {
          return codePoint - 97;
        }
        return base;
      };
      var digitToBasic = function digitToBasic2(digit, flag) {
        return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
      };
      var adapt = function adapt2(delta, numPoints, firstTime) {
        var k = 0;
        delta = firstTime ? floor(delta / damp) : delta >> 1;
        delta += floor(delta / numPoints);
        for (; delta > baseMinusTMin * tMax >> 1; k += base) {
          delta = floor(delta / baseMinusTMin);
        }
        return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
      };
      var decode = function decode2(input) {
        var output = [];
        var inputLength = input.length;
        var i = 0;
        var n = initialN;
        var bias = initialBias;
        var basic = input.lastIndexOf(delimiter);
        if (basic < 0) {
          basic = 0;
        }
        for (var j = 0; j < basic; ++j) {
          if (input.charCodeAt(j) >= 128) {
            error$1("not-basic");
          }
          output.push(input.charCodeAt(j));
        }
        for (var index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
          var oldi = i;
          for (var w = 1, k = base; ; k += base) {
            if (index >= inputLength) {
              error$1("invalid-input");
            }
            var digit = basicToDigit(input.charCodeAt(index++));
            if (digit >= base || digit > floor((maxInt - i) / w)) {
              error$1("overflow");
            }
            i += digit * w;
            var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (digit < t) {
              break;
            }
            var baseMinusT = base - t;
            if (w > floor(maxInt / baseMinusT)) {
              error$1("overflow");
            }
            w *= baseMinusT;
          }
          var out = output.length + 1;
          bias = adapt(i - oldi, out, oldi == 0);
          if (floor(i / out) > maxInt - n) {
            error$1("overflow");
          }
          n += floor(i / out);
          i %= out;
          output.splice(i++, 0, n);
        }
        return String.fromCodePoint.apply(String, output);
      };
      var encode = function encode2(input) {
        var output = [];
        input = ucs2decode(input);
        var inputLength = input.length;
        var n = initialN;
        var delta = 0;
        var bias = initialBias;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = void 0;
        try {
          for (var _iterator = input[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _currentValue2 = _step.value;
            if (_currentValue2 < 128) {
              output.push(stringFromCharCode(_currentValue2));
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
        var basicLength = output.length;
        var handledCPCount = basicLength;
        if (basicLength) {
          output.push(delimiter);
        }
        while (handledCPCount < inputLength) {
          var m = maxInt;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = void 0;
          try {
            for (var _iterator2 = input[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var currentValue = _step2.value;
              if (currentValue >= n && currentValue < m) {
                m = currentValue;
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
          var handledCPCountPlusOne = handledCPCount + 1;
          if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
            error$1("overflow");
          }
          delta += (m - n) * handledCPCountPlusOne;
          n = m;
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = void 0;
          try {
            for (var _iterator3 = input[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _currentValue = _step3.value;
              if (_currentValue < n && ++delta > maxInt) {
                error$1("overflow");
              }
              if (_currentValue == n) {
                var q = delta;
                for (var k = base; ; k += base) {
                  var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                  if (q < t) {
                    break;
                  }
                  var qMinusT = q - t;
                  var baseMinusT = base - t;
                  output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
                  q = floor(qMinusT / baseMinusT);
                }
                output.push(stringFromCharCode(digitToBasic(q, 0)));
                bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
                delta = 0;
                ++handledCPCount;
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
          ++delta;
          ++n;
        }
        return output.join("");
      };
      var toUnicode = function toUnicode2(input) {
        return mapDomain(input, function(string) {
          return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
        });
      };
      var toASCII = function toASCII2(input) {
        return mapDomain(input, function(string) {
          return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
        });
      };
      var punycode = {
        version: "2.1.0",
        ucs2: {
          decode: ucs2decode,
          encode: ucs2encode
        },
        decode,
        encode,
        toASCII,
        toUnicode
      };
      var SCHEMES = {};
      function pctEncChar(chr) {
        var c = chr.charCodeAt(0);
        var e = void 0;
        if (c < 16)
          e = "%0" + c.toString(16).toUpperCase();
        else if (c < 128)
          e = "%" + c.toString(16).toUpperCase();
        else if (c < 2048)
          e = "%" + (c >> 6 | 192).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
        else
          e = "%" + (c >> 12 | 224).toString(16).toUpperCase() + "%" + (c >> 6 & 63 | 128).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
        return e;
      }
      function pctDecChars(str) {
        var newStr = "";
        var i = 0;
        var il = str.length;
        while (i < il) {
          var c = parseInt(str.substr(i + 1, 2), 16);
          if (c < 128) {
            newStr += String.fromCharCode(c);
            i += 3;
          } else if (c >= 194 && c < 224) {
            if (il - i >= 6) {
              var c2 = parseInt(str.substr(i + 4, 2), 16);
              newStr += String.fromCharCode((c & 31) << 6 | c2 & 63);
            } else {
              newStr += str.substr(i, 6);
            }
            i += 6;
          } else if (c >= 224) {
            if (il - i >= 9) {
              var _c = parseInt(str.substr(i + 4, 2), 16);
              var c3 = parseInt(str.substr(i + 7, 2), 16);
              newStr += String.fromCharCode((c & 15) << 12 | (_c & 63) << 6 | c3 & 63);
            } else {
              newStr += str.substr(i, 9);
            }
            i += 9;
          } else {
            newStr += str.substr(i, 3);
            i += 3;
          }
        }
        return newStr;
      }
      function _normalizeComponentEncoding(components, protocol) {
        function decodeUnreserved2(str) {
          var decStr = pctDecChars(str);
          return !decStr.match(protocol.UNRESERVED) ? str : decStr;
        }
        if (components.scheme)
          components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved2).toLowerCase().replace(protocol.NOT_SCHEME, "");
        if (components.userinfo !== void 0)
          components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved2).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
        if (components.host !== void 0)
          components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved2).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
        if (components.path !== void 0)
          components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved2).replace(components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
        if (components.query !== void 0)
          components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved2).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
        if (components.fragment !== void 0)
          components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved2).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
        return components;
      }
      function _stripLeadingZeros(str) {
        return str.replace(/^0*(.*)/, "$1") || "0";
      }
      function _normalizeIPv4(host, protocol) {
        var matches = host.match(protocol.IPV4ADDRESS) || [];
        var _matches = slicedToArray(matches, 2), address = _matches[1];
        if (address) {
          return address.split(".").map(_stripLeadingZeros).join(".");
        } else {
          return host;
        }
      }
      function _normalizeIPv6(host, protocol) {
        var matches = host.match(protocol.IPV6ADDRESS) || [];
        var _matches2 = slicedToArray(matches, 3), address = _matches2[1], zone = _matches2[2];
        if (address) {
          var _address$toLowerCase$ = address.toLowerCase().split("::").reverse(), _address$toLowerCase$2 = slicedToArray(_address$toLowerCase$, 2), last = _address$toLowerCase$2[0], first = _address$toLowerCase$2[1];
          var firstFields = first ? first.split(":").map(_stripLeadingZeros) : [];
          var lastFields = last.split(":").map(_stripLeadingZeros);
          var isLastFieldIPv4Address = protocol.IPV4ADDRESS.test(lastFields[lastFields.length - 1]);
          var fieldCount = isLastFieldIPv4Address ? 7 : 8;
          var lastFieldsStart = lastFields.length - fieldCount;
          var fields = Array(fieldCount);
          for (var x = 0; x < fieldCount; ++x) {
            fields[x] = firstFields[x] || lastFields[lastFieldsStart + x] || "";
          }
          if (isLastFieldIPv4Address) {
            fields[fieldCount - 1] = _normalizeIPv4(fields[fieldCount - 1], protocol);
          }
          var allZeroFields = fields.reduce(function(acc, field, index) {
            if (!field || field === "0") {
              var lastLongest = acc[acc.length - 1];
              if (lastLongest && lastLongest.index + lastLongest.length === index) {
                lastLongest.length++;
              } else {
                acc.push({index, length: 1});
              }
            }
            return acc;
          }, []);
          var longestZeroFields = allZeroFields.sort(function(a, b) {
            return b.length - a.length;
          })[0];
          var newHost = void 0;
          if (longestZeroFields && longestZeroFields.length > 1) {
            var newFirst = fields.slice(0, longestZeroFields.index);
            var newLast = fields.slice(longestZeroFields.index + longestZeroFields.length);
            newHost = newFirst.join(":") + "::" + newLast.join(":");
          } else {
            newHost = fields.join(":");
          }
          if (zone) {
            newHost += "%" + zone;
          }
          return newHost;
        } else {
          return host;
        }
      }
      var URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
      var NO_MATCH_IS_UNDEFINED = "".match(/(){0}/)[1] === void 0;
      function parse(uriString) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var components = {};
        var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
        if (options.reference === "suffix")
          uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
        var matches = uriString.match(URI_PARSE);
        if (matches) {
          if (NO_MATCH_IS_UNDEFINED) {
            components.scheme = matches[1];
            components.userinfo = matches[3];
            components.host = matches[4];
            components.port = parseInt(matches[5], 10);
            components.path = matches[6] || "";
            components.query = matches[7];
            components.fragment = matches[8];
            if (isNaN(components.port)) {
              components.port = matches[5];
            }
          } else {
            components.scheme = matches[1] || void 0;
            components.userinfo = uriString.indexOf("@") !== -1 ? matches[3] : void 0;
            components.host = uriString.indexOf("//") !== -1 ? matches[4] : void 0;
            components.port = parseInt(matches[5], 10);
            components.path = matches[6] || "";
            components.query = uriString.indexOf("?") !== -1 ? matches[7] : void 0;
            components.fragment = uriString.indexOf("#") !== -1 ? matches[8] : void 0;
            if (isNaN(components.port)) {
              components.port = uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : void 0;
            }
          }
          if (components.host) {
            components.host = _normalizeIPv6(_normalizeIPv4(components.host, protocol), protocol);
          }
          if (components.scheme === void 0 && components.userinfo === void 0 && components.host === void 0 && components.port === void 0 && !components.path && components.query === void 0) {
            components.reference = "same-document";
          } else if (components.scheme === void 0) {
            components.reference = "relative";
          } else if (components.fragment === void 0) {
            components.reference = "absolute";
          } else {
            components.reference = "uri";
          }
          if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) {
            components.error = components.error || "URI is not a " + options.reference + " reference.";
          }
          var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
          if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
            if (components.host && (options.domainHost || schemeHandler && schemeHandler.domainHost)) {
              try {
                components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
              } catch (e) {
                components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
              }
            }
            _normalizeComponentEncoding(components, URI_PROTOCOL);
          } else {
            _normalizeComponentEncoding(components, protocol);
          }
          if (schemeHandler && schemeHandler.parse) {
            schemeHandler.parse(components, options);
          }
        } else {
          components.error = components.error || "URI can not be parsed.";
        }
        return components;
      }
      function _recomposeAuthority(components, options) {
        var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
        var uriTokens = [];
        if (components.userinfo !== void 0) {
          uriTokens.push(components.userinfo);
          uriTokens.push("@");
        }
        if (components.host !== void 0) {
          uriTokens.push(_normalizeIPv6(_normalizeIPv4(String(components.host), protocol), protocol).replace(protocol.IPV6ADDRESS, function(_, $1, $2) {
            return "[" + $1 + ($2 ? "%25" + $2 : "") + "]";
          }));
        }
        if (typeof components.port === "number" || typeof components.port === "string") {
          uriTokens.push(":");
          uriTokens.push(String(components.port));
        }
        return uriTokens.length ? uriTokens.join("") : void 0;
      }
      var RDS1 = /^\.\.?\//;
      var RDS2 = /^\/\.(\/|$)/;
      var RDS3 = /^\/\.\.(\/|$)/;
      var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/;
      function removeDotSegments(input) {
        var output = [];
        while (input.length) {
          if (input.match(RDS1)) {
            input = input.replace(RDS1, "");
          } else if (input.match(RDS2)) {
            input = input.replace(RDS2, "/");
          } else if (input.match(RDS3)) {
            input = input.replace(RDS3, "/");
            output.pop();
          } else if (input === "." || input === "..") {
            input = "";
          } else {
            var im = input.match(RDS5);
            if (im) {
              var s = im[0];
              input = input.slice(s.length);
              output.push(s);
            } else {
              throw new Error("Unexpected dot segment condition");
            }
          }
        }
        return output.join("");
      }
      function serialize(components) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var protocol = options.iri ? IRI_PROTOCOL : URI_PROTOCOL;
        var uriTokens = [];
        var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
        if (schemeHandler && schemeHandler.serialize)
          schemeHandler.serialize(components, options);
        if (components.host) {
          if (protocol.IPV6ADDRESS.test(components.host)) {
          } else if (options.domainHost || schemeHandler && schemeHandler.domainHost) {
            try {
              components.host = !options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host);
            } catch (e) {
              components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
            }
          }
        }
        _normalizeComponentEncoding(components, protocol);
        if (options.reference !== "suffix" && components.scheme) {
          uriTokens.push(components.scheme);
          uriTokens.push(":");
        }
        var authority = _recomposeAuthority(components, options);
        if (authority !== void 0) {
          if (options.reference !== "suffix") {
            uriTokens.push("//");
          }
          uriTokens.push(authority);
          if (components.path && components.path.charAt(0) !== "/") {
            uriTokens.push("/");
          }
        }
        if (components.path !== void 0) {
          var s = components.path;
          if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
            s = removeDotSegments(s);
          }
          if (authority === void 0) {
            s = s.replace(/^\/\//, "/%2F");
          }
          uriTokens.push(s);
        }
        if (components.query !== void 0) {
          uriTokens.push("?");
          uriTokens.push(components.query);
        }
        if (components.fragment !== void 0) {
          uriTokens.push("#");
          uriTokens.push(components.fragment);
        }
        return uriTokens.join("");
      }
      function resolveComponents(base2, relative) {
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        var skipNormalization = arguments[3];
        var target = {};
        if (!skipNormalization) {
          base2 = parse(serialize(base2, options), options);
          relative = parse(serialize(relative, options), options);
        }
        options = options || {};
        if (!options.tolerant && relative.scheme) {
          target.scheme = relative.scheme;
          target.userinfo = relative.userinfo;
          target.host = relative.host;
          target.port = relative.port;
          target.path = removeDotSegments(relative.path || "");
          target.query = relative.query;
        } else {
          if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
            target.userinfo = relative.userinfo;
            target.host = relative.host;
            target.port = relative.port;
            target.path = removeDotSegments(relative.path || "");
            target.query = relative.query;
          } else {
            if (!relative.path) {
              target.path = base2.path;
              if (relative.query !== void 0) {
                target.query = relative.query;
              } else {
                target.query = base2.query;
              }
            } else {
              if (relative.path.charAt(0) === "/") {
                target.path = removeDotSegments(relative.path);
              } else {
                if ((base2.userinfo !== void 0 || base2.host !== void 0 || base2.port !== void 0) && !base2.path) {
                  target.path = "/" + relative.path;
                } else if (!base2.path) {
                  target.path = relative.path;
                } else {
                  target.path = base2.path.slice(0, base2.path.lastIndexOf("/") + 1) + relative.path;
                }
                target.path = removeDotSegments(target.path);
              }
              target.query = relative.query;
            }
            target.userinfo = base2.userinfo;
            target.host = base2.host;
            target.port = base2.port;
          }
          target.scheme = base2.scheme;
        }
        target.fragment = relative.fragment;
        return target;
      }
      function resolve(baseURI, relativeURI, options) {
        var schemelessOptions = assign({scheme: "null"}, options);
        return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions);
      }
      function normalize(uri, options) {
        if (typeof uri === "string") {
          uri = serialize(parse(uri, options), options);
        } else if (typeOf(uri) === "object") {
          uri = parse(serialize(uri, options), options);
        }
        return uri;
      }
      function equal(uriA, uriB, options) {
        if (typeof uriA === "string") {
          uriA = serialize(parse(uriA, options), options);
        } else if (typeOf(uriA) === "object") {
          uriA = serialize(uriA, options);
        }
        if (typeof uriB === "string") {
          uriB = serialize(parse(uriB, options), options);
        } else if (typeOf(uriB) === "object") {
          uriB = serialize(uriB, options);
        }
        return uriA === uriB;
      }
      function escapeComponent(str, options) {
        return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE, pctEncChar);
      }
      function unescapeComponent(str, options) {
        return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED, pctDecChars);
      }
      var handler = {
        scheme: "http",
        domainHost: true,
        parse: function parse2(components, options) {
          if (!components.host) {
            components.error = components.error || "HTTP URIs must have a host.";
          }
          return components;
        },
        serialize: function serialize2(components, options) {
          var secure = String(components.scheme).toLowerCase() === "https";
          if (components.port === (secure ? 443 : 80) || components.port === "") {
            components.port = void 0;
          }
          if (!components.path) {
            components.path = "/";
          }
          return components;
        }
      };
      var handler$1 = {
        scheme: "https",
        domainHost: handler.domainHost,
        parse: handler.parse,
        serialize: handler.serialize
      };
      function isSecure(wsComponents) {
        return typeof wsComponents.secure === "boolean" ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
      }
      var handler$2 = {
        scheme: "ws",
        domainHost: true,
        parse: function parse2(components, options) {
          var wsComponents = components;
          wsComponents.secure = isSecure(wsComponents);
          wsComponents.resourceName = (wsComponents.path || "/") + (wsComponents.query ? "?" + wsComponents.query : "");
          wsComponents.path = void 0;
          wsComponents.query = void 0;
          return wsComponents;
        },
        serialize: function serialize2(wsComponents, options) {
          if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
            wsComponents.port = void 0;
          }
          if (typeof wsComponents.secure === "boolean") {
            wsComponents.scheme = wsComponents.secure ? "wss" : "ws";
            wsComponents.secure = void 0;
          }
          if (wsComponents.resourceName) {
            var _wsComponents$resourc = wsComponents.resourceName.split("?"), _wsComponents$resourc2 = slicedToArray(_wsComponents$resourc, 2), path = _wsComponents$resourc2[0], query = _wsComponents$resourc2[1];
            wsComponents.path = path && path !== "/" ? path : void 0;
            wsComponents.query = query;
            wsComponents.resourceName = void 0;
          }
          wsComponents.fragment = void 0;
          return wsComponents;
        }
      };
      var handler$3 = {
        scheme: "wss",
        domainHost: handler$2.domainHost,
        parse: handler$2.parse,
        serialize: handler$2.serialize
      };
      var O = {};
      var isIRI = true;
      var UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + (isIRI ? "\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" : "") + "]";
      var HEXDIG$$ = "[0-9A-Fa-f]";
      var PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$));
      var ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
      var QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
      var VCHAR$$ = merge(QTEXT$$, '[\\"\\\\]');
      var SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
      var UNRESERVED = new RegExp(UNRESERVED$$, "g");
      var PCT_ENCODED = new RegExp(PCT_ENCODED$, "g");
      var NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", '[\\"]', VCHAR$$), "g");
      var NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g");
      var NOT_HFVALUE = NOT_HFNAME;
      function decodeUnreserved(str) {
        var decStr = pctDecChars(str);
        return !decStr.match(UNRESERVED) ? str : decStr;
      }
      var handler$4 = {
        scheme: "mailto",
        parse: function parse$$1(components, options) {
          var mailtoComponents = components;
          var to = mailtoComponents.to = mailtoComponents.path ? mailtoComponents.path.split(",") : [];
          mailtoComponents.path = void 0;
          if (mailtoComponents.query) {
            var unknownHeaders = false;
            var headers = {};
            var hfields = mailtoComponents.query.split("&");
            for (var x = 0, xl = hfields.length; x < xl; ++x) {
              var hfield = hfields[x].split("=");
              switch (hfield[0]) {
                case "to":
                  var toAddrs = hfield[1].split(",");
                  for (var _x = 0, _xl = toAddrs.length; _x < _xl; ++_x) {
                    to.push(toAddrs[_x]);
                  }
                  break;
                case "subject":
                  mailtoComponents.subject = unescapeComponent(hfield[1], options);
                  break;
                case "body":
                  mailtoComponents.body = unescapeComponent(hfield[1], options);
                  break;
                default:
                  unknownHeaders = true;
                  headers[unescapeComponent(hfield[0], options)] = unescapeComponent(hfield[1], options);
                  break;
              }
            }
            if (unknownHeaders)
              mailtoComponents.headers = headers;
          }
          mailtoComponents.query = void 0;
          for (var _x2 = 0, _xl2 = to.length; _x2 < _xl2; ++_x2) {
            var addr = to[_x2].split("@");
            addr[0] = unescapeComponent(addr[0]);
            if (!options.unicodeSupport) {
              try {
                addr[1] = punycode.toASCII(unescapeComponent(addr[1], options).toLowerCase());
              } catch (e) {
                mailtoComponents.error = mailtoComponents.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
              }
            } else {
              addr[1] = unescapeComponent(addr[1], options).toLowerCase();
            }
            to[_x2] = addr.join("@");
          }
          return mailtoComponents;
        },
        serialize: function serialize$$1(mailtoComponents, options) {
          var components = mailtoComponents;
          var to = toArray(mailtoComponents.to);
          if (to) {
            for (var x = 0, xl = to.length; x < xl; ++x) {
              var toAddr = String(to[x]);
              var atIdx = toAddr.lastIndexOf("@");
              var localPart = toAddr.slice(0, atIdx).replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, pctEncChar);
              var domain = toAddr.slice(atIdx + 1);
              try {
                domain = !options.iri ? punycode.toASCII(unescapeComponent(domain, options).toLowerCase()) : punycode.toUnicode(domain);
              } catch (e) {
                components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
              }
              to[x] = localPart + "@" + domain;
            }
            components.path = to.join(",");
          }
          var headers = mailtoComponents.headers = mailtoComponents.headers || {};
          if (mailtoComponents.subject)
            headers["subject"] = mailtoComponents.subject;
          if (mailtoComponents.body)
            headers["body"] = mailtoComponents.body;
          var fields = [];
          for (var name in headers) {
            if (headers[name] !== O[name]) {
              fields.push(name.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, pctEncChar) + "=" + headers[name].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, pctEncChar));
            }
          }
          if (fields.length) {
            components.query = fields.join("&");
          }
          return components;
        }
      };
      var URN_PARSE = /^([^\:]+)\:(.*)/;
      var handler$5 = {
        scheme: "urn",
        parse: function parse$$1(components, options) {
          var matches = components.path && components.path.match(URN_PARSE);
          var urnComponents = components;
          if (matches) {
            var scheme = options.scheme || urnComponents.scheme || "urn";
            var nid = matches[1].toLowerCase();
            var nss = matches[2];
            var urnScheme = scheme + ":" + (options.nid || nid);
            var schemeHandler = SCHEMES[urnScheme];
            urnComponents.nid = nid;
            urnComponents.nss = nss;
            urnComponents.path = void 0;
            if (schemeHandler) {
              urnComponents = schemeHandler.parse(urnComponents, options);
            }
          } else {
            urnComponents.error = urnComponents.error || "URN can not be parsed.";
          }
          return urnComponents;
        },
        serialize: function serialize$$1(urnComponents, options) {
          var scheme = options.scheme || urnComponents.scheme || "urn";
          var nid = urnComponents.nid;
          var urnScheme = scheme + ":" + (options.nid || nid);
          var schemeHandler = SCHEMES[urnScheme];
          if (schemeHandler) {
            urnComponents = schemeHandler.serialize(urnComponents, options);
          }
          var uriComponents = urnComponents;
          var nss = urnComponents.nss;
          uriComponents.path = (nid || options.nid) + ":" + nss;
          return uriComponents;
        }
      };
      var UUID = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
      var handler$6 = {
        scheme: "urn:uuid",
        parse: function parse2(urnComponents, options) {
          var uuidComponents = urnComponents;
          uuidComponents.uuid = uuidComponents.nss;
          uuidComponents.nss = void 0;
          if (!options.tolerant && (!uuidComponents.uuid || !uuidComponents.uuid.match(UUID))) {
            uuidComponents.error = uuidComponents.error || "UUID is not valid.";
          }
          return uuidComponents;
        },
        serialize: function serialize2(uuidComponents, options) {
          var urnComponents = uuidComponents;
          urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
          return urnComponents;
        }
      };
      SCHEMES[handler.scheme] = handler;
      SCHEMES[handler$1.scheme] = handler$1;
      SCHEMES[handler$2.scheme] = handler$2;
      SCHEMES[handler$3.scheme] = handler$3;
      SCHEMES[handler$4.scheme] = handler$4;
      SCHEMES[handler$5.scheme] = handler$5;
      SCHEMES[handler$6.scheme] = handler$6;
      exports2.SCHEMES = SCHEMES;
      exports2.pctEncChar = pctEncChar;
      exports2.pctDecChars = pctDecChars;
      exports2.parse = parse;
      exports2.removeDotSegments = removeDotSegments;
      exports2.serialize = serialize;
      exports2.resolveComponents = resolveComponents;
      exports2.resolve = resolve;
      exports2.normalize = normalize;
      exports2.equal = equal;
      exports2.escapeComponent = escapeComponent;
      exports2.unescapeComponent = unescapeComponent;
      Object.defineProperty(exports2, "__esModule", {value: true});
    });
  });

  // node_modules/fast-deep-equal/index.js
  var require_fast_deep_equal = __commonJS((exports, module) => {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b)
        return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor)
          return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length)
            return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i]))
              return false;
          return true;
        }
        if (a.constructor === RegExp)
          return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf)
          return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString)
          return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length)
          return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
            return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key]))
            return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  });

  // node_modules/ajv/lib/compile/ucs2length.js
  var require_ucs2length = __commonJS((exports, module) => {
    "use strict";
    module.exports = function ucs2length(str) {
      var length = 0, len = str.length, pos = 0, value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) == 56320)
            pos++;
        }
      }
      return length;
    };
  });

  // node_modules/ajv/lib/compile/util.js
  var require_util = __commonJS((exports, module) => {
    "use strict";
    module.exports = {
      copy,
      checkDataType,
      checkDataTypes,
      coerceToTypes,
      toHash,
      getProperty,
      escapeQuotes,
      equal: require_fast_deep_equal(),
      ucs2length: require_ucs2length(),
      varOccurences,
      varReplace,
      schemaHasRules,
      schemaHasRulesExcept,
      schemaUnknownRules,
      toQuotedString,
      getPathExpr,
      getPath,
      getData,
      unescapeFragment,
      unescapeJsonPointer,
      escapeFragment,
      escapeJsonPointer
    };
    function copy(o, to) {
      to = to || {};
      for (var key in o)
        to[key] = o[key];
      return to;
    }
    function checkDataType(dataType, data, strictNumbers, negate) {
      var EQUAL = negate ? " !== " : " === ", AND = negate ? " || " : " && ", OK = negate ? "!" : "", NOT = negate ? "" : "!";
      switch (dataType) {
        case "null":
          return data + EQUAL + "null";
        case "array":
          return OK + "Array.isArray(" + data + ")";
        case "object":
          return "(" + OK + data + AND + "typeof " + data + EQUAL + '"object"' + AND + NOT + "Array.isArray(" + data + "))";
        case "integer":
          return "(typeof " + data + EQUAL + '"number"' + AND + NOT + "(" + data + " % 1)" + AND + data + EQUAL + data + (strictNumbers ? AND + OK + "isFinite(" + data + ")" : "") + ")";
        case "number":
          return "(typeof " + data + EQUAL + '"' + dataType + '"' + (strictNumbers ? AND + OK + "isFinite(" + data + ")" : "") + ")";
        default:
          return "typeof " + data + EQUAL + '"' + dataType + '"';
      }
    }
    function checkDataTypes(dataTypes, data, strictNumbers) {
      switch (dataTypes.length) {
        case 1:
          return checkDataType(dataTypes[0], data, strictNumbers, true);
        default:
          var code = "";
          var types = toHash(dataTypes);
          if (types.array && types.object) {
            code = types.null ? "(" : "(!" + data + " || ";
            code += "typeof " + data + ' !== "object")';
            delete types.null;
            delete types.array;
            delete types.object;
          }
          if (types.number)
            delete types.integer;
          for (var t in types)
            code += (code ? " && " : "") + checkDataType(t, data, strictNumbers, true);
          return code;
      }
    }
    var COERCE_TO_TYPES = toHash(["string", "number", "integer", "boolean", "null"]);
    function coerceToTypes(optionCoerceTypes, dataTypes) {
      if (Array.isArray(dataTypes)) {
        var types = [];
        for (var i = 0; i < dataTypes.length; i++) {
          var t = dataTypes[i];
          if (COERCE_TO_TYPES[t])
            types[types.length] = t;
          else if (optionCoerceTypes === "array" && t === "array")
            types[types.length] = t;
        }
        if (types.length)
          return types;
      } else if (COERCE_TO_TYPES[dataTypes]) {
        return [dataTypes];
      } else if (optionCoerceTypes === "array" && dataTypes === "array") {
        return ["array"];
      }
    }
    function toHash(arr) {
      var hash = {};
      for (var i = 0; i < arr.length; i++)
        hash[arr[i]] = true;
      return hash;
    }
    var IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    var SINGLE_QUOTE = /'|\\/g;
    function getProperty(key) {
      return typeof key == "number" ? "[" + key + "]" : IDENTIFIER.test(key) ? "." + key : "['" + escapeQuotes(key) + "']";
    }
    function escapeQuotes(str) {
      return str.replace(SINGLE_QUOTE, "\\$&").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\f/g, "\\f").replace(/\t/g, "\\t");
    }
    function varOccurences(str, dataVar) {
      dataVar += "[^0-9]";
      var matches = str.match(new RegExp(dataVar, "g"));
      return matches ? matches.length : 0;
    }
    function varReplace(str, dataVar, expr) {
      dataVar += "([^0-9])";
      expr = expr.replace(/\$/g, "$$$$");
      return str.replace(new RegExp(dataVar, "g"), expr + "$1");
    }
    function schemaHasRules(schema, rules) {
      if (typeof schema == "boolean")
        return !schema;
      for (var key in schema)
        if (rules[key])
          return true;
    }
    function schemaHasRulesExcept(schema, rules, exceptKeyword) {
      if (typeof schema == "boolean")
        return !schema && exceptKeyword != "not";
      for (var key in schema)
        if (key != exceptKeyword && rules[key])
          return true;
    }
    function schemaUnknownRules(schema, rules) {
      if (typeof schema == "boolean")
        return;
      for (var key in schema)
        if (!rules[key])
          return key;
    }
    function toQuotedString(str) {
      return "'" + escapeQuotes(str) + "'";
    }
    function getPathExpr(currentPath, expr, jsonPointers, isNumber) {
      var path = jsonPointers ? "'/' + " + expr + (isNumber ? "" : ".replace(/~/g, '~0').replace(/\\//g, '~1')") : isNumber ? "'[' + " + expr + " + ']'" : "'[\\'' + " + expr + " + '\\']'";
      return joinPaths(currentPath, path);
    }
    function getPath(currentPath, prop, jsonPointers) {
      var path = jsonPointers ? toQuotedString("/" + escapeJsonPointer(prop)) : toQuotedString(getProperty(prop));
      return joinPaths(currentPath, path);
    }
    var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
    var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
    function getData($data, lvl, paths) {
      var up, jsonPointer, data, matches;
      if ($data === "")
        return "rootData";
      if ($data[0] == "/") {
        if (!JSON_POINTER.test($data))
          throw new Error("Invalid JSON-pointer: " + $data);
        jsonPointer = $data;
        data = "rootData";
      } else {
        matches = $data.match(RELATIVE_JSON_POINTER);
        if (!matches)
          throw new Error("Invalid JSON-pointer: " + $data);
        up = +matches[1];
        jsonPointer = matches[2];
        if (jsonPointer == "#") {
          if (up >= lvl)
            throw new Error("Cannot access property/index " + up + " levels up, current level is " + lvl);
          return paths[lvl - up];
        }
        if (up > lvl)
          throw new Error("Cannot access data " + up + " levels up, current level is " + lvl);
        data = "data" + (lvl - up || "");
        if (!jsonPointer)
          return data;
      }
      var expr = data;
      var segments = jsonPointer.split("/");
      for (var i = 0; i < segments.length; i++) {
        var segment = segments[i];
        if (segment) {
          data += getProperty(unescapeJsonPointer(segment));
          expr += " && " + data;
        }
      }
      return expr;
    }
    function joinPaths(a, b) {
      if (a == '""')
        return b;
      return (a + " + " + b).replace(/([^\\])' \+ '/g, "$1");
    }
    function unescapeFragment(str) {
      return unescapeJsonPointer(decodeURIComponent(str));
    }
    function escapeFragment(str) {
      return encodeURIComponent(escapeJsonPointer(str));
    }
    function escapeJsonPointer(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
  });

  // node_modules/ajv/lib/compile/schema_obj.js
  var require_schema_obj = __commonJS((exports, module) => {
    "use strict";
    var util = require_util();
    module.exports = SchemaObject;
    function SchemaObject(obj) {
      util.copy(obj, this);
    }
  });

  // node_modules/json-schema-traverse/index.js
  var require_json_schema_traverse = __commonJS((exports, module) => {
    "use strict";
    var traverse = module.exports = function(schema, opts, cb) {
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }
      cb = opts.cb || cb;
      var pre = typeof cb == "function" ? cb : cb.pre || function() {
      };
      var post = cb.post || function() {
      };
      _traverse(opts, pre, post, schema, "", schema);
    };
    traverse.keywords = {
      additionalItems: true,
      items: true,
      contains: true,
      additionalProperties: true,
      propertyNames: true,
      not: true
    };
    traverse.arrayKeywords = {
      items: true,
      allOf: true,
      anyOf: true,
      oneOf: true
    };
    traverse.propsKeywords = {
      definitions: true,
      properties: true,
      patternProperties: true,
      dependencies: true
    };
    traverse.skipKeywords = {
      default: true,
      enum: true,
      const: true,
      required: true,
      maximum: true,
      minimum: true,
      exclusiveMaximum: true,
      exclusiveMinimum: true,
      multipleOf: true,
      maxLength: true,
      minLength: true,
      pattern: true,
      format: true,
      maxItems: true,
      minItems: true,
      uniqueItems: true,
      maxProperties: true,
      minProperties: true
    };
    function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
      if (schema && typeof schema == "object" && !Array.isArray(schema)) {
        pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        for (var key in schema) {
          var sch = schema[key];
          if (Array.isArray(sch)) {
            if (key in traverse.arrayKeywords) {
              for (var i = 0; i < sch.length; i++)
                _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
            }
          } else if (key in traverse.propsKeywords) {
            if (sch && typeof sch == "object") {
              for (var prop in sch)
                _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
            }
          } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
            _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
          }
        }
        post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      }
    }
    function escapeJsonPtr(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  });

  // node_modules/ajv/lib/compile/resolve.js
  var require_resolve = __commonJS((exports, module) => {
    "use strict";
    var URI = require_uri_all();
    var equal = require_fast_deep_equal();
    var util = require_util();
    var SchemaObject = require_schema_obj();
    var traverse = require_json_schema_traverse();
    module.exports = resolve;
    resolve.normalizeId = normalizeId;
    resolve.fullPath = getFullPath;
    resolve.url = resolveUrl;
    resolve.ids = resolveIds;
    resolve.inlineRef = inlineRef;
    resolve.schema = resolveSchema;
    function resolve(compile, root, ref) {
      var refVal = this._refs[ref];
      if (typeof refVal == "string") {
        if (this._refs[refVal])
          refVal = this._refs[refVal];
        else
          return resolve.call(this, compile, root, refVal);
      }
      refVal = refVal || this._schemas[ref];
      if (refVal instanceof SchemaObject) {
        return inlineRef(refVal.schema, this._opts.inlineRefs) ? refVal.schema : refVal.validate || this._compile(refVal);
      }
      var res = resolveSchema.call(this, root, ref);
      var schema, v, baseId;
      if (res) {
        schema = res.schema;
        root = res.root;
        baseId = res.baseId;
      }
      if (schema instanceof SchemaObject) {
        v = schema.validate || compile.call(this, schema.schema, root, void 0, baseId);
      } else if (schema !== void 0) {
        v = inlineRef(schema, this._opts.inlineRefs) ? schema : compile.call(this, schema, root, void 0, baseId);
      }
      return v;
    }
    function resolveSchema(root, ref) {
      var p = URI.parse(ref), refPath = _getFullPath(p), baseId = getFullPath(this._getId(root.schema));
      if (Object.keys(root.schema).length === 0 || refPath !== baseId) {
        var id = normalizeId(refPath);
        var refVal = this._refs[id];
        if (typeof refVal == "string") {
          return resolveRecursive.call(this, root, refVal, p);
        } else if (refVal instanceof SchemaObject) {
          if (!refVal.validate)
            this._compile(refVal);
          root = refVal;
        } else {
          refVal = this._schemas[id];
          if (refVal instanceof SchemaObject) {
            if (!refVal.validate)
              this._compile(refVal);
            if (id == normalizeId(ref))
              return {schema: refVal, root, baseId};
            root = refVal;
          } else {
            return;
          }
        }
        if (!root.schema)
          return;
        baseId = getFullPath(this._getId(root.schema));
      }
      return getJsonPointer.call(this, p, baseId, root.schema, root);
    }
    function resolveRecursive(root, ref, parsedRef) {
      var res = resolveSchema.call(this, root, ref);
      if (res) {
        var schema = res.schema;
        var baseId = res.baseId;
        root = res.root;
        var id = this._getId(schema);
        if (id)
          baseId = resolveUrl(baseId, id);
        return getJsonPointer.call(this, parsedRef, baseId, schema, root);
      }
    }
    var PREVENT_SCOPE_CHANGE = util.toHash(["properties", "patternProperties", "enum", "dependencies", "definitions"]);
    function getJsonPointer(parsedRef, baseId, schema, root) {
      parsedRef.fragment = parsedRef.fragment || "";
      if (parsedRef.fragment.slice(0, 1) != "/")
        return;
      var parts = parsedRef.fragment.split("/");
      for (var i = 1; i < parts.length; i++) {
        var part = parts[i];
        if (part) {
          part = util.unescapeFragment(part);
          schema = schema[part];
          if (schema === void 0)
            break;
          var id;
          if (!PREVENT_SCOPE_CHANGE[part]) {
            id = this._getId(schema);
            if (id)
              baseId = resolveUrl(baseId, id);
            if (schema.$ref) {
              var $ref = resolveUrl(baseId, schema.$ref);
              var res = resolveSchema.call(this, root, $ref);
              if (res) {
                schema = res.schema;
                root = res.root;
                baseId = res.baseId;
              }
            }
          }
        }
      }
      if (schema !== void 0 && schema !== root.schema)
        return {schema, root, baseId};
    }
    var SIMPLE_INLINED = util.toHash([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum"
    ]);
    function inlineRef(schema, limit) {
      if (limit === false)
        return false;
      if (limit === void 0 || limit === true)
        return checkNoRef(schema);
      else if (limit)
        return countKeys(schema) <= limit;
    }
    function checkNoRef(schema) {
      var item;
      if (Array.isArray(schema)) {
        for (var i = 0; i < schema.length; i++) {
          item = schema[i];
          if (typeof item == "object" && !checkNoRef(item))
            return false;
        }
      } else {
        for (var key in schema) {
          if (key == "$ref")
            return false;
          item = schema[key];
          if (typeof item == "object" && !checkNoRef(item))
            return false;
        }
      }
      return true;
    }
    function countKeys(schema) {
      var count = 0, item;
      if (Array.isArray(schema)) {
        for (var i = 0; i < schema.length; i++) {
          item = schema[i];
          if (typeof item == "object")
            count += countKeys(item);
          if (count == Infinity)
            return Infinity;
        }
      } else {
        for (var key in schema) {
          if (key == "$ref")
            return Infinity;
          if (SIMPLE_INLINED[key]) {
            count++;
          } else {
            item = schema[key];
            if (typeof item == "object")
              count += countKeys(item) + 1;
            if (count == Infinity)
              return Infinity;
          }
        }
      }
      return count;
    }
    function getFullPath(id, normalize) {
      if (normalize !== false)
        id = normalizeId(id);
      var p = URI.parse(id);
      return _getFullPath(p);
    }
    function _getFullPath(p) {
      return URI.serialize(p).split("#")[0] + "#";
    }
    var TRAILING_SLASH_HASH = /#\/?$/;
    function normalizeId(id) {
      return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
    }
    function resolveUrl(baseId, id) {
      id = normalizeId(id);
      return URI.resolve(baseId, id);
    }
    function resolveIds(schema) {
      var schemaId = normalizeId(this._getId(schema));
      var baseIds = {"": schemaId};
      var fullPaths = {"": getFullPath(schemaId, false)};
      var localRefs = {};
      var self2 = this;
      traverse(schema, {allKeys: true}, function(sch, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
        if (jsonPtr === "")
          return;
        var id = self2._getId(sch);
        var baseId = baseIds[parentJsonPtr];
        var fullPath = fullPaths[parentJsonPtr] + "/" + parentKeyword;
        if (keyIndex !== void 0)
          fullPath += "/" + (typeof keyIndex == "number" ? keyIndex : util.escapeFragment(keyIndex));
        if (typeof id == "string") {
          id = baseId = normalizeId(baseId ? URI.resolve(baseId, id) : id);
          var refVal = self2._refs[id];
          if (typeof refVal == "string")
            refVal = self2._refs[refVal];
          if (refVal && refVal.schema) {
            if (!equal(sch, refVal.schema))
              throw new Error('id "' + id + '" resolves to more than one schema');
          } else if (id != normalizeId(fullPath)) {
            if (id[0] == "#") {
              if (localRefs[id] && !equal(sch, localRefs[id]))
                throw new Error('id "' + id + '" resolves to more than one schema');
              localRefs[id] = sch;
            } else {
              self2._refs[id] = fullPath;
            }
          }
        }
        baseIds[jsonPtr] = baseId;
        fullPaths[jsonPtr] = fullPath;
      });
      return localRefs;
    }
  });

  // node_modules/ajv/lib/compile/error_classes.js
  var require_error_classes = __commonJS((exports, module) => {
    "use strict";
    var resolve = require_resolve();
    module.exports = {
      Validation: errorSubclass(ValidationError),
      MissingRef: errorSubclass(MissingRefError)
    };
    function ValidationError(errors) {
      this.message = "validation failed";
      this.errors = errors;
      this.ajv = this.validation = true;
    }
    MissingRefError.message = function(baseId, ref) {
      return "can't resolve reference " + ref + " from id " + baseId;
    };
    function MissingRefError(baseId, ref, message) {
      this.message = message || MissingRefError.message(baseId, ref);
      this.missingRef = resolve.url(baseId, ref);
      this.missingSchema = resolve.normalizeId(resolve.fullPath(this.missingRef));
    }
    function errorSubclass(Subclass) {
      Subclass.prototype = Object.create(Error.prototype);
      Subclass.prototype.constructor = Subclass;
      return Subclass;
    }
  });

  // node_modules/fast-json-stable-stringify/index.js
  var require_fast_json_stable_stringify = __commonJS((exports, module) => {
    "use strict";
    module.exports = function(data, opts) {
      if (!opts)
        opts = {};
      if (typeof opts === "function")
        opts = {cmp: opts};
      var cycles = typeof opts.cycles === "boolean" ? opts.cycles : false;
      var cmp = opts.cmp && function(f) {
        return function(node) {
          return function(a, b) {
            var aobj = {key: a, value: node[a]};
            var bobj = {key: b, value: node[b]};
            return f(aobj, bobj);
          };
        };
      }(opts.cmp);
      var seen = [];
      return function stringify(node) {
        if (node && node.toJSON && typeof node.toJSON === "function") {
          node = node.toJSON();
        }
        if (node === void 0)
          return;
        if (typeof node == "number")
          return isFinite(node) ? "" + node : "null";
        if (typeof node !== "object")
          return JSON.stringify(node);
        var i, out;
        if (Array.isArray(node)) {
          out = "[";
          for (i = 0; i < node.length; i++) {
            if (i)
              out += ",";
            out += stringify(node[i]) || "null";
          }
          return out + "]";
        }
        if (node === null)
          return "null";
        if (seen.indexOf(node) !== -1) {
          if (cycles)
            return JSON.stringify("__cycle__");
          throw new TypeError("Converting circular structure to JSON");
        }
        var seenIndex = seen.push(node) - 1;
        var keys = Object.keys(node).sort(cmp && cmp(node));
        out = "";
        for (i = 0; i < keys.length; i++) {
          var key = keys[i];
          var value = stringify(node[key]);
          if (!value)
            continue;
          if (out)
            out += ",";
          out += JSON.stringify(key) + ":" + value;
        }
        seen.splice(seenIndex, 1);
        return "{" + out + "}";
      }(data);
    };
  });

  // node_modules/ajv/lib/dotjs/validate.js
  var require_validate = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_validate(it, $keyword, $ruleType) {
      var out = "";
      var $async = it.schema.$async === true, $refKeywords = it.util.schemaHasRulesExcept(it.schema, it.RULES.all, "$ref"), $id = it.self._getId(it.schema);
      if (it.opts.strictKeywords) {
        var $unknownKwd = it.util.schemaUnknownRules(it.schema, it.RULES.keywords);
        if ($unknownKwd) {
          var $keywordsMsg = "unknown keyword: " + $unknownKwd;
          if (it.opts.strictKeywords === "log")
            it.logger.warn($keywordsMsg);
          else
            throw new Error($keywordsMsg);
        }
      }
      if (it.isTop) {
        out += " var validate = ";
        if ($async) {
          it.async = true;
          out += "async ";
        }
        out += "function(data, dataPath, parentData, parentDataProperty, rootData) { 'use strict'; ";
        if ($id && (it.opts.sourceCode || it.opts.processCode)) {
          out += " " + ("/*# sourceURL=" + $id + " */") + " ";
        }
      }
      if (typeof it.schema == "boolean" || !($refKeywords || it.schema.$ref)) {
        var $keyword = "false schema";
        var $lvl = it.level;
        var $dataLvl = it.dataLevel;
        var $schema = it.schema[$keyword];
        var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
        var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
        var $breakOnError = !it.opts.allErrors;
        var $errorKeyword;
        var $data = "data" + ($dataLvl || "");
        var $valid = "valid" + $lvl;
        if (it.schema === false) {
          if (it.isTop) {
            $breakOnError = true;
          } else {
            out += " var " + $valid + " = false; ";
          }
          var $$outStack = $$outStack || [];
          $$outStack.push(out);
          out = "";
          if (it.createErrors !== false) {
            out += " { keyword: '" + ($errorKeyword || "false schema") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
            if (it.opts.messages !== false) {
              out += " , message: 'boolean schema is false' ";
            }
            if (it.opts.verbose) {
              out += " , schema: false , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
            }
            out += " } ";
          } else {
            out += " {} ";
          }
          var __err = out;
          out = $$outStack.pop();
          if (!it.compositeRule && $breakOnError) {
            if (it.async) {
              out += " throw new ValidationError([" + __err + "]); ";
            } else {
              out += " validate.errors = [" + __err + "]; return false; ";
            }
          } else {
            out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
          }
        } else {
          if (it.isTop) {
            if ($async) {
              out += " return data; ";
            } else {
              out += " validate.errors = null; return true; ";
            }
          } else {
            out += " var " + $valid + " = true; ";
          }
        }
        if (it.isTop) {
          out += " }; return validate; ";
        }
        return out;
      }
      if (it.isTop) {
        var $top = it.isTop, $lvl = it.level = 0, $dataLvl = it.dataLevel = 0, $data = "data";
        it.rootId = it.resolve.fullPath(it.self._getId(it.root.schema));
        it.baseId = it.baseId || it.rootId;
        delete it.isTop;
        it.dataPathArr = [""];
        if (it.schema.default !== void 0 && it.opts.useDefaults && it.opts.strictDefaults) {
          var $defaultMsg = "default is ignored in the schema root";
          if (it.opts.strictDefaults === "log")
            it.logger.warn($defaultMsg);
          else
            throw new Error($defaultMsg);
        }
        out += " var vErrors = null; ";
        out += " var errors = 0;     ";
        out += " if (rootData === undefined) rootData = data; ";
      } else {
        var $lvl = it.level, $dataLvl = it.dataLevel, $data = "data" + ($dataLvl || "");
        if ($id)
          it.baseId = it.resolve.url(it.baseId, $id);
        if ($async && !it.async)
          throw new Error("async schema in sync schema");
        out += " var errs_" + $lvl + " = errors;";
      }
      var $valid = "valid" + $lvl, $breakOnError = !it.opts.allErrors, $closingBraces1 = "", $closingBraces2 = "";
      var $errorKeyword;
      var $typeSchema = it.schema.type, $typeIsArray = Array.isArray($typeSchema);
      if ($typeSchema && it.opts.nullable && it.schema.nullable === true) {
        if ($typeIsArray) {
          if ($typeSchema.indexOf("null") == -1)
            $typeSchema = $typeSchema.concat("null");
        } else if ($typeSchema != "null") {
          $typeSchema = [$typeSchema, "null"];
          $typeIsArray = true;
        }
      }
      if ($typeIsArray && $typeSchema.length == 1) {
        $typeSchema = $typeSchema[0];
        $typeIsArray = false;
      }
      if (it.schema.$ref && $refKeywords) {
        if (it.opts.extendRefs == "fail") {
          throw new Error('$ref: validation keywords used in schema at path "' + it.errSchemaPath + '" (see option extendRefs)');
        } else if (it.opts.extendRefs !== true) {
          $refKeywords = false;
          it.logger.warn('$ref: keywords ignored in schema at path "' + it.errSchemaPath + '"');
        }
      }
      if (it.schema.$comment && it.opts.$comment) {
        out += " " + it.RULES.all.$comment.code(it, "$comment");
      }
      if ($typeSchema) {
        if (it.opts.coerceTypes) {
          var $coerceToTypes = it.util.coerceToTypes(it.opts.coerceTypes, $typeSchema);
        }
        var $rulesGroup = it.RULES.types[$typeSchema];
        if ($coerceToTypes || $typeIsArray || $rulesGroup === true || $rulesGroup && !$shouldUseGroup($rulesGroup)) {
          var $schemaPath = it.schemaPath + ".type", $errSchemaPath = it.errSchemaPath + "/type";
          var $schemaPath = it.schemaPath + ".type", $errSchemaPath = it.errSchemaPath + "/type", $method = $typeIsArray ? "checkDataTypes" : "checkDataType";
          out += " if (" + it.util[$method]($typeSchema, $data, it.opts.strictNumbers, true) + ") { ";
          if ($coerceToTypes) {
            var $dataType = "dataType" + $lvl, $coerced = "coerced" + $lvl;
            out += " var " + $dataType + " = typeof " + $data + "; var " + $coerced + " = undefined; ";
            if (it.opts.coerceTypes == "array") {
              out += " if (" + $dataType + " == 'object' && Array.isArray(" + $data + ") && " + $data + ".length == 1) { " + $data + " = " + $data + "[0]; " + $dataType + " = typeof " + $data + "; if (" + it.util.checkDataType(it.schema.type, $data, it.opts.strictNumbers) + ") " + $coerced + " = " + $data + "; } ";
            }
            out += " if (" + $coerced + " !== undefined) ; ";
            var arr1 = $coerceToTypes;
            if (arr1) {
              var $type, $i = -1, l1 = arr1.length - 1;
              while ($i < l1) {
                $type = arr1[$i += 1];
                if ($type == "string") {
                  out += " else if (" + $dataType + " == 'number' || " + $dataType + " == 'boolean') " + $coerced + " = '' + " + $data + "; else if (" + $data + " === null) " + $coerced + " = ''; ";
                } else if ($type == "number" || $type == "integer") {
                  out += " else if (" + $dataType + " == 'boolean' || " + $data + " === null || (" + $dataType + " == 'string' && " + $data + " && " + $data + " == +" + $data + " ";
                  if ($type == "integer") {
                    out += " && !(" + $data + " % 1)";
                  }
                  out += ")) " + $coerced + " = +" + $data + "; ";
                } else if ($type == "boolean") {
                  out += " else if (" + $data + " === 'false' || " + $data + " === 0 || " + $data + " === null) " + $coerced + " = false; else if (" + $data + " === 'true' || " + $data + " === 1) " + $coerced + " = true; ";
                } else if ($type == "null") {
                  out += " else if (" + $data + " === '' || " + $data + " === 0 || " + $data + " === false) " + $coerced + " = null; ";
                } else if (it.opts.coerceTypes == "array" && $type == "array") {
                  out += " else if (" + $dataType + " == 'string' || " + $dataType + " == 'number' || " + $dataType + " == 'boolean' || " + $data + " == null) " + $coerced + " = [" + $data + "]; ";
                }
              }
            }
            out += " else {   ";
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = "";
            if (it.createErrors !== false) {
              out += " { keyword: '" + ($errorKeyword || "type") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { type: '";
              if ($typeIsArray) {
                out += "" + $typeSchema.join(",");
              } else {
                out += "" + $typeSchema;
              }
              out += "' } ";
              if (it.opts.messages !== false) {
                out += " , message: 'should be ";
                if ($typeIsArray) {
                  out += "" + $typeSchema.join(",");
                } else {
                  out += "" + $typeSchema;
                }
                out += "' ";
              }
              if (it.opts.verbose) {
                out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
              }
              out += " } ";
            } else {
              out += " {} ";
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              if (it.async) {
                out += " throw new ValidationError([" + __err + "]); ";
              } else {
                out += " validate.errors = [" + __err + "]; return false; ";
              }
            } else {
              out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
            }
            out += " } if (" + $coerced + " !== undefined) {  ";
            var $parentData = $dataLvl ? "data" + ($dataLvl - 1 || "") : "parentData", $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : "parentDataProperty";
            out += " " + $data + " = " + $coerced + "; ";
            if (!$dataLvl) {
              out += "if (" + $parentData + " !== undefined)";
            }
            out += " " + $parentData + "[" + $parentDataProperty + "] = " + $coerced + "; } ";
          } else {
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = "";
            if (it.createErrors !== false) {
              out += " { keyword: '" + ($errorKeyword || "type") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { type: '";
              if ($typeIsArray) {
                out += "" + $typeSchema.join(",");
              } else {
                out += "" + $typeSchema;
              }
              out += "' } ";
              if (it.opts.messages !== false) {
                out += " , message: 'should be ";
                if ($typeIsArray) {
                  out += "" + $typeSchema.join(",");
                } else {
                  out += "" + $typeSchema;
                }
                out += "' ";
              }
              if (it.opts.verbose) {
                out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
              }
              out += " } ";
            } else {
              out += " {} ";
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              if (it.async) {
                out += " throw new ValidationError([" + __err + "]); ";
              } else {
                out += " validate.errors = [" + __err + "]; return false; ";
              }
            } else {
              out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
            }
          }
          out += " } ";
        }
      }
      if (it.schema.$ref && !$refKeywords) {
        out += " " + it.RULES.all.$ref.code(it, "$ref") + " ";
        if ($breakOnError) {
          out += " } if (errors === ";
          if ($top) {
            out += "0";
          } else {
            out += "errs_" + $lvl;
          }
          out += ") { ";
          $closingBraces2 += "}";
        }
      } else {
        var arr2 = it.RULES;
        if (arr2) {
          var $rulesGroup, i2 = -1, l2 = arr2.length - 1;
          while (i2 < l2) {
            $rulesGroup = arr2[i2 += 1];
            if ($shouldUseGroup($rulesGroup)) {
              if ($rulesGroup.type) {
                out += " if (" + it.util.checkDataType($rulesGroup.type, $data, it.opts.strictNumbers) + ") { ";
              }
              if (it.opts.useDefaults) {
                if ($rulesGroup.type == "object" && it.schema.properties) {
                  var $schema = it.schema.properties, $schemaKeys = Object.keys($schema);
                  var arr3 = $schemaKeys;
                  if (arr3) {
                    var $propertyKey, i3 = -1, l3 = arr3.length - 1;
                    while (i3 < l3) {
                      $propertyKey = arr3[i3 += 1];
                      var $sch = $schema[$propertyKey];
                      if ($sch.default !== void 0) {
                        var $passData = $data + it.util.getProperty($propertyKey);
                        if (it.compositeRule) {
                          if (it.opts.strictDefaults) {
                            var $defaultMsg = "default is ignored for: " + $passData;
                            if (it.opts.strictDefaults === "log")
                              it.logger.warn($defaultMsg);
                            else
                              throw new Error($defaultMsg);
                          }
                        } else {
                          out += " if (" + $passData + " === undefined ";
                          if (it.opts.useDefaults == "empty") {
                            out += " || " + $passData + " === null || " + $passData + " === '' ";
                          }
                          out += " ) " + $passData + " = ";
                          if (it.opts.useDefaults == "shared") {
                            out += " " + it.useDefault($sch.default) + " ";
                          } else {
                            out += " " + JSON.stringify($sch.default) + " ";
                          }
                          out += "; ";
                        }
                      }
                    }
                  }
                } else if ($rulesGroup.type == "array" && Array.isArray(it.schema.items)) {
                  var arr4 = it.schema.items;
                  if (arr4) {
                    var $sch, $i = -1, l4 = arr4.length - 1;
                    while ($i < l4) {
                      $sch = arr4[$i += 1];
                      if ($sch.default !== void 0) {
                        var $passData = $data + "[" + $i + "]";
                        if (it.compositeRule) {
                          if (it.opts.strictDefaults) {
                            var $defaultMsg = "default is ignored for: " + $passData;
                            if (it.opts.strictDefaults === "log")
                              it.logger.warn($defaultMsg);
                            else
                              throw new Error($defaultMsg);
                          }
                        } else {
                          out += " if (" + $passData + " === undefined ";
                          if (it.opts.useDefaults == "empty") {
                            out += " || " + $passData + " === null || " + $passData + " === '' ";
                          }
                          out += " ) " + $passData + " = ";
                          if (it.opts.useDefaults == "shared") {
                            out += " " + it.useDefault($sch.default) + " ";
                          } else {
                            out += " " + JSON.stringify($sch.default) + " ";
                          }
                          out += "; ";
                        }
                      }
                    }
                  }
                }
              }
              var arr5 = $rulesGroup.rules;
              if (arr5) {
                var $rule, i5 = -1, l5 = arr5.length - 1;
                while (i5 < l5) {
                  $rule = arr5[i5 += 1];
                  if ($shouldUseRule($rule)) {
                    var $code = $rule.code(it, $rule.keyword, $rulesGroup.type);
                    if ($code) {
                      out += " " + $code + " ";
                      if ($breakOnError) {
                        $closingBraces1 += "}";
                      }
                    }
                  }
                }
              }
              if ($breakOnError) {
                out += " " + $closingBraces1 + " ";
                $closingBraces1 = "";
              }
              if ($rulesGroup.type) {
                out += " } ";
                if ($typeSchema && $typeSchema === $rulesGroup.type && !$coerceToTypes) {
                  out += " else { ";
                  var $schemaPath = it.schemaPath + ".type", $errSchemaPath = it.errSchemaPath + "/type";
                  var $$outStack = $$outStack || [];
                  $$outStack.push(out);
                  out = "";
                  if (it.createErrors !== false) {
                    out += " { keyword: '" + ($errorKeyword || "type") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { type: '";
                    if ($typeIsArray) {
                      out += "" + $typeSchema.join(",");
                    } else {
                      out += "" + $typeSchema;
                    }
                    out += "' } ";
                    if (it.opts.messages !== false) {
                      out += " , message: 'should be ";
                      if ($typeIsArray) {
                        out += "" + $typeSchema.join(",");
                      } else {
                        out += "" + $typeSchema;
                      }
                      out += "' ";
                    }
                    if (it.opts.verbose) {
                      out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
                    }
                    out += " } ";
                  } else {
                    out += " {} ";
                  }
                  var __err = out;
                  out = $$outStack.pop();
                  if (!it.compositeRule && $breakOnError) {
                    if (it.async) {
                      out += " throw new ValidationError([" + __err + "]); ";
                    } else {
                      out += " validate.errors = [" + __err + "]; return false; ";
                    }
                  } else {
                    out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
                  }
                  out += " } ";
                }
              }
              if ($breakOnError) {
                out += " if (errors === ";
                if ($top) {
                  out += "0";
                } else {
                  out += "errs_" + $lvl;
                }
                out += ") { ";
                $closingBraces2 += "}";
              }
            }
          }
        }
      }
      if ($breakOnError) {
        out += " " + $closingBraces2 + " ";
      }
      if ($top) {
        if ($async) {
          out += " if (errors === 0) return data;           ";
          out += " else throw new ValidationError(vErrors); ";
        } else {
          out += " validate.errors = vErrors; ";
          out += " return errors === 0;       ";
        }
        out += " }; return validate;";
      } else {
        out += " var " + $valid + " = errors === errs_" + $lvl + ";";
      }
      function $shouldUseGroup($rulesGroup2) {
        var rules = $rulesGroup2.rules;
        for (var i = 0; i < rules.length; i++)
          if ($shouldUseRule(rules[i]))
            return true;
      }
      function $shouldUseRule($rule2) {
        return it.schema[$rule2.keyword] !== void 0 || $rule2.implements && $ruleImplementsSomeKeyword($rule2);
      }
      function $ruleImplementsSomeKeyword($rule2) {
        var impl = $rule2.implements;
        for (var i = 0; i < impl.length; i++)
          if (it.schema[impl[i]] !== void 0)
            return true;
      }
      return out;
    };
  });

  // node_modules/ajv/lib/compile/index.js
  var require_compile = __commonJS((exports, module) => {
    "use strict";
    var resolve = require_resolve();
    var util = require_util();
    var errorClasses = require_error_classes();
    var stableStringify = require_fast_json_stable_stringify();
    var validateGenerator = require_validate();
    var ucs2length = util.ucs2length;
    var equal = require_fast_deep_equal();
    var ValidationError = errorClasses.Validation;
    module.exports = compile;
    function compile(schema, root, localRefs, baseId) {
      var self2 = this, opts = this._opts, refVal = [void 0], refs = {}, patterns = [], patternsHash = {}, defaults = [], defaultsHash = {}, customRules = [];
      root = root || {schema, refVal, refs};
      var c = checkCompiling.call(this, schema, root, baseId);
      var compilation = this._compilations[c.index];
      if (c.compiling)
        return compilation.callValidate = callValidate;
      var formats = this._formats;
      var RULES = this.RULES;
      try {
        var v = localCompile(schema, root, localRefs, baseId);
        compilation.validate = v;
        var cv = compilation.callValidate;
        if (cv) {
          cv.schema = v.schema;
          cv.errors = null;
          cv.refs = v.refs;
          cv.refVal = v.refVal;
          cv.root = v.root;
          cv.$async = v.$async;
          if (opts.sourceCode)
            cv.source = v.source;
        }
        return v;
      } finally {
        endCompiling.call(this, schema, root, baseId);
      }
      function callValidate() {
        var validate = compilation.validate;
        var result = validate.apply(this, arguments);
        callValidate.errors = validate.errors;
        return result;
      }
      function localCompile(_schema, _root, localRefs2, baseId2) {
        var isRoot = !_root || _root && _root.schema == _schema;
        if (_root.schema != root.schema)
          return compile.call(self2, _schema, _root, localRefs2, baseId2);
        var $async = _schema.$async === true;
        var sourceCode = validateGenerator({
          isTop: true,
          schema: _schema,
          isRoot,
          baseId: baseId2,
          root: _root,
          schemaPath: "",
          errSchemaPath: "#",
          errorPath: '""',
          MissingRefError: errorClasses.MissingRef,
          RULES,
          validate: validateGenerator,
          util,
          resolve,
          resolveRef,
          usePattern,
          useDefault,
          useCustomRule,
          opts,
          formats,
          logger: self2.logger,
          self: self2
        });
        sourceCode = vars(refVal, refValCode) + vars(patterns, patternCode) + vars(defaults, defaultCode) + vars(customRules, customRuleCode) + sourceCode;
        if (opts.processCode)
          sourceCode = opts.processCode(sourceCode, _schema);
        var validate;
        try {
          var makeValidate = new Function("self", "RULES", "formats", "root", "refVal", "defaults", "customRules", "equal", "ucs2length", "ValidationError", sourceCode);
          validate = makeValidate(self2, RULES, formats, root, refVal, defaults, customRules, equal, ucs2length, ValidationError);
          refVal[0] = validate;
        } catch (e) {
          self2.logger.error("Error compiling schema, function code:", sourceCode);
          throw e;
        }
        validate.schema = _schema;
        validate.errors = null;
        validate.refs = refs;
        validate.refVal = refVal;
        validate.root = isRoot ? validate : _root;
        if ($async)
          validate.$async = true;
        if (opts.sourceCode === true) {
          validate.source = {
            code: sourceCode,
            patterns,
            defaults
          };
        }
        return validate;
      }
      function resolveRef(baseId2, ref, isRoot) {
        ref = resolve.url(baseId2, ref);
        var refIndex = refs[ref];
        var _refVal, refCode;
        if (refIndex !== void 0) {
          _refVal = refVal[refIndex];
          refCode = "refVal[" + refIndex + "]";
          return resolvedRef(_refVal, refCode);
        }
        if (!isRoot && root.refs) {
          var rootRefId = root.refs[ref];
          if (rootRefId !== void 0) {
            _refVal = root.refVal[rootRefId];
            refCode = addLocalRef(ref, _refVal);
            return resolvedRef(_refVal, refCode);
          }
        }
        refCode = addLocalRef(ref);
        var v2 = resolve.call(self2, localCompile, root, ref);
        if (v2 === void 0) {
          var localSchema = localRefs && localRefs[ref];
          if (localSchema) {
            v2 = resolve.inlineRef(localSchema, opts.inlineRefs) ? localSchema : compile.call(self2, localSchema, root, localRefs, baseId2);
          }
        }
        if (v2 === void 0) {
          removeLocalRef(ref);
        } else {
          replaceLocalRef(ref, v2);
          return resolvedRef(v2, refCode);
        }
      }
      function addLocalRef(ref, v2) {
        var refId = refVal.length;
        refVal[refId] = v2;
        refs[ref] = refId;
        return "refVal" + refId;
      }
      function removeLocalRef(ref) {
        delete refs[ref];
      }
      function replaceLocalRef(ref, v2) {
        var refId = refs[ref];
        refVal[refId] = v2;
      }
      function resolvedRef(refVal2, code) {
        return typeof refVal2 == "object" || typeof refVal2 == "boolean" ? {code, schema: refVal2, inline: true} : {code, $async: refVal2 && !!refVal2.$async};
      }
      function usePattern(regexStr) {
        var index = patternsHash[regexStr];
        if (index === void 0) {
          index = patternsHash[regexStr] = patterns.length;
          patterns[index] = regexStr;
        }
        return "pattern" + index;
      }
      function useDefault(value) {
        switch (typeof value) {
          case "boolean":
          case "number":
            return "" + value;
          case "string":
            return util.toQuotedString(value);
          case "object":
            if (value === null)
              return "null";
            var valueStr = stableStringify(value);
            var index = defaultsHash[valueStr];
            if (index === void 0) {
              index = defaultsHash[valueStr] = defaults.length;
              defaults[index] = value;
            }
            return "default" + index;
        }
      }
      function useCustomRule(rule, schema2, parentSchema, it) {
        if (self2._opts.validateSchema !== false) {
          var deps = rule.definition.dependencies;
          if (deps && !deps.every(function(keyword) {
            return Object.prototype.hasOwnProperty.call(parentSchema, keyword);
          }))
            throw new Error("parent schema must have all required keywords: " + deps.join(","));
          var validateSchema = rule.definition.validateSchema;
          if (validateSchema) {
            var valid = validateSchema(schema2);
            if (!valid) {
              var message = "keyword schema is invalid: " + self2.errorsText(validateSchema.errors);
              if (self2._opts.validateSchema == "log")
                self2.logger.error(message);
              else
                throw new Error(message);
            }
          }
        }
        var compile2 = rule.definition.compile, inline = rule.definition.inline, macro = rule.definition.macro;
        var validate;
        if (compile2) {
          validate = compile2.call(self2, schema2, parentSchema, it);
        } else if (macro) {
          validate = macro.call(self2, schema2, parentSchema, it);
          if (opts.validateSchema !== false)
            self2.validateSchema(validate, true);
        } else if (inline) {
          validate = inline.call(self2, it, rule.keyword, schema2, parentSchema);
        } else {
          validate = rule.definition.validate;
          if (!validate)
            return;
        }
        if (validate === void 0)
          throw new Error('custom keyword "' + rule.keyword + '"failed to compile');
        var index = customRules.length;
        customRules[index] = validate;
        return {
          code: "customRule" + index,
          validate
        };
      }
    }
    function checkCompiling(schema, root, baseId) {
      var index = compIndex.call(this, schema, root, baseId);
      if (index >= 0)
        return {index, compiling: true};
      index = this._compilations.length;
      this._compilations[index] = {
        schema,
        root,
        baseId
      };
      return {index, compiling: false};
    }
    function endCompiling(schema, root, baseId) {
      var i = compIndex.call(this, schema, root, baseId);
      if (i >= 0)
        this._compilations.splice(i, 1);
    }
    function compIndex(schema, root, baseId) {
      for (var i = 0; i < this._compilations.length; i++) {
        var c = this._compilations[i];
        if (c.schema == schema && c.root == root && c.baseId == baseId)
          return i;
      }
      return -1;
    }
    function patternCode(i, patterns) {
      return "var pattern" + i + " = new RegExp(" + util.toQuotedString(patterns[i]) + ");";
    }
    function defaultCode(i) {
      return "var default" + i + " = defaults[" + i + "];";
    }
    function refValCode(i, refVal) {
      return refVal[i] === void 0 ? "" : "var refVal" + i + " = refVal[" + i + "];";
    }
    function customRuleCode(i) {
      return "var customRule" + i + " = customRules[" + i + "];";
    }
    function vars(arr, statement) {
      if (!arr.length)
        return "";
      var code = "";
      for (var i = 0; i < arr.length; i++)
        code += statement(i, arr);
      return code;
    }
  });

  // node_modules/ajv/lib/cache.js
  var require_cache = __commonJS((exports, module) => {
    "use strict";
    var Cache = module.exports = function Cache2() {
      this._cache = {};
    };
    Cache.prototype.put = function Cache_put(key, value) {
      this._cache[key] = value;
    };
    Cache.prototype.get = function Cache_get(key) {
      return this._cache[key];
    };
    Cache.prototype.del = function Cache_del(key) {
      delete this._cache[key];
    };
    Cache.prototype.clear = function Cache_clear() {
      this._cache = {};
    };
  });

  // node_modules/ajv/lib/compile/formats.js
  var require_formats = __commonJS((exports, module) => {
    "use strict";
    var util = require_util();
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var TIME = /^(\d\d):(\d\d):(\d\d)(\.\d+)?(z|[+-]\d\d(?::?\d\d)?)?$/i;
    var HOSTNAME = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i;
    var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    var URIREF = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    var URITEMPLATE = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
    var URL = /^(?:(?:http[s\u017F]?|ftp):\/\/)(?:(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+(?::(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?@)?(?:(?!10(?:\.[0-9]{1,3}){3})(?!127(?:\.[0-9]{1,3}){3})(?!169\.254(?:\.[0-9]{1,3}){2})(?!192\.168(?:\.[0-9]{1,3}){2})(?!172\.(?:1[6-9]|2[0-9]|3[01])(?:\.[0-9]{1,3}){2})(?:[1-9][0-9]?|1[0-9][0-9]|2[01][0-9]|22[0-3])(?:\.(?:1?[0-9]{1,2}|2[0-4][0-9]|25[0-5])){2}(?:\.(?:[1-9][0-9]?|1[0-9][0-9]|2[0-4][0-9]|25[0-4]))|(?:(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)(?:\.(?:(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+-)*(?:[0-9a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+)*(?:\.(?:(?:[a-z\xA1-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]){2,})))(?::[0-9]{2,5})?(?:\/(?:[\0-\x08\x0E-\x1F!-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*)?$/i;
    var UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
    var JSON_POINTER = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
    var JSON_POINTER_URI_FRAGMENT = /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i;
    var RELATIVE_JSON_POINTER = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
    module.exports = formats;
    function formats(mode) {
      mode = mode == "full" ? "full" : "fast";
      return util.copy(formats[mode]);
    }
    formats.fast = {
      date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
      time: /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i,
      "date-time": /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i,
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      "uri-template": URITEMPLATE,
      url: URL,
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
      hostname: HOSTNAME,
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
      ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
      regex,
      uuid: UUID,
      "json-pointer": JSON_POINTER,
      "json-pointer-uri-fragment": JSON_POINTER_URI_FRAGMENT,
      "relative-json-pointer": RELATIVE_JSON_POINTER
    };
    formats.full = {
      date,
      time,
      "date-time": date_time,
      uri,
      "uri-reference": URIREF,
      "uri-template": URITEMPLATE,
      url: URL,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: HOSTNAME,
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
      ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
      regex,
      uuid: UUID,
      "json-pointer": JSON_POINTER,
      "json-pointer-uri-fragment": JSON_POINTER_URI_FRAGMENT,
      "relative-json-pointer": RELATIVE_JSON_POINTER
    };
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    function date(str) {
      var matches = str.match(DATE);
      if (!matches)
        return false;
      var year = +matches[1];
      var month = +matches[2];
      var day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    function time(str, full) {
      var matches = str.match(TIME);
      if (!matches)
        return false;
      var hour = matches[1];
      var minute = matches[2];
      var second = matches[3];
      var timeZone = matches[5];
      return (hour <= 23 && minute <= 59 && second <= 59 || hour == 23 && minute == 59 && second == 60) && (!full || timeZone);
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function date_time(str) {
      var dateTime = str.split(DATE_TIME_SEPARATOR);
      return dateTime.length == 2 && date(dateTime[0]) && time(dateTime[1], true);
    }
    var NOT_URI_FRAGMENT = /\/|:/;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  });

  // node_modules/ajv/lib/dotjs/ref.js
  var require_ref = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_ref(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $async, $refCode;
      if ($schema == "#" || $schema == "#/") {
        if (it.isRoot) {
          $async = it.async;
          $refCode = "validate";
        } else {
          $async = it.root.schema.$async === true;
          $refCode = "root.refVal[0]";
        }
      } else {
        var $refVal = it.resolveRef(it.baseId, $schema, it.isRoot);
        if ($refVal === void 0) {
          var $message = it.MissingRefError.message(it.baseId, $schema);
          if (it.opts.missingRefs == "fail") {
            it.logger.error($message);
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = "";
            if (it.createErrors !== false) {
              out += " { keyword: '$ref' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { ref: '" + it.util.escapeQuotes($schema) + "' } ";
              if (it.opts.messages !== false) {
                out += " , message: 'can\\'t resolve reference " + it.util.escapeQuotes($schema) + "' ";
              }
              if (it.opts.verbose) {
                out += " , schema: " + it.util.toQuotedString($schema) + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
              }
              out += " } ";
            } else {
              out += " {} ";
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              if (it.async) {
                out += " throw new ValidationError([" + __err + "]); ";
              } else {
                out += " validate.errors = [" + __err + "]; return false; ";
              }
            } else {
              out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
            }
            if ($breakOnError) {
              out += " if (false) { ";
            }
          } else if (it.opts.missingRefs == "ignore") {
            it.logger.warn($message);
            if ($breakOnError) {
              out += " if (true) { ";
            }
          } else {
            throw new it.MissingRefError(it.baseId, $schema, $message);
          }
        } else if ($refVal.inline) {
          var $it = it.util.copy(it);
          $it.level++;
          var $nextValid = "valid" + $it.level;
          $it.schema = $refVal.schema;
          $it.schemaPath = "";
          $it.errSchemaPath = $schema;
          var $code = it.validate($it).replace(/validate\.schema/g, $refVal.code);
          out += " " + $code + " ";
          if ($breakOnError) {
            out += " if (" + $nextValid + ") { ";
          }
        } else {
          $async = $refVal.$async === true || it.async && $refVal.$async !== false;
          $refCode = $refVal.code;
        }
      }
      if ($refCode) {
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = "";
        if (it.opts.passContext) {
          out += " " + $refCode + ".call(this, ";
        } else {
          out += " " + $refCode + "( ";
        }
        out += " " + $data + ", (dataPath || '')";
        if (it.errorPath != '""') {
          out += " + " + it.errorPath;
        }
        var $parentData = $dataLvl ? "data" + ($dataLvl - 1 || "") : "parentData", $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : "parentDataProperty";
        out += " , " + $parentData + " , " + $parentDataProperty + ", rootData)  ";
        var __callValidate = out;
        out = $$outStack.pop();
        if ($async) {
          if (!it.async)
            throw new Error("async schema referenced by sync schema");
          if ($breakOnError) {
            out += " var " + $valid + "; ";
          }
          out += " try { await " + __callValidate + "; ";
          if ($breakOnError) {
            out += " " + $valid + " = true; ";
          }
          out += " } catch (e) { if (!(e instanceof ValidationError)) throw e; if (vErrors === null) vErrors = e.errors; else vErrors = vErrors.concat(e.errors); errors = vErrors.length; ";
          if ($breakOnError) {
            out += " " + $valid + " = false; ";
          }
          out += " } ";
          if ($breakOnError) {
            out += " if (" + $valid + ") { ";
          }
        } else {
          out += " if (!" + __callValidate + ") { if (vErrors === null) vErrors = " + $refCode + ".errors; else vErrors = vErrors.concat(" + $refCode + ".errors); errors = vErrors.length; } ";
          if ($breakOnError) {
            out += " else { ";
          }
        }
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/allOf.js
  var require_allOf = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_allOf(it, $keyword, $ruleType) {
      var out = " ";
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $currentBaseId = $it.baseId, $allSchemasEmpty = true;
      var arr1 = $schema;
      if (arr1) {
        var $sch, $i = -1, l1 = arr1.length - 1;
        while ($i < l1) {
          $sch = arr1[$i += 1];
          if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
            $allSchemasEmpty = false;
            $it.schema = $sch;
            $it.schemaPath = $schemaPath + "[" + $i + "]";
            $it.errSchemaPath = $errSchemaPath + "/" + $i;
            out += "  " + it.validate($it) + " ";
            $it.baseId = $currentBaseId;
            if ($breakOnError) {
              out += " if (" + $nextValid + ") { ";
              $closingBraces += "}";
            }
          }
        }
      }
      if ($breakOnError) {
        if ($allSchemasEmpty) {
          out += " if (true) { ";
        } else {
          out += " " + $closingBraces.slice(0, -1) + " ";
        }
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/anyOf.js
  var require_anyOf = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_anyOf(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $noEmptySchema = $schema.every(function($sch2) {
        return it.opts.strictKeywords ? typeof $sch2 == "object" && Object.keys($sch2).length > 0 || $sch2 === false : it.util.schemaHasRules($sch2, it.RULES.all);
      });
      if ($noEmptySchema) {
        var $currentBaseId = $it.baseId;
        out += " var " + $errs + " = errors; var " + $valid + " = false;  ";
        var $wasComposite = it.compositeRule;
        it.compositeRule = $it.compositeRule = true;
        var arr1 = $schema;
        if (arr1) {
          var $sch, $i = -1, l1 = arr1.length - 1;
          while ($i < l1) {
            $sch = arr1[$i += 1];
            $it.schema = $sch;
            $it.schemaPath = $schemaPath + "[" + $i + "]";
            $it.errSchemaPath = $errSchemaPath + "/" + $i;
            out += "  " + it.validate($it) + " ";
            $it.baseId = $currentBaseId;
            out += " " + $valid + " = " + $valid + " || " + $nextValid + "; if (!" + $valid + ") { ";
            $closingBraces += "}";
          }
        }
        it.compositeRule = $it.compositeRule = $wasComposite;
        out += " " + $closingBraces + " if (!" + $valid + ") {   var err =   ";
        if (it.createErrors !== false) {
          out += " { keyword: 'anyOf' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
          if (it.opts.messages !== false) {
            out += " , message: 'should match some schema in anyOf' ";
          }
          if (it.opts.verbose) {
            out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        if (!it.compositeRule && $breakOnError) {
          if (it.async) {
            out += " throw new ValidationError(vErrors); ";
          } else {
            out += " validate.errors = vErrors; return false; ";
          }
        }
        out += " } else {  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; } ";
        if (it.opts.allErrors) {
          out += " } ";
        }
      } else {
        if ($breakOnError) {
          out += " if (true) { ";
        }
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/comment.js
  var require_comment = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_comment(it, $keyword, $ruleType) {
      var out = " ";
      var $schema = it.schema[$keyword];
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $comment = it.util.toQuotedString($schema);
      if (it.opts.$comment === true) {
        out += " console.log(" + $comment + ");";
      } else if (typeof it.opts.$comment == "function") {
        out += " self._opts.$comment(" + $comment + ", " + it.util.toQuotedString($errSchemaPath) + ", validate.root.schema);";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/const.js
  var require_const = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_const(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      if (!$isData) {
        out += " var schema" + $lvl + " = validate.schema" + $schemaPath + ";";
      }
      out += "var " + $valid + " = equal(" + $data + ", schema" + $lvl + "); if (!" + $valid + ") {   ";
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: 'const' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { allowedValue: schema" + $lvl + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should be equal to constant' ";
        }
        if (it.opts.verbose) {
          out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += " }";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/contains.js
  var require_contains = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_contains(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $idx = "i" + $lvl, $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $currentBaseId = it.baseId, $nonEmptySchema = it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all);
      out += "var " + $errs + " = errors;var " + $valid + ";";
      if ($nonEmptySchema) {
        var $wasComposite = it.compositeRule;
        it.compositeRule = $it.compositeRule = true;
        $it.schema = $schema;
        $it.schemaPath = $schemaPath;
        $it.errSchemaPath = $errSchemaPath;
        out += " var " + $nextValid + " = false; for (var " + $idx + " = 0; " + $idx + " < " + $data + ".length; " + $idx + "++) { ";
        $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
        var $passData = $data + "[" + $idx + "]";
        $it.dataPathArr[$dataNxt] = $idx;
        var $code = it.validate($it);
        $it.baseId = $currentBaseId;
        if (it.util.varOccurences($code, $nextData) < 2) {
          out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
        } else {
          out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
        }
        out += " if (" + $nextValid + ") break; }  ";
        it.compositeRule = $it.compositeRule = $wasComposite;
        out += " " + $closingBraces + " if (!" + $nextValid + ") {";
      } else {
        out += " if (" + $data + ".length == 0) {";
      }
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: 'contains' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
        if (it.opts.messages !== false) {
          out += " , message: 'should contain a valid item' ";
        }
        if (it.opts.verbose) {
          out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += " } else { ";
      if ($nonEmptySchema) {
        out += "  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; } ";
      }
      if (it.opts.allErrors) {
        out += " } ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/dependencies.js
  var require_dependencies = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_dependencies(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $schemaDeps = {}, $propertyDeps = {}, $ownProperties = it.opts.ownProperties;
      for ($property in $schema) {
        if ($property == "__proto__")
          continue;
        var $sch = $schema[$property];
        var $deps = Array.isArray($sch) ? $propertyDeps : $schemaDeps;
        $deps[$property] = $sch;
      }
      out += "var " + $errs + " = errors;";
      var $currentErrorPath = it.errorPath;
      out += "var missing" + $lvl + ";";
      for (var $property in $propertyDeps) {
        $deps = $propertyDeps[$property];
        if ($deps.length) {
          out += " if ( " + $data + it.util.getProperty($property) + " !== undefined ";
          if ($ownProperties) {
            out += " && Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($property) + "') ";
          }
          if ($breakOnError) {
            out += " && ( ";
            var arr1 = $deps;
            if (arr1) {
              var $propertyKey, $i = -1, l1 = arr1.length - 1;
              while ($i < l1) {
                $propertyKey = arr1[$i += 1];
                if ($i) {
                  out += " || ";
                }
                var $prop = it.util.getProperty($propertyKey), $useData = $data + $prop;
                out += " ( ( " + $useData + " === undefined ";
                if ($ownProperties) {
                  out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
                }
                out += ") && (missing" + $lvl + " = " + it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop) + ") ) ";
              }
            }
            out += ")) {  ";
            var $propertyPath = "missing" + $lvl, $missingProperty = "' + " + $propertyPath + " + '";
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + " + " + $propertyPath;
            }
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = "";
            if (it.createErrors !== false) {
              out += " { keyword: 'dependencies' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { property: '" + it.util.escapeQuotes($property) + "', missingProperty: '" + $missingProperty + "', depsCount: " + $deps.length + ", deps: '" + it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", ")) + "' } ";
              if (it.opts.messages !== false) {
                out += " , message: 'should have ";
                if ($deps.length == 1) {
                  out += "property " + it.util.escapeQuotes($deps[0]);
                } else {
                  out += "properties " + it.util.escapeQuotes($deps.join(", "));
                }
                out += " when property " + it.util.escapeQuotes($property) + " is present' ";
              }
              if (it.opts.verbose) {
                out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
              }
              out += " } ";
            } else {
              out += " {} ";
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              if (it.async) {
                out += " throw new ValidationError([" + __err + "]); ";
              } else {
                out += " validate.errors = [" + __err + "]; return false; ";
              }
            } else {
              out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
            }
          } else {
            out += " ) { ";
            var arr2 = $deps;
            if (arr2) {
              var $propertyKey, i2 = -1, l2 = arr2.length - 1;
              while (i2 < l2) {
                $propertyKey = arr2[i2 += 1];
                var $prop = it.util.getProperty($propertyKey), $missingProperty = it.util.escapeQuotes($propertyKey), $useData = $data + $prop;
                if (it.opts._errorDataPathProperty) {
                  it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
                }
                out += " if ( " + $useData + " === undefined ";
                if ($ownProperties) {
                  out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
                }
                out += ") {  var err =   ";
                if (it.createErrors !== false) {
                  out += " { keyword: 'dependencies' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { property: '" + it.util.escapeQuotes($property) + "', missingProperty: '" + $missingProperty + "', depsCount: " + $deps.length + ", deps: '" + it.util.escapeQuotes($deps.length == 1 ? $deps[0] : $deps.join(", ")) + "' } ";
                  if (it.opts.messages !== false) {
                    out += " , message: 'should have ";
                    if ($deps.length == 1) {
                      out += "property " + it.util.escapeQuotes($deps[0]);
                    } else {
                      out += "properties " + it.util.escapeQuotes($deps.join(", "));
                    }
                    out += " when property " + it.util.escapeQuotes($property) + " is present' ";
                  }
                  if (it.opts.verbose) {
                    out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
                  }
                  out += " } ";
                } else {
                  out += " {} ";
                }
                out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ";
              }
            }
          }
          out += " }   ";
          if ($breakOnError) {
            $closingBraces += "}";
            out += " else { ";
          }
        }
      }
      it.errorPath = $currentErrorPath;
      var $currentBaseId = $it.baseId;
      for (var $property in $schemaDeps) {
        var $sch = $schemaDeps[$property];
        if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
          out += " " + $nextValid + " = true; if ( " + $data + it.util.getProperty($property) + " !== undefined ";
          if ($ownProperties) {
            out += " && Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($property) + "') ";
          }
          out += ") { ";
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + it.util.getProperty($property);
          $it.errSchemaPath = $errSchemaPath + "/" + it.util.escapeFragment($property);
          out += "  " + it.validate($it) + " ";
          $it.baseId = $currentBaseId;
          out += " }  ";
          if ($breakOnError) {
            out += " if (" + $nextValid + ") { ";
            $closingBraces += "}";
          }
        }
      }
      if ($breakOnError) {
        out += "   " + $closingBraces + " if (" + $errs + " == errors) {";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/enum.js
  var require_enum = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_enum(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      var $i = "i" + $lvl, $vSchema = "schema" + $lvl;
      if (!$isData) {
        out += " var " + $vSchema + " = validate.schema" + $schemaPath + ";";
      }
      out += "var " + $valid + ";";
      if ($isData) {
        out += " if (schema" + $lvl + " === undefined) " + $valid + " = true; else if (!Array.isArray(schema" + $lvl + ")) " + $valid + " = false; else {";
      }
      out += "" + $valid + " = false;for (var " + $i + "=0; " + $i + "<" + $vSchema + ".length; " + $i + "++) if (equal(" + $data + ", " + $vSchema + "[" + $i + "])) { " + $valid + " = true; break; }";
      if ($isData) {
        out += "  }  ";
      }
      out += " if (!" + $valid + ") {   ";
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: 'enum' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { allowedValues: schema" + $lvl + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should be equal to one of the allowed values' ";
        }
        if (it.opts.verbose) {
          out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += " }";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/format.js
  var require_format = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_format(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      if (it.opts.format === false) {
        if ($breakOnError) {
          out += " if (true) { ";
        }
        return out;
      }
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      var $unknownFormats = it.opts.unknownFormats, $allowUnknown = Array.isArray($unknownFormats);
      if ($isData) {
        var $format = "format" + $lvl, $isObject = "isObject" + $lvl, $formatType = "formatType" + $lvl;
        out += " var " + $format + " = formats[" + $schemaValue + "]; var " + $isObject + " = typeof " + $format + " == 'object' && !(" + $format + " instanceof RegExp) && " + $format + ".validate; var " + $formatType + " = " + $isObject + " && " + $format + ".type || 'string'; if (" + $isObject + ") { ";
        if (it.async) {
          out += " var async" + $lvl + " = " + $format + ".async; ";
        }
        out += " " + $format + " = " + $format + ".validate; } if (  ";
        if ($isData) {
          out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'string') || ";
        }
        out += " (";
        if ($unknownFormats != "ignore") {
          out += " (" + $schemaValue + " && !" + $format + " ";
          if ($allowUnknown) {
            out += " && self._opts.unknownFormats.indexOf(" + $schemaValue + ") == -1 ";
          }
          out += ") || ";
        }
        out += " (" + $format + " && " + $formatType + " == '" + $ruleType + "' && !(typeof " + $format + " == 'function' ? ";
        if (it.async) {
          out += " (async" + $lvl + " ? await " + $format + "(" + $data + ") : " + $format + "(" + $data + ")) ";
        } else {
          out += " " + $format + "(" + $data + ") ";
        }
        out += " : " + $format + ".test(" + $data + "))))) {";
      } else {
        var $format = it.formats[$schema];
        if (!$format) {
          if ($unknownFormats == "ignore") {
            it.logger.warn('unknown format "' + $schema + '" ignored in schema at path "' + it.errSchemaPath + '"');
            if ($breakOnError) {
              out += " if (true) { ";
            }
            return out;
          } else if ($allowUnknown && $unknownFormats.indexOf($schema) >= 0) {
            if ($breakOnError) {
              out += " if (true) { ";
            }
            return out;
          } else {
            throw new Error('unknown format "' + $schema + '" is used in schema at path "' + it.errSchemaPath + '"');
          }
        }
        var $isObject = typeof $format == "object" && !($format instanceof RegExp) && $format.validate;
        var $formatType = $isObject && $format.type || "string";
        if ($isObject) {
          var $async = $format.async === true;
          $format = $format.validate;
        }
        if ($formatType != $ruleType) {
          if ($breakOnError) {
            out += " if (true) { ";
          }
          return out;
        }
        if ($async) {
          if (!it.async)
            throw new Error("async format in sync schema");
          var $formatRef = "formats" + it.util.getProperty($schema) + ".validate";
          out += " if (!(await " + $formatRef + "(" + $data + "))) { ";
        } else {
          out += " if (! ";
          var $formatRef = "formats" + it.util.getProperty($schema);
          if ($isObject)
            $formatRef += ".validate";
          if (typeof $format == "function") {
            out += " " + $formatRef + "(" + $data + ") ";
          } else {
            out += " " + $formatRef + ".test(" + $data + ") ";
          }
          out += ") { ";
        }
      }
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: 'format' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { format:  ";
        if ($isData) {
          out += "" + $schemaValue;
        } else {
          out += "" + it.util.toQuotedString($schema);
        }
        out += "  } ";
        if (it.opts.messages !== false) {
          out += ` , message: 'should match format "`;
          if ($isData) {
            out += "' + " + $schemaValue + " + '";
          } else {
            out += "" + it.util.escapeQuotes($schema);
          }
          out += `"' `;
        }
        if (it.opts.verbose) {
          out += " , schema:  ";
          if ($isData) {
            out += "validate.schema" + $schemaPath;
          } else {
            out += "" + it.util.toQuotedString($schema);
          }
          out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += " } ";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/if.js
  var require_if = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_if(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $thenSch = it.schema["then"], $elseSch = it.schema["else"], $thenPresent = $thenSch !== void 0 && (it.opts.strictKeywords ? typeof $thenSch == "object" && Object.keys($thenSch).length > 0 || $thenSch === false : it.util.schemaHasRules($thenSch, it.RULES.all)), $elsePresent = $elseSch !== void 0 && (it.opts.strictKeywords ? typeof $elseSch == "object" && Object.keys($elseSch).length > 0 || $elseSch === false : it.util.schemaHasRules($elseSch, it.RULES.all)), $currentBaseId = $it.baseId;
      if ($thenPresent || $elsePresent) {
        var $ifClause;
        $it.createErrors = false;
        $it.schema = $schema;
        $it.schemaPath = $schemaPath;
        $it.errSchemaPath = $errSchemaPath;
        out += " var " + $errs + " = errors; var " + $valid + " = true;  ";
        var $wasComposite = it.compositeRule;
        it.compositeRule = $it.compositeRule = true;
        out += "  " + it.validate($it) + " ";
        $it.baseId = $currentBaseId;
        $it.createErrors = true;
        out += "  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; }  ";
        it.compositeRule = $it.compositeRule = $wasComposite;
        if ($thenPresent) {
          out += " if (" + $nextValid + ") {  ";
          $it.schema = it.schema["then"];
          $it.schemaPath = it.schemaPath + ".then";
          $it.errSchemaPath = it.errSchemaPath + "/then";
          out += "  " + it.validate($it) + " ";
          $it.baseId = $currentBaseId;
          out += " " + $valid + " = " + $nextValid + "; ";
          if ($thenPresent && $elsePresent) {
            $ifClause = "ifClause" + $lvl;
            out += " var " + $ifClause + " = 'then'; ";
          } else {
            $ifClause = "'then'";
          }
          out += " } ";
          if ($elsePresent) {
            out += " else { ";
          }
        } else {
          out += " if (!" + $nextValid + ") { ";
        }
        if ($elsePresent) {
          $it.schema = it.schema["else"];
          $it.schemaPath = it.schemaPath + ".else";
          $it.errSchemaPath = it.errSchemaPath + "/else";
          out += "  " + it.validate($it) + " ";
          $it.baseId = $currentBaseId;
          out += " " + $valid + " = " + $nextValid + "; ";
          if ($thenPresent && $elsePresent) {
            $ifClause = "ifClause" + $lvl;
            out += " var " + $ifClause + " = 'else'; ";
          } else {
            $ifClause = "'else'";
          }
          out += " } ";
        }
        out += " if (!" + $valid + ") {   var err =   ";
        if (it.createErrors !== false) {
          out += " { keyword: 'if' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { failingKeyword: " + $ifClause + " } ";
          if (it.opts.messages !== false) {
            out += ` , message: 'should match "' + ` + $ifClause + ` + '" schema' `;
          }
          if (it.opts.verbose) {
            out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        if (!it.compositeRule && $breakOnError) {
          if (it.async) {
            out += " throw new ValidationError(vErrors); ";
          } else {
            out += " validate.errors = vErrors; return false; ";
          }
        }
        out += " }   ";
        if ($breakOnError) {
          out += " else { ";
        }
      } else {
        if ($breakOnError) {
          out += " if (true) { ";
        }
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/items.js
  var require_items = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_items(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $idx = "i" + $lvl, $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $currentBaseId = it.baseId;
      out += "var " + $errs + " = errors;var " + $valid + ";";
      if (Array.isArray($schema)) {
        var $additionalItems = it.schema.additionalItems;
        if ($additionalItems === false) {
          out += " " + $valid + " = " + $data + ".length <= " + $schema.length + "; ";
          var $currErrSchemaPath = $errSchemaPath;
          $errSchemaPath = it.errSchemaPath + "/additionalItems";
          out += "  if (!" + $valid + ") {   ";
          var $$outStack = $$outStack || [];
          $$outStack.push(out);
          out = "";
          if (it.createErrors !== false) {
            out += " { keyword: 'additionalItems' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schema.length + " } ";
            if (it.opts.messages !== false) {
              out += " , message: 'should NOT have more than " + $schema.length + " items' ";
            }
            if (it.opts.verbose) {
              out += " , schema: false , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
            }
            out += " } ";
          } else {
            out += " {} ";
          }
          var __err = out;
          out = $$outStack.pop();
          if (!it.compositeRule && $breakOnError) {
            if (it.async) {
              out += " throw new ValidationError([" + __err + "]); ";
            } else {
              out += " validate.errors = [" + __err + "]; return false; ";
            }
          } else {
            out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
          }
          out += " } ";
          $errSchemaPath = $currErrSchemaPath;
          if ($breakOnError) {
            $closingBraces += "}";
            out += " else { ";
          }
        }
        var arr1 = $schema;
        if (arr1) {
          var $sch, $i = -1, l1 = arr1.length - 1;
          while ($i < l1) {
            $sch = arr1[$i += 1];
            if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
              out += " " + $nextValid + " = true; if (" + $data + ".length > " + $i + ") { ";
              var $passData = $data + "[" + $i + "]";
              $it.schema = $sch;
              $it.schemaPath = $schemaPath + "[" + $i + "]";
              $it.errSchemaPath = $errSchemaPath + "/" + $i;
              $it.errorPath = it.util.getPathExpr(it.errorPath, $i, it.opts.jsonPointers, true);
              $it.dataPathArr[$dataNxt] = $i;
              var $code = it.validate($it);
              $it.baseId = $currentBaseId;
              if (it.util.varOccurences($code, $nextData) < 2) {
                out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
              } else {
                out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
              }
              out += " }  ";
              if ($breakOnError) {
                out += " if (" + $nextValid + ") { ";
                $closingBraces += "}";
              }
            }
          }
        }
        if (typeof $additionalItems == "object" && (it.opts.strictKeywords ? typeof $additionalItems == "object" && Object.keys($additionalItems).length > 0 || $additionalItems === false : it.util.schemaHasRules($additionalItems, it.RULES.all))) {
          $it.schema = $additionalItems;
          $it.schemaPath = it.schemaPath + ".additionalItems";
          $it.errSchemaPath = it.errSchemaPath + "/additionalItems";
          out += " " + $nextValid + " = true; if (" + $data + ".length > " + $schema.length + ") {  for (var " + $idx + " = " + $schema.length + "; " + $idx + " < " + $data + ".length; " + $idx + "++) { ";
          $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
          var $passData = $data + "[" + $idx + "]";
          $it.dataPathArr[$dataNxt] = $idx;
          var $code = it.validate($it);
          $it.baseId = $currentBaseId;
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
          } else {
            out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
          }
          if ($breakOnError) {
            out += " if (!" + $nextValid + ") break; ";
          }
          out += " } }  ";
          if ($breakOnError) {
            out += " if (" + $nextValid + ") { ";
            $closingBraces += "}";
          }
        }
      } else if (it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all)) {
        $it.schema = $schema;
        $it.schemaPath = $schemaPath;
        $it.errSchemaPath = $errSchemaPath;
        out += "  for (var " + $idx + " = " + 0 + "; " + $idx + " < " + $data + ".length; " + $idx + "++) { ";
        $it.errorPath = it.util.getPathExpr(it.errorPath, $idx, it.opts.jsonPointers, true);
        var $passData = $data + "[" + $idx + "]";
        $it.dataPathArr[$dataNxt] = $idx;
        var $code = it.validate($it);
        $it.baseId = $currentBaseId;
        if (it.util.varOccurences($code, $nextData) < 2) {
          out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
        } else {
          out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
        }
        if ($breakOnError) {
          out += " if (!" + $nextValid + ") break; ";
        }
        out += " }";
      }
      if ($breakOnError) {
        out += " " + $closingBraces + " if (" + $errs + " == errors) {";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/_limit.js
  var require_limit = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate__limit(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $errorKeyword;
      var $data = "data" + ($dataLvl || "");
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      var $isMax = $keyword == "maximum", $exclusiveKeyword = $isMax ? "exclusiveMaximum" : "exclusiveMinimum", $schemaExcl = it.schema[$exclusiveKeyword], $isDataExcl = it.opts.$data && $schemaExcl && $schemaExcl.$data, $op = $isMax ? "<" : ">", $notOp = $isMax ? ">" : "<", $errorKeyword = void 0;
      if (!($isData || typeof $schema == "number" || $schema === void 0)) {
        throw new Error($keyword + " must be number");
      }
      if (!($isDataExcl || $schemaExcl === void 0 || typeof $schemaExcl == "number" || typeof $schemaExcl == "boolean")) {
        throw new Error($exclusiveKeyword + " must be number or boolean");
      }
      if ($isDataExcl) {
        var $schemaValueExcl = it.util.getData($schemaExcl.$data, $dataLvl, it.dataPathArr), $exclusive = "exclusive" + $lvl, $exclType = "exclType" + $lvl, $exclIsNumber = "exclIsNumber" + $lvl, $opExpr = "op" + $lvl, $opStr = "' + " + $opExpr + " + '";
        out += " var schemaExcl" + $lvl + " = " + $schemaValueExcl + "; ";
        $schemaValueExcl = "schemaExcl" + $lvl;
        out += " var " + $exclusive + "; var " + $exclType + " = typeof " + $schemaValueExcl + "; if (" + $exclType + " != 'boolean' && " + $exclType + " != 'undefined' && " + $exclType + " != 'number') { ";
        var $errorKeyword = $exclusiveKeyword;
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = "";
        if (it.createErrors !== false) {
          out += " { keyword: '" + ($errorKeyword || "_exclusiveLimit") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
          if (it.opts.messages !== false) {
            out += " , message: '" + $exclusiveKeyword + " should be boolean' ";
          }
          if (it.opts.verbose) {
            out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          if (it.async) {
            out += " throw new ValidationError([" + __err + "]); ";
          } else {
            out += " validate.errors = [" + __err + "]; return false; ";
          }
        } else {
          out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        }
        out += " } else if ( ";
        if ($isData) {
          out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
        }
        out += " " + $exclType + " == 'number' ? ( (" + $exclusive + " = " + $schemaValue + " === undefined || " + $schemaValueExcl + " " + $op + "= " + $schemaValue + ") ? " + $data + " " + $notOp + "= " + $schemaValueExcl + " : " + $data + " " + $notOp + " " + $schemaValue + " ) : ( (" + $exclusive + " = " + $schemaValueExcl + " === true) ? " + $data + " " + $notOp + "= " + $schemaValue + " : " + $data + " " + $notOp + " " + $schemaValue + " ) || " + $data + " !== " + $data + ") { var op" + $lvl + " = " + $exclusive + " ? '" + $op + "' : '" + $op + "='; ";
        if ($schema === void 0) {
          $errorKeyword = $exclusiveKeyword;
          $errSchemaPath = it.errSchemaPath + "/" + $exclusiveKeyword;
          $schemaValue = $schemaValueExcl;
          $isData = $isDataExcl;
        }
      } else {
        var $exclIsNumber = typeof $schemaExcl == "number", $opStr = $op;
        if ($exclIsNumber && $isData) {
          var $opExpr = "'" + $opStr + "'";
          out += " if ( ";
          if ($isData) {
            out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
          }
          out += " ( " + $schemaValue + " === undefined || " + $schemaExcl + " " + $op + "= " + $schemaValue + " ? " + $data + " " + $notOp + "= " + $schemaExcl + " : " + $data + " " + $notOp + " " + $schemaValue + " ) || " + $data + " !== " + $data + ") { ";
        } else {
          if ($exclIsNumber && $schema === void 0) {
            $exclusive = true;
            $errorKeyword = $exclusiveKeyword;
            $errSchemaPath = it.errSchemaPath + "/" + $exclusiveKeyword;
            $schemaValue = $schemaExcl;
            $notOp += "=";
          } else {
            if ($exclIsNumber)
              $schemaValue = Math[$isMax ? "min" : "max"]($schemaExcl, $schema);
            if ($schemaExcl === ($exclIsNumber ? $schemaValue : true)) {
              $exclusive = true;
              $errorKeyword = $exclusiveKeyword;
              $errSchemaPath = it.errSchemaPath + "/" + $exclusiveKeyword;
              $notOp += "=";
            } else {
              $exclusive = false;
              $opStr += "=";
            }
          }
          var $opExpr = "'" + $opStr + "'";
          out += " if ( ";
          if ($isData) {
            out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
          }
          out += " " + $data + " " + $notOp + " " + $schemaValue + " || " + $data + " !== " + $data + ") { ";
        }
      }
      $errorKeyword = $errorKeyword || $keyword;
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: '" + ($errorKeyword || "_limit") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { comparison: " + $opExpr + ", limit: " + $schemaValue + ", exclusive: " + $exclusive + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should be " + $opStr + " ";
          if ($isData) {
            out += "' + " + $schemaValue;
          } else {
            out += "" + $schemaValue + "'";
          }
        }
        if (it.opts.verbose) {
          out += " , schema:  ";
          if ($isData) {
            out += "validate.schema" + $schemaPath;
          } else {
            out += "" + $schema;
          }
          out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += " } ";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/_limitItems.js
  var require_limitItems = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate__limitItems(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $errorKeyword;
      var $data = "data" + ($dataLvl || "");
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      if (!($isData || typeof $schema == "number")) {
        throw new Error($keyword + " must be number");
      }
      var $op = $keyword == "maxItems" ? ">" : "<";
      out += "if ( ";
      if ($isData) {
        out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
      }
      out += " " + $data + ".length " + $op + " " + $schemaValue + ") { ";
      var $errorKeyword = $keyword;
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: '" + ($errorKeyword || "_limitItems") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schemaValue + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should NOT have ";
          if ($keyword == "maxItems") {
            out += "more";
          } else {
            out += "fewer";
          }
          out += " than ";
          if ($isData) {
            out += "' + " + $schemaValue + " + '";
          } else {
            out += "" + $schema;
          }
          out += " items' ";
        }
        if (it.opts.verbose) {
          out += " , schema:  ";
          if ($isData) {
            out += "validate.schema" + $schemaPath;
          } else {
            out += "" + $schema;
          }
          out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += "} ";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/_limitLength.js
  var require_limitLength = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate__limitLength(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $errorKeyword;
      var $data = "data" + ($dataLvl || "");
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      if (!($isData || typeof $schema == "number")) {
        throw new Error($keyword + " must be number");
      }
      var $op = $keyword == "maxLength" ? ">" : "<";
      out += "if ( ";
      if ($isData) {
        out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
      }
      if (it.opts.unicode === false) {
        out += " " + $data + ".length ";
      } else {
        out += " ucs2length(" + $data + ") ";
      }
      out += " " + $op + " " + $schemaValue + ") { ";
      var $errorKeyword = $keyword;
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: '" + ($errorKeyword || "_limitLength") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schemaValue + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should NOT be ";
          if ($keyword == "maxLength") {
            out += "longer";
          } else {
            out += "shorter";
          }
          out += " than ";
          if ($isData) {
            out += "' + " + $schemaValue + " + '";
          } else {
            out += "" + $schema;
          }
          out += " characters' ";
        }
        if (it.opts.verbose) {
          out += " , schema:  ";
          if ($isData) {
            out += "validate.schema" + $schemaPath;
          } else {
            out += "" + $schema;
          }
          out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += "} ";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/_limitProperties.js
  var require_limitProperties = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate__limitProperties(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $errorKeyword;
      var $data = "data" + ($dataLvl || "");
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      if (!($isData || typeof $schema == "number")) {
        throw new Error($keyword + " must be number");
      }
      var $op = $keyword == "maxProperties" ? ">" : "<";
      out += "if ( ";
      if ($isData) {
        out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'number') || ";
      }
      out += " Object.keys(" + $data + ").length " + $op + " " + $schemaValue + ") { ";
      var $errorKeyword = $keyword;
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: '" + ($errorKeyword || "_limitProperties") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { limit: " + $schemaValue + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should NOT have ";
          if ($keyword == "maxProperties") {
            out += "more";
          } else {
            out += "fewer";
          }
          out += " than ";
          if ($isData) {
            out += "' + " + $schemaValue + " + '";
          } else {
            out += "" + $schema;
          }
          out += " properties' ";
        }
        if (it.opts.verbose) {
          out += " , schema:  ";
          if ($isData) {
            out += "validate.schema" + $schemaPath;
          } else {
            out += "" + $schema;
          }
          out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += "} ";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/multipleOf.js
  var require_multipleOf = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_multipleOf(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      if (!($isData || typeof $schema == "number")) {
        throw new Error($keyword + " must be number");
      }
      out += "var division" + $lvl + ";if (";
      if ($isData) {
        out += " " + $schemaValue + " !== undefined && ( typeof " + $schemaValue + " != 'number' || ";
      }
      out += " (division" + $lvl + " = " + $data + " / " + $schemaValue + ", ";
      if (it.opts.multipleOfPrecision) {
        out += " Math.abs(Math.round(division" + $lvl + ") - division" + $lvl + ") > 1e-" + it.opts.multipleOfPrecision + " ";
      } else {
        out += " division" + $lvl + " !== parseInt(division" + $lvl + ") ";
      }
      out += " ) ";
      if ($isData) {
        out += "  )  ";
      }
      out += " ) {   ";
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: 'multipleOf' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { multipleOf: " + $schemaValue + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should be multiple of ";
          if ($isData) {
            out += "' + " + $schemaValue;
          } else {
            out += "" + $schemaValue + "'";
          }
        }
        if (it.opts.verbose) {
          out += " , schema:  ";
          if ($isData) {
            out += "validate.schema" + $schemaPath;
          } else {
            out += "" + $schema;
          }
          out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += "} ";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/not.js
  var require_not = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_not(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      $it.level++;
      var $nextValid = "valid" + $it.level;
      if (it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all)) {
        $it.schema = $schema;
        $it.schemaPath = $schemaPath;
        $it.errSchemaPath = $errSchemaPath;
        out += " var " + $errs + " = errors;  ";
        var $wasComposite = it.compositeRule;
        it.compositeRule = $it.compositeRule = true;
        $it.createErrors = false;
        var $allErrorsOption;
        if ($it.opts.allErrors) {
          $allErrorsOption = $it.opts.allErrors;
          $it.opts.allErrors = false;
        }
        out += " " + it.validate($it) + " ";
        $it.createErrors = true;
        if ($allErrorsOption)
          $it.opts.allErrors = $allErrorsOption;
        it.compositeRule = $it.compositeRule = $wasComposite;
        out += " if (" + $nextValid + ") {   ";
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = "";
        if (it.createErrors !== false) {
          out += " { keyword: 'not' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
          if (it.opts.messages !== false) {
            out += " , message: 'should NOT be valid' ";
          }
          if (it.opts.verbose) {
            out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          if (it.async) {
            out += " throw new ValidationError([" + __err + "]); ";
          } else {
            out += " validate.errors = [" + __err + "]; return false; ";
          }
        } else {
          out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        }
        out += " } else {  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; } ";
        if (it.opts.allErrors) {
          out += " } ";
        }
      } else {
        out += "  var err =   ";
        if (it.createErrors !== false) {
          out += " { keyword: 'not' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: {} ";
          if (it.opts.messages !== false) {
            out += " , message: 'should NOT be valid' ";
          }
          if (it.opts.verbose) {
            out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        if ($breakOnError) {
          out += " if (false) { ";
        }
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/oneOf.js
  var require_oneOf = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_oneOf(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $currentBaseId = $it.baseId, $prevValid = "prevValid" + $lvl, $passingSchemas = "passingSchemas" + $lvl;
      out += "var " + $errs + " = errors , " + $prevValid + " = false , " + $valid + " = false , " + $passingSchemas + " = null; ";
      var $wasComposite = it.compositeRule;
      it.compositeRule = $it.compositeRule = true;
      var arr1 = $schema;
      if (arr1) {
        var $sch, $i = -1, l1 = arr1.length - 1;
        while ($i < l1) {
          $sch = arr1[$i += 1];
          if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
            $it.schema = $sch;
            $it.schemaPath = $schemaPath + "[" + $i + "]";
            $it.errSchemaPath = $errSchemaPath + "/" + $i;
            out += "  " + it.validate($it) + " ";
            $it.baseId = $currentBaseId;
          } else {
            out += " var " + $nextValid + " = true; ";
          }
          if ($i) {
            out += " if (" + $nextValid + " && " + $prevValid + ") { " + $valid + " = false; " + $passingSchemas + " = [" + $passingSchemas + ", " + $i + "]; } else { ";
            $closingBraces += "}";
          }
          out += " if (" + $nextValid + ") { " + $valid + " = " + $prevValid + " = true; " + $passingSchemas + " = " + $i + "; }";
        }
      }
      it.compositeRule = $it.compositeRule = $wasComposite;
      out += "" + $closingBraces + "if (!" + $valid + ") {   var err =   ";
      if (it.createErrors !== false) {
        out += " { keyword: 'oneOf' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { passingSchemas: " + $passingSchemas + " } ";
        if (it.opts.messages !== false) {
          out += " , message: 'should match exactly one schema in oneOf' ";
        }
        if (it.opts.verbose) {
          out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError(vErrors); ";
        } else {
          out += " validate.errors = vErrors; return false; ";
        }
      }
      out += "} else {  errors = " + $errs + "; if (vErrors !== null) { if (" + $errs + ") vErrors.length = " + $errs + "; else vErrors = null; }";
      if (it.opts.allErrors) {
        out += " } ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/pattern.js
  var require_pattern = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_pattern(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      var $regexp = $isData ? "(new RegExp(" + $schemaValue + "))" : it.usePattern($schema);
      out += "if ( ";
      if ($isData) {
        out += " (" + $schemaValue + " !== undefined && typeof " + $schemaValue + " != 'string') || ";
      }
      out += " !" + $regexp + ".test(" + $data + ") ) {   ";
      var $$outStack = $$outStack || [];
      $$outStack.push(out);
      out = "";
      if (it.createErrors !== false) {
        out += " { keyword: 'pattern' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { pattern:  ";
        if ($isData) {
          out += "" + $schemaValue;
        } else {
          out += "" + it.util.toQuotedString($schema);
        }
        out += "  } ";
        if (it.opts.messages !== false) {
          out += ` , message: 'should match pattern "`;
          if ($isData) {
            out += "' + " + $schemaValue + " + '";
          } else {
            out += "" + it.util.escapeQuotes($schema);
          }
          out += `"' `;
        }
        if (it.opts.verbose) {
          out += " , schema:  ";
          if ($isData) {
            out += "validate.schema" + $schemaPath;
          } else {
            out += "" + it.util.toQuotedString($schema);
          }
          out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
        }
        out += " } ";
      } else {
        out += " {} ";
      }
      var __err = out;
      out = $$outStack.pop();
      if (!it.compositeRule && $breakOnError) {
        if (it.async) {
          out += " throw new ValidationError([" + __err + "]); ";
        } else {
          out += " validate.errors = [" + __err + "]; return false; ";
        }
      } else {
        out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
      }
      out += "} ";
      if ($breakOnError) {
        out += " else { ";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/properties.js
  var require_properties = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_properties(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      var $key = "key" + $lvl, $idx = "idx" + $lvl, $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $dataProperties = "dataProperties" + $lvl;
      var $schemaKeys = Object.keys($schema || {}).filter(notProto), $pProperties = it.schema.patternProperties || {}, $pPropertyKeys = Object.keys($pProperties).filter(notProto), $aProperties = it.schema.additionalProperties, $someProperties = $schemaKeys.length || $pPropertyKeys.length, $noAdditional = $aProperties === false, $additionalIsSchema = typeof $aProperties == "object" && Object.keys($aProperties).length, $removeAdditional = it.opts.removeAdditional, $checkAdditional = $noAdditional || $additionalIsSchema || $removeAdditional, $ownProperties = it.opts.ownProperties, $currentBaseId = it.baseId;
      var $required = it.schema.required;
      if ($required && !(it.opts.$data && $required.$data) && $required.length < it.opts.loopRequired) {
        var $requiredHash = it.util.toHash($required);
      }
      function notProto(p) {
        return p !== "__proto__";
      }
      out += "var " + $errs + " = errors;var " + $nextValid + " = true;";
      if ($ownProperties) {
        out += " var " + $dataProperties + " = undefined;";
      }
      if ($checkAdditional) {
        if ($ownProperties) {
          out += " " + $dataProperties + " = " + $dataProperties + " || Object.keys(" + $data + "); for (var " + $idx + "=0; " + $idx + "<" + $dataProperties + ".length; " + $idx + "++) { var " + $key + " = " + $dataProperties + "[" + $idx + "]; ";
        } else {
          out += " for (var " + $key + " in " + $data + ") { ";
        }
        if ($someProperties) {
          out += " var isAdditional" + $lvl + " = !(false ";
          if ($schemaKeys.length) {
            if ($schemaKeys.length > 8) {
              out += " || validate.schema" + $schemaPath + ".hasOwnProperty(" + $key + ") ";
            } else {
              var arr1 = $schemaKeys;
              if (arr1) {
                var $propertyKey, i1 = -1, l1 = arr1.length - 1;
                while (i1 < l1) {
                  $propertyKey = arr1[i1 += 1];
                  out += " || " + $key + " == " + it.util.toQuotedString($propertyKey) + " ";
                }
              }
            }
          }
          if ($pPropertyKeys.length) {
            var arr2 = $pPropertyKeys;
            if (arr2) {
              var $pProperty, $i = -1, l2 = arr2.length - 1;
              while ($i < l2) {
                $pProperty = arr2[$i += 1];
                out += " || " + it.usePattern($pProperty) + ".test(" + $key + ") ";
              }
            }
          }
          out += " ); if (isAdditional" + $lvl + ") { ";
        }
        if ($removeAdditional == "all") {
          out += " delete " + $data + "[" + $key + "]; ";
        } else {
          var $currentErrorPath = it.errorPath;
          var $additionalProperty = "' + " + $key + " + '";
          if (it.opts._errorDataPathProperty) {
            it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
          }
          if ($noAdditional) {
            if ($removeAdditional) {
              out += " delete " + $data + "[" + $key + "]; ";
            } else {
              out += " " + $nextValid + " = false; ";
              var $currErrSchemaPath = $errSchemaPath;
              $errSchemaPath = it.errSchemaPath + "/additionalProperties";
              var $$outStack = $$outStack || [];
              $$outStack.push(out);
              out = "";
              if (it.createErrors !== false) {
                out += " { keyword: 'additionalProperties' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { additionalProperty: '" + $additionalProperty + "' } ";
                if (it.opts.messages !== false) {
                  out += " , message: '";
                  if (it.opts._errorDataPathProperty) {
                    out += "is an invalid additional property";
                  } else {
                    out += "should NOT have additional properties";
                  }
                  out += "' ";
                }
                if (it.opts.verbose) {
                  out += " , schema: false , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
                }
                out += " } ";
              } else {
                out += " {} ";
              }
              var __err = out;
              out = $$outStack.pop();
              if (!it.compositeRule && $breakOnError) {
                if (it.async) {
                  out += " throw new ValidationError([" + __err + "]); ";
                } else {
                  out += " validate.errors = [" + __err + "]; return false; ";
                }
              } else {
                out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
              }
              $errSchemaPath = $currErrSchemaPath;
              if ($breakOnError) {
                out += " break; ";
              }
            }
          } else if ($additionalIsSchema) {
            if ($removeAdditional == "failing") {
              out += " var " + $errs + " = errors;  ";
              var $wasComposite = it.compositeRule;
              it.compositeRule = $it.compositeRule = true;
              $it.schema = $aProperties;
              $it.schemaPath = it.schemaPath + ".additionalProperties";
              $it.errSchemaPath = it.errSchemaPath + "/additionalProperties";
              $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
              var $passData = $data + "[" + $key + "]";
              $it.dataPathArr[$dataNxt] = $key;
              var $code = it.validate($it);
              $it.baseId = $currentBaseId;
              if (it.util.varOccurences($code, $nextData) < 2) {
                out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
              } else {
                out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
              }
              out += " if (!" + $nextValid + ") { errors = " + $errs + "; if (validate.errors !== null) { if (errors) validate.errors.length = errors; else validate.errors = null; } delete " + $data + "[" + $key + "]; }  ";
              it.compositeRule = $it.compositeRule = $wasComposite;
            } else {
              $it.schema = $aProperties;
              $it.schemaPath = it.schemaPath + ".additionalProperties";
              $it.errSchemaPath = it.errSchemaPath + "/additionalProperties";
              $it.errorPath = it.opts._errorDataPathProperty ? it.errorPath : it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
              var $passData = $data + "[" + $key + "]";
              $it.dataPathArr[$dataNxt] = $key;
              var $code = it.validate($it);
              $it.baseId = $currentBaseId;
              if (it.util.varOccurences($code, $nextData) < 2) {
                out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
              } else {
                out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
              }
              if ($breakOnError) {
                out += " if (!" + $nextValid + ") break; ";
              }
            }
          }
          it.errorPath = $currentErrorPath;
        }
        if ($someProperties) {
          out += " } ";
        }
        out += " }  ";
        if ($breakOnError) {
          out += " if (" + $nextValid + ") { ";
          $closingBraces += "}";
        }
      }
      var $useDefaults = it.opts.useDefaults && !it.compositeRule;
      if ($schemaKeys.length) {
        var arr3 = $schemaKeys;
        if (arr3) {
          var $propertyKey, i3 = -1, l3 = arr3.length - 1;
          while (i3 < l3) {
            $propertyKey = arr3[i3 += 1];
            var $sch = $schema[$propertyKey];
            if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
              var $prop = it.util.getProperty($propertyKey), $passData = $data + $prop, $hasDefault = $useDefaults && $sch.default !== void 0;
              $it.schema = $sch;
              $it.schemaPath = $schemaPath + $prop;
              $it.errSchemaPath = $errSchemaPath + "/" + it.util.escapeFragment($propertyKey);
              $it.errorPath = it.util.getPath(it.errorPath, $propertyKey, it.opts.jsonPointers);
              $it.dataPathArr[$dataNxt] = it.util.toQuotedString($propertyKey);
              var $code = it.validate($it);
              $it.baseId = $currentBaseId;
              if (it.util.varOccurences($code, $nextData) < 2) {
                $code = it.util.varReplace($code, $nextData, $passData);
                var $useData = $passData;
              } else {
                var $useData = $nextData;
                out += " var " + $nextData + " = " + $passData + "; ";
              }
              if ($hasDefault) {
                out += " " + $code + " ";
              } else {
                if ($requiredHash && $requiredHash[$propertyKey]) {
                  out += " if ( " + $useData + " === undefined ";
                  if ($ownProperties) {
                    out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
                  }
                  out += ") { " + $nextValid + " = false; ";
                  var $currentErrorPath = it.errorPath, $currErrSchemaPath = $errSchemaPath, $missingProperty = it.util.escapeQuotes($propertyKey);
                  if (it.opts._errorDataPathProperty) {
                    it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
                  }
                  $errSchemaPath = it.errSchemaPath + "/required";
                  var $$outStack = $$outStack || [];
                  $$outStack.push(out);
                  out = "";
                  if (it.createErrors !== false) {
                    out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
                    if (it.opts.messages !== false) {
                      out += " , message: '";
                      if (it.opts._errorDataPathProperty) {
                        out += "is a required property";
                      } else {
                        out += "should have required property \\'" + $missingProperty + "\\'";
                      }
                      out += "' ";
                    }
                    if (it.opts.verbose) {
                      out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
                    }
                    out += " } ";
                  } else {
                    out += " {} ";
                  }
                  var __err = out;
                  out = $$outStack.pop();
                  if (!it.compositeRule && $breakOnError) {
                    if (it.async) {
                      out += " throw new ValidationError([" + __err + "]); ";
                    } else {
                      out += " validate.errors = [" + __err + "]; return false; ";
                    }
                  } else {
                    out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
                  }
                  $errSchemaPath = $currErrSchemaPath;
                  it.errorPath = $currentErrorPath;
                  out += " } else { ";
                } else {
                  if ($breakOnError) {
                    out += " if ( " + $useData + " === undefined ";
                    if ($ownProperties) {
                      out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
                    }
                    out += ") { " + $nextValid + " = true; } else { ";
                  } else {
                    out += " if (" + $useData + " !== undefined ";
                    if ($ownProperties) {
                      out += " &&   Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
                    }
                    out += " ) { ";
                  }
                }
                out += " " + $code + " } ";
              }
            }
            if ($breakOnError) {
              out += " if (" + $nextValid + ") { ";
              $closingBraces += "}";
            }
          }
        }
      }
      if ($pPropertyKeys.length) {
        var arr4 = $pPropertyKeys;
        if (arr4) {
          var $pProperty, i4 = -1, l4 = arr4.length - 1;
          while (i4 < l4) {
            $pProperty = arr4[i4 += 1];
            var $sch = $pProperties[$pProperty];
            if (it.opts.strictKeywords ? typeof $sch == "object" && Object.keys($sch).length > 0 || $sch === false : it.util.schemaHasRules($sch, it.RULES.all)) {
              $it.schema = $sch;
              $it.schemaPath = it.schemaPath + ".patternProperties" + it.util.getProperty($pProperty);
              $it.errSchemaPath = it.errSchemaPath + "/patternProperties/" + it.util.escapeFragment($pProperty);
              if ($ownProperties) {
                out += " " + $dataProperties + " = " + $dataProperties + " || Object.keys(" + $data + "); for (var " + $idx + "=0; " + $idx + "<" + $dataProperties + ".length; " + $idx + "++) { var " + $key + " = " + $dataProperties + "[" + $idx + "]; ";
              } else {
                out += " for (var " + $key + " in " + $data + ") { ";
              }
              out += " if (" + it.usePattern($pProperty) + ".test(" + $key + ")) { ";
              $it.errorPath = it.util.getPathExpr(it.errorPath, $key, it.opts.jsonPointers);
              var $passData = $data + "[" + $key + "]";
              $it.dataPathArr[$dataNxt] = $key;
              var $code = it.validate($it);
              $it.baseId = $currentBaseId;
              if (it.util.varOccurences($code, $nextData) < 2) {
                out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
              } else {
                out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
              }
              if ($breakOnError) {
                out += " if (!" + $nextValid + ") break; ";
              }
              out += " } ";
              if ($breakOnError) {
                out += " else " + $nextValid + " = true; ";
              }
              out += " }  ";
              if ($breakOnError) {
                out += " if (" + $nextValid + ") { ";
                $closingBraces += "}";
              }
            }
          }
        }
      }
      if ($breakOnError) {
        out += " " + $closingBraces + " if (" + $errs + " == errors) {";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/propertyNames.js
  var require_propertyNames = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_propertyNames(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $errs = "errs__" + $lvl;
      var $it = it.util.copy(it);
      var $closingBraces = "";
      $it.level++;
      var $nextValid = "valid" + $it.level;
      out += "var " + $errs + " = errors;";
      if (it.opts.strictKeywords ? typeof $schema == "object" && Object.keys($schema).length > 0 || $schema === false : it.util.schemaHasRules($schema, it.RULES.all)) {
        $it.schema = $schema;
        $it.schemaPath = $schemaPath;
        $it.errSchemaPath = $errSchemaPath;
        var $key = "key" + $lvl, $idx = "idx" + $lvl, $i = "i" + $lvl, $invalidName = "' + " + $key + " + '", $dataNxt = $it.dataLevel = it.dataLevel + 1, $nextData = "data" + $dataNxt, $dataProperties = "dataProperties" + $lvl, $ownProperties = it.opts.ownProperties, $currentBaseId = it.baseId;
        if ($ownProperties) {
          out += " var " + $dataProperties + " = undefined; ";
        }
        if ($ownProperties) {
          out += " " + $dataProperties + " = " + $dataProperties + " || Object.keys(" + $data + "); for (var " + $idx + "=0; " + $idx + "<" + $dataProperties + ".length; " + $idx + "++) { var " + $key + " = " + $dataProperties + "[" + $idx + "]; ";
        } else {
          out += " for (var " + $key + " in " + $data + ") { ";
        }
        out += " var startErrs" + $lvl + " = errors; ";
        var $passData = $key;
        var $wasComposite = it.compositeRule;
        it.compositeRule = $it.compositeRule = true;
        var $code = it.validate($it);
        $it.baseId = $currentBaseId;
        if (it.util.varOccurences($code, $nextData) < 2) {
          out += " " + it.util.varReplace($code, $nextData, $passData) + " ";
        } else {
          out += " var " + $nextData + " = " + $passData + "; " + $code + " ";
        }
        it.compositeRule = $it.compositeRule = $wasComposite;
        out += " if (!" + $nextValid + ") { for (var " + $i + "=startErrs" + $lvl + "; " + $i + "<errors; " + $i + "++) { vErrors[" + $i + "].propertyName = " + $key + "; }   var err =   ";
        if (it.createErrors !== false) {
          out += " { keyword: 'propertyNames' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { propertyName: '" + $invalidName + "' } ";
          if (it.opts.messages !== false) {
            out += " , message: 'property name \\'" + $invalidName + "\\' is invalid' ";
          }
          if (it.opts.verbose) {
            out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        if (!it.compositeRule && $breakOnError) {
          if (it.async) {
            out += " throw new ValidationError(vErrors); ";
          } else {
            out += " validate.errors = vErrors; return false; ";
          }
        }
        if ($breakOnError) {
          out += " break; ";
        }
        out += " } }";
      }
      if ($breakOnError) {
        out += " " + $closingBraces + " if (" + $errs + " == errors) {";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/required.js
  var require_required = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_required(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      var $vSchema = "schema" + $lvl;
      if (!$isData) {
        if ($schema.length < it.opts.loopRequired && it.schema.properties && Object.keys(it.schema.properties).length) {
          var $required = [];
          var arr1 = $schema;
          if (arr1) {
            var $property, i1 = -1, l1 = arr1.length - 1;
            while (i1 < l1) {
              $property = arr1[i1 += 1];
              var $propertySch = it.schema.properties[$property];
              if (!($propertySch && (it.opts.strictKeywords ? typeof $propertySch == "object" && Object.keys($propertySch).length > 0 || $propertySch === false : it.util.schemaHasRules($propertySch, it.RULES.all)))) {
                $required[$required.length] = $property;
              }
            }
          }
        } else {
          var $required = $schema;
        }
      }
      if ($isData || $required.length) {
        var $currentErrorPath = it.errorPath, $loopRequired = $isData || $required.length >= it.opts.loopRequired, $ownProperties = it.opts.ownProperties;
        if ($breakOnError) {
          out += " var missing" + $lvl + "; ";
          if ($loopRequired) {
            if (!$isData) {
              out += " var " + $vSchema + " = validate.schema" + $schemaPath + "; ";
            }
            var $i = "i" + $lvl, $propertyPath = "schema" + $lvl + "[" + $i + "]", $missingProperty = "' + " + $propertyPath + " + '";
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
            }
            out += " var " + $valid + " = true; ";
            if ($isData) {
              out += " if (schema" + $lvl + " === undefined) " + $valid + " = true; else if (!Array.isArray(schema" + $lvl + ")) " + $valid + " = false; else {";
            }
            out += " for (var " + $i + " = 0; " + $i + " < " + $vSchema + ".length; " + $i + "++) { " + $valid + " = " + $data + "[" + $vSchema + "[" + $i + "]] !== undefined ";
            if ($ownProperties) {
              out += " &&   Object.prototype.hasOwnProperty.call(" + $data + ", " + $vSchema + "[" + $i + "]) ";
            }
            out += "; if (!" + $valid + ") break; } ";
            if ($isData) {
              out += "  }  ";
            }
            out += "  if (!" + $valid + ") {   ";
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = "";
            if (it.createErrors !== false) {
              out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
              if (it.opts.messages !== false) {
                out += " , message: '";
                if (it.opts._errorDataPathProperty) {
                  out += "is a required property";
                } else {
                  out += "should have required property \\'" + $missingProperty + "\\'";
                }
                out += "' ";
              }
              if (it.opts.verbose) {
                out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
              }
              out += " } ";
            } else {
              out += " {} ";
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              if (it.async) {
                out += " throw new ValidationError([" + __err + "]); ";
              } else {
                out += " validate.errors = [" + __err + "]; return false; ";
              }
            } else {
              out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
            }
            out += " } else { ";
          } else {
            out += " if ( ";
            var arr2 = $required;
            if (arr2) {
              var $propertyKey, $i = -1, l2 = arr2.length - 1;
              while ($i < l2) {
                $propertyKey = arr2[$i += 1];
                if ($i) {
                  out += " || ";
                }
                var $prop = it.util.getProperty($propertyKey), $useData = $data + $prop;
                out += " ( ( " + $useData + " === undefined ";
                if ($ownProperties) {
                  out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
                }
                out += ") && (missing" + $lvl + " = " + it.util.toQuotedString(it.opts.jsonPointers ? $propertyKey : $prop) + ") ) ";
              }
            }
            out += ") {  ";
            var $propertyPath = "missing" + $lvl, $missingProperty = "' + " + $propertyPath + " + '";
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + " + " + $propertyPath;
            }
            var $$outStack = $$outStack || [];
            $$outStack.push(out);
            out = "";
            if (it.createErrors !== false) {
              out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
              if (it.opts.messages !== false) {
                out += " , message: '";
                if (it.opts._errorDataPathProperty) {
                  out += "is a required property";
                } else {
                  out += "should have required property \\'" + $missingProperty + "\\'";
                }
                out += "' ";
              }
              if (it.opts.verbose) {
                out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
              }
              out += " } ";
            } else {
              out += " {} ";
            }
            var __err = out;
            out = $$outStack.pop();
            if (!it.compositeRule && $breakOnError) {
              if (it.async) {
                out += " throw new ValidationError([" + __err + "]); ";
              } else {
                out += " validate.errors = [" + __err + "]; return false; ";
              }
            } else {
              out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
            }
            out += " } else { ";
          }
        } else {
          if ($loopRequired) {
            if (!$isData) {
              out += " var " + $vSchema + " = validate.schema" + $schemaPath + "; ";
            }
            var $i = "i" + $lvl, $propertyPath = "schema" + $lvl + "[" + $i + "]", $missingProperty = "' + " + $propertyPath + " + '";
            if (it.opts._errorDataPathProperty) {
              it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
            }
            if ($isData) {
              out += " if (" + $vSchema + " && !Array.isArray(" + $vSchema + ")) {  var err =   ";
              if (it.createErrors !== false) {
                out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
                if (it.opts.messages !== false) {
                  out += " , message: '";
                  if (it.opts._errorDataPathProperty) {
                    out += "is a required property";
                  } else {
                    out += "should have required property \\'" + $missingProperty + "\\'";
                  }
                  out += "' ";
                }
                if (it.opts.verbose) {
                  out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
                }
                out += " } ";
              } else {
                out += " {} ";
              }
              out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } else if (" + $vSchema + " !== undefined) { ";
            }
            out += " for (var " + $i + " = 0; " + $i + " < " + $vSchema + ".length; " + $i + "++) { if (" + $data + "[" + $vSchema + "[" + $i + "]] === undefined ";
            if ($ownProperties) {
              out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", " + $vSchema + "[" + $i + "]) ";
            }
            out += ") {  var err =   ";
            if (it.createErrors !== false) {
              out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
              if (it.opts.messages !== false) {
                out += " , message: '";
                if (it.opts._errorDataPathProperty) {
                  out += "is a required property";
                } else {
                  out += "should have required property \\'" + $missingProperty + "\\'";
                }
                out += "' ";
              }
              if (it.opts.verbose) {
                out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
              }
              out += " } ";
            } else {
              out += " {} ";
            }
            out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } } ";
            if ($isData) {
              out += "  }  ";
            }
          } else {
            var arr3 = $required;
            if (arr3) {
              var $propertyKey, i3 = -1, l3 = arr3.length - 1;
              while (i3 < l3) {
                $propertyKey = arr3[i3 += 1];
                var $prop = it.util.getProperty($propertyKey), $missingProperty = it.util.escapeQuotes($propertyKey), $useData = $data + $prop;
                if (it.opts._errorDataPathProperty) {
                  it.errorPath = it.util.getPath($currentErrorPath, $propertyKey, it.opts.jsonPointers);
                }
                out += " if ( " + $useData + " === undefined ";
                if ($ownProperties) {
                  out += " || ! Object.prototype.hasOwnProperty.call(" + $data + ", '" + it.util.escapeQuotes($propertyKey) + "') ";
                }
                out += ") {  var err =   ";
                if (it.createErrors !== false) {
                  out += " { keyword: 'required' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { missingProperty: '" + $missingProperty + "' } ";
                  if (it.opts.messages !== false) {
                    out += " , message: '";
                    if (it.opts._errorDataPathProperty) {
                      out += "is a required property";
                    } else {
                      out += "should have required property \\'" + $missingProperty + "\\'";
                    }
                    out += "' ";
                  }
                  if (it.opts.verbose) {
                    out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
                  }
                  out += " } ";
                } else {
                  out += " {} ";
                }
                out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ";
              }
            }
          }
        }
        it.errorPath = $currentErrorPath;
      } else if ($breakOnError) {
        out += " if (true) {";
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/uniqueItems.js
  var require_uniqueItems = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_uniqueItems(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      if (($schema || $isData) && it.opts.uniqueItems !== false) {
        if ($isData) {
          out += " var " + $valid + "; if (" + $schemaValue + " === false || " + $schemaValue + " === undefined) " + $valid + " = true; else if (typeof " + $schemaValue + " != 'boolean') " + $valid + " = false; else { ";
        }
        out += " var i = " + $data + ".length , " + $valid + " = true , j; if (i > 1) { ";
        var $itemType = it.schema.items && it.schema.items.type, $typeIsArray = Array.isArray($itemType);
        if (!$itemType || $itemType == "object" || $itemType == "array" || $typeIsArray && ($itemType.indexOf("object") >= 0 || $itemType.indexOf("array") >= 0)) {
          out += " outer: for (;i--;) { for (j = i; j--;) { if (equal(" + $data + "[i], " + $data + "[j])) { " + $valid + " = false; break outer; } } } ";
        } else {
          out += " var itemIndices = {}, item; for (;i--;) { var item = " + $data + "[i]; ";
          var $method = "checkDataType" + ($typeIsArray ? "s" : "");
          out += " if (" + it.util[$method]($itemType, "item", it.opts.strictNumbers, true) + ") continue; ";
          if ($typeIsArray) {
            out += ` if (typeof item == 'string') item = '"' + item; `;
          }
          out += " if (typeof itemIndices[item] == 'number') { " + $valid + " = false; j = itemIndices[item]; break; } itemIndices[item] = i; } ";
        }
        out += " } ";
        if ($isData) {
          out += "  }  ";
        }
        out += " if (!" + $valid + ") {   ";
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = "";
        if (it.createErrors !== false) {
          out += " { keyword: 'uniqueItems' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { i: i, j: j } ";
          if (it.opts.messages !== false) {
            out += " , message: 'should NOT have duplicate items (items ## ' + j + ' and ' + i + ' are identical)' ";
          }
          if (it.opts.verbose) {
            out += " , schema:  ";
            if ($isData) {
              out += "validate.schema" + $schemaPath;
            } else {
              out += "" + $schema;
            }
            out += "         , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          if (it.async) {
            out += " throw new ValidationError([" + __err + "]); ";
          } else {
            out += " validate.errors = [" + __err + "]; return false; ";
          }
        } else {
          out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        }
        out += " } ";
        if ($breakOnError) {
          out += " else { ";
        }
      } else {
        if ($breakOnError) {
          out += " if (true) { ";
        }
      }
      return out;
    };
  });

  // node_modules/ajv/lib/dotjs/index.js
  var require_dotjs = __commonJS((exports, module) => {
    "use strict";
    module.exports = {
      $ref: require_ref(),
      allOf: require_allOf(),
      anyOf: require_anyOf(),
      $comment: require_comment(),
      const: require_const(),
      contains: require_contains(),
      dependencies: require_dependencies(),
      enum: require_enum(),
      format: require_format(),
      if: require_if(),
      items: require_items(),
      maximum: require_limit(),
      minimum: require_limit(),
      maxItems: require_limitItems(),
      minItems: require_limitItems(),
      maxLength: require_limitLength(),
      minLength: require_limitLength(),
      maxProperties: require_limitProperties(),
      minProperties: require_limitProperties(),
      multipleOf: require_multipleOf(),
      not: require_not(),
      oneOf: require_oneOf(),
      pattern: require_pattern(),
      properties: require_properties(),
      propertyNames: require_propertyNames(),
      required: require_required(),
      uniqueItems: require_uniqueItems(),
      validate: require_validate()
    };
  });

  // node_modules/ajv/lib/compile/rules.js
  var require_rules = __commonJS((exports, module) => {
    "use strict";
    var ruleModules = require_dotjs();
    var toHash = require_util().toHash;
    module.exports = function rules() {
      var RULES = [
        {
          type: "number",
          rules: [
            {maximum: ["exclusiveMaximum"]},
            {minimum: ["exclusiveMinimum"]},
            "multipleOf",
            "format"
          ]
        },
        {
          type: "string",
          rules: ["maxLength", "minLength", "pattern", "format"]
        },
        {
          type: "array",
          rules: ["maxItems", "minItems", "items", "contains", "uniqueItems"]
        },
        {
          type: "object",
          rules: [
            "maxProperties",
            "minProperties",
            "required",
            "dependencies",
            "propertyNames",
            {properties: ["additionalProperties", "patternProperties"]}
          ]
        },
        {rules: ["$ref", "const", "enum", "not", "anyOf", "oneOf", "allOf", "if"]}
      ];
      var ALL = ["type", "$comment"];
      var KEYWORDS = [
        "$schema",
        "$id",
        "id",
        "$data",
        "$async",
        "title",
        "description",
        "default",
        "definitions",
        "examples",
        "readOnly",
        "writeOnly",
        "contentMediaType",
        "contentEncoding",
        "additionalItems",
        "then",
        "else"
      ];
      var TYPES = ["number", "integer", "string", "array", "object", "boolean", "null"];
      RULES.all = toHash(ALL);
      RULES.types = toHash(TYPES);
      RULES.forEach(function(group) {
        group.rules = group.rules.map(function(keyword) {
          var implKeywords;
          if (typeof keyword == "object") {
            var key = Object.keys(keyword)[0];
            implKeywords = keyword[key];
            keyword = key;
            implKeywords.forEach(function(k) {
              ALL.push(k);
              RULES.all[k] = true;
            });
          }
          ALL.push(keyword);
          var rule = RULES.all[keyword] = {
            keyword,
            code: ruleModules[keyword],
            implements: implKeywords
          };
          return rule;
        });
        RULES.all.$comment = {
          keyword: "$comment",
          code: ruleModules.$comment
        };
        if (group.type)
          RULES.types[group.type] = group;
      });
      RULES.keywords = toHash(ALL.concat(KEYWORDS));
      RULES.custom = {};
      return RULES;
    };
  });

  // node_modules/ajv/lib/data.js
  var require_data = __commonJS((exports, module) => {
    "use strict";
    var KEYWORDS = [
      "multipleOf",
      "maximum",
      "exclusiveMaximum",
      "minimum",
      "exclusiveMinimum",
      "maxLength",
      "minLength",
      "pattern",
      "additionalItems",
      "maxItems",
      "minItems",
      "uniqueItems",
      "maxProperties",
      "minProperties",
      "required",
      "additionalProperties",
      "enum",
      "format",
      "const"
    ];
    module.exports = function(metaSchema, keywordsJsonPointers) {
      for (var i = 0; i < keywordsJsonPointers.length; i++) {
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        var segments = keywordsJsonPointers[i].split("/");
        var keywords = metaSchema;
        var j;
        for (j = 1; j < segments.length; j++)
          keywords = keywords[segments[j]];
        for (j = 0; j < KEYWORDS.length; j++) {
          var key = KEYWORDS[j];
          var schema = keywords[key];
          if (schema) {
            keywords[key] = {
              anyOf: [
                schema,
                {$ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"}
              ]
            };
          }
        }
      }
      return metaSchema;
    };
  });

  // node_modules/ajv/lib/compile/async.js
  var require_async = __commonJS((exports, module) => {
    "use strict";
    var MissingRefError = require_error_classes().MissingRef;
    module.exports = compileAsync;
    function compileAsync(schema, meta, callback) {
      var self2 = this;
      if (typeof this._opts.loadSchema != "function")
        throw new Error("options.loadSchema should be a function");
      if (typeof meta == "function") {
        callback = meta;
        meta = void 0;
      }
      var p = loadMetaSchemaOf(schema).then(function() {
        var schemaObj = self2._addSchema(schema, void 0, meta);
        return schemaObj.validate || _compileAsync(schemaObj);
      });
      if (callback) {
        p.then(function(v) {
          callback(null, v);
        }, callback);
      }
      return p;
      function loadMetaSchemaOf(sch) {
        var $schema = sch.$schema;
        return $schema && !self2.getSchema($schema) ? compileAsync.call(self2, {$ref: $schema}, true) : Promise.resolve();
      }
      function _compileAsync(schemaObj) {
        try {
          return self2._compile(schemaObj);
        } catch (e) {
          if (e instanceof MissingRefError)
            return loadMissingSchema(e);
          throw e;
        }
        function loadMissingSchema(e) {
          var ref = e.missingSchema;
          if (added(ref))
            throw new Error("Schema " + ref + " is loaded but " + e.missingRef + " cannot be resolved");
          var schemaPromise = self2._loadingSchemas[ref];
          if (!schemaPromise) {
            schemaPromise = self2._loadingSchemas[ref] = self2._opts.loadSchema(ref);
            schemaPromise.then(removePromise, removePromise);
          }
          return schemaPromise.then(function(sch) {
            if (!added(ref)) {
              return loadMetaSchemaOf(sch).then(function() {
                if (!added(ref))
                  self2.addSchema(sch, ref, void 0, meta);
              });
            }
          }).then(function() {
            return _compileAsync(schemaObj);
          });
          function removePromise() {
            delete self2._loadingSchemas[ref];
          }
          function added(ref2) {
            return self2._refs[ref2] || self2._schemas[ref2];
          }
        }
      }
    }
  });

  // node_modules/ajv/lib/dotjs/custom.js
  var require_custom = __commonJS((exports, module) => {
    "use strict";
    module.exports = function generate_custom(it, $keyword, $ruleType) {
      var out = " ";
      var $lvl = it.level;
      var $dataLvl = it.dataLevel;
      var $schema = it.schema[$keyword];
      var $schemaPath = it.schemaPath + it.util.getProperty($keyword);
      var $errSchemaPath = it.errSchemaPath + "/" + $keyword;
      var $breakOnError = !it.opts.allErrors;
      var $errorKeyword;
      var $data = "data" + ($dataLvl || "");
      var $valid = "valid" + $lvl;
      var $errs = "errs__" + $lvl;
      var $isData = it.opts.$data && $schema && $schema.$data, $schemaValue;
      if ($isData) {
        out += " var schema" + $lvl + " = " + it.util.getData($schema.$data, $dataLvl, it.dataPathArr) + "; ";
        $schemaValue = "schema" + $lvl;
      } else {
        $schemaValue = $schema;
      }
      var $rule = this, $definition = "definition" + $lvl, $rDef = $rule.definition, $closingBraces = "";
      var $compile, $inline, $macro, $ruleValidate, $validateCode;
      if ($isData && $rDef.$data) {
        $validateCode = "keywordValidate" + $lvl;
        var $validateSchema = $rDef.validateSchema;
        out += " var " + $definition + " = RULES.custom['" + $keyword + "'].definition; var " + $validateCode + " = " + $definition + ".validate;";
      } else {
        $ruleValidate = it.useCustomRule($rule, $schema, it.schema, it);
        if (!$ruleValidate)
          return;
        $schemaValue = "validate.schema" + $schemaPath;
        $validateCode = $ruleValidate.code;
        $compile = $rDef.compile;
        $inline = $rDef.inline;
        $macro = $rDef.macro;
      }
      var $ruleErrs = $validateCode + ".errors", $i = "i" + $lvl, $ruleErr = "ruleErr" + $lvl, $asyncKeyword = $rDef.async;
      if ($asyncKeyword && !it.async)
        throw new Error("async keyword in sync schema");
      if (!($inline || $macro)) {
        out += "" + $ruleErrs + " = null;";
      }
      out += "var " + $errs + " = errors;var " + $valid + ";";
      if ($isData && $rDef.$data) {
        $closingBraces += "}";
        out += " if (" + $schemaValue + " === undefined) { " + $valid + " = true; } else { ";
        if ($validateSchema) {
          $closingBraces += "}";
          out += " " + $valid + " = " + $definition + ".validateSchema(" + $schemaValue + "); if (" + $valid + ") { ";
        }
      }
      if ($inline) {
        if ($rDef.statements) {
          out += " " + $ruleValidate.validate + " ";
        } else {
          out += " " + $valid + " = " + $ruleValidate.validate + "; ";
        }
      } else if ($macro) {
        var $it = it.util.copy(it);
        var $closingBraces = "";
        $it.level++;
        var $nextValid = "valid" + $it.level;
        $it.schema = $ruleValidate.validate;
        $it.schemaPath = "";
        var $wasComposite = it.compositeRule;
        it.compositeRule = $it.compositeRule = true;
        var $code = it.validate($it).replace(/validate\.schema/g, $validateCode);
        it.compositeRule = $it.compositeRule = $wasComposite;
        out += " " + $code;
      } else {
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = "";
        out += "  " + $validateCode + ".call( ";
        if (it.opts.passContext) {
          out += "this";
        } else {
          out += "self";
        }
        if ($compile || $rDef.schema === false) {
          out += " , " + $data + " ";
        } else {
          out += " , " + $schemaValue + " , " + $data + " , validate.schema" + it.schemaPath + " ";
        }
        out += " , (dataPath || '')";
        if (it.errorPath != '""') {
          out += " + " + it.errorPath;
        }
        var $parentData = $dataLvl ? "data" + ($dataLvl - 1 || "") : "parentData", $parentDataProperty = $dataLvl ? it.dataPathArr[$dataLvl] : "parentDataProperty";
        out += " , " + $parentData + " , " + $parentDataProperty + " , rootData )  ";
        var def_callRuleValidate = out;
        out = $$outStack.pop();
        if ($rDef.errors === false) {
          out += " " + $valid + " = ";
          if ($asyncKeyword) {
            out += "await ";
          }
          out += "" + def_callRuleValidate + "; ";
        } else {
          if ($asyncKeyword) {
            $ruleErrs = "customErrors" + $lvl;
            out += " var " + $ruleErrs + " = null; try { " + $valid + " = await " + def_callRuleValidate + "; } catch (e) { " + $valid + " = false; if (e instanceof ValidationError) " + $ruleErrs + " = e.errors; else throw e; } ";
          } else {
            out += " " + $ruleErrs + " = null; " + $valid + " = " + def_callRuleValidate + "; ";
          }
        }
      }
      if ($rDef.modifying) {
        out += " if (" + $parentData + ") " + $data + " = " + $parentData + "[" + $parentDataProperty + "];";
      }
      out += "" + $closingBraces;
      if ($rDef.valid) {
        if ($breakOnError) {
          out += " if (true) { ";
        }
      } else {
        out += " if ( ";
        if ($rDef.valid === void 0) {
          out += " !";
          if ($macro) {
            out += "" + $nextValid;
          } else {
            out += "" + $valid;
          }
        } else {
          out += " " + !$rDef.valid + " ";
        }
        out += ") { ";
        $errorKeyword = $rule.keyword;
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = "";
        var $$outStack = $$outStack || [];
        $$outStack.push(out);
        out = "";
        if (it.createErrors !== false) {
          out += " { keyword: '" + ($errorKeyword || "custom") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { keyword: '" + $rule.keyword + "' } ";
          if (it.opts.messages !== false) {
            out += ` , message: 'should pass "` + $rule.keyword + `" keyword validation' `;
          }
          if (it.opts.verbose) {
            out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
          }
          out += " } ";
        } else {
          out += " {} ";
        }
        var __err = out;
        out = $$outStack.pop();
        if (!it.compositeRule && $breakOnError) {
          if (it.async) {
            out += " throw new ValidationError([" + __err + "]); ";
          } else {
            out += " validate.errors = [" + __err + "]; return false; ";
          }
        } else {
          out += " var err = " + __err + ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
        }
        var def_customError = out;
        out = $$outStack.pop();
        if ($inline) {
          if ($rDef.errors) {
            if ($rDef.errors != "full") {
              out += "  for (var " + $i + "=" + $errs + "; " + $i + "<errors; " + $i + "++) { var " + $ruleErr + " = vErrors[" + $i + "]; if (" + $ruleErr + ".dataPath === undefined) " + $ruleErr + ".dataPath = (dataPath || '') + " + it.errorPath + "; if (" + $ruleErr + ".schemaPath === undefined) { " + $ruleErr + '.schemaPath = "' + $errSchemaPath + '"; } ';
              if (it.opts.verbose) {
                out += " " + $ruleErr + ".schema = " + $schemaValue + "; " + $ruleErr + ".data = " + $data + "; ";
              }
              out += " } ";
            }
          } else {
            if ($rDef.errors === false) {
              out += " " + def_customError + " ";
            } else {
              out += " if (" + $errs + " == errors) { " + def_customError + " } else {  for (var " + $i + "=" + $errs + "; " + $i + "<errors; " + $i + "++) { var " + $ruleErr + " = vErrors[" + $i + "]; if (" + $ruleErr + ".dataPath === undefined) " + $ruleErr + ".dataPath = (dataPath || '') + " + it.errorPath + "; if (" + $ruleErr + ".schemaPath === undefined) { " + $ruleErr + '.schemaPath = "' + $errSchemaPath + '"; } ';
              if (it.opts.verbose) {
                out += " " + $ruleErr + ".schema = " + $schemaValue + "; " + $ruleErr + ".data = " + $data + "; ";
              }
              out += " } } ";
            }
          }
        } else if ($macro) {
          out += "   var err =   ";
          if (it.createErrors !== false) {
            out += " { keyword: '" + ($errorKeyword || "custom") + "' , dataPath: (dataPath || '') + " + it.errorPath + " , schemaPath: " + it.util.toQuotedString($errSchemaPath) + " , params: { keyword: '" + $rule.keyword + "' } ";
            if (it.opts.messages !== false) {
              out += ` , message: 'should pass "` + $rule.keyword + `" keyword validation' `;
            }
            if (it.opts.verbose) {
              out += " , schema: validate.schema" + $schemaPath + " , parentSchema: validate.schema" + it.schemaPath + " , data: " + $data + " ";
            }
            out += " } ";
          } else {
            out += " {} ";
          }
          out += ";  if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ";
          if (!it.compositeRule && $breakOnError) {
            if (it.async) {
              out += " throw new ValidationError(vErrors); ";
            } else {
              out += " validate.errors = vErrors; return false; ";
            }
          }
        } else {
          if ($rDef.errors === false) {
            out += " " + def_customError + " ";
          } else {
            out += " if (Array.isArray(" + $ruleErrs + ")) { if (vErrors === null) vErrors = " + $ruleErrs + "; else vErrors = vErrors.concat(" + $ruleErrs + "); errors = vErrors.length;  for (var " + $i + "=" + $errs + "; " + $i + "<errors; " + $i + "++) { var " + $ruleErr + " = vErrors[" + $i + "]; if (" + $ruleErr + ".dataPath === undefined) " + $ruleErr + ".dataPath = (dataPath || '') + " + it.errorPath + ";  " + $ruleErr + '.schemaPath = "' + $errSchemaPath + '";  ';
            if (it.opts.verbose) {
              out += " " + $ruleErr + ".schema = " + $schemaValue + "; " + $ruleErr + ".data = " + $data + "; ";
            }
            out += " } } else { " + def_customError + " } ";
          }
        }
        out += " } ";
        if ($breakOnError) {
          out += " else { ";
        }
      }
      return out;
    };
  });

  // node_modules/ajv/lib/refs/json-schema-draft-07.json
  var require_json_schema_draft_07 = __commonJS((exports, module) => {
    module.exports = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://json-schema.org/draft-07/schema#",
      title: "Core schema meta-schema",
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: {$ref: "#"}
        },
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          allOf: [
            {$ref: "#/definitions/nonNegativeInteger"},
            {default: 0}
          ]
        },
        simpleTypes: {
          enum: [
            "array",
            "boolean",
            "integer",
            "null",
            "number",
            "object",
            "string"
          ]
        },
        stringArray: {
          type: "array",
          items: {type: "string"},
          uniqueItems: true,
          default: []
        }
      },
      type: ["object", "boolean"],
      properties: {
        $id: {
          type: "string",
          format: "uri-reference"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        $comment: {
          type: "string"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: true,
        readOnly: {
          type: "boolean",
          default: false
        },
        examples: {
          type: "array",
          items: true
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: {$ref: "#/definitions/nonNegativeInteger"},
        minLength: {$ref: "#/definitions/nonNegativeIntegerDefault0"},
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: {$ref: "#"},
        items: {
          anyOf: [
            {$ref: "#"},
            {$ref: "#/definitions/schemaArray"}
          ],
          default: true
        },
        maxItems: {$ref: "#/definitions/nonNegativeInteger"},
        minItems: {$ref: "#/definitions/nonNegativeIntegerDefault0"},
        uniqueItems: {
          type: "boolean",
          default: false
        },
        contains: {$ref: "#"},
        maxProperties: {$ref: "#/definitions/nonNegativeInteger"},
        minProperties: {$ref: "#/definitions/nonNegativeIntegerDefault0"},
        required: {$ref: "#/definitions/stringArray"},
        additionalProperties: {$ref: "#"},
        definitions: {
          type: "object",
          additionalProperties: {$ref: "#"},
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: {$ref: "#"},
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: {$ref: "#"},
          propertyNames: {format: "regex"},
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [
              {$ref: "#"},
              {$ref: "#/definitions/stringArray"}
            ]
          }
        },
        propertyNames: {$ref: "#"},
        const: true,
        enum: {
          type: "array",
          items: true,
          minItems: 1,
          uniqueItems: true
        },
        type: {
          anyOf: [
            {$ref: "#/definitions/simpleTypes"},
            {
              type: "array",
              items: {$ref: "#/definitions/simpleTypes"},
              minItems: 1,
              uniqueItems: true
            }
          ]
        },
        format: {type: "string"},
        contentMediaType: {type: "string"},
        contentEncoding: {type: "string"},
        if: {$ref: "#"},
        then: {$ref: "#"},
        else: {$ref: "#"},
        allOf: {$ref: "#/definitions/schemaArray"},
        anyOf: {$ref: "#/definitions/schemaArray"},
        oneOf: {$ref: "#/definitions/schemaArray"},
        not: {$ref: "#"}
      },
      default: true
    };
  });

  // node_modules/ajv/lib/definition_schema.js
  var require_definition_schema = __commonJS((exports, module) => {
    "use strict";
    var metaSchema = require_json_schema_draft_07();
    module.exports = {
      $id: "https://github.com/ajv-validator/ajv/blob/master/lib/definition_schema.js",
      definitions: {
        simpleTypes: metaSchema.definitions.simpleTypes
      },
      type: "object",
      dependencies: {
        schema: ["validate"],
        $data: ["validate"],
        statements: ["inline"],
        valid: {not: {required: ["macro"]}}
      },
      properties: {
        type: metaSchema.properties.type,
        schema: {type: "boolean"},
        statements: {type: "boolean"},
        dependencies: {
          type: "array",
          items: {type: "string"}
        },
        metaSchema: {type: "object"},
        modifying: {type: "boolean"},
        valid: {type: "boolean"},
        $data: {type: "boolean"},
        async: {type: "boolean"},
        errors: {
          anyOf: [
            {type: "boolean"},
            {const: "full"}
          ]
        }
      }
    };
  });

  // node_modules/ajv/lib/keyword.js
  var require_keyword = __commonJS((exports, module) => {
    "use strict";
    var IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i;
    var customRuleCode = require_custom();
    var definitionSchema = require_definition_schema();
    module.exports = {
      add: addKeyword,
      get: getKeyword,
      remove: removeKeyword,
      validate: validateKeyword
    };
    function addKeyword(keyword, definition) {
      var RULES = this.RULES;
      if (RULES.keywords[keyword])
        throw new Error("Keyword " + keyword + " is already defined");
      if (!IDENTIFIER.test(keyword))
        throw new Error("Keyword " + keyword + " is not a valid identifier");
      if (definition) {
        this.validateKeyword(definition, true);
        var dataType = definition.type;
        if (Array.isArray(dataType)) {
          for (var i = 0; i < dataType.length; i++)
            _addRule(keyword, dataType[i], definition);
        } else {
          _addRule(keyword, dataType, definition);
        }
        var metaSchema = definition.metaSchema;
        if (metaSchema) {
          if (definition.$data && this._opts.$data) {
            metaSchema = {
              anyOf: [
                metaSchema,
                {$ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"}
              ]
            };
          }
          definition.validateSchema = this.compile(metaSchema, true);
        }
      }
      RULES.keywords[keyword] = RULES.all[keyword] = true;
      function _addRule(keyword2, dataType2, definition2) {
        var ruleGroup;
        for (var i2 = 0; i2 < RULES.length; i2++) {
          var rg = RULES[i2];
          if (rg.type == dataType2) {
            ruleGroup = rg;
            break;
          }
        }
        if (!ruleGroup) {
          ruleGroup = {type: dataType2, rules: []};
          RULES.push(ruleGroup);
        }
        var rule = {
          keyword: keyword2,
          definition: definition2,
          custom: true,
          code: customRuleCode,
          implements: definition2.implements
        };
        ruleGroup.rules.push(rule);
        RULES.custom[keyword2] = rule;
      }
      return this;
    }
    function getKeyword(keyword) {
      var rule = this.RULES.custom[keyword];
      return rule ? rule.definition : this.RULES.keywords[keyword] || false;
    }
    function removeKeyword(keyword) {
      var RULES = this.RULES;
      delete RULES.keywords[keyword];
      delete RULES.all[keyword];
      delete RULES.custom[keyword];
      for (var i = 0; i < RULES.length; i++) {
        var rules = RULES[i].rules;
        for (var j = 0; j < rules.length; j++) {
          if (rules[j].keyword == keyword) {
            rules.splice(j, 1);
            break;
          }
        }
      }
      return this;
    }
    function validateKeyword(definition, throwError) {
      validateKeyword.errors = null;
      var v = this._validateKeyword = this._validateKeyword || this.compile(definitionSchema, true);
      if (v(definition))
        return true;
      validateKeyword.errors = v.errors;
      if (throwError)
        throw new Error("custom keyword definition is invalid: " + this.errorsText(v.errors));
      else
        return false;
    }
  });

  // node_modules/ajv/lib/refs/data.json
  var require_data2 = __commonJS((exports, module) => {
    module.exports = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      description: "Meta-schema for $data reference (JSON Schema extension proposal)",
      type: "object",
      required: ["$data"],
      properties: {
        $data: {
          type: "string",
          anyOf: [
            {format: "relative-json-pointer"},
            {format: "json-pointer"}
          ]
        }
      },
      additionalProperties: false
    };
  });

  // node_modules/ajv/lib/ajv.js
  var require_ajv = __commonJS((exports, module) => {
    "use strict";
    var compileSchema = require_compile();
    var resolve = require_resolve();
    var Cache = require_cache();
    var SchemaObject = require_schema_obj();
    var stableStringify = require_fast_json_stable_stringify();
    var formats = require_formats();
    var rules = require_rules();
    var $dataMetaSchema = require_data();
    var util = require_util();
    module.exports = Ajv;
    Ajv.prototype.validate = validate;
    Ajv.prototype.compile = compile;
    Ajv.prototype.addSchema = addSchema;
    Ajv.prototype.addMetaSchema = addMetaSchema;
    Ajv.prototype.validateSchema = validateSchema;
    Ajv.prototype.getSchema = getSchema;
    Ajv.prototype.removeSchema = removeSchema;
    Ajv.prototype.addFormat = addFormat;
    Ajv.prototype.errorsText = errorsText;
    Ajv.prototype._addSchema = _addSchema;
    Ajv.prototype._compile = _compile;
    Ajv.prototype.compileAsync = require_async();
    var customKeyword = require_keyword();
    Ajv.prototype.addKeyword = customKeyword.add;
    Ajv.prototype.getKeyword = customKeyword.get;
    Ajv.prototype.removeKeyword = customKeyword.remove;
    Ajv.prototype.validateKeyword = customKeyword.validate;
    var errorClasses = require_error_classes();
    Ajv.ValidationError = errorClasses.Validation;
    Ajv.MissingRefError = errorClasses.MissingRef;
    Ajv.$dataMetaSchema = $dataMetaSchema;
    var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
    var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes", "strictDefaults"];
    var META_SUPPORT_DATA = ["/properties"];
    function Ajv(opts) {
      if (!(this instanceof Ajv))
        return new Ajv(opts);
      opts = this._opts = util.copy(opts) || {};
      setLogger(this);
      this._schemas = {};
      this._refs = {};
      this._fragments = {};
      this._formats = formats(opts.format);
      this._cache = opts.cache || new Cache();
      this._loadingSchemas = {};
      this._compilations = [];
      this.RULES = rules();
      this._getId = chooseGetId(opts);
      opts.loopRequired = opts.loopRequired || Infinity;
      if (opts.errorDataPath == "property")
        opts._errorDataPathProperty = true;
      if (opts.serialize === void 0)
        opts.serialize = stableStringify;
      this._metaOpts = getMetaSchemaOptions(this);
      if (opts.formats)
        addInitialFormats(this);
      if (opts.keywords)
        addInitialKeywords(this);
      addDefaultMetaSchema(this);
      if (typeof opts.meta == "object")
        this.addMetaSchema(opts.meta);
      if (opts.nullable)
        this.addKeyword("nullable", {metaSchema: {type: "boolean"}});
      addInitialSchemas(this);
    }
    function validate(schemaKeyRef, data) {
      var v;
      if (typeof schemaKeyRef == "string") {
        v = this.getSchema(schemaKeyRef);
        if (!v)
          throw new Error('no schema with key or ref "' + schemaKeyRef + '"');
      } else {
        var schemaObj = this._addSchema(schemaKeyRef);
        v = schemaObj.validate || this._compile(schemaObj);
      }
      var valid = v(data);
      if (v.$async !== true)
        this.errors = v.errors;
      return valid;
    }
    function compile(schema, _meta) {
      var schemaObj = this._addSchema(schema, void 0, _meta);
      return schemaObj.validate || this._compile(schemaObj);
    }
    function addSchema(schema, key, _skipValidation, _meta) {
      if (Array.isArray(schema)) {
        for (var i = 0; i < schema.length; i++)
          this.addSchema(schema[i], void 0, _skipValidation, _meta);
        return this;
      }
      var id = this._getId(schema);
      if (id !== void 0 && typeof id != "string")
        throw new Error("schema id must be string");
      key = resolve.normalizeId(key || id);
      checkUnique(this, key);
      this._schemas[key] = this._addSchema(schema, _skipValidation, _meta, true);
      return this;
    }
    function addMetaSchema(schema, key, skipValidation) {
      this.addSchema(schema, key, skipValidation, true);
      return this;
    }
    function validateSchema(schema, throwOrLogError) {
      var $schema = schema.$schema;
      if ($schema !== void 0 && typeof $schema != "string")
        throw new Error("$schema must be a string");
      $schema = $schema || this._opts.defaultMeta || defaultMeta(this);
      if (!$schema) {
        this.logger.warn("meta-schema not available");
        this.errors = null;
        return true;
      }
      var valid = this.validate($schema, schema);
      if (!valid && throwOrLogError) {
        var message = "schema is invalid: " + this.errorsText();
        if (this._opts.validateSchema == "log")
          this.logger.error(message);
        else
          throw new Error(message);
      }
      return valid;
    }
    function defaultMeta(self2) {
      var meta = self2._opts.meta;
      self2._opts.defaultMeta = typeof meta == "object" ? self2._getId(meta) || meta : self2.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0;
      return self2._opts.defaultMeta;
    }
    function getSchema(keyRef) {
      var schemaObj = _getSchemaObj(this, keyRef);
      switch (typeof schemaObj) {
        case "object":
          return schemaObj.validate || this._compile(schemaObj);
        case "string":
          return this.getSchema(schemaObj);
        case "undefined":
          return _getSchemaFragment(this, keyRef);
      }
    }
    function _getSchemaFragment(self2, ref) {
      var res = resolve.schema.call(self2, {schema: {}}, ref);
      if (res) {
        var schema = res.schema, root = res.root, baseId = res.baseId;
        var v = compileSchema.call(self2, schema, root, void 0, baseId);
        self2._fragments[ref] = new SchemaObject({
          ref,
          fragment: true,
          schema,
          root,
          baseId,
          validate: v
        });
        return v;
      }
    }
    function _getSchemaObj(self2, keyRef) {
      keyRef = resolve.normalizeId(keyRef);
      return self2._schemas[keyRef] || self2._refs[keyRef] || self2._fragments[keyRef];
    }
    function removeSchema(schemaKeyRef) {
      if (schemaKeyRef instanceof RegExp) {
        _removeAllSchemas(this, this._schemas, schemaKeyRef);
        _removeAllSchemas(this, this._refs, schemaKeyRef);
        return this;
      }
      switch (typeof schemaKeyRef) {
        case "undefined":
          _removeAllSchemas(this, this._schemas);
          _removeAllSchemas(this, this._refs);
          this._cache.clear();
          return this;
        case "string":
          var schemaObj = _getSchemaObj(this, schemaKeyRef);
          if (schemaObj)
            this._cache.del(schemaObj.cacheKey);
          delete this._schemas[schemaKeyRef];
          delete this._refs[schemaKeyRef];
          return this;
        case "object":
          var serialize = this._opts.serialize;
          var cacheKey = serialize ? serialize(schemaKeyRef) : schemaKeyRef;
          this._cache.del(cacheKey);
          var id = this._getId(schemaKeyRef);
          if (id) {
            id = resolve.normalizeId(id);
            delete this._schemas[id];
            delete this._refs[id];
          }
      }
      return this;
    }
    function _removeAllSchemas(self2, schemas, regex) {
      for (var keyRef in schemas) {
        var schemaObj = schemas[keyRef];
        if (!schemaObj.meta && (!regex || regex.test(keyRef))) {
          self2._cache.del(schemaObj.cacheKey);
          delete schemas[keyRef];
        }
      }
    }
    function _addSchema(schema, skipValidation, meta, shouldAddSchema) {
      if (typeof schema != "object" && typeof schema != "boolean")
        throw new Error("schema should be object or boolean");
      var serialize = this._opts.serialize;
      var cacheKey = serialize ? serialize(schema) : schema;
      var cached = this._cache.get(cacheKey);
      if (cached)
        return cached;
      shouldAddSchema = shouldAddSchema || this._opts.addUsedSchema !== false;
      var id = resolve.normalizeId(this._getId(schema));
      if (id && shouldAddSchema)
        checkUnique(this, id);
      var willValidate = this._opts.validateSchema !== false && !skipValidation;
      var recursiveMeta;
      if (willValidate && !(recursiveMeta = id && id == resolve.normalizeId(schema.$schema)))
        this.validateSchema(schema, true);
      var localRefs = resolve.ids.call(this, schema);
      var schemaObj = new SchemaObject({
        id,
        schema,
        localRefs,
        cacheKey,
        meta
      });
      if (id[0] != "#" && shouldAddSchema)
        this._refs[id] = schemaObj;
      this._cache.put(cacheKey, schemaObj);
      if (willValidate && recursiveMeta)
        this.validateSchema(schema, true);
      return schemaObj;
    }
    function _compile(schemaObj, root) {
      if (schemaObj.compiling) {
        schemaObj.validate = callValidate;
        callValidate.schema = schemaObj.schema;
        callValidate.errors = null;
        callValidate.root = root ? root : callValidate;
        if (schemaObj.schema.$async === true)
          callValidate.$async = true;
        return callValidate;
      }
      schemaObj.compiling = true;
      var currentOpts;
      if (schemaObj.meta) {
        currentOpts = this._opts;
        this._opts = this._metaOpts;
      }
      var v;
      try {
        v = compileSchema.call(this, schemaObj.schema, root, schemaObj.localRefs);
      } catch (e) {
        delete schemaObj.validate;
        throw e;
      } finally {
        schemaObj.compiling = false;
        if (schemaObj.meta)
          this._opts = currentOpts;
      }
      schemaObj.validate = v;
      schemaObj.refs = v.refs;
      schemaObj.refVal = v.refVal;
      schemaObj.root = v.root;
      return v;
      function callValidate() {
        var _validate = schemaObj.validate;
        var result = _validate.apply(this, arguments);
        callValidate.errors = _validate.errors;
        return result;
      }
    }
    function chooseGetId(opts) {
      switch (opts.schemaId) {
        case "auto":
          return _get$IdOrId;
        case "id":
          return _getId;
        default:
          return _get$Id;
      }
    }
    function _getId(schema) {
      if (schema.$id)
        this.logger.warn("schema $id ignored", schema.$id);
      return schema.id;
    }
    function _get$Id(schema) {
      if (schema.id)
        this.logger.warn("schema id ignored", schema.id);
      return schema.$id;
    }
    function _get$IdOrId(schema) {
      if (schema.$id && schema.id && schema.$id != schema.id)
        throw new Error("schema $id is different from id");
      return schema.$id || schema.id;
    }
    function errorsText(errors, options) {
      errors = errors || this.errors;
      if (!errors)
        return "No errors";
      options = options || {};
      var separator = options.separator === void 0 ? ", " : options.separator;
      var dataVar = options.dataVar === void 0 ? "data" : options.dataVar;
      var text = "";
      for (var i = 0; i < errors.length; i++) {
        var e = errors[i];
        if (e)
          text += dataVar + e.dataPath + " " + e.message + separator;
      }
      return text.slice(0, -separator.length);
    }
    function addFormat(name, format) {
      if (typeof format == "string")
        format = new RegExp(format);
      this._formats[name] = format;
      return this;
    }
    function addDefaultMetaSchema(self2) {
      var $dataSchema;
      if (self2._opts.$data) {
        $dataSchema = require_data2();
        self2.addMetaSchema($dataSchema, $dataSchema.$id, true);
      }
      if (self2._opts.meta === false)
        return;
      var metaSchema = require_json_schema_draft_07();
      if (self2._opts.$data)
        metaSchema = $dataMetaSchema(metaSchema, META_SUPPORT_DATA);
      self2.addMetaSchema(metaSchema, META_SCHEMA_ID, true);
      self2._refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    function addInitialSchemas(self2) {
      var optsSchemas = self2._opts.schemas;
      if (!optsSchemas)
        return;
      if (Array.isArray(optsSchemas))
        self2.addSchema(optsSchemas);
      else
        for (var key in optsSchemas)
          self2.addSchema(optsSchemas[key], key);
    }
    function addInitialFormats(self2) {
      for (var name in self2._opts.formats) {
        var format = self2._opts.formats[name];
        self2.addFormat(name, format);
      }
    }
    function addInitialKeywords(self2) {
      for (var name in self2._opts.keywords) {
        var keyword = self2._opts.keywords[name];
        self2.addKeyword(name, keyword);
      }
    }
    function checkUnique(self2, id) {
      if (self2._schemas[id] || self2._refs[id])
        throw new Error('schema with key or id "' + id + '" already exists');
    }
    function getMetaSchemaOptions(self2) {
      var metaOpts = util.copy(self2._opts);
      for (var i = 0; i < META_IGNORE_OPTIONS.length; i++)
        delete metaOpts[META_IGNORE_OPTIONS[i]];
      return metaOpts;
    }
    function setLogger(self2) {
      var logger = self2._opts.logger;
      if (logger === false) {
        self2.logger = {log: noop, warn: noop, error: noop};
      } else {
        if (logger === void 0)
          logger = console;
        if (!(typeof logger == "object" && logger.log && logger.warn && logger.error))
          throw new Error("logger must implement log, warn and error methods");
        self2.logger = logger;
      }
    }
    function noop() {
    }
  });

  // ../node_modules/util/support/isBufferBrowser.js
  var require_isBufferBrowser = __commonJS((exports, module) => {
    module.exports = function isBuffer(arg) {
      return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
    };
  });

  // ../node_modules/util/node_modules/inherits/inherits_browser.js
  var require_inherits_browser = __commonJS((exports, module) => {
    if (typeof Object.create === "function") {
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
  });

  // ../node_modules/util/util.js
  var require_util2 = __commonJS((exports) => {
    var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors2(obj) {
      var keys = Object.keys(obj);
      var descriptors = {};
      for (var i = 0; i < keys.length; i++) {
        descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
      }
      return descriptors;
    };
    var formatRegExp = /%[sdj%]/g;
    exports.format = function(f) {
      if (!isString(f)) {
        var objects = [];
        for (var i = 0; i < arguments.length; i++) {
          objects.push(inspect(arguments[i]));
        }
        return objects.join(" ");
      }
      var i = 1;
      var args = arguments;
      var len = args.length;
      var str = String(f).replace(formatRegExp, function(x2) {
        if (x2 === "%%")
          return "%";
        if (i >= len)
          return x2;
        switch (x2) {
          case "%s":
            return String(args[i++]);
          case "%d":
            return Number(args[i++]);
          case "%j":
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return "[Circular]";
            }
          default:
            return x2;
        }
      });
      for (var x = args[i]; i < len; x = args[++i]) {
        if (isNull(x) || !isObject(x)) {
          str += " " + x;
        } else {
          str += " " + inspect(x);
        }
      }
      return str;
    };
    exports.deprecate = function(fn, msg) {
      if (typeof process !== "undefined" && process.noDeprecation === true) {
        return fn;
      }
      if (typeof process === "undefined") {
        return function() {
          return exports.deprecate(fn, msg).apply(this, arguments);
        };
      }
      var warned = false;
      function deprecated() {
        if (!warned) {
          if (process.throwDeprecation) {
            throw new Error(msg);
          } else if (process.traceDeprecation) {
            console.trace(msg);
          } else {
            console.error(msg);
          }
          warned = true;
        }
        return fn.apply(this, arguments);
      }
      return deprecated;
    };
    var debugs = {};
    var debugEnviron;
    exports.debuglog = function(set) {
      if (isUndefined(debugEnviron))
        debugEnviron = process.env.NODE_DEBUG || "";
      set = set.toUpperCase();
      if (!debugs[set]) {
        if (new RegExp("\\b" + set + "\\b", "i").test(debugEnviron)) {
          var pid = process.pid;
          debugs[set] = function() {
            var msg = exports.format.apply(exports, arguments);
            console.error("%s %d: %s", set, pid, msg);
          };
        } else {
          debugs[set] = function() {
          };
        }
      }
      return debugs[set];
    };
    function inspect(obj, opts) {
      var ctx = {
        seen: [],
        stylize: stylizeNoColor
      };
      if (arguments.length >= 3)
        ctx.depth = arguments[2];
      if (arguments.length >= 4)
        ctx.colors = arguments[3];
      if (isBoolean(opts)) {
        ctx.showHidden = opts;
      } else if (opts) {
        exports._extend(ctx, opts);
      }
      if (isUndefined(ctx.showHidden))
        ctx.showHidden = false;
      if (isUndefined(ctx.depth))
        ctx.depth = 2;
      if (isUndefined(ctx.colors))
        ctx.colors = false;
      if (isUndefined(ctx.customInspect))
        ctx.customInspect = true;
      if (ctx.colors)
        ctx.stylize = stylizeWithColor;
      return formatValue(ctx, obj, ctx.depth);
    }
    exports.inspect = inspect;
    inspect.colors = {
      bold: [1, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      white: [37, 39],
      grey: [90, 39],
      black: [30, 39],
      blue: [34, 39],
      cyan: [36, 39],
      green: [32, 39],
      magenta: [35, 39],
      red: [31, 39],
      yellow: [33, 39]
    };
    inspect.styles = {
      special: "cyan",
      number: "yellow",
      boolean: "yellow",
      undefined: "grey",
      null: "bold",
      string: "green",
      date: "magenta",
      regexp: "red"
    };
    function stylizeWithColor(str, styleType) {
      var style = inspect.styles[styleType];
      if (style) {
        return "[" + inspect.colors[style][0] + "m" + str + "[" + inspect.colors[style][1] + "m";
      } else {
        return str;
      }
    }
    function stylizeNoColor(str, styleType) {
      return str;
    }
    function arrayToHash(array) {
      var hash = {};
      array.forEach(function(val, idx) {
        hash[val] = true;
      });
      return hash;
    }
    function formatValue(ctx, value, recurseTimes) {
      if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports.inspect && !(value.constructor && value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx);
        if (!isString(ret)) {
          ret = formatValue(ctx, ret, recurseTimes);
        }
        return ret;
      }
      var primitive = formatPrimitive(ctx, value);
      if (primitive) {
        return primitive;
      }
      var keys = Object.keys(value);
      var visibleKeys = arrayToHash(keys);
      if (ctx.showHidden) {
        keys = Object.getOwnPropertyNames(value);
      }
      if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
        return formatError(value);
      }
      if (keys.length === 0) {
        if (isFunction(value)) {
          var name = value.name ? ": " + value.name : "";
          return ctx.stylize("[Function" + name + "]", "special");
        }
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        }
        if (isDate(value)) {
          return ctx.stylize(Date.prototype.toString.call(value), "date");
        }
        if (isError(value)) {
          return formatError(value);
        }
      }
      var base = "", array = false, braces = ["{", "}"];
      if (isArray(value)) {
        array = true;
        braces = ["[", "]"];
      }
      if (isFunction(value)) {
        var n = value.name ? ": " + value.name : "";
        base = " [Function" + n + "]";
      }
      if (isRegExp(value)) {
        base = " " + RegExp.prototype.toString.call(value);
      }
      if (isDate(value)) {
        base = " " + Date.prototype.toUTCString.call(value);
      }
      if (isError(value)) {
        base = " " + formatError(value);
      }
      if (keys.length === 0 && (!array || value.length == 0)) {
        return braces[0] + base + braces[1];
      }
      if (recurseTimes < 0) {
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        } else {
          return ctx.stylize("[Object]", "special");
        }
      }
      ctx.seen.push(value);
      var output;
      if (array) {
        output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
      } else {
        output = keys.map(function(key) {
          return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
        });
      }
      ctx.seen.pop();
      return reduceToSingleString(output, base, braces);
    }
    function formatPrimitive(ctx, value) {
      if (isUndefined(value))
        return ctx.stylize("undefined", "undefined");
      if (isString(value)) {
        var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
        return ctx.stylize(simple, "string");
      }
      if (isNumber(value))
        return ctx.stylize("" + value, "number");
      if (isBoolean(value))
        return ctx.stylize("" + value, "boolean");
      if (isNull(value))
        return ctx.stylize("null", "null");
    }
    function formatError(value) {
      return "[" + Error.prototype.toString.call(value) + "]";
    }
    function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
      var output = [];
      for (var i = 0, l = value.length; i < l; ++i) {
        if (hasOwnProperty(value, String(i))) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
        } else {
          output.push("");
        }
      }
      keys.forEach(function(key) {
        if (!key.match(/^\d+$/)) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
        }
      });
      return output;
    }
    function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
      var name, str, desc;
      desc = Object.getOwnPropertyDescriptor(value, key) || {value: value[key]};
      if (desc.get) {
        if (desc.set) {
          str = ctx.stylize("[Getter/Setter]", "special");
        } else {
          str = ctx.stylize("[Getter]", "special");
        }
      } else {
        if (desc.set) {
          str = ctx.stylize("[Setter]", "special");
        }
      }
      if (!hasOwnProperty(visibleKeys, key)) {
        name = "[" + key + "]";
      }
      if (!str) {
        if (ctx.seen.indexOf(desc.value) < 0) {
          if (isNull(recurseTimes)) {
            str = formatValue(ctx, desc.value, null);
          } else {
            str = formatValue(ctx, desc.value, recurseTimes - 1);
          }
          if (str.indexOf("\n") > -1) {
            if (array) {
              str = str.split("\n").map(function(line) {
                return "  " + line;
              }).join("\n").substr(2);
            } else {
              str = "\n" + str.split("\n").map(function(line) {
                return "   " + line;
              }).join("\n");
            }
          }
        } else {
          str = ctx.stylize("[Circular]", "special");
        }
      }
      if (isUndefined(name)) {
        if (array && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify("" + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = ctx.stylize(name, "name");
        } else {
          name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
          name = ctx.stylize(name, "string");
        }
      }
      return name + ": " + str;
    }
    function reduceToSingleString(output, base, braces) {
      var numLinesEst = 0;
      var length = output.reduce(function(prev, cur) {
        numLinesEst++;
        if (cur.indexOf("\n") >= 0)
          numLinesEst++;
        return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
      }, 0);
      if (length > 60) {
        return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
      }
      return braces[0] + base + " " + output.join(", ") + " " + braces[1];
    }
    function isArray(ar) {
      return Array.isArray(ar);
    }
    exports.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports.isUndefined = isUndefined;
    function isRegExp(re) {
      return isObject(re) && objectToString(re) === "[object RegExp]";
    }
    exports.isRegExp = isRegExp;
    function isObject(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports.isObject = isObject;
    function isDate(d) {
      return isObject(d) && objectToString(d) === "[object Date]";
    }
    exports.isDate = isDate;
    function isError(e) {
      return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
    }
    exports.isError = isError;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports.isFunction = isFunction;
    function isPrimitive(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
    }
    exports.isPrimitive = isPrimitive;
    exports.isBuffer = require_isBufferBrowser();
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
    function pad(n) {
      return n < 10 ? "0" + n.toString(10) : n.toString(10);
    }
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    function timestamp() {
      var d = new Date();
      var time = [
        pad(d.getHours()),
        pad(d.getMinutes()),
        pad(d.getSeconds())
      ].join(":");
      return [d.getDate(), months[d.getMonth()], time].join(" ");
    }
    exports.log = function() {
      console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments));
    };
    exports.inherits = require_inherits_browser();
    exports._extend = function(origin, add) {
      if (!add || !isObject(add))
        return origin;
      var keys = Object.keys(add);
      var i = keys.length;
      while (i--) {
        origin[keys[i]] = add[keys[i]];
      }
      return origin;
    };
    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    var kCustomPromisifiedSymbol = typeof Symbol !== "undefined" ? Symbol("util.promisify.custom") : void 0;
    exports.promisify = function promisify(original) {
      if (typeof original !== "function")
        throw new TypeError('The "original" argument must be of type Function');
      if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
        var fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== "function") {
          throw new TypeError('The "util.promisify.custom" argument must be of type Function');
        }
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
          value: fn,
          enumerable: false,
          writable: false,
          configurable: true
        });
        return fn;
      }
      function fn() {
        var promiseResolve, promiseReject;
        var promise = new Promise(function(resolve, reject) {
          promiseResolve = resolve;
          promiseReject = reject;
        });
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        args.push(function(err, value) {
          if (err) {
            promiseReject(err);
          } else {
            promiseResolve(value);
          }
        });
        try {
          original.apply(this, args);
        } catch (err) {
          promiseReject(err);
        }
        return promise;
      }
      Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
      if (kCustomPromisifiedSymbol)
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
          value: fn,
          enumerable: false,
          writable: false,
          configurable: true
        });
      return Object.defineProperties(fn, getOwnPropertyDescriptors(original));
    };
    exports.promisify.custom = kCustomPromisifiedSymbol;
    function callbackifyOnRejected(reason, cb) {
      if (!reason) {
        var newReason = new Error("Promise was rejected with a falsy value");
        newReason.reason = reason;
        reason = newReason;
      }
      return cb(reason);
    }
    function callbackify(original) {
      if (typeof original !== "function") {
        throw new TypeError('The "original" argument must be of type Function');
      }
      function callbackified() {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        var maybeCb = args.pop();
        if (typeof maybeCb !== "function") {
          throw new TypeError("The last argument must be of type Function");
        }
        var self2 = this;
        var cb = function() {
          return maybeCb.apply(self2, arguments);
        };
        original.apply(this, args).then(function(ret) {
          process.nextTick(cb, null, ret);
        }, function(rej) {
          process.nextTick(callbackifyOnRejected, rej, cb);
        });
      }
      Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
      Object.defineProperties(callbackified, getOwnPropertyDescriptors(original));
      return callbackified;
    }
    exports.callbackify = callbackify;
  });

  // table/column/string/stringIsSafe.js
  var require_stringIsSafe = __commonJS((exports, module) => {
    var ascii = " (->@-Z`-z";
    var latin1 = "\xC0-\xD6\xD8-\xF6\xF8-\xFF";
    var latinExtA = "\u0100-\u017F";
    var latinExtB = "\u0180-\u024F";
    var cyrillic = "\u0400-\u04FF";
    var cjk = "\u4E00-\u9FC3";
    var util = require_util2();
    var patternString = util.format("^[%s%s%s%s%s%s]+$", ascii, latin1, latinExtA, latinExtB, cyrillic, cjk);
    var pattern = new RegExp(patternString);
    function stringIsSafe(value) {
      return pattern.test(value);
    }
    module.exports = stringIsSafe;
  });

  // table/column/string/purify.js
  var require_purify = __commonJS((exports, module) => {
    function purify(value) {
      if (value == null)
        return null;
      return value;
    }
    module.exports = purify;
  });

  // table/column/string/newEncode.js
  var require_newEncode = __commonJS((exports, module) => {
    var newPara = require_newParameterized();
    var stringIsSafe = require_stringIsSafe();
    var purify = require_purify();
    function _new(column) {
      return function(value) {
        value = purify(value);
        if (value == null) {
          if (column.dbNull === null)
            return newPara("null");
          return newPara("'" + column.dbNull + "'");
        }
        if (stringIsSafe(value))
          return newPara("'" + value + "'");
        return newPara("?", [value]);
      };
    }
    module.exports = _new;
  });

  // table/column/newDecodeCore.js
  var require_newDecodeCore = __commonJS((exports, module) => {
    function _new(column) {
      return function(value) {
        if (value == column.dbNull)
          return null;
        return value;
      };
    }
    module.exports = _new;
  });

  // table/column/string/startsWithCore.js
  var require_startsWithCore = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var nullOperator = " is ";
    function startsWithCore(operator, column, arg, alias) {
      operator = " " + operator + " ";
      var encoded = column.encode(arg);
      if (encoded.sql() == "null")
        operator = nullOperator;
      else
        encoded = column.encode(arg + "%");
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = startsWithCore;
  });

  // table/column/string/startsWith.js
  var require_startsWith = __commonJS((exports, module) => {
    var startsWithCore = require_startsWithCore();
    module.exports = startsWithCore.bind(null, "LIKE");
  });

  // table/column/string/endsWithCore.js
  var require_endsWithCore = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var nullOperator = " is ";
    function endsWithCore(operator, column, arg, alias) {
      operator = " " + operator + " ";
      var encoded = column.encode(arg);
      if (encoded.sql() == "null")
        operator = nullOperator;
      else
        encoded = column.encode("%" + arg);
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = endsWithCore;
  });

  // table/column/string/endsWith.js
  var require_endsWith = __commonJS((exports, module) => {
    var endsWithCore = require_endsWithCore();
    module.exports = endsWithCore.bind(null, "LIKE");
  });

  // table/column/string/containsCore.js
  var require_containsCore = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var nullOperator = " is ";
    function endsWithCore(operator, column, arg, alias) {
      operator = " " + operator + " ";
      var encoded = column.encode(arg);
      if (encoded.sql() == "null")
        operator = nullOperator;
      else
        encoded = column.encode("%" + arg + "%");
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = endsWithCore;
  });

  // table/column/string/contains.js
  var require_contains2 = __commonJS((exports, module) => {
    var containsCore = require_containsCore();
    module.exports = containsCore.bind(null, "LIKE");
  });

  // table/column/string/iStartsWith.js
  var require_iStartsWith = __commonJS((exports, module) => {
    var startsWithCore = require_startsWithCore();
    module.exports = startsWithCore.bind(null, "ILIKE");
  });

  // table/column/string/iEndsWith.js
  var require_iEndsWith = __commonJS((exports, module) => {
    var endsWithCore = require_endsWithCore();
    module.exports = endsWithCore.bind(null, "ILIKE");
  });

  // table/column/string/iContains.js
  var require_iContains = __commonJS((exports, module) => {
    var containsCore = require_containsCore();
    module.exports = containsCore.bind(null, "ILIKE");
  });

  // table/column/string/iEqual.js
  var require_iEqual = __commonJS((exports, module) => {
    var newBoolean = require_newBoolean();
    var nullOperator = " is ";
    var encodeFilterArg = require_encodeFilterArg();
    function iEqual(column, arg, alias) {
      var operator = " ILIKE ";
      var encoded = encodeFilterArg(column, arg);
      if (encoded.sql() == "null")
        operator = nullOperator;
      var firstPart = alias + "." + column._dbName + operator;
      var filter = encoded.prepend(firstPart);
      return newBoolean(filter);
    }
    module.exports = iEqual;
  });

  // table/column/string.js
  var require_string = __commonJS((exports, module) => {
    var newEncode = require_newEncode();
    var newDecode = require_newDecodeCore();
    var startsWith = require_startsWith();
    var endsWith = require_endsWith();
    var contains = require_contains2();
    var iStartsWith = require_iStartsWith();
    var iEndsWith = require_iEndsWith();
    var iContains = require_iContains();
    var iEqual = require_iEqual();
    var purify = require_purify();
    var _extractAlias = require_extractAlias();
    function _new(table, column) {
      column.purify = purify;
      column.encode = newEncode(column);
      column.decode = newDecode(column);
      var extractAlias = _extractAlias.bind(null, table);
      column.startsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return startsWith(column, arg, alias);
      };
      column.endsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return endsWith(column, arg, alias);
      };
      column.contains = function(arg, alias) {
        alias = extractAlias(alias);
        return contains(column, arg, alias);
      };
      column.iStartsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return iStartsWith(column, arg, alias);
      };
      column.iEndsWith = function(arg, alias) {
        alias = extractAlias(alias);
        return iEndsWith(column, arg, alias);
      };
      column.iContains = function(arg, alias) {
        alias = extractAlias(alias);
        return iContains(column, arg, alias);
      };
      column.iEqual = function(arg, alias) {
        alias = extractAlias(alias);
        return iEqual(column, arg, alias);
      };
      column.iEq = column.iEqual;
      column.IEQ = column.iEqual;
      column.ieq = column.iEqual;
    }
    module.exports = _new;
  });

  // table/column/json/purify.js
  var require_purify2 = __commonJS((exports, module) => {
    function purify(value) {
      if (value == null)
        return null;
      return value;
    }
    module.exports = purify;
  });

  // table/column/json/newEncode.js
  var require_newEncode2 = __commonJS((exports, module) => {
    var newPara = require_newParameterized();
    var purify = require_purify2();
    function _new(column) {
      return function(candidate) {
        var value = purify(candidate);
        if (value == null) {
          if (column.dbNull === null)
            return newPara("null");
          return newPara("'" + column.dbNull + "'");
        }
        return newPara("?", [JSON.stringify(value)]);
      };
    }
    module.exports = _new;
  });

  // node_modules/on-change/lib/constants.js
  var require_constants = __commonJS((exports, module) => {
    module.exports = {
      PATH_SEPARATOR: ".",
      TARGET: Symbol("target"),
      UNSUBSCRIBE: Symbol("unsubscribe")
    };
  });

  // node_modules/on-change/lib/is-builtin.js
  var require_is_builtin = __commonJS((exports, module) => {
    "use strict";
    var isBuiltin = {
      withMutableMethods: (value) => {
        return value instanceof Date || value instanceof Set || value instanceof Map || value instanceof WeakSet || value instanceof WeakMap;
      },
      withoutMutableMethods: (value) => (typeof value === "object" ? value === null : typeof value !== "function") || value instanceof RegExp
    };
    module.exports = isBuiltin;
  });

  // node_modules/on-change/lib/is-array.js
  var require_is_array = __commonJS((exports, module) => {
    "use strict";
    module.exports = Array.isArray;
  });

  // node_modules/on-change/lib/is-symbol.js
  var require_is_symbol = __commonJS((exports, module) => {
    "use strict";
    module.exports = (value) => typeof value === "symbol";
  });

  // node_modules/on-change/lib/path.js
  var require_path = __commonJS((exports, module) => {
    "use strict";
    var {PATH_SEPARATOR} = require_constants();
    var isArray = require_is_array();
    var isSymbol = require_is_symbol();
    module.exports = {
      after: (path, subPath) => {
        if (isArray(path)) {
          return path.slice(subPath.length);
        }
        if (subPath === "") {
          return path;
        }
        return path.slice(subPath.length + 1);
      },
      concat: (path, key) => {
        if (isArray(path)) {
          path = path.slice();
          if (key) {
            path.push(key);
          }
          return path;
        }
        if (key && key.toString !== void 0) {
          if (path !== "") {
            path += PATH_SEPARATOR;
          }
          if (isSymbol(key)) {
            return path + key.toString();
          }
          return path + key;
        }
        return path;
      },
      initial: (path) => {
        if (isArray(path)) {
          return path.slice(0, -1);
        }
        if (path === "") {
          return path;
        }
        const index = path.lastIndexOf(PATH_SEPARATOR);
        if (index === -1) {
          return "";
        }
        return path.slice(0, index);
      },
      last: (path) => {
        if (isArray(path)) {
          return path[path.length - 1] || "";
        }
        if (path === "") {
          return path;
        }
        const index = path.lastIndexOf(PATH_SEPARATOR);
        if (index === -1) {
          return path;
        }
        return path.slice(index + 1);
      },
      walk: (path, callback) => {
        if (isArray(path)) {
          path.forEach((key) => callback(key));
        } else if (path !== "") {
          let position = 0;
          let index = path.indexOf(PATH_SEPARATOR);
          if (index === -1) {
            callback(path);
          } else {
            while (position < path.length) {
              if (index === -1) {
                index = path.length;
              }
              callback(path.slice(position, index));
              position = index + 1;
              index = path.indexOf(PATH_SEPARATOR, position);
            }
          }
        }
      }
    };
  });

  // node_modules/on-change/lib/is-iterator.js
  var require_is_iterator = __commonJS((exports, module) => {
    "use strict";
    module.exports = (value) => typeof value === "object" && typeof value.next === "function";
  });

  // node_modules/on-change/lib/wrap-iterator.js
  var require_wrap_iterator = __commonJS((exports, module) => {
    "use strict";
    var {TARGET} = require_constants();
    module.exports = (iterator, target, thisArg, applyPath, prepareValue) => {
      const originalNext = iterator.next;
      if (target.name === "entries") {
        iterator.next = function() {
          const result = originalNext.call(this);
          if (result.done === false) {
            result.value[0] = prepareValue(result.value[0], target, result.value[0], applyPath);
            result.value[1] = prepareValue(result.value[1], target, result.value[0], applyPath);
          }
          return result;
        };
      } else if (target.name === "values") {
        const keyIterator = thisArg[TARGET].keys();
        iterator.next = function() {
          const result = originalNext.call(this);
          if (result.done === false) {
            result.value = prepareValue(result.value, target, keyIterator.next().value, applyPath);
          }
          return result;
        };
      } else {
        iterator.next = function() {
          const result = originalNext.call(this);
          if (result.done === false) {
            result.value = prepareValue(result.value, target, result.value, applyPath);
          }
          return result;
        };
      }
      return iterator;
    };
  });

  // node_modules/on-change/lib/ignore-property.js
  var require_ignore_property = __commonJS((exports, module) => {
    "use strict";
    var isSymbol = require_is_symbol();
    module.exports = (cache, options, property) => {
      return cache.isUnsubscribed || options.ignoreSymbols && isSymbol(property) || options.ignoreUnderscores && property.charAt(0) === "_" || "ignoreKeys" in options && options.ignoreKeys.includes(property);
    };
  });

  // node_modules/on-change/lib/cache.js
  var require_cache2 = __commonJS((exports, module) => {
    "use strict";
    var path = require_path();
    var Cache = class {
      constructor(equals) {
        this._equals = equals;
        this._proxyCache = new WeakMap();
        this._pathCache = new WeakMap();
        this.isUnsubscribed = false;
      }
      _getDescriptorCache() {
        if (this._descriptorCache === void 0) {
          this._descriptorCache = new WeakMap();
        }
        return this._descriptorCache;
      }
      _getProperties(target) {
        const descriptorCache = this._getDescriptorCache();
        let properties = descriptorCache.get(target);
        if (properties === void 0) {
          properties = {};
          descriptorCache.set(target, properties);
        }
        return properties;
      }
      _getOwnPropertyDescriptor(target, property) {
        if (this.isUnsubscribed) {
          return Reflect.getOwnPropertyDescriptor(target, property);
        }
        const properties = this._getProperties(target);
        let descriptor = properties[property];
        if (descriptor === void 0) {
          descriptor = Reflect.getOwnPropertyDescriptor(target, property);
          properties[property] = descriptor;
        }
        return descriptor;
      }
      getProxy(target, path2, handler, proxyTarget) {
        if (this.isUnsubscribed) {
          return target;
        }
        this._pathCache.set(target, path2);
        let proxy = this._proxyCache.get(target);
        if (proxy === void 0) {
          proxy = target[proxyTarget] === void 0 ? new Proxy(target, handler) : target;
          this._proxyCache.set(target, proxy);
        }
        return proxy;
      }
      getPath(target) {
        return this.isUnsubscribed ? void 0 : this._pathCache.get(target);
      }
      isDetached(target, object) {
        path.walk(this.getPath(target), (key) => {
          if (object) {
            object = object[key];
          }
        });
        return !Object.is(target, object);
      }
      defineProperty(target, property, descriptor) {
        if (!Reflect.defineProperty(target, property, descriptor)) {
          return false;
        }
        if (!this.isUnsubscribed) {
          this._getProperties(target)[property] = descriptor;
        }
        return true;
      }
      setProperty(target, property, value, receiver, previous) {
        if (!this._equals(previous, value) || !(property in target)) {
          const descriptor = this._getOwnPropertyDescriptor(target, property);
          if (descriptor !== void 0 && "set" in descriptor) {
            return Reflect.set(target, property, value, receiver);
          }
          return Reflect.set(target, property, value);
        }
        return true;
      }
      deleteProperty(target, property, previous) {
        if (Reflect.deleteProperty(target, property)) {
          if (!this.isUnsubscribed) {
            const properties = this._getDescriptorCache().get(target);
            if (properties) {
              delete properties[property];
              this._pathCache.delete(previous);
            }
          }
          return true;
        }
        return false;
      }
      isSameDescriptor(a, target, property) {
        const b = this._getOwnPropertyDescriptor(target, property);
        return a !== void 0 && b !== void 0 && Object.is(a.value, b.value) && (a.writable || false) === (b.writable || false) && (a.enumerable || false) === (b.enumerable || false) && (a.configurable || false) === (b.configurable || false) && a.get === b.get && a.set === b.set;
      }
      isGetInvariant(target, property) {
        const descriptor = this._getOwnPropertyDescriptor(target, property);
        return descriptor !== void 0 && descriptor.configurable !== true && descriptor.writable !== true;
      }
      unsubscribe() {
        this._descriptorCache = null;
        this._pathCache = null;
        this._proxyCache = null;
        this.isUnsubscribed = true;
      }
    };
    module.exports = Cache;
  });

  // node_modules/on-change/lib/is-object.js
  var require_is_object = __commonJS((exports, module) => {
    "use strict";
    module.exports = (value) => toString.call(value) === "[object Object]";
  });

  // node_modules/on-change/lib/smart-clone.js
  var require_smart_clone = __commonJS((exports, module) => {
    "use strict";
    var path = require_path();
    var isArray = require_is_array();
    var isBuiltin = require_is_builtin();
    var isObject = require_is_object();
    var certainChange = () => true;
    var shallowEqualArrays = (clone, value) => {
      return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
    };
    var shallowEqualSets = (clone, value) => {
      if (clone.size !== value.size) {
        return true;
      }
      for (const element of clone) {
        if (!value.has(element)) {
          return true;
        }
      }
      return false;
    };
    var shallowEqualMaps = (clone, value) => {
      if (clone.size !== value.size) {
        return true;
      }
      let bValue;
      for (const [key, aValue] of clone) {
        bValue = value.get(key);
        if (bValue !== aValue || bValue === void 0 && !value.has(key)) {
          return true;
        }
      }
      return false;
    };
    var IMMUTABLE_OBJECT_METHODS = new Set([
      "hasOwnProperty",
      "isPrototypeOf",
      "propertyIsEnumerable",
      "toLocaleString",
      "toString",
      "valueOf"
    ]);
    var IMMUTABLE_ARRAY_METHODS = new Set([
      "concat",
      "includes",
      "indexOf",
      "join",
      "keys",
      "lastIndexOf"
    ]);
    var IMMUTABLE_SET_METHODS = new Set([
      "has",
      "toString"
    ]);
    var IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS].concat(["get"]));
    var SHALLOW_MUTABLE_ARRAY_METHODS = {
      push: certainChange,
      pop: certainChange,
      shift: certainChange,
      unshift: certainChange,
      copyWithin: shallowEqualArrays,
      reverse: shallowEqualArrays,
      sort: shallowEqualArrays,
      splice: shallowEqualArrays,
      flat: shallowEqualArrays,
      fill: shallowEqualArrays
    };
    var SHALLOW_MUTABLE_SET_METHODS = {
      add: shallowEqualSets,
      clear: shallowEqualSets,
      delete: shallowEqualSets
    };
    var COLLECTION_ITERATOR_METHODS = [
      "keys",
      "values",
      "entries"
    ];
    var SHALLOW_MUTABLE_MAP_METHODS = {
      set: shallowEqualMaps,
      clear: shallowEqualMaps,
      delete: shallowEqualMaps
    };
    var HANDLED_ARRAY_METHODS = new Set([...IMMUTABLE_OBJECT_METHODS].concat([...IMMUTABLE_ARRAY_METHODS]).concat(Object.keys(SHALLOW_MUTABLE_ARRAY_METHODS)));
    var HANDLED_SET_METHODS = new Set([...IMMUTABLE_SET_METHODS].concat(Object.keys(SHALLOW_MUTABLE_SET_METHODS)).concat(COLLECTION_ITERATOR_METHODS));
    var HANDLED_MAP_METHODS = new Set([...IMMUTABLE_MAP_METHODS].concat(Object.keys(SHALLOW_MUTABLE_MAP_METHODS)).concat(COLLECTION_ITERATOR_METHODS));
    var Clone = class {
      constructor(value, path2, argumentsList) {
        this._path = path2;
        this._isChanged = false;
        this._clonedCache = new Set();
        if (value instanceof WeakSet) {
          this._weakValue = value.has(argumentsList[0]);
        } else if (value instanceof WeakMap) {
          this._weakValue = value.get(argumentsList[0]);
        } else {
          this.clone = path2 === void 0 ? value : this._shallowClone(value);
        }
      }
      _shallowClone(value) {
        let clone;
        if (isObject(value)) {
          clone = {...value};
        } else if (isArray(value)) {
          clone = [...value];
        } else if (value instanceof Date) {
          clone = new Date(value);
        } else if (value instanceof Set) {
          clone = new Set(value);
        } else if (value instanceof Map) {
          clone = new Map(value);
        }
        this._clonedCache.add(clone);
        return clone;
      }
      preferredThisArg(target, thisArg, thisProxyTarget) {
        const {name} = target;
        if (SmartClone.isHandledMethod(thisProxyTarget, name)) {
          if (isArray(thisProxyTarget)) {
            this._onIsChanged = SHALLOW_MUTABLE_ARRAY_METHODS[name];
          } else if (thisProxyTarget instanceof Set) {
            this._onIsChanged = SHALLOW_MUTABLE_SET_METHODS[name];
          } else if (thisProxyTarget instanceof Map) {
            this._onIsChanged = SHALLOW_MUTABLE_MAP_METHODS[name];
          }
          return thisProxyTarget;
        }
        return thisArg;
      }
      update(fullPath, property, value) {
        if (value !== void 0 && property !== "length") {
          let object = this.clone;
          path.walk(path.after(fullPath, this._path), (key) => {
            if (!this._clonedCache.has(object[key])) {
              object[key] = this._shallowClone(object[key]);
            }
            object = object[key];
          });
          object[property] = value;
        }
        this._isChanged = true;
      }
      isChanged(value, equals, argumentsList) {
        if (value instanceof Date) {
          return !equals(this.clone.valueOf(), value.valueOf());
        }
        if (value instanceof WeakSet) {
          return this._weakValue !== value.has(argumentsList[0]);
        }
        if (value instanceof WeakMap) {
          return this._weakValue !== value.get(argumentsList[0]);
        }
        return this._onIsChanged === void 0 ? this._isChanged : this._onIsChanged(this.clone, value);
      }
    };
    var SmartClone = class {
      constructor() {
        this.stack = [];
      }
      static isHandledType(value) {
        return isObject(value) || isArray(value) || isBuiltin.withMutableMethods(value);
      }
      static isHandledMethod(target, name) {
        if (isObject(target)) {
          return IMMUTABLE_OBJECT_METHODS.has(name);
        }
        if (isArray(target)) {
          return HANDLED_ARRAY_METHODS.has(name);
        }
        if (target instanceof Set) {
          return HANDLED_SET_METHODS.has(name);
        }
        if (target instanceof Map) {
          return HANDLED_MAP_METHODS.has(name);
        }
        return isBuiltin.withMutableMethods(target);
      }
      get isCloning() {
        return this.stack.length !== 0;
      }
      start(value, path2, argumentsList) {
        this.stack.push(new Clone(value, path2, argumentsList));
      }
      update(fullPath, property, value) {
        this.stack[this.stack.length - 1].update(fullPath, property, value);
      }
      preferredThisArg(target, thisArg, thisProxyTarget) {
        return this.stack[this.stack.length - 1].preferredThisArg(target, thisArg, thisProxyTarget);
      }
      isChanged(isMutable, value, equals, argumentsList) {
        return this.stack[this.stack.length - 1].isChanged(isMutable, value, equals, argumentsList);
      }
      stop() {
        return this.stack.pop().clone;
      }
    };
    module.exports = SmartClone;
  });

  // node_modules/on-change/index.js
  var require_on_change = __commonJS((exports, module) => {
    "use strict";
    var {TARGET, UNSUBSCRIBE} = require_constants();
    var isBuiltin = require_is_builtin();
    var path = require_path();
    var isSymbol = require_is_symbol();
    var isIterator = require_is_iterator();
    var wrapIterator = require_wrap_iterator();
    var ignoreProperty = require_ignore_property();
    var Cache = require_cache2();
    var SmartClone = require_smart_clone();
    var defaultOptions = {
      equals: Object.is,
      isShallow: false,
      pathAsArray: false,
      ignoreSymbols: false,
      ignoreUnderscores: false,
      ignoreDetached: false
    };
    var onChange = (object, onChange2, options = {}) => {
      options = {
        ...defaultOptions,
        ...options
      };
      const proxyTarget = Symbol("ProxyTarget");
      const {equals, isShallow, ignoreDetached} = options;
      const cache = new Cache(equals);
      const smartClone = new SmartClone();
      const handleChangeOnTarget = (target, property, previous, value) => {
        if (!ignoreProperty(cache, options, property) && !(ignoreDetached && cache.isDetached(target, object))) {
          handleChange(cache.getPath(target), property, previous, value);
        }
      };
      const handleChange = (changePath, property, previous, value, name) => {
        if (smartClone.isCloning) {
          smartClone.update(changePath, property, previous);
        } else {
          onChange2(path.concat(changePath, property), value, previous, name);
        }
      };
      const getProxyTarget = (value) => {
        if (value) {
          return value[proxyTarget] || value;
        }
        return value;
      };
      const prepareValue = (value, target, property, basePath) => {
        if (isBuiltin.withoutMutableMethods(value) || property === "constructor" || isShallow && !SmartClone.isHandledMethod(target, property) || ignoreProperty(cache, options, property) || cache.isGetInvariant(target, property) || ignoreDetached && cache.isDetached(target, object)) {
          return value;
        }
        if (basePath === void 0) {
          basePath = cache.getPath(target);
        }
        return cache.getProxy(value, path.concat(basePath, property), handler, proxyTarget);
      };
      const handler = {
        get(target, property, receiver) {
          if (isSymbol(property)) {
            if (property === proxyTarget || property === TARGET) {
              return target;
            }
            if (property === UNSUBSCRIBE && !cache.isUnsubscribed && cache.getPath(target).length === 0) {
              cache.unsubscribe();
              return target;
            }
          }
          const value = isBuiltin.withMutableMethods(target) ? Reflect.get(target, property) : Reflect.get(target, property, receiver);
          return prepareValue(value, target, property);
        },
        set(target, property, value, receiver) {
          value = getProxyTarget(value);
          const reflectTarget = target[proxyTarget] || target;
          const previous = reflectTarget[property];
          const hasProperty = property in target;
          if (cache.setProperty(reflectTarget, property, value, receiver, previous)) {
            if (!equals(previous, value) || !hasProperty) {
              handleChangeOnTarget(target, property, previous, value);
            }
            return true;
          }
          return false;
        },
        defineProperty(target, property, descriptor) {
          if (!cache.isSameDescriptor(descriptor, target, property)) {
            if (!cache.defineProperty(target, property, descriptor)) {
              return false;
            }
            handleChangeOnTarget(target, property, void 0, descriptor.value);
          }
          return true;
        },
        deleteProperty(target, property) {
          if (!Reflect.has(target, property)) {
            return true;
          }
          const previous = Reflect.get(target, property);
          if (cache.deleteProperty(target, property, previous)) {
            handleChangeOnTarget(target, property, previous);
            return true;
          }
          return false;
        },
        apply(target, thisArg, argumentsList) {
          const thisProxyTarget = thisArg[proxyTarget] || thisArg;
          if (cache.isUnsubscribed) {
            return Reflect.apply(target, thisProxyTarget, argumentsList);
          }
          if (SmartClone.isHandledType(thisProxyTarget)) {
            const applyPath = path.initial(cache.getPath(target));
            const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, target.name);
            smartClone.start(thisProxyTarget, applyPath, argumentsList);
            const result = Reflect.apply(target, smartClone.preferredThisArg(target, thisArg, thisProxyTarget), isHandledMethod ? argumentsList.map((argument) => getProxyTarget(argument)) : argumentsList);
            const isChanged = smartClone.isChanged(thisProxyTarget, equals, argumentsList);
            const clone = smartClone.stop();
            if (isChanged) {
              if (smartClone.isCloning) {
                handleChange(path.initial(applyPath), path.last(applyPath), clone, thisProxyTarget, target.name);
              } else {
                handleChange(applyPath, "", clone, thisProxyTarget, target.name);
              }
            }
            if ((thisArg instanceof Map || thisArg instanceof Set) && isIterator(result)) {
              return wrapIterator(result, target, thisArg, applyPath, prepareValue);
            }
            return SmartClone.isHandledType(result) && isHandledMethod ? cache.getProxy(result, applyPath, handler, proxyTarget) : result;
          }
          return Reflect.apply(target, thisArg, argumentsList);
        }
      };
      const proxy = cache.getProxy(object, options.pathAsArray ? [] : "", handler);
      onChange2 = onChange2.bind(proxy);
      return proxy;
    };
    onChange.target = (proxy) => proxy[TARGET] || proxy;
    onChange.unsubscribe = (proxy) => proxy[UNSUBSCRIBE] || proxy;
    module.exports = onChange;
  });

  // node_modules/rfdc/index.js
  var require_rfdc = __commonJS((exports, module) => {
    "use strict";
    module.exports = rfdc;
    function copyBuffer(cur) {
      if (cur instanceof Buffer) {
        return Buffer.from(cur);
      }
      return new cur.constructor(cur.buffer.slice(), cur.byteOffset, cur.length);
    }
    function rfdc(opts) {
      opts = opts || {};
      if (opts.circles)
        return rfdcCircles(opts);
      return opts.proto ? cloneProto : clone;
      function cloneArray(a, fn) {
        var keys = Object.keys(a);
        var a2 = new Array(keys.length);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          var cur = a[k];
          if (typeof cur !== "object" || cur === null) {
            a2[k] = cur;
          } else if (cur instanceof Date) {
            a2[k] = new Date(cur);
          } else if (ArrayBuffer.isView(cur)) {
            a2[k] = copyBuffer(cur);
          } else {
            a2[k] = fn(cur);
          }
        }
        return a2;
      }
      function clone(o) {
        if (typeof o !== "object" || o === null)
          return o;
        if (o instanceof Date)
          return new Date(o);
        if (Array.isArray(o))
          return cloneArray(o, clone);
        if (o instanceof Map)
          return new Map(cloneArray(Array.from(o), clone));
        if (o instanceof Set)
          return new Set(cloneArray(Array.from(o), clone));
        var o2 = {};
        for (var k in o) {
          if (Object.hasOwnProperty.call(o, k) === false)
            continue;
          var cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur instanceof Date) {
            o2[k] = new Date(cur);
          } else if (cur instanceof Map) {
            o2[k] = new Map(cloneArray(Array.from(cur), clone));
          } else if (cur instanceof Set) {
            o2[k] = new Set(cloneArray(Array.from(cur), clone));
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            o2[k] = clone(cur);
          }
        }
        return o2;
      }
      function cloneProto(o) {
        if (typeof o !== "object" || o === null)
          return o;
        if (o instanceof Date)
          return new Date(o);
        if (Array.isArray(o))
          return cloneArray(o, cloneProto);
        if (o instanceof Map)
          return new Map(cloneArray(Array.from(o), cloneProto));
        if (o instanceof Set)
          return new Set(cloneArray(Array.from(o), cloneProto));
        var o2 = {};
        for (var k in o) {
          var cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur instanceof Date) {
            o2[k] = new Date(cur);
          } else if (cur instanceof Map) {
            o2[k] = new Map(cloneArray(Array.from(cur), cloneProto));
          } else if (cur instanceof Set) {
            o2[k] = new Set(cloneArray(Array.from(cur), cloneProto));
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            o2[k] = cloneProto(cur);
          }
        }
        return o2;
      }
    }
    function rfdcCircles(opts) {
      var refs = [];
      var refsNew = [];
      return opts.proto ? cloneProto : clone;
      function cloneArray(a, fn) {
        var keys = Object.keys(a);
        var a2 = new Array(keys.length);
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          var cur = a[k];
          if (typeof cur !== "object" || cur === null) {
            a2[k] = cur;
          } else if (cur instanceof Date) {
            a2[k] = new Date(cur);
          } else if (ArrayBuffer.isView(cur)) {
            a2[k] = copyBuffer(cur);
          } else {
            var index = refs.indexOf(cur);
            if (index !== -1) {
              a2[k] = refsNew[index];
            } else {
              a2[k] = fn(cur);
            }
          }
        }
        return a2;
      }
      function clone(o) {
        if (typeof o !== "object" || o === null)
          return o;
        if (o instanceof Date)
          return new Date(o);
        if (Array.isArray(o))
          return cloneArray(o, clone);
        if (o instanceof Map)
          return new Map(cloneArray(Array.from(o), clone));
        if (o instanceof Set)
          return new Set(cloneArray(Array.from(o), clone));
        var o2 = {};
        refs.push(o);
        refsNew.push(o2);
        for (var k in o) {
          if (Object.hasOwnProperty.call(o, k) === false)
            continue;
          var cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur instanceof Date) {
            o2[k] = new Date(cur);
          } else if (cur instanceof Map) {
            o2[k] = new Map(cloneArray(Array.from(cur), clone));
          } else if (cur instanceof Set) {
            o2[k] = new Set(cloneArray(Array.from(cur), clone));
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            var i = refs.indexOf(cur);
            if (i !== -1) {
              o2[k] = refsNew[i];
            } else {
              o2[k] = clone(cur);
            }
          }
        }
        refs.pop();
        refsNew.pop();
        return o2;
      }
      function cloneProto(o) {
        if (typeof o !== "object" || o === null)
          return o;
        if (o instanceof Date)
          return new Date(o);
        if (Array.isArray(o))
          return cloneArray(o, cloneProto);
        if (o instanceof Map)
          return new Map(cloneArray(Array.from(o), cloneProto));
        if (o instanceof Set)
          return new Set(cloneArray(Array.from(o), cloneProto));
        var o2 = {};
        refs.push(o);
        refsNew.push(o2);
        for (var k in o) {
          var cur = o[k];
          if (typeof cur !== "object" || cur === null) {
            o2[k] = cur;
          } else if (cur instanceof Date) {
            o2[k] = new Date(cur);
          } else if (cur instanceof Map) {
            o2[k] = new Map(cloneArray(Array.from(cur), cloneProto));
          } else if (cur instanceof Set) {
            o2[k] = new Set(cloneArray(Array.from(cur), cloneProto));
          } else if (ArrayBuffer.isView(cur)) {
            o2[k] = copyBuffer(cur);
          } else {
            var i = refs.indexOf(cur);
            if (i !== -1) {
              o2[k] = refsNew[i];
            } else {
              o2[k] = cloneProto(cur);
            }
          }
        }
        refs.pop();
        refsNew.pop();
        return o2;
      }
    }
  });

  // node_modules/rfdc/default.js
  var require_default = __commonJS((exports, module) => {
    "use strict";
    module.exports = require_rfdc()();
  });

  // table/column/json.js
  var require_json = __commonJS((exports, module) => {
    var newEncode = require_newEncode2();
    var newDecode = require_newDecodeCore();
    var purify = require_purify2();
    var onChange = require_on_change();
    var clone = require_default();
    function _new(column) {
      column.purify = purify;
      column.encode = newEncode(column);
      column.decode = newDecode(column);
      column.onChange = onChange;
      column.toDto = toDto;
    }
    function toDto(value) {
      return clone(value);
    }
    module.exports = _new;
  });

  // table/column/guid/purify.js
  var require_purify3 = __commonJS((exports, module) => {
    function negotiateGuidFormat(candidate) {
      if (candidate == null)
        return null;
      var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!pattern.test(candidate))
        throw new TypeError(candidate + " is not a valid UUID");
      return candidate;
    }
    module.exports = negotiateGuidFormat;
  });

  // table/column/guid/newEncode.js
  var require_newEncode3 = __commonJS((exports, module) => {
    var newPara = require_newParameterized();
    var purify = require_purify3();
    function _new(column) {
      return function(candidate) {
        var value = purify(candidate);
        if (value == null) {
          if (column.dbNull === null)
            return newPara("null");
          return newPara("'" + column.dbNull + "'");
        }
        return newPara("'" + value + "'");
      };
    }
    module.exports = _new;
  });

  // table/column/guid.js
  var require_guid = __commonJS((exports, module) => {
    var newEncode = require_newEncode3();
    var newDecode = require_newDecodeCore();
    var purify = require_purify3();
    function _new(column) {
      column.purify = purify;
      column.encode = newEncode(column);
      column.decode = newDecode(column);
    }
    module.exports = _new;
  });

  // table/column/date/tryParseISO.js
  var require_tryParseISO = __commonJS((exports, module) => {
    var pattern = /(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\d(T| )[0-2]\d:[0-5]\d)/;
    function tryParseISO(iso) {
      if (pattern.test(iso))
        return iso;
    }
    module.exports = tryParseISO;
  });

  // table/column/date/getISOTimezone.js
  var require_getISOTimezone = __commonJS((exports, module) => {
    function getISOTimezone(date) {
      var tzo = -date.getTimezoneOffset();
      var dif = tzo >= 0 ? "+" : "-";
      return dif + pad(tzo / 60) + ":" + pad(tzo % 60);
    }
    function pad(num) {
      var norm = Math.abs(Math.floor(num));
      return (norm < 10 ? "0" : "") + norm;
    }
    module.exports = getISOTimezone;
  });

  // table/column/date/toISOString.js
  var require_toISOString = __commonJS((exports, module) => {
    var getISOTimezone = require_getISOTimezone();
    function toISOString(date) {
      return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds()) + "." + pad(date.getMilliseconds()) + getISOTimezone(date);
    }
    function pad(num) {
      var norm = Math.abs(Math.floor(num));
      return (norm < 10 ? "0" : "") + norm;
    }
    module.exports = toISOString;
  });

  // table/column/date/cloneDate.js
  var require_cloneDate = __commonJS((exports, module) => {
    var toISOString = require_toISOString();
    function cloneDate(date) {
      date = new Date(date);
      Object.defineProperty(date, "toISOString", {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function() {
          return toISOString(date);
        }
      });
      return date;
    }
    module.exports = cloneDate;
  });

  // table/column/date/purify.js
  var require_purify4 = __commonJS((exports, module) => {
    var tryParseISO = require_tryParseISO();
    var cloneDate = require_cloneDate();
    function purify(value) {
      if (value == null)
        return null;
      if (value.toISOString)
        return cloneDate(value);
      var iso = tryParseISO(value);
      if (iso)
        return iso;
      return cloneDate(value);
    }
    module.exports = purify;
  });

  // table/column/newEncodeSafe.js
  var require_newEncodeSafe = __commonJS((exports, module) => {
    var newPara = require_newParameterized();
    function _newSafe(column, purify) {
      return function(value) {
        value = purify(value);
        if (value == null) {
          if (column.dbNull === null)
            return newPara("null");
          return newPara("'" + column.dbNull + "'");
        }
        return newPara("?", [value]);
      };
    }
    module.exports = _newSafe;
  });

  // (disabled):useHook
  var require_useHook = __commonJS(() => {
  });

  // (disabled):node_modules/node-cls/index.js
  var require_node_cls = __commonJS(() => {
  });

  // pg/encodeBoolean.js
  var require_encodeBoolean = __commonJS((exports, module) => {
    function encodeBoolean(bool) {
      return bool.toString();
    }
    module.exports = encodeBoolean;
  });

  // pg/encodeDate.js
  var require_encodeDate = __commonJS((exports, module) => {
    function encodeDate(date) {
      if (date.toISOString)
        return "'" + date.toISOString() + "'";
      return "'" + date + "'";
    }
    module.exports = encodeDate;
  });

  // pg/deleteFromSql.js
  var require_deleteFromSql = __commonJS((exports, module) => {
    var format = "delete from %s %s%s";
    var util = require_util2();
    function deleteFromSql(table, alias, whereSql) {
      var name = table._dbName;
      return util.format(format, name, alias, whereSql);
    }
    module.exports = deleteFromSql;
  });

  // pg/selectForUpdateSql.js
  var require_selectForUpdateSql = __commonJS((exports, module) => {
    module.exports = function(alias) {
      return " FOR UPDATE OF " + alias;
    };
  });

  // table/getSessionContext.js
  var require_getSessionContext = __commonJS((exports, module) => {
    var useHook = require_useHook();
    var cls = require_node_cls();
    var flags = require_flags();
    var browserContext = {
      changes: [],
      encodeBoolean: require_encodeBoolean(),
      encodeDate: require_encodeDate(),
      deleteFromSql: require_deleteFromSql(),
      selectForUpdateSql: require_selectForUpdateSql(),
      multipleStatements: true,
      accept: (caller) => caller.visitPg(),
      dbClient: {
        executeQuery
      }
    };
    async function executeQuery(query, onCompleted) {
      let body = JSON.stringify({sql: query.sql(), parameters: query.parameters});
      let request = new Request(`${flags.url}`, {method: "POST", body});
      try {
        let response = await fetch(request);
        if (response.status === 200) {
          onCompleted(void 0, await response.json());
        } else {
          let msg = response.json && await response.json() || `Status ${response.status} from server`;
          let e = new Error(msg);
          e.status = response.status;
          onCompleted(e);
        }
      } catch (error) {
        onCompleted(error);
      }
    }
    function getSessionContext() {
      if (flags.url) {
        return browserContext;
      }
      if (useHook())
        return cls.getContext("rdb").rdb;
      else
        return process.domain.rdb;
    }
    module.exports = getSessionContext;
  });

  // table/getSessionSingleton.js
  var require_getSessionSingleton = __commonJS((exports, module) => {
    var getSessionContext = require_getSessionContext();
    module.exports = function(name) {
      return getSessionContext()[name];
    };
  });

  // table/column/date/newEncode.js
  var require_newEncode4 = __commonJS((exports, module) => {
    var newPara = require_newParameterized();
    var purify = require_purify4();
    var newEncodeSafe = require_newEncodeSafe();
    var getSessionSingleton = require_getSessionSingleton();
    function _new(column) {
      var encode = function(value) {
        value = purify(value);
        if (value == null) {
          if (column.dbNull === null)
            return newPara("null");
          return newPara("'" + column.dbNull + "'");
        }
        var encodeCore = getSessionSingleton("encodeDate");
        return newPara(encodeCore(value));
      };
      encode.safe = newEncodeSafe(column, purify);
      return encode;
    }
    module.exports = _new;
  });

  // table/column/date/newDecode.js
  var require_newDecode = __commonJS((exports, module) => {
    var newDecodeCore = require_newDecodeCore();
    var cloneDate = require_cloneDate();
    function _new(column) {
      var decodeCore = newDecodeCore(column);
      return function(value) {
        value = decodeCore(value);
        if (value === null)
          return value;
        return cloneDate(value);
      };
    }
    module.exports = _new;
  });

  // table/column/date.js
  var require_date = __commonJS((exports, module) => {
    var newEncode = require_newEncode4();
    var newDecode = require_newDecode();
    var purify = require_purify4();
    function _new(column) {
      column.purify = purify;
      column.encode = newEncode(column);
      column.decode = newDecode(column);
    }
    module.exports = _new;
  });

  // table/column/numeric/purify.js
  var require_purify5 = __commonJS((exports, module) => {
    function purify(value) {
      if (value == null)
        return null;
      if (typeof value !== "number")
        throw new Error("'" + value + "' is not a number");
      return value;
    }
    module.exports = purify;
  });

  // table/column/numeric/newEncode.js
  var require_newEncode5 = __commonJS((exports, module) => {
    var purify = require_purify5();
    var newParam = require_newParameterized();
    module.exports = function(column) {
      return encode;
      function encode(value) {
        value = purify(value);
        if (value == null) {
          var dbNull = column.dbNull;
          return newParam("" + dbNull + "");
        }
        return newParam("" + value);
      }
    };
  });

  // table/column/numeric/newDecode.js
  var require_newDecode2 = __commonJS((exports, module) => {
    var newDecodeCore = require_newDecodeCore();
    function _new(column) {
      var decodeCore = newDecodeCore(column);
      return function(value) {
        value = decodeCore(value);
        if (value === null)
          return value;
        if (typeof value !== "number")
          return parseFloat(value);
        return value;
      };
    }
    module.exports = _new;
  });

  // table/column/numeric.js
  var require_numeric = __commonJS((exports, module) => {
    var newEncode = require_newEncode5();
    var newDecode = require_newDecode2();
    var purify = require_purify5();
    function _new(column) {
      column.default = 0;
      column.purify = purify;
      column.encode = newEncode(column);
      column.decode = newDecode(column);
    }
    module.exports = _new;
  });

  // table/column/boolean/purify.js
  var require_purify6 = __commonJS((exports, module) => {
    function purify(value) {
      if (value === null || typeof value === "undefined")
        return null;
      return Boolean(value);
    }
    module.exports = purify;
  });

  // table/column/boolean/newEncode.js
  var require_newEncode6 = __commonJS((exports, module) => {
    var purify = require_purify6();
    var newParam = require_newParameterized();
    var getSessionSingleton = require_getSessionSingleton();
    var newEncodeSafe = require_newEncodeSafe();
    function _new(column) {
      function encode(value) {
        value = purify(value);
        if (value === null) {
          if (column.dbNull === null)
            return newParam("null");
          return newParam("'" + column.dbNull + "'");
        }
        var encodeCore = getSessionSingleton("encodeBoolean");
        if (value)
          return newParam(encodeCore(true));
        return newParam(encodeCore(false));
      }
      encode.safe = newEncodeSafe(column, purify);
      return encode;
    }
    module.exports = _new;
  });

  // table/column/boolean/newDecode.js
  var require_newDecode3 = __commonJS((exports, module) => {
    var purify = require_purify6();
    function _new(column) {
      return function(value) {
        if (value == column.dbNull)
          return null;
        return purify(value);
      };
    }
    module.exports = _new;
  });

  // table/column/boolean.js
  var require_boolean = __commonJS((exports, module) => {
    var newEncode = require_newEncode6();
    var newDecode = require_newDecode3();
    var purify = require_purify6();
    function _new(column) {
      column.purify = purify;
      column.default = false;
      column.encode = newEncode(column);
      column.decode = newDecode(column);
    }
    module.exports = _new;
  });

  // table/column/binary/purify.js
  var require_purify7 = __commonJS((exports, module) => {
    function purify(value) {
      if (value == null)
        return null;
      if (!Buffer.isBuffer(value))
        throw new Error("'" + value + "' is not a buffer");
      return value;
    }
    module.exports = purify;
  });

  // table/column/binary/newEncode.js
  var require_newEncode7 = __commonJS((exports, module) => {
    var purify = require_purify7();
    var newParam = require_newParameterized();
    function _new() {
      return encode;
      function encode(value) {
        value = purify(value);
        if (value === null)
          return newParam("null");
        return newParam("?", [value]);
      }
    }
    module.exports = _new;
  });

  // table/column/binary.js
  var require_binary = __commonJS((exports, module) => {
    var newEncode = require_newEncode7();
    var newDecode = require_newDecodeCore();
    var purify = require_purify7();
    function _new(column) {
      column.purify = purify;
      column.encode = newEncode(column);
      column.decode = newDecode(column);
    }
    module.exports = _new;
  });

  // table/column.js
  var require_column = __commonJS((exports, module) => {
    var Ajv = require_ajv();
    var inspect = require_util2().inspect;
    function defineColumn(column, table) {
      var c = {};
      c.string = function() {
        require_string()(table, column);
        return c;
      };
      c.json = function() {
        require_json()(column);
        return c;
      };
      c.guid = function() {
        require_guid()(column);
        return c;
      };
      c.date = function() {
        require_date()(column);
        return c;
      };
      c.numeric = function(optionalPrecision, optionalScale) {
        require_numeric()(column, optionalPrecision, optionalScale);
        return c;
      };
      c.boolean = function() {
        require_boolean()(column);
        return c;
      };
      c.binary = function() {
        require_binary()(column);
        return c;
      };
      c.default = function(value) {
        column.default = value;
        return c;
      };
      c.as = function(alias) {
        var oldAlias = column.alias;
        delete table[oldAlias];
        table[alias] = column;
        column.alias = alias;
        return c;
      };
      c.dbNull = function(value) {
        column.dbNull = value;
        return c;
      };
      c.serializable = function(value) {
        column.serializable = value;
        return c;
      };
      c.validate = function(value) {
        column.validate = value;
        return c;
      };
      c.JSONSchema = function(schema, options) {
        let ajv = new Ajv(options);
        let validate = ajv.compile(schema);
        column.validate = _validate;
        function _validate(value) {
          let valid = validate(value);
          if (!valid) {
            let e = new Error(`Column ${table._dbName}.${column._dbName} violates JSON Schema: ${inspect(validate.errors, false, 10)}`);
            e.errors = validate.errors;
            throw e;
          }
        }
        return c;
      };
      return c;
    }
    module.exports = defineColumn;
  });

  // newCollection.js
  var require_newCollection = __commonJS((exports, module) => {
    function newCollection() {
      var c = {};
      var initialArgs = [];
      for (var i = 0; i < arguments.length; i++) {
        initialArgs.push(arguments[i]);
      }
      var ranges = [initialArgs];
      c.addRange = function(otherCollection) {
        ranges.push(otherCollection);
      };
      c.add = function(element) {
        c.addRange([element]);
      };
      c.toArray = function() {
        var result = [];
        c.forEach(onEach);
        return result;
        function onEach(element) {
          result.push(element);
        }
      };
      c.forEach = function(callback) {
        var index = 0;
        for (var i2 = 0; i2 < ranges.length; i2++) {
          ranges[i2].forEach(onEach);
        }
        function onEach(element) {
          callback(element, index);
          index++;
        }
      };
      Object.defineProperty(c, "length", {
        enumerable: false,
        get: function() {
          var result = 0;
          for (var i2 = 0; i2 < ranges.length; i2++) {
            result += ranges[i2].length;
          }
          return result;
        }
      });
      return c;
    }
    module.exports = newCollection;
  });

  // table/query/singleQuery/newQueryContext.js
  var require_newQueryContext = __commonJS((exports, module) => {
    function newQueryContext() {
      var rows = [];
      var c = {};
      c.rows = rows;
      c.expand = function(relation) {
        rows.forEach(function(row) {
          relation.expand(row);
        });
      };
      c.add = function(row) {
        rows.push(row);
      };
      return c;
    }
    module.exports = newQueryContext;
  });

  // table/relation/newJoinLeg.js
  var require_newJoinLeg = __commonJS((exports, module) => {
    var newCollection = require_newCollection();
    var newQueryContext = require_newQueryContext();
    function newLeg(relation) {
      var c = {};
      var span = {};
      span.table = relation.childTable;
      span.legs = newCollection();
      span.queryContext = newQueryContext();
      c.span = span;
      c.name = relation.leftAlias;
      c.table = relation.parentTable;
      c.columns = relation.columns;
      c.expand = relation.expand;
      c.accept = function(visitor) {
        visitor.visitJoin(c);
      };
      return c;
    }
    module.exports = newLeg;
  });

  // table/tryGetFromCacheById.js
  var require_tryGetFromCacheById = __commonJS((exports, module) => {
    function tryGet(table) {
      var fakeRow = {};
      var args = arguments;
      table._primaryColumns.forEach(addPkValue);
      function addPkValue(pkColumn, index) {
        fakeRow[pkColumn.alias] = args[index + 1];
      }
      return table._cache.tryGet(fakeRow);
    }
    module.exports = tryGet;
  });

  // table/newPrimaryKeyFilter.js
  var require_newPrimaryKeyFilter = __commonJS((exports, module) => {
    function primaryKeyFilter(table) {
      var primaryColumns = table._primaryColumns;
      var key = arguments[1];
      var filter = primaryColumns[0].equal(key);
      for (var i = 1; i < primaryColumns.length; i++) {
        key = arguments[i + 1];
        var colFilter = primaryColumns[i].equal(key);
        filter = filter.and(colFilter);
      }
      return filter;
    }
    module.exports = primaryKeyFilter;
  });

  // table/query/singleQuery/columnSql/newShallowColumnSql.js
  var require_newShallowColumnSql = __commonJS((exports, module) => {
    function _new(table, alias) {
      var aliasDot = alias + ".";
      var commaAliasDot = "," + aliasDot;
      var columns = table._columns;
      var sql = aliasDot + encodeColumn(0);
      for (var i = 1; i < columns.length; i++) {
        sql = sql + commaAliasDot + encodeColumn(i);
      }
      return sql;
      function encodeColumn(i2) {
        return columns[i2]._dbName + " as s" + alias + i2;
      }
    }
    module.exports = _new;
  });

  // table/query/singleQuery/columnSql/joinLegToColumnSql.js
  var require_joinLegToColumnSql = __commonJS((exports, module) => {
    var newShallowColumnSql = require_newShallowColumnSql();
    var newJoinedColumnSql = _initJOinedColumnSql;
    function sql(leg, alias) {
      var span = leg.span;
      var shallowColumnSql = newShallowColumnSql(span.table, alias);
      var joinedColumnSql = newJoinedColumnSql(span, alias);
      return "," + shallowColumnSql + joinedColumnSql;
    }
    function _initJOinedColumnSql(span, alias) {
      newJoinedColumnSql = require_newJoinedColumnSql();
      return newJoinedColumnSql(span, alias);
    }
    module.exports = sql;
  });

  // table/query/singleQuery/columnSql/newJoinedColumnSql.js
  var require_newJoinedColumnSql = __commonJS((exports, module) => {
    var joinLegToColumnSql = require_joinLegToColumnSql();
    module.exports = function(span, alias) {
      var index = 0;
      var c = {};
      var sql = "";
      c.visitJoin = function(leg) {
        var joinSql = joinLegToColumnSql(leg, alias + "_" + index);
        sql = sql + joinSql;
      };
      c.visitOne = function(leg) {
        c.visitJoin(leg);
      };
      c.visitMany = function() {
      };
      span.legs.forEach(onEach);
      function onEach(leg) {
        leg.accept(c);
        index++;
      }
      return sql;
    };
  });

  // table/query/singleQuery/newColumnSql.js
  var require_newColumnSql = __commonJS((exports, module) => {
    var newShallowColumnSql = require_newShallowColumnSql();
    var newJoinedColumnSql = require_newJoinedColumnSql();
    module.exports = function(table, span, alias) {
      var shallowColumnSql = newShallowColumnSql(table, alias);
      var joinedColumnSql = newJoinedColumnSql(span, alias);
      return shallowColumnSql + joinedColumnSql;
    };
  });

  // table/query/singleQuery/newDiscriminatorSql.js
  var require_newDiscriminatorSql = __commonJS((exports, module) => {
    function newDiscriminatorSql(table, alias) {
      var result = "";
      var formulaDiscriminators = table._formulaDiscriminators;
      var columnDiscriminators = table._columnDiscriminators;
      addFormula();
      addColumn();
      return result;
      function addFormula() {
        for (var i = 0; i < formulaDiscriminators.length; i++) {
          var current = formulaDiscriminators[i].replace("@this", alias);
          and();
          result += "(" + current + ")";
        }
      }
      function addColumn() {
        for (var i = 0; i < columnDiscriminators.length; i++) {
          var current = columnDiscriminators[i];
          and();
          result += alias + "." + current;
        }
      }
      function and() {
        if (result)
          result += " AND ";
        else
          result = " ";
      }
    }
    module.exports = newDiscriminatorSql;
  });

  // table/query/singleQuery/joinSql/newDiscriminatorSql.js
  var require_newDiscriminatorSql2 = __commonJS((exports, module) => {
    var newDiscriminatorSqlCore = require_newDiscriminatorSql();
    function newDiscriminatorSql(table, alias) {
      var result = newDiscriminatorSqlCore(table, alias);
      if (result)
        return " AND" + result;
      return result;
    }
    module.exports = newDiscriminatorSql;
  });

  // table/query/singleQuery/joinSql/newShallowJoinSqlCore.js
  var require_newShallowJoinSqlCore = __commonJS((exports, module) => {
    var newDiscriminatorSql = require_newDiscriminatorSql2();
    function _new(rightTable, leftColumns, rightColumns, leftAlias, rightAlias) {
      var sql = "";
      var delimiter = "";
      for (var i = 0; i < leftColumns.length; i++) {
        addColumn(i);
        delimiter = " AND ";
      }
      function addColumn(index) {
        var leftColumn = leftColumns[index];
        var rightColumn = rightColumns[index];
        sql += delimiter + leftAlias + "." + leftColumn._dbName + "=" + rightAlias + "." + rightColumn._dbName;
      }
      sql += newDiscriminatorSql(rightTable, rightAlias);
      return sql;
    }
    module.exports = _new;
  });

  // table/query/singleQuery/joinSql/newShallowJoinSql.js
  var require_newShallowJoinSql = __commonJS((exports, module) => {
    var newJoinCore = require_newShallowJoinSqlCore();
    function _new(rightTable, leftColumns, rightColumns, leftAlias, rightAlias) {
      var sql = " JOIN " + rightTable._dbName + " " + rightAlias + " ON (";
      sql += newJoinCore(rightTable, leftColumns, rightColumns, leftAlias, rightAlias) + ")";
      return sql;
    }
    module.exports = _new;
  });

  // table/query/singleQuery/joinSql/joinLegToShallowJoinSql.js
  var require_joinLegToShallowJoinSql = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSql();
    function toJoinSql(leg, alias, childAlias) {
      var columns = leg.columns;
      var childTable = leg.span.table;
      return " LEFT" + newShallowJoinSql(childTable, columns, childTable._primaryColumns, alias, childAlias);
    }
    module.exports = toJoinSql;
  });

  // table/query/singleQuery/joinSql/joinLegToJoinSql.js
  var require_joinLegToJoinSql = __commonJS((exports, module) => {
    var joinLegToShallowJoinSql = require_joinLegToShallowJoinSql();
    var newJoinSql = _newJoinSql;
    function toJoinSql(leg, alias, childAlias) {
      return joinLegToShallowJoinSql(leg, alias, childAlias) + newJoinSql(leg.span, childAlias);
    }
    function _newJoinSql() {
      newJoinSql = require_newJoinSql();
      return newJoinSql.apply(null, arguments);
    }
    module.exports = toJoinSql;
  });

  // table/query/singleQuery/joinSql/oneLegToShallowJoinSql.js
  var require_oneLegToShallowJoinSql = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSql();
    function toJoinSql(leg, alias, childAlias) {
      var parentTable = leg.table;
      var columns = leg.columns;
      var childTable = leg.span.table;
      return " LEFT" + newShallowJoinSql(childTable, parentTable._primaryColumns, columns, alias, childAlias);
    }
    module.exports = toJoinSql;
  });

  // table/query/singleQuery/joinSql/oneLegToJoinSql.js
  var require_oneLegToJoinSql = __commonJS((exports, module) => {
    var oneLegToShallowJoinSql = require_oneLegToShallowJoinSql();
    var newJoinSql = _newJoinSql;
    function toJoinSql(leg, alias, childAlias) {
      return oneLegToShallowJoinSql(leg, alias, childAlias) + newJoinSql(leg.span, childAlias);
    }
    function _newJoinSql() {
      newJoinSql = require_newJoinSql();
      return newJoinSql.apply(null, arguments);
    }
    module.exports = toJoinSql;
  });

  // table/query/singleQuery/newJoinSql.js
  var require_newJoinSql = __commonJS((exports, module) => {
    var joinLegToJoinSql = require_joinLegToJoinSql();
    var oneLegToJoinSql = require_oneLegToJoinSql();
    function _new(span, alias) {
      var sql = "";
      var legNo = 0;
      var childAlias;
      var c = {};
      c.visitJoin = function(leg) {
        sql = sql + joinLegToJoinSql(leg, alias, childAlias);
      };
      c.visitOne = function(leg) {
        sql = sql + oneLegToJoinSql(leg, alias, childAlias);
      };
      c.visitMany = function() {
      };
      function onEachLeg(leg) {
        childAlias = alias + "_" + legNo;
        leg.accept(c);
        legNo++;
      }
      span.legs.forEach(onEachLeg);
      return sql;
    }
    module.exports = _new;
  });

  // table/query/singleQuery/newWhereSql.js
  var require_newWhereSql = __commonJS((exports, module) => {
    var newDiscriminatorSql = require_newDiscriminatorSql();
    function newWhereSql(table, filter, alias) {
      var separator = " where";
      var result = "";
      var sql = filter.sql();
      var discriminator = newDiscriminatorSql(table, alias);
      if (sql) {
        result = separator + " " + sql;
        separator = " AND";
      }
      if (discriminator)
        result += separator + discriminator;
      return result;
    }
    module.exports = newWhereSql;
  });

  // table/query/singleQuery/negotiateLimit.js
  var require_negotiateLimit = __commonJS((exports, module) => {
    function negotiateLimit(limit) {
      if (!limit)
        return "";
      if (limit.charAt(0) !== " ")
        return " " + limit;
      return limit;
    }
    module.exports = negotiateLimit;
  });

  // table/query/singleQuery/negotiateExclusive.js
  var require_negotiateExclusive = __commonJS((exports, module) => {
    var getSessionSingleton = require_getSessionSingleton();
    function negotiateExclusive(table, alias, _exclusive) {
      if (table._exclusive || _exclusive) {
        var encode = getSessionSingleton("selectForUpdateSql");
        return encode(alias);
      }
      return "";
    }
    module.exports = negotiateExclusive;
  });

  // table/query/newSingleQuery.js
  var require_newSingleQuery = __commonJS((exports, module) => {
    var newColumnSql = require_newColumnSql();
    var newJoinSql = require_newJoinSql();
    var newWhereSql = require_newWhereSql();
    var negotiateLimit = require_negotiateLimit();
    var negotiateExclusive = require_negotiateExclusive();
    function _new(table, filter, span, alias, innerJoin, orderBy, limit, exclusive) {
      var c = {};
      c.sql = function() {
        var name = table._dbName;
        var columnSql = newColumnSql(table, span, alias);
        var innerJoinSql = innerJoin.sql();
        var joinSql = newJoinSql(span, alias);
        var whereSql = newWhereSql(table, filter, alias);
        var safeLimit = negotiateLimit(limit);
        var exclusiveClause = negotiateExclusive(table, alias, exclusive);
        return "select " + columnSql + " from " + name + " " + alias + innerJoinSql + joinSql + whereSql + orderBy + safeLimit + exclusiveClause;
      };
      c.parameters = innerJoin.parameters.concat(filter.parameters);
      return c;
    }
    module.exports = _new;
  });

  // emptyFilter.js
  var require_emptyFilter = __commonJS((exports, module) => {
    var negotiateRawSqlFilter = require_negotiateRawSqlFilter();
    var parameterized = require_newParameterized()("");
    function emptyFilter() {
      return emptyFilter.and.apply(null, arguments);
    }
    emptyFilter.sql = parameterized.sql;
    emptyFilter.parameters = parameterized.parameters;
    emptyFilter.and = function(other) {
      other = negotiateRawSqlFilter(other);
      for (var i = 1; i < arguments.length; i++) {
        other = other.and(arguments[i]);
      }
      return other;
    };
    emptyFilter.or = function(other) {
      other = negotiateRawSqlFilter(other);
      for (var i = 1; i < arguments.length; i++) {
        other = other.or(arguments[i]);
      }
      return other;
    };
    emptyFilter.not = function() {
      return emptyFilter;
    };
    module.exports = emptyFilter;
  });

  // table/query/extractFilter.js
  var require_extractFilter = __commonJS((exports, module) => {
    var emptyFilter = require_emptyFilter();
    function extract(filter) {
      if (filter)
        return filter;
      return emptyFilter;
    }
    module.exports = extract;
  });

  // table/query/extractOrderBy.js
  var require_extractOrderBy = __commonJS((exports, module) => {
    function extractOrderBy(table, alias, orderBy, originalOrderBy) {
      var dbNames = [];
      var i;
      if (orderBy) {
        if (typeof orderBy === "string")
          orderBy = [orderBy];
        for (i = 0; i < orderBy.length; i++) {
          var nameAndDirection = extractNameAndDirection(orderBy[i]);
          pushColumn(nameAndDirection.name, nameAndDirection.direction);
        }
      } else {
        if (originalOrderBy)
          return originalOrderBy;
        for (i = 0; i < table._primaryColumns.length; i++) {
          pushColumn(table._primaryColumns[i].alias);
        }
      }
      function extractNameAndDirection(orderBy2) {
        var elements = orderBy2.split(" ");
        var direction = "";
        if (elements.length > 1) {
          direction = " " + elements[1];
        }
        return {
          name: elements[0],
          direction
        };
      }
      function pushColumn(property, direction) {
        direction = direction || "";
        var column = getTableColumn(property);
        var jsonQuery = getJsonQuery(property, column.alias);
        dbNames.push(alias + "." + column._dbName + jsonQuery + direction);
      }
      function getTableColumn(property) {
        var column = table[property] || table[property.split(/(-|#)>+/g)[0]];
        if (!column) {
          throw new Error(`Unable to get column on orderBy '${property}'. If jsonb query, only #>, #>>, -> and ->> allowed. Only use ' ' to seperate between query and direction. Does currently not support casting.`);
        }
        return column;
      }
      function getJsonQuery(property, column) {
        let containsJson = /(-|#)>+/g.test(property);
        if (!containsJson) {
          return "";
        }
        return property.replace(column, "");
      }
      return " order by " + dbNames.join(",");
    }
    module.exports = extractOrderBy;
  });

  // table/query/extractLimit.js
  var require_extractLimit = __commonJS((exports, module) => {
    function extractLimit(span) {
      if (span.limit) {
        return " limit " + span.limit;
      }
      return "";
    }
    module.exports = extractLimit;
  });

  // table/newQuery.js
  var require_newQuery = __commonJS((exports, module) => {
    var newSingleQuery = require_newSingleQuery();
    var extractFilter = require_extractFilter();
    var extractOrderBy = require_extractOrderBy();
    var extractLimit = require_extractLimit();
    function newQuery(queries, table, filter, span, alias, innerJoin, orderBy, exclusive) {
      filter = extractFilter(filter);
      orderBy = extractOrderBy(table, alias, span.orderBy, orderBy);
      var limit = extractLimit(span);
      var singleQuery = newSingleQuery(table, filter, span, alias, innerJoin, orderBy, limit, exclusive);
      queries.push(singleQuery);
      return queries;
    }
    module.exports = newQuery;
  });

  // table/executeQueries/resolveExecuteQuery.js
  var require_resolveExecuteQuery = __commonJS((exports, module) => {
    var getSessionSingleton = require_getSessionSingleton();
    function resolveExecuteQuery(query) {
      return resolve;
      function resolve(success, failed) {
        try {
          var domain = process.domain;
          if (domain) {
            success = process.domain.bind(success);
            failed = process.domain.bind(failed);
          }
          var client = getSessionSingleton("dbClient");
          client.executeQuery(query, onCompleted);
        } catch (e) {
          failed(e);
        }
        function onCompleted(err, rows) {
          if (!err) {
            var lastIndex = rows.length - 1;
            if (!Array.isArray(rows[0]) && Array.isArray(rows[lastIndex]))
              rows = rows[lastIndex];
            success(rows);
          } else
            failed(err);
        }
      }
    }
    module.exports = resolveExecuteQuery;
  });

  // table/executeQueries/executeQuery.js
  var require_executeQuery = __commonJS((exports, module) => {
    var newResolver = require_resolveExecuteQuery();
    function executeQuery(query) {
      var resolver = newResolver(query);
      return new Promise(resolver);
    }
    module.exports = executeQuery;
  });

  // node_modules/asap/browser-raw.js
  var require_browser_raw = __commonJS((exports, module) => {
    "use strict";
    module.exports = rawAsap;
    function rawAsap(task) {
      if (!queue.length) {
        requestFlush();
        flushing = true;
      }
      queue[queue.length] = task;
    }
    var queue = [];
    var flushing = false;
    var requestFlush;
    var index = 0;
    var capacity = 1024;
    function flush() {
      while (index < queue.length) {
        var currentIndex = index;
        index = index + 1;
        queue[currentIndex].call();
        if (index > capacity) {
          for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
            queue[scan] = queue[scan + index];
          }
          queue.length -= index;
          index = 0;
        }
      }
      queue.length = 0;
      index = 0;
      flushing = false;
    }
    var scope = typeof global !== "undefined" ? global : self;
    var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;
    if (typeof BrowserMutationObserver === "function") {
      requestFlush = makeRequestCallFromMutationObserver(flush);
    } else {
      requestFlush = makeRequestCallFromTimer(flush);
    }
    rawAsap.requestFlush = requestFlush;
    function makeRequestCallFromMutationObserver(callback) {
      var toggle = 1;
      var observer = new BrowserMutationObserver(callback);
      var node = document.createTextNode("");
      observer.observe(node, {characterData: true});
      return function requestCall() {
        toggle = -toggle;
        node.data = toggle;
      };
    }
    function makeRequestCallFromTimer(callback) {
      return function requestCall() {
        var timeoutHandle = setTimeout(handleTimer, 0);
        var intervalHandle = setInterval(handleTimer, 50);
        function handleTimer() {
          clearTimeout(timeoutHandle);
          clearInterval(intervalHandle);
          callback();
        }
      };
    }
    rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;
  });

  // node_modules/asap/browser-asap.js
  var require_browser_asap = __commonJS((exports, module) => {
    "use strict";
    var rawAsap = require_browser_raw();
    var freeTasks = [];
    var pendingErrors = [];
    var requestErrorThrow = rawAsap.makeRequestCallFromTimer(throwFirstError);
    function throwFirstError() {
      if (pendingErrors.length) {
        throw pendingErrors.shift();
      }
    }
    module.exports = asap;
    function asap(task) {
      var rawTask;
      if (freeTasks.length) {
        rawTask = freeTasks.pop();
      } else {
        rawTask = new RawTask();
      }
      rawTask.task = task;
      rawAsap(rawTask);
    }
    function RawTask() {
      this.task = null;
    }
    RawTask.prototype.call = function() {
      try {
        this.task.call();
      } catch (error) {
        if (asap.onerror) {
          asap.onerror(error);
        } else {
          pendingErrors.push(error);
          requestErrorThrow();
        }
      } finally {
        this.task = null;
        freeTasks[freeTasks.length] = this;
      }
    };
  });

  // node_modules/promise/domains/core.js
  var require_core = __commonJS((exports, module) => {
    "use strict";
    var asap = require_browser_asap();
    function noop() {
    }
    var LAST_ERROR = null;
    var IS_ERROR = {};
    function getThen(obj) {
      try {
        return obj.then;
      } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
      }
    }
    function tryCallOne(fn, a) {
      try {
        return fn(a);
      } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
      }
    }
    function tryCallTwo(fn, a, b) {
      try {
        fn(a, b);
      } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
      }
    }
    module.exports = Promise2;
    function Promise2(fn) {
      if (typeof this !== "object") {
        throw new TypeError("Promises must be constructed via new");
      }
      if (typeof fn !== "function") {
        throw new TypeError("Promise constructor's argument is not a function");
      }
      this._U = 0;
      this._V = 0;
      this._W = null;
      this._X = null;
      if (fn === noop)
        return;
      doResolve(fn, this);
    }
    Promise2._Y = null;
    Promise2._Z = null;
    Promise2._0 = noop;
    Promise2.prototype.then = function(onFulfilled, onRejected) {
      if (this.constructor !== Promise2) {
        return safeThen(this, onFulfilled, onRejected);
      }
      var res = new Promise2(noop);
      handle(this, new Handler(onFulfilled, onRejected, res));
      return res;
    };
    function safeThen(self2, onFulfilled, onRejected) {
      return new self2.constructor(function(resolve2, reject2) {
        var res = new Promise2(noop);
        res.then(resolve2, reject2);
        handle(self2, new Handler(onFulfilled, onRejected, res));
      });
    }
    function handle(self2, deferred) {
      while (self2._V === 3) {
        self2 = self2._W;
      }
      if (Promise2._Y) {
        Promise2._Y(self2);
      }
      if (self2._V === 0) {
        if (self2._U === 0) {
          self2._U = 1;
          self2._X = deferred;
          return;
        }
        if (self2._U === 1) {
          self2._U = 2;
          self2._X = [self2._X, deferred];
          return;
        }
        self2._X.push(deferred);
        return;
      }
      handleResolved(self2, deferred);
    }
    function handleResolved(self2, deferred) {
      asap(function() {
        var cb = self2._V === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
          if (self2._V === 1) {
            resolve(deferred.promise, self2._W);
          } else {
            reject(deferred.promise, self2._W);
          }
          return;
        }
        var ret = tryCallOne(cb, self2._W);
        if (ret === IS_ERROR) {
          reject(deferred.promise, LAST_ERROR);
        } else {
          resolve(deferred.promise, ret);
        }
      });
    }
    function resolve(self2, newValue) {
      if (newValue === self2) {
        return reject(self2, new TypeError("A promise cannot be resolved with itself."));
      }
      if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
        var then = getThen(newValue);
        if (then === IS_ERROR) {
          return reject(self2, LAST_ERROR);
        }
        if (then === self2.then && newValue instanceof Promise2) {
          self2._V = 3;
          self2._W = newValue;
          finale(self2);
          return;
        } else if (typeof then === "function") {
          doResolve(then.bind(newValue), self2);
          return;
        }
      }
      self2._V = 1;
      self2._W = newValue;
      finale(self2);
    }
    function reject(self2, newValue) {
      self2._V = 2;
      self2._W = newValue;
      if (Promise2._Z) {
        Promise2._Z(self2, newValue);
      }
      finale(self2);
    }
    function finale(self2) {
      if (self2._U === 1) {
        handle(self2, self2._X);
        self2._X = null;
      }
      if (self2._U === 2) {
        for (var i = 0; i < self2._X.length; i++) {
          handle(self2, self2._X[i]);
        }
        self2._X = null;
      }
    }
    function Handler(onFulfilled, onRejected, promise) {
      this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
      this.onRejected = typeof onRejected === "function" ? onRejected : null;
      this.promise = promise;
    }
    function doResolve(fn, promise) {
      var done = false;
      var res = tryCallTwo(fn, function(value) {
        if (done)
          return;
        done = true;
        resolve(promise, value);
      }, function(reason) {
        if (done)
          return;
        done = true;
        reject(promise, reason);
      });
      if (!done && res === IS_ERROR) {
        done = true;
        reject(promise, LAST_ERROR);
      }
    }
  });

  // node_modules/promise/domains/done.js
  var require_done = __commonJS((exports, module) => {
    "use strict";
    var Promise2 = require_core();
    module.exports = Promise2;
    Promise2.prototype.done = function(onFulfilled, onRejected) {
      var self2 = arguments.length ? this.then.apply(this, arguments) : this;
      self2.then(null, function(err) {
        setTimeout(function() {
          throw err;
        }, 0);
      });
    };
  });

  // node_modules/promise/domains/finally.js
  var require_finally = __commonJS((exports, module) => {
    "use strict";
    var Promise2 = require_core();
    module.exports = Promise2;
    Promise2.prototype.finally = function(f) {
      return this.then(function(value) {
        return Promise2.resolve(f()).then(function() {
          return value;
        });
      }, function(err) {
        return Promise2.resolve(f()).then(function() {
          throw err;
        });
      });
    };
  });

  // node_modules/promise/domains/es6-extensions.js
  var require_es6_extensions = __commonJS((exports, module) => {
    "use strict";
    var Promise2 = require_core();
    module.exports = Promise2;
    var TRUE = valuePromise(true);
    var FALSE = valuePromise(false);
    var NULL = valuePromise(null);
    var UNDEFINED = valuePromise(void 0);
    var ZERO = valuePromise(0);
    var EMPTYSTRING = valuePromise("");
    function valuePromise(value) {
      var p = new Promise2(Promise2._0);
      p._V = 1;
      p._W = value;
      return p;
    }
    Promise2.resolve = function(value) {
      if (value instanceof Promise2)
        return value;
      if (value === null)
        return NULL;
      if (value === void 0)
        return UNDEFINED;
      if (value === true)
        return TRUE;
      if (value === false)
        return FALSE;
      if (value === 0)
        return ZERO;
      if (value === "")
        return EMPTYSTRING;
      if (typeof value === "object" || typeof value === "function") {
        try {
          var then = value.then;
          if (typeof then === "function") {
            return new Promise2(then.bind(value));
          }
        } catch (ex) {
          return new Promise2(function(resolve, reject) {
            reject(ex);
          });
        }
      }
      return valuePromise(value);
    };
    var iterableToArray = function(iterable) {
      if (typeof Array.from === "function") {
        iterableToArray = Array.from;
        return Array.from(iterable);
      }
      iterableToArray = function(x) {
        return Array.prototype.slice.call(x);
      };
      return Array.prototype.slice.call(iterable);
    };
    Promise2.all = function(arr) {
      var args = iterableToArray(arr);
      return new Promise2(function(resolve, reject) {
        if (args.length === 0)
          return resolve([]);
        var remaining = args.length;
        function res(i2, val) {
          if (val && (typeof val === "object" || typeof val === "function")) {
            if (val instanceof Promise2 && val.then === Promise2.prototype.then) {
              while (val._V === 3) {
                val = val._W;
              }
              if (val._V === 1)
                return res(i2, val._W);
              if (val._V === 2)
                reject(val._W);
              val.then(function(val2) {
                res(i2, val2);
              }, reject);
              return;
            } else {
              var then = val.then;
              if (typeof then === "function") {
                var p = new Promise2(then.bind(val));
                p.then(function(val2) {
                  res(i2, val2);
                }, reject);
                return;
              }
            }
          }
          args[i2] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        }
        for (var i = 0; i < args.length; i++) {
          res(i, args[i]);
        }
      });
    };
    Promise2.reject = function(value) {
      return new Promise2(function(resolve, reject) {
        reject(value);
      });
    };
    Promise2.race = function(values) {
      return new Promise2(function(resolve, reject) {
        iterableToArray(values).forEach(function(value) {
          Promise2.resolve(value).then(resolve, reject);
        });
      });
    };
    Promise2.prototype["catch"] = function(onRejected) {
      return this.then(null, onRejected);
    };
  });

  // node_modules/promise/domains/node-extensions.js
  var require_node_extensions = __commonJS((exports, module) => {
    "use strict";
    var Promise2 = require_core();
    var asap = require_browser_asap();
    module.exports = Promise2;
    Promise2.denodeify = function(fn, argumentCount) {
      if (typeof argumentCount === "number" && argumentCount !== Infinity) {
        return denodeifyWithCount(fn, argumentCount);
      } else {
        return denodeifyWithoutCount(fn);
      }
    };
    var callbackFn = "function (err, res) {if (err) { rj(err); } else { rs(res); }}";
    function denodeifyWithCount(fn, argumentCount) {
      var args = [];
      for (var i = 0; i < argumentCount; i++) {
        args.push("a" + i);
      }
      var body = [
        "return function (" + args.join(",") + ") {",
        "var self = this;",
        "return new Promise(function (rs, rj) {",
        "var res = fn.call(",
        ["self"].concat(args).concat([callbackFn]).join(","),
        ");",
        "if (res &&",
        '(typeof res === "object" || typeof res === "function") &&',
        'typeof res.then === "function"',
        ") {rs(res);}",
        "});",
        "};"
      ].join("");
      return Function(["Promise", "fn"], body)(Promise2, fn);
    }
    function denodeifyWithoutCount(fn) {
      var fnLength = Math.max(fn.length - 1, 3);
      var args = [];
      for (var i = 0; i < fnLength; i++) {
        args.push("a" + i);
      }
      var body = [
        "return function (" + args.join(",") + ") {",
        "var self = this;",
        "var args;",
        "var argLength = arguments.length;",
        "if (arguments.length > " + fnLength + ") {",
        "args = new Array(arguments.length + 1);",
        "for (var i = 0; i < arguments.length; i++) {",
        "args[i] = arguments[i];",
        "}",
        "}",
        "return new Promise(function (rs, rj) {",
        "var cb = " + callbackFn + ";",
        "var res;",
        "switch (argLength) {",
        args.concat(["extra"]).map(function(_, index) {
          return "case " + index + ":res = fn.call(" + ["self"].concat(args.slice(0, index)).concat("cb").join(",") + ");break;";
        }).join(""),
        "default:",
        "args[argLength] = cb;",
        "res = fn.apply(self, args);",
        "}",
        "if (res &&",
        '(typeof res === "object" || typeof res === "function") &&',
        'typeof res.then === "function"',
        ") {rs(res);}",
        "});",
        "};"
      ].join("");
      return Function(["Promise", "fn"], body)(Promise2, fn);
    }
    Promise2.nodeify = function(fn) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var callback = typeof args[args.length - 1] === "function" ? args.pop() : null;
        var ctx = this;
        try {
          return fn.apply(this, arguments).nodeify(callback, ctx);
        } catch (ex) {
          if (callback === null || typeof callback == "undefined") {
            return new Promise2(function(resolve, reject) {
              reject(ex);
            });
          } else {
            asap(function() {
              callback.call(ctx, ex);
            });
          }
        }
      };
    };
    Promise2.prototype.nodeify = function(callback, ctx) {
      if (typeof callback != "function")
        return this;
      this.then(function(value) {
        asap(function() {
          callback.call(ctx, null, value);
        });
      }, function(err) {
        asap(function() {
          callback.call(ctx, err);
        });
      });
    };
  });

  // node_modules/promise/domains/synchronous.js
  var require_synchronous = __commonJS((exports, module) => {
    "use strict";
    var Promise2 = require_core();
    module.exports = Promise2;
    Promise2.enableSynchronous = function() {
      Promise2.prototype.isPending = function() {
        return this.getState() == 0;
      };
      Promise2.prototype.isFulfilled = function() {
        return this.getState() == 1;
      };
      Promise2.prototype.isRejected = function() {
        return this.getState() == 2;
      };
      Promise2.prototype.getValue = function() {
        if (this._V === 3) {
          return this._W.getValue();
        }
        if (!this.isFulfilled()) {
          throw new Error("Cannot get a value of an unfulfilled promise.");
        }
        return this._W;
      };
      Promise2.prototype.getReason = function() {
        if (this._V === 3) {
          return this._W.getReason();
        }
        if (!this.isRejected()) {
          throw new Error("Cannot get a rejection reason of a non-rejected promise.");
        }
        return this._W;
      };
      Promise2.prototype.getState = function() {
        if (this._V === 3) {
          return this._W.getState();
        }
        if (this._V === -1 || this._V === -2) {
          return 0;
        }
        return this._V;
      };
    };
    Promise2.disableSynchronous = function() {
      Promise2.prototype.isPending = void 0;
      Promise2.prototype.isFulfilled = void 0;
      Promise2.prototype.isRejected = void 0;
      Promise2.prototype.getValue = void 0;
      Promise2.prototype.getReason = void 0;
      Promise2.prototype.getState = void 0;
    };
  });

  // node_modules/promise/domains/index.js
  var require_domains = __commonJS((exports, module) => {
    "use strict";
    module.exports = require_core();
    require_done();
    require_finally();
    require_es6_extensions();
    require_node_extensions();
    require_synchronous();
  });

  // table/promise.js
  var require_promise = __commonJS((exports, module) => {
    var promise = require_domains();
    var promisify = require_util2().promisify;
    function newPromise(func) {
      if (!func)
        return Promise.resolve();
      return new promise(func);
    }
    newPromise.all = Promise.all;
    newPromise.denodeify = promisify || promise.denodeify;
    module.exports = newPromise;
  });

  // table/executeQueries/executeChanges.js
  var require_executeChanges = __commonJS((exports, module) => {
    var executeQuery = require_executeQuery();
    var newPromise = require_promise();
    function executeChanges(queries) {
      if (queries.length === 0)
        return newPromise();
      var i = -1;
      return execute().then(emitChanged);
      function execute() {
        i++;
        if (i + 1 === queries.length)
          return executeQuery(queries[i]);
        else {
          return executeQuery(queries[i]).then(execute);
        }
      }
      async function emitChanged() {
        for (let i2 = 0; i2 < queries.length; i2++) {
          if (queries[i2].emitChanged)
            await Promise.all(queries[i2].emitChanged());
        }
      }
    }
    module.exports = executeChanges;
  });

  // table/commands/getChangeSet.js
  var require_getChangeSet = __commonJS((exports, module) => {
    var getSessionSingleton = require_getSessionSingleton();
    function getChangeSet() {
      return getSessionSingleton("changes");
    }
    module.exports = getChangeSet;
  });

  // table/commands/compressChanges.js
  var require_compressChanges = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    var getSessionSingleton = require_getSessionSingleton();
    function compress(queries) {
      var multipleStatements = getSessionSingleton("multipleStatements");
      var compressed = [];
      var queryCount = queries.length;
      for (var i = 0; i < queryCount; i++) {
        var current = queries[i];
        if (multipleStatements && current.parameters.length === 0 && !current.disallowCompress) {
          for (var i2 = i + 1; i2 < queryCount; i2++) {
            var next = queries[i2];
            if (next.parameters.length > 0 || !next.disallowCompress)
              break;
            current = newParameterized(current.sql() + ";" + next.sql());
            i++;
          }
        }
        compressed.push(current);
      }
      return compressed;
    }
    module.exports = compress;
  });

  // table/popChanges.js
  var require_popChanges = __commonJS((exports, module) => {
    var getChangeSet = require_getChangeSet();
    var compressChanges = require_compressChanges();
    function popChanges() {
      var changeSet = getChangeSet();
      var length = changeSet.length;
      if (length > 0) {
        var lastCmd = changeSet[length - 1];
        if (lastCmd.endEdit)
          lastCmd.endEdit();
        var compressed = compressChanges(changeSet);
        changeSet.length = 0;
        return compressed;
      }
      return changeSet;
    }
    module.exports = popChanges;
  });

  // table/executeQueries/executeQueriesCore.js
  var require_executeQueriesCore = __commonJS((exports, module) => {
    var executeQuery = require_executeQuery();
    function executeQueriesCore(queries) {
      var promises = [];
      for (var i = 0; i < queries.length; i++) {
        var q = executeQuery(queries[i]);
        promises.push(q);
      }
      return promises;
    }
    module.exports = executeQueriesCore;
  });

  // table/executeQueries.js
  var require_executeQueries = __commonJS((exports, module) => {
    var executeChanges = require_executeChanges();
    var popChanges = require_popChanges();
    var executeQueriesCore = require_executeQueriesCore();
    function executeQueries(queries) {
      var changes = popChanges();
      return executeChanges(changes).then(onDoneChanges);
      function onDoneChanges() {
        return executeQueriesCore(queries);
      }
    }
    module.exports = executeQueries;
  });

  // table/resultToRows/negotiateQueryContext.js
  var require_negotiateQueryContext = __commonJS((exports, module) => {
    function negotiateQueryContext(queryContext, row) {
      if (queryContext)
        queryContext.add(row);
    }
    module.exports = negotiateQueryContext;
  });

  // table/commands/newUpdateCommandCore.js
  var require_newUpdateCommandCore = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    function newUpdateCommandCore(table, columns, row) {
      var command = newParameterized("UPDATE " + table._dbName + " SET");
      var separator = " ";
      addColumns();
      addWhereId();
      addDiscriminators();
      function addColumns() {
        for (var alias in columns) {
          var column = columns[alias];
          var encoded = column.encode(row[alias]);
          command = command.append(separator + column._dbName + "=").append(encoded);
          separator = ",";
        }
      }
      function addWhereId() {
        separator = " WHERE ";
        var columns2 = table._primaryColumns;
        for (var i = 0; i < columns2.length; i++) {
          var column = columns2[i];
          var value = row[column.alias];
          var encoded = column.encode(value);
          command = command.append(separator + column._dbName + "=").append(encoded);
          separator = " AND ";
        }
      }
      function addDiscriminators() {
        var discriminators = table._columnDiscriminators;
        if (discriminators.length === 0)
          return;
        discriminators = separator + discriminators.join(" AND ");
        command = command.append(discriminators);
      }
      return command;
    }
    module.exports = newUpdateCommandCore;
  });

  // newImmutable.js
  var require_newImmutable = __commonJS((exports, module) => {
    function newImmutable(fn) {
      var result;
      var _run = runFirst;
      return run;
      function run() {
        var args = [].slice.call(arguments);
        return _run(args);
      }
      function runFirst(args) {
        result = fn.apply(null, args);
        _run = runNIgnoreArgs;
        return result;
      }
      function runNIgnoreArgs() {
        return result;
      }
    }
    module.exports = newImmutable;
  });

  // newObject.js
  var require_newObject = __commonJS((exports, module) => {
    function newObject() {
      return {};
    }
    module.exports = newObject;
  });

  // node_modules/rfc6902/pointer.js
  var require_pointer = __commonJS((exports) => {
    "use strict";
    Object.defineProperty(exports, "__esModule", {value: true});
    exports.Pointer = void 0;
    function unescape(token) {
      return token.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    function escape(token) {
      return token.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    var Pointer = function() {
      function Pointer2(tokens) {
        if (tokens === void 0) {
          tokens = [""];
        }
        this.tokens = tokens;
      }
      Pointer2.fromJSON = function(path) {
        var tokens = path.split("/").map(unescape);
        if (tokens[0] !== "")
          throw new Error("Invalid JSON Pointer: " + path);
        return new Pointer2(tokens);
      };
      Pointer2.prototype.toString = function() {
        return this.tokens.map(escape).join("/");
      };
      Pointer2.prototype.evaluate = function(object) {
        var parent = null;
        var key = "";
        var value = object;
        for (var i = 1, l = this.tokens.length; i < l; i++) {
          parent = value;
          key = this.tokens[i];
          value = (parent || {})[key];
        }
        return {parent, key, value};
      };
      Pointer2.prototype.get = function(object) {
        return this.evaluate(object).value;
      };
      Pointer2.prototype.set = function(object, value) {
        var cursor = object;
        for (var i = 1, l = this.tokens.length - 1, token = this.tokens[i]; i < l; i++) {
          cursor = (cursor || {})[token];
        }
        if (cursor) {
          cursor[this.tokens[this.tokens.length - 1]] = value;
        }
      };
      Pointer2.prototype.push = function(token) {
        this.tokens.push(token);
      };
      Pointer2.prototype.add = function(token) {
        var tokens = this.tokens.concat(String(token));
        return new Pointer2(tokens);
      };
      return Pointer2;
    }();
    exports.Pointer = Pointer;
  });

  // node_modules/rfc6902/util.js
  var require_util3 = __commonJS((exports) => {
    "use strict";
    Object.defineProperty(exports, "__esModule", {value: true});
    exports.clone = exports.objectType = exports.hasOwnProperty = void 0;
    exports.hasOwnProperty = Object.prototype.hasOwnProperty;
    function objectType(object) {
      if (object === void 0) {
        return "undefined";
      }
      if (object === null) {
        return "null";
      }
      if (Array.isArray(object)) {
        return "array";
      }
      return typeof object;
    }
    exports.objectType = objectType;
    function clone(source) {
      if (source == null || typeof source != "object") {
        return source;
      }
      if (source.constructor == Array) {
        var length_1 = source.length;
        var arrayTarget = new Array(length_1);
        for (var i = 0; i < length_1; i++) {
          arrayTarget[i] = clone(source[i]);
        }
        return arrayTarget;
      }
      var objectTarget = {};
      for (var key in source) {
        if (exports.hasOwnProperty.call(source, key)) {
          objectTarget[key] = clone(source[key]);
        }
      }
      return objectTarget;
    }
    exports.clone = clone;
  });

  // node_modules/rfc6902/equal.js
  var require_equal2 = __commonJS((exports) => {
    "use strict";
    Object.defineProperty(exports, "__esModule", {value: true});
    exports.compare = void 0;
    var util_1 = require_util3();
    function compareArrays(left, right) {
      var length = left.length;
      if (length !== right.length) {
        return false;
      }
      for (var i = 0; i < length; i++) {
        if (!compare(left[i], right[i])) {
          return false;
        }
      }
      return true;
    }
    function compareObjects(left, right) {
      var left_keys = Object.keys(left);
      var right_keys = Object.keys(right);
      var length = left_keys.length;
      if (length !== right_keys.length) {
        return false;
      }
      for (var i = 0; i < length; i++) {
        var key = left_keys[i];
        if (!util_1.hasOwnProperty.call(right, key) || !compare(left[key], right[key])) {
          return false;
        }
      }
      return true;
    }
    function compare(left, right) {
      if (left === right) {
        return true;
      }
      var left_type = util_1.objectType(left);
      var right_type = util_1.objectType(right);
      if (left_type == "array" && right_type == "array") {
        return compareArrays(left, right);
      }
      if (left_type == "object" && right_type == "object") {
        return compareObjects(left, right);
      }
      return false;
    }
    exports.compare = compare;
  });

  // node_modules/rfc6902/patch.js
  var require_patch = __commonJS((exports) => {
    "use strict";
    var __extends = exports && exports.__extends || function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (b2.hasOwnProperty(p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", {value: true});
    exports.apply = exports.InvalidOperationError = exports.test = exports.copy = exports.move = exports.replace = exports.remove = exports.add = exports.TestError = exports.MissingError = void 0;
    var pointer_1 = require_pointer();
    var util_1 = require_util3();
    var equal_1 = require_equal2();
    var MissingError = function(_super) {
      __extends(MissingError2, _super);
      function MissingError2(path) {
        var _this = _super.call(this, "Value required at path: " + path) || this;
        _this.path = path;
        _this.name = "MissingError";
        return _this;
      }
      return MissingError2;
    }(Error);
    exports.MissingError = MissingError;
    var TestError = function(_super) {
      __extends(TestError2, _super);
      function TestError2(actual, expected) {
        var _this = _super.call(this, "Test failed: " + actual + " != " + expected) || this;
        _this.actual = actual;
        _this.expected = expected;
        _this.name = "TestError";
        return _this;
      }
      return TestError2;
    }(Error);
    exports.TestError = TestError;
    function _add(object, key, value) {
      if (Array.isArray(object)) {
        if (key == "-") {
          object.push(value);
        } else {
          var index = parseInt(key, 10);
          object.splice(index, 0, value);
        }
      } else {
        object[key] = value;
      }
    }
    function _remove(object, key) {
      if (Array.isArray(object)) {
        var index = parseInt(key, 10);
        object.splice(index, 1);
      } else {
        delete object[key];
      }
    }
    function add(object, operation) {
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
      if (endpoint.parent === void 0) {
        return new MissingError(operation.path);
      }
      _add(endpoint.parent, endpoint.key, util_1.clone(operation.value));
      return null;
    }
    exports.add = add;
    function remove(object, operation) {
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
      if (endpoint.value === void 0) {
        return new MissingError(operation.path);
      }
      _remove(endpoint.parent, endpoint.key);
      return null;
    }
    exports.remove = remove;
    function replace(object, operation) {
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
      if (endpoint.parent === null) {
        return new MissingError(operation.path);
      }
      if (Array.isArray(endpoint.parent)) {
        if (parseInt(endpoint.key, 10) >= endpoint.parent.length) {
          return new MissingError(operation.path);
        }
      } else if (endpoint.value === void 0) {
        return new MissingError(operation.path);
      }
      endpoint.parent[endpoint.key] = operation.value;
      return null;
    }
    exports.replace = replace;
    function move(object, operation) {
      var from_endpoint = pointer_1.Pointer.fromJSON(operation.from).evaluate(object);
      if (from_endpoint.value === void 0) {
        return new MissingError(operation.from);
      }
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
      if (endpoint.parent === void 0) {
        return new MissingError(operation.path);
      }
      _remove(from_endpoint.parent, from_endpoint.key);
      _add(endpoint.parent, endpoint.key, from_endpoint.value);
      return null;
    }
    exports.move = move;
    function copy(object, operation) {
      var from_endpoint = pointer_1.Pointer.fromJSON(operation.from).evaluate(object);
      if (from_endpoint.value === void 0) {
        return new MissingError(operation.from);
      }
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
      if (endpoint.parent === void 0) {
        return new MissingError(operation.path);
      }
      _add(endpoint.parent, endpoint.key, util_1.clone(from_endpoint.value));
      return null;
    }
    exports.copy = copy;
    function test(object, operation) {
      var endpoint = pointer_1.Pointer.fromJSON(operation.path).evaluate(object);
      var result = equal_1.compare(endpoint.value, operation.value);
      if (!result) {
        return new TestError(endpoint.value, operation.value);
      }
      return null;
    }
    exports.test = test;
    var InvalidOperationError = function(_super) {
      __extends(InvalidOperationError2, _super);
      function InvalidOperationError2(operation) {
        var _this = _super.call(this, "Invalid operation: " + operation.op) || this;
        _this.operation = operation;
        _this.name = "InvalidOperationError";
        return _this;
      }
      return InvalidOperationError2;
    }(Error);
    exports.InvalidOperationError = InvalidOperationError;
    function apply(object, operation) {
      switch (operation.op) {
        case "add":
          return add(object, operation);
        case "remove":
          return remove(object, operation);
        case "replace":
          return replace(object, operation);
        case "move":
          return move(object, operation);
        case "copy":
          return copy(object, operation);
        case "test":
          return test(object, operation);
      }
      return new InvalidOperationError(operation);
    }
    exports.apply = apply;
  });

  // node_modules/rfc6902/diff.js
  var require_diff = __commonJS((exports) => {
    "use strict";
    Object.defineProperty(exports, "__esModule", {value: true});
    exports.diffAny = exports.diffObjects = exports.diffArrays = exports.intersection = exports.subtract = exports.isDestructive = void 0;
    var equal_1 = require_equal2();
    var util_1 = require_util3();
    function isDestructive(_a) {
      var op = _a.op;
      return op === "remove" || op === "replace" || op === "copy" || op === "move";
    }
    exports.isDestructive = isDestructive;
    function subtract(minuend, subtrahend) {
      var obj = {};
      for (var add_key in minuend) {
        if (util_1.hasOwnProperty.call(minuend, add_key) && minuend[add_key] !== void 0) {
          obj[add_key] = 1;
        }
      }
      for (var del_key in subtrahend) {
        if (util_1.hasOwnProperty.call(subtrahend, del_key) && subtrahend[del_key] !== void 0) {
          delete obj[del_key];
        }
      }
      return Object.keys(obj);
    }
    exports.subtract = subtract;
    function intersection(objects) {
      var length = objects.length;
      var counter = {};
      for (var i = 0; i < length; i++) {
        var object = objects[i];
        for (var key in object) {
          if (util_1.hasOwnProperty.call(object, key) && object[key] !== void 0) {
            counter[key] = (counter[key] || 0) + 1;
          }
        }
      }
      for (var key in counter) {
        if (counter[key] < length) {
          delete counter[key];
        }
      }
      return Object.keys(counter);
    }
    exports.intersection = intersection;
    function isArrayAdd(array_operation) {
      return array_operation.op === "add";
    }
    function isArrayRemove(array_operation) {
      return array_operation.op === "remove";
    }
    function appendArrayOperation(base, operation) {
      return {
        operations: base.operations.concat(operation),
        cost: base.cost + 1
      };
    }
    function diffArrays(input, output, ptr, diff) {
      if (diff === void 0) {
        diff = diffAny;
      }
      var memo = {
        "0,0": {operations: [], cost: 0}
      };
      function dist(i, j) {
        var memo_key = i + "," + j;
        var memoized = memo[memo_key];
        if (memoized === void 0) {
          if (i > 0 && j > 0 && equal_1.compare(input[i - 1], output[j - 1])) {
            memoized = dist(i - 1, j - 1);
          } else {
            var alternatives = [];
            if (i > 0) {
              var remove_base = dist(i - 1, j);
              var remove_operation = {
                op: "remove",
                index: i - 1
              };
              alternatives.push(appendArrayOperation(remove_base, remove_operation));
            }
            if (j > 0) {
              var add_base = dist(i, j - 1);
              var add_operation = {
                op: "add",
                index: i - 1,
                value: output[j - 1]
              };
              alternatives.push(appendArrayOperation(add_base, add_operation));
            }
            if (i > 0 && j > 0) {
              var replace_base = dist(i - 1, j - 1);
              var replace_operation = {
                op: "replace",
                index: i - 1,
                original: input[i - 1],
                value: output[j - 1]
              };
              alternatives.push(appendArrayOperation(replace_base, replace_operation));
            }
            var best = alternatives.sort(function(a, b) {
              return a.cost - b.cost;
            })[0];
            memoized = best;
          }
          memo[memo_key] = memoized;
        }
        return memoized;
      }
      var input_length = isNaN(input.length) || input.length <= 0 ? 0 : input.length;
      var output_length = isNaN(output.length) || output.length <= 0 ? 0 : output.length;
      var array_operations = dist(input_length, output_length).operations;
      var padded_operations = array_operations.reduce(function(_a, array_operation) {
        var operations = _a[0], padding = _a[1];
        if (isArrayAdd(array_operation)) {
          var padded_index = array_operation.index + 1 + padding;
          var index_token = padded_index < input_length + padding ? String(padded_index) : "-";
          var operation = {
            op: array_operation.op,
            path: ptr.add(index_token).toString(),
            value: array_operation.value
          };
          return [operations.concat(operation), padding + 1];
        } else if (isArrayRemove(array_operation)) {
          var operation = {
            op: array_operation.op,
            path: ptr.add(String(array_operation.index + padding)).toString()
          };
          return [operations.concat(operation), padding - 1];
        } else {
          var replace_ptr = ptr.add(String(array_operation.index + padding));
          var replace_operations = diff(array_operation.original, array_operation.value, replace_ptr);
          return [operations.concat.apply(operations, replace_operations), padding];
        }
      }, [[], 0])[0];
      return padded_operations;
    }
    exports.diffArrays = diffArrays;
    function diffObjects(input, output, ptr, diff) {
      if (diff === void 0) {
        diff = diffAny;
      }
      var operations = [];
      subtract(input, output).forEach(function(key) {
        operations.push({op: "remove", path: ptr.add(key).toString()});
      });
      subtract(output, input).forEach(function(key) {
        operations.push({op: "add", path: ptr.add(key).toString(), value: output[key]});
      });
      intersection([input, output]).forEach(function(key) {
        operations.push.apply(operations, diff(input[key], output[key], ptr.add(key)));
      });
      return operations;
    }
    exports.diffObjects = diffObjects;
    function diffAny(input, output, ptr, diff) {
      if (diff === void 0) {
        diff = diffAny;
      }
      if (input === output) {
        return [];
      }
      var input_type = util_1.objectType(input);
      var output_type = util_1.objectType(output);
      if (input_type == "array" && output_type == "array") {
        return diffArrays(input, output, ptr, diff);
      }
      if (input_type == "object" && output_type == "object") {
        return diffObjects(input, output, ptr, diff);
      }
      return [{op: "replace", path: ptr.toString(), value: output}];
    }
    exports.diffAny = diffAny;
  });

  // node_modules/rfc6902/index.js
  var require_rfc6902 = __commonJS((exports) => {
    "use strict";
    Object.defineProperty(exports, "__esModule", {value: true});
    exports.createTests = exports.createPatch = exports.applyPatch = void 0;
    var pointer_1 = require_pointer();
    var patch_1 = require_patch();
    var diff_1 = require_diff();
    function applyPatch(object, patch) {
      return patch.map(function(operation) {
        return patch_1.apply(object, operation);
      });
    }
    exports.applyPatch = applyPatch;
    function wrapVoidableDiff(diff) {
      function wrappedDiff(input, output, ptr) {
        var custom_patch = diff(input, output, ptr);
        return Array.isArray(custom_patch) ? custom_patch : diff_1.diffAny(input, output, ptr, wrappedDiff);
      }
      return wrappedDiff;
    }
    function createPatch(input, output, diff) {
      var ptr = new pointer_1.Pointer();
      return (diff ? wrapVoidableDiff(diff) : diff_1.diffAny)(input, output, ptr);
    }
    exports.createPatch = createPatch;
    function createTest(input, path) {
      var endpoint = pointer_1.Pointer.fromJSON(path).evaluate(input);
      if (endpoint !== void 0) {
        return {op: "test", path, value: endpoint.value};
      }
    }
    function createTests(input, patch) {
      var tests = new Array();
      patch.filter(diff_1.isDestructive).forEach(function(operation) {
        var pathTest = createTest(input, operation.path);
        if (pathTest)
          tests.push(pathTest);
        if ("from" in operation) {
          var fromTest = createTest(input, operation.from);
          if (fromTest)
            tests.push(fromTest);
        }
      });
      return tests;
    }
    exports.createTests = createTests;
  });

  // node_modules/rdb-client/createPatch.js
  var require_createPatch = __commonJS((exports, module) => {
    var rfc = require_rfc6902();
    module.exports = function createPatch(original, dto) {
      let clonedOriginal = toCompareObject(original);
      let clonedDto = toCompareObject(dto);
      let changes = rfc.createPatch(clonedOriginal, clonedDto);
      changes = changes.map(addOldValue);
      return changes;
      function addOldValue(change) {
        if (change.op === "remove" || change.op === "replace") {
          let splitPath = change.path.split("/");
          splitPath.shift();
          change.oldValue = splitPath.reduce(extract, clonedOriginal);
        } else
          return change;
        function extract(obj, element) {
          return obj[element];
        }
        return change;
      }
      function toCompareObject(object) {
        if (Array.isArray(object)) {
          let copy = {__patchType: "Array"};
          for (var i = 0; i < object.length; i++) {
            let element = toCompareObject(object[i]);
            if (element === Object(element) && "id" in element)
              copy[element.id] = element;
            else
              copy[i] = element;
          }
          return copy;
        } else if (object === Object(object)) {
          let copy = {};
          for (let name in object) {
            copy[name] = toCompareObject(object[name]);
          }
          return copy;
        }
        return object;
      }
    };
  });

  // node_modules/rdb-client/index.js
  var require_rdb_client = __commonJS((exports, module) => {
    var createPatch = require_createPatch();
    function rdbClient() {
      let isSaving;
      let isSlicing;
      let c = rdbClient;
      c.createPatch = createPatch;
      c.insert = insert;
      c.update = update;
      c.delete = _delete;
      c.proxify = proxify;
      c.save = save;
      let originalJSON = new WeakMap();
      let insertDeleteCount = new WeakMap();
      let previousArray = new WeakMap();
      let proxified = new WeakMap();
      function proxify(itemOrArray) {
        if (proxified.has(itemOrArray))
          return itemOrArray;
        if (Array.isArray(itemOrArray)) {
          for (let i = 0; i < itemOrArray.length; i++) {
            const row = itemOrArray[i];
            itemOrArray[i] = proxify(row);
          }
          let p = new Proxy(itemOrArray, arrayHandler);
          insertDeleteCount.set(p, new Map());
          proxified.set(p, p);
          return p;
        } else {
          let p = new Proxy(itemOrArray, handler);
          proxified.set(p, p);
          return p;
        }
      }
      let arrayHandler = {
        get(target, property, receiver) {
          if (property === "length" & !isSlicing) {
            isSlicing = true;
            previousArray.set(receiver, target.slice(0));
            isSlicing = false;
          }
          const value = Reflect.get(target, property, receiver);
          return value;
        },
        set: function(target, property, value, receiver) {
          isSlicing = true;
          let previous = receiver[property];
          if (property === "length" && previous > value) {
            let previousAr = previousArray.get(receiver);
            for (let i = Number.parseInt(value); i < previousAr.length; i++) {
              let row = previousAr[i];
              updateInsertDeleteCount(receiver, row, -1);
            }
          } else if (typeof previous === "object")
            updateInsertDeleteCount(receiver, previous, -1);
          if (typeof value === "object") {
            value = proxify(value);
            updateInsertDeleteCount(receiver, value, 1);
          }
          isSlicing = false;
          return Reflect.set(target, property, value);
        }
      };
      let handler = {
        set: function(obj, prop, value, receiver) {
          if (isSaving)
            obj[prop] = value;
          else if (!originalJSON.has(receiver)) {
            originalJSON.set(receiver, JSON.stringify(receiver));
            obj[prop] = value;
          }
          return true;
        }
      };
      function updateInsertDeleteCount(array, object, step) {
        let countMap = insertDeleteCount.get(array);
        let count = countMap.get(object) || 0;
        countMap.set(object, count + step);
      }
      async function insert(row, saveFn) {
        let patch = createPatch([], [row]);
        let changedRow = await saveFn(patch);
        console.log("changed inserted " + JSON.stringify(changedRow));
        row = proxify(row);
        isSaving = true;
        refresh(row, changedRow);
        isSaving = false;
        return row;
      }
      async function update(row, saveFn) {
        console.log("updating");
        let patch = [];
        if (originalJSON.has(row)) {
          patch = createPatch([JSON.parse(originalJSON.get(row))], [row]);
          console.log("got patch");
        } else
          console.log("no patch");
        let changedRow = await saveFn(patch);
        isSaving = true;
        refresh(row, changedRow);
        isSaving = false;
        return row;
      }
      async function _delete(row, saveFn) {
        let patch = createPatch([row], []);
        await saveFn(patch);
        return;
      }
      function refresh(row, updated) {
        for (let p in row) {
          if (!(p in updated))
            delete row[p];
        }
        Object.assign(row, updated);
      }
      async function save(rows, saveFn) {
        let counts = insertDeleteCount.get(rows);
        for (let i = 0; i < rows.length; i++) {
          let row = rows[i];
          if (counts.get(row) > 0)
            await insert(row, saveFn);
          else if (!counts.has(row) || counts.get(row) === 0)
            await update(row, saveFn);
        }
        for (let [row, count] of counts) {
          if (count < 0)
            await _delete(row, saveFn);
        }
        return rows;
      }
      return c;
    }
    module.exports = rdbClient();
  });

  // table/resultToRows/toDto/createDto.js
  var require_createDto = __commonJS((exports, module) => {
    var flags = require_flags();
    function _createDto(table, row) {
      var dto = {};
      var columns = table._columns;
      var length = columns.length;
      flags.useProxy = false;
      for (var i = 0; i < length; i++) {
        var column = columns[i];
        if (!("serializable" in column && !column.serializable)) {
          var alias = column.alias;
          if (column.toDto)
            dto[alias] = column.toDto(row[alias]);
          else
            dto[alias] = row[alias];
        }
      }
      flags.useProxy = true;
      return dto;
    }
    module.exports = _createDto;
  });

  // table/commands/newUpdateCommand.js
  var require_newUpdateCommand = __commonJS((exports, module) => {
    var newUpdateCommandCore = require_newUpdateCommandCore();
    var newImmutable = require_newImmutable();
    var newColumnList = require_newObject();
    var createPatch = require_rdb_client().createPatch;
    var createDto = require_createDto();
    function newUpdateCommand(table, column, row) {
      return new UpdateCommand(table, column, row);
    }
    function UpdateCommand(table, column, row) {
      this._table = table;
      this._row = row;
      this.__getCoreCommand = newImmutable(newUpdateCommandCore);
      this._columnList = newColumnList();
      this._columnList[column.alias] = column;
      this.onFieldChanged = this.onFieldChanged.bind(this);
      row.subscribeChanged(this.onFieldChanged);
    }
    UpdateCommand.prototype.onFieldChanged = function(_row, column) {
      this._columnList[column.alias] = column;
    };
    UpdateCommand.prototype.sql = function() {
      return this._getCoreCommand().sql();
    };
    Object.defineProperty(UpdateCommand.prototype, "parameters", {
      get: function() {
        return this._getCoreCommand().parameters;
      }
    });
    UpdateCommand.prototype._getCoreCommand = function() {
      return this.__getCoreCommand(this._table, this._columnList, this._row);
    };
    UpdateCommand.prototype.endEdit = function() {
      this._getCoreCommand();
      this._row.unsubscribeChanged(this.onFieldChanged);
      let dto = JSON.parse(JSON.stringify(createDto(this._table, this._row)));
      this._patch = createPatch([JSON.parse(this._row._oldValues)], [dto]);
      this._row._oldValues = JSON.stringify(dto);
    };
    UpdateCommand.prototype.emitChanged = function() {
      return this._table._emitChanged({row: this._row, patch: this._patch});
    };
    UpdateCommand.prototype.matches = function(otherRow) {
      return this._row === otherRow;
    };
    Object.defineProperty(UpdateCommand.prototype, "disallowCompress", {
      get: function() {
        return this._table._emitChanged.callbacks.length > 0;
      }
    });
    module.exports = newUpdateCommand;
  });

  // table/commands/negotiateEndEdit.js
  var require_negotiateEndEdit = __commonJS((exports, module) => {
    function negotiateEndEdit(changes) {
      var last = changes[changes.length - 1];
      if (last && last.endEdit)
        last.endEdit();
    }
    module.exports = negotiateEndEdit;
  });

  // table/commands/pushCommand.js
  var require_pushCommand = __commonJS((exports, module) => {
    var getChangeSet = require_getChangeSet();
    var negotiateEndEdit = require_negotiateEndEdit();
    function pushCommand(command) {
      var changes = getChangeSet();
      negotiateEndEdit(changes);
      changes.push(command);
    }
    module.exports = pushCommand;
  });

  // table/commands/lastCommandMatches.js
  var require_lastCommandMatches = __commonJS((exports, module) => {
    var getChangeSet = require_getChangeSet();
    function lastCommandMatches(row) {
      var changeSet = getChangeSet();
      var lastIndex = changeSet.length - 1;
      if (lastIndex >= 0 && changeSet[lastIndex].matches)
        return changeSet[lastIndex].matches(row);
      return false;
    }
    module.exports = lastCommandMatches;
  });

  // table/updateField.js
  var require_updateField = __commonJS((exports, module) => {
    var newUpdateCommand = require_newUpdateCommand();
    var pushCommand = require_pushCommand();
    var lastCommandMatches = require_lastCommandMatches();
    function updateField(table, column, row, oldValue) {
      if (lastCommandMatches(row))
        return;
      var command = newUpdateCommand(table, column, row, oldValue);
      pushCommand(command);
    }
    module.exports = updateField;
  });

  // emitEvent.js
  var require_emitEvent = __commonJS((exports, module) => {
    function emitEvent() {
      var callbacks = [];
      var emit = function() {
        var copy = callbacks.slice(0, callbacks.length);
        var result = [];
        for (var i = 0; i < copy.length; i++) {
          var callback = copy[i];
          result.push(callback.apply(null, arguments));
        }
        return result;
      };
      emit.add = function(callback) {
        callbacks.push(callback);
      };
      emit.tryAdd = function(callback) {
        if (callback)
          emit.add(callback);
      };
      emit.remove = function(callback) {
        for (var i = 0; i < callbacks.length; i++) {
          if (callbacks[i] === callback) {
            callbacks.splice(i, 1);
            return;
          }
        }
      };
      emit.tryRemove = function(callback) {
        if (callback)
          emit.remove(callback);
      };
      emit.clear = function() {
        callbacks.splice(0, callbacks.length);
      };
      emit.callbacks = callbacks;
      return emit;
    }
    module.exports = emitEvent;
  });

  // table/resultToRows/toDto/extractStrategy.js
  var require_extractStrategy = __commonJS((exports, module) => {
    var extractSubStrategy = _extractSubStrategy;
    function _extractSubStrategy(table) {
      extractSubStrategy = require_extractStrategy();
      return extractSubStrategy(table);
    }
    function extractStrategy() {
      if (arguments.length === 2)
        return arguments[0];
      var table = arguments[0];
      var strategy = {};
      var relations = table._relations;
      var relationName;
      var visitor = {};
      visitor.visitJoin = function() {
      };
      visitor.visitMany = function(relation2) {
        strategy[relationName] = extractSubStrategy(relation2.childTable);
      };
      visitor.visitOne = visitor.visitMany;
      for (relationName in relations) {
        var relation = relations[relationName];
        relation.accept(visitor);
      }
      return strategy;
    }
    module.exports = extractStrategy;
  });

  // table/extractDeleteStrategy.js
  var require_extractDeleteStrategy = __commonJS((exports, module) => {
    var emptyStrategy = require_newObject()();
    function extractDeleteStrategy(strategy) {
      if (strategy)
        return strategy;
      return emptyStrategy;
    }
    module.exports = extractDeleteStrategy;
  });

  // table/newCascadeDeleteStrategy.js
  var require_newCascadeDeleteStrategy = __commonJS((exports, module) => {
    var addSubStrategies = _addSubStrategies;
    var newObject = require_newObject();
    function newCascadeDeleteStrategy(strategy, table) {
      var relations = table._relations;
      var relationName;
      var c = {};
      c.visitJoin = function() {
      };
      c.visitOne = function(relation2) {
        var subStrategy = newObject();
        strategy[relationName] = subStrategy;
        addSubStrategies(subStrategy, relation2.childTable);
      };
      c.visitMany = c.visitOne;
      for (relationName in relations) {
        var relation = relations[relationName];
        relation.accept(c);
      }
      return strategy;
    }
    function _addSubStrategies(strategy, table) {
      addSubStrategies = require_newCascadeDeleteStrategy();
      addSubStrategies(strategy, table);
    }
    module.exports = newCascadeDeleteStrategy;
  });

  // table/resultToRows/delete/removeFromCache.js
  var require_removeFromCache = __commonJS((exports, module) => {
    var nextRemoveFromCache = _nextRemoveFromCache;
    function removeFromCache(row, strategy, table) {
      if (Array.isArray(row)) {
        removeManyRows();
        return;
      }
      if (row)
        removeSingleRow();
      function removeManyRows() {
        row.forEach(function(rowToRemove) {
          nextRemoveFromCache(rowToRemove, strategy, table);
        });
      }
      function removeSingleRow() {
        var relations = table._relations;
        for (var relationName in strategy) {
          var relation = relations[relationName];
          var rows = relation.getRowsSync(row);
          nextRemoveFromCache(rows, strategy[relationName], relation.childTable);
        }
        table._cache.tryRemove(row);
      }
    }
    function _nextRemoveFromCache(row, strategy, table) {
      nextRemoveFromCache = require_removeFromCache();
      nextRemoveFromCache(row, strategy, table);
    }
    module.exports = removeFromCache;
  });

  // table/commands/delete/singleCommand/selectSql.js
  var require_selectSql = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    var newBoolean = require_newBoolean();
    function newSelectSql(table, alias) {
      var colName = table._primaryColumns[0]._dbName;
      var sql = "SELECT " + alias + "." + colName + " FROM " + table._dbName + " AS " + alias;
      sql = newParameterized(sql);
      return newBoolean(sql);
    }
    module.exports = newSelectSql;
  });

  // table/commands/delete/createAlias.js
  var require_createAlias = __commonJS((exports, module) => {
    function createAlias(table, depth) {
      if (depth === 0)
        return table._dbName;
      return "_" + depth;
    }
    module.exports = createAlias;
  });

  // table/commands/delete/singleCommand/joinSql.js
  var require_joinSql = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSql();
    var createAlias = require_createAlias();
    function newJoinSql(relations) {
      var length = relations.length;
      var leftAlias, rightAlias;
      var sql = "";
      function addSql(relation) {
        var rightColumns = relation.childTable._primaryColumns;
        var leftColumns = relation.columns;
        sql += " INNER" + newShallowJoinSql(relation.childTable, leftColumns, rightColumns, leftAlias, rightAlias);
      }
      relations.forEach(function(relation, i) {
        leftAlias = "_" + (length - i);
        rightAlias = createAlias(relation.childTable, length - i - 1);
        addSql(relation);
      });
      return sql;
    }
    module.exports = newJoinSql;
  });

  // table/commands/delete/singleCommand/whereSql.js
  var require_whereSql = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    function newWhereSql(relations, shallowFilter, rightAlias) {
      var sql;
      var relationCount = relations.length;
      var relation = relations[0];
      var leftAlias = "_" + relationCount;
      var table = relation.childTable;
      var leftColumns = relation.columns;
      var rightColumns = table._primaryColumns;
      where(leftColumns, rightColumns);
      function where() {
        var table2 = relation.childTable;
        var joinCore = newShallowJoinSql(table2, leftColumns, rightColumns, leftAlias, rightAlias);
        if (shallowFilter)
          sql = shallowFilter.prepend(" WHERE " + joinCore + " AND ");
        else
          sql = " WHERE " + joinCore;
      }
      return sql;
    }
    module.exports = newWhereSql;
  });

  // table/commands/delete/singleCommand/subFilter.js
  var require_subFilter = __commonJS((exports, module) => {
    var newSelect = require_selectSql();
    var newJoin = require_joinSql();
    var newWhere = require_whereSql();
    var createAlias = require_createAlias();
    function newSubFilter(relations, shallowFilter) {
      var relationCount = relations.length;
      if (relationCount === 0)
        return shallowFilter;
      var table = relations[0].childTable;
      var alias = createAlias(table, relationCount - 1);
      var filter = newSelect(table, alias).prepend("EXISTS (");
      var join = newJoin(relations.slice(1));
      var where = newWhere(relations, shallowFilter, alias);
      return filter.append(join).append(where).append(")");
    }
    module.exports = newSubFilter;
  });

  // table/commands/delete/singleCommand/newSingleCommandCore.js
  var require_newSingleCommandCore = __commonJS((exports, module) => {
    var getSessionSingleton = require_getSessionSingleton();
    function newSingleCommandCore(table, filter, alias) {
      var c = {};
      c.sql = function() {
        var whereSql = filter.sql();
        if (whereSql)
          whereSql = " where " + whereSql;
        var deleteFromSql = getSessionSingleton("deleteFromSql");
        return deleteFromSql(table, alias, whereSql);
      };
      c.parameters = filter.parameters;
      return c;
    }
    module.exports = newSingleCommandCore;
  });

  // table/commands/delete/newSingleCommand.js
  var require_newSingleCommand = __commonJS((exports, module) => {
    var newSubFilter = require_subFilter();
    var newDiscriminatorSql = require_newDiscriminatorSql();
    var extractFilter = require_extractFilter();
    var newSingleCommandCore = require_newSingleCommandCore();
    var createAlias = require_createAlias();
    function _new(table, filter, relations) {
      var alias = createAlias(table, relations.length);
      filter = extractFilter(filter);
      filter = newSubFilter(relations, filter);
      var discriminator = newDiscriminatorSql(table, alias);
      if (discriminator !== "")
        filter = filter.and(discriminator);
      return newSingleCommandCore(table, filter, alias);
    }
    module.exports = _new;
  });

  // table/commands/newDeleteCommand.js
  var require_newDeleteCommand = __commonJS((exports, module) => {
    var newSingleCommand = require_newSingleCommand();
    var nextCommand = function() {
      nextCommand = require_newDeleteCommand();
      nextCommand.apply(null, arguments);
    };
    function newCommand(queries, table, filter, strategy, relations) {
      var singleCommand = newSingleCommand(table, filter, relations);
      for (var name in strategy) {
        var childStrategy = strategy[name];
        var childRelation = table._relations[name];
        var joinRelation = childRelation.joinRelation;
        var childRelations = [joinRelation].concat(relations);
        nextCommand(queries, childRelation.childTable, filter, childStrategy, childRelations);
      }
      queries.push(singleCommand);
      return queries;
    }
    module.exports = newCommand;
  });

  // table/resultToRows/delete.js
  var require_delete = __commonJS((exports, module) => {
    var removeFromCache = require_removeFromCache();
    var pushCommand = require_pushCommand();
    var newDeleteCommand = require_newDeleteCommand();
    var newPrimaryKeyFilter = require_newPrimaryKeyFilter();
    var createPatch = require_rdb_client().createPatch;
    var createDto = require_createDto();
    function _delete(row, strategy, table) {
      var relations = [];
      removeFromCache(row, strategy, table);
      var args = [table];
      table._primaryColumns.forEach(function(primary) {
        args.push(row[primary.alias]);
      });
      var filter = newPrimaryKeyFilter.apply(null, args);
      var cmds = newDeleteCommand([], table, filter, strategy, relations);
      cmds.forEach(function(cmd2) {
        pushCommand(cmd2);
      });
      var cmd = cmds[0];
      if (table._emitChanged.callbacks.length > 0) {
        cmd.disallowCompress = true;
        var dto = createDto(table, row);
        let patch = createPatch([dto], []);
        cmd.emitChanged = table._emitChanged.bind(null, {row, patch});
      }
    }
    module.exports = _delete;
  });

  // table/resultToPromise.js
  var require_resultToPromise = __commonJS((exports, module) => {
    function resultToPromise(result) {
      return Promise.resolve(result);
    }
    module.exports = resultToPromise;
  });

  // table/resultToRows/toDto.js
  var require_toDto = __commonJS((exports, module) => {
    var resultToPromise = require_resultToPromise();
    var createDto = require_createDto();
    function toDto(strategy, table, row) {
      var dto = createDto(table, row);
      strategy = strategy || {};
      var promise = resultToPromise(dto);
      for (var property in strategy) {
        mapChild(property);
      }
      function mapChild(name) {
        promise = promise.then(getRelated).then(onChild);
        function getRelated() {
          return row[name];
        }
        function onChild(child) {
          if (child)
            return child.__toDto(strategy[name]).then(onChildDto);
        }
        function onChildDto(childDto) {
          dto[name] = childDto;
        }
      }
      return promise.then(function() {
        return dto;
      });
    }
    module.exports = toDto;
  });

  // ../node_modules/object-assign/index.js
  var require_object_assign = __commonJS((exports, module) => {
    /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
    "use strict";
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
      if (val === null || val === void 0) {
        throw new TypeError("Object.assign cannot be called with null or undefined");
      }
      return Object(val);
    }
    function shouldUseNative() {
      try {
        if (!Object.assign) {
          return false;
        }
        var test1 = new String("abc");
        test1[5] = "de";
        if (Object.getOwnPropertyNames(test1)[0] === "5") {
          return false;
        }
        var test2 = {};
        for (var i = 0; i < 10; i++) {
          test2["_" + String.fromCharCode(i)] = i;
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
          return test2[n];
        });
        if (order2.join("") !== "0123456789") {
          return false;
        }
        var test3 = {};
        "abcdefghijklmnopqrst".split("").forEach(function(letter) {
          test3[letter] = letter;
        });
        if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    module.exports = shouldUseNative() ? Object.assign : function(target, source) {
      var from;
      var to = toObject(target);
      var symbols;
      for (var s = 1; s < arguments.length; s++) {
        from = Object(arguments[s]);
        for (var key in from) {
          if (hasOwnProperty.call(from, key)) {
            to[key] = from[key];
          }
        }
        if (getOwnPropertySymbols) {
          symbols = getOwnPropertySymbols(from);
          for (var i = 0; i < symbols.length; i++) {
            if (propIsEnumerable.call(from, symbols[i])) {
              to[symbols[i]] = from[symbols[i]];
            }
          }
        }
      }
      return to;
    };
  });

  // ../node_modules/assert/node_modules/util/support/isBufferBrowser.js
  var require_isBufferBrowser2 = __commonJS((exports, module) => {
    module.exports = function isBuffer(arg) {
      return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
    };
  });

  // ../node_modules/assert/node_modules/inherits/inherits_browser.js
  var require_inherits_browser2 = __commonJS((exports, module) => {
    if (typeof Object.create === "function") {
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
  });

  // ../node_modules/assert/node_modules/util/util.js
  var require_util4 = __commonJS((exports) => {
    var formatRegExp = /%[sdj%]/g;
    exports.format = function(f) {
      if (!isString(f)) {
        var objects = [];
        for (var i = 0; i < arguments.length; i++) {
          objects.push(inspect(arguments[i]));
        }
        return objects.join(" ");
      }
      var i = 1;
      var args = arguments;
      var len = args.length;
      var str = String(f).replace(formatRegExp, function(x2) {
        if (x2 === "%%")
          return "%";
        if (i >= len)
          return x2;
        switch (x2) {
          case "%s":
            return String(args[i++]);
          case "%d":
            return Number(args[i++]);
          case "%j":
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return "[Circular]";
            }
          default:
            return x2;
        }
      });
      for (var x = args[i]; i < len; x = args[++i]) {
        if (isNull(x) || !isObject(x)) {
          str += " " + x;
        } else {
          str += " " + inspect(x);
        }
      }
      return str;
    };
    exports.deprecate = function(fn, msg) {
      if (isUndefined(global.process)) {
        return function() {
          return exports.deprecate(fn, msg).apply(this, arguments);
        };
      }
      if (process.noDeprecation === true) {
        return fn;
      }
      var warned = false;
      function deprecated() {
        if (!warned) {
          if (process.throwDeprecation) {
            throw new Error(msg);
          } else if (process.traceDeprecation) {
            console.trace(msg);
          } else {
            console.error(msg);
          }
          warned = true;
        }
        return fn.apply(this, arguments);
      }
      return deprecated;
    };
    var debugs = {};
    var debugEnviron;
    exports.debuglog = function(set) {
      if (isUndefined(debugEnviron))
        debugEnviron = process.env.NODE_DEBUG || "";
      set = set.toUpperCase();
      if (!debugs[set]) {
        if (new RegExp("\\b" + set + "\\b", "i").test(debugEnviron)) {
          var pid = process.pid;
          debugs[set] = function() {
            var msg = exports.format.apply(exports, arguments);
            console.error("%s %d: %s", set, pid, msg);
          };
        } else {
          debugs[set] = function() {
          };
        }
      }
      return debugs[set];
    };
    function inspect(obj, opts) {
      var ctx = {
        seen: [],
        stylize: stylizeNoColor
      };
      if (arguments.length >= 3)
        ctx.depth = arguments[2];
      if (arguments.length >= 4)
        ctx.colors = arguments[3];
      if (isBoolean(opts)) {
        ctx.showHidden = opts;
      } else if (opts) {
        exports._extend(ctx, opts);
      }
      if (isUndefined(ctx.showHidden))
        ctx.showHidden = false;
      if (isUndefined(ctx.depth))
        ctx.depth = 2;
      if (isUndefined(ctx.colors))
        ctx.colors = false;
      if (isUndefined(ctx.customInspect))
        ctx.customInspect = true;
      if (ctx.colors)
        ctx.stylize = stylizeWithColor;
      return formatValue(ctx, obj, ctx.depth);
    }
    exports.inspect = inspect;
    inspect.colors = {
      bold: [1, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      white: [37, 39],
      grey: [90, 39],
      black: [30, 39],
      blue: [34, 39],
      cyan: [36, 39],
      green: [32, 39],
      magenta: [35, 39],
      red: [31, 39],
      yellow: [33, 39]
    };
    inspect.styles = {
      special: "cyan",
      number: "yellow",
      boolean: "yellow",
      undefined: "grey",
      null: "bold",
      string: "green",
      date: "magenta",
      regexp: "red"
    };
    function stylizeWithColor(str, styleType) {
      var style = inspect.styles[styleType];
      if (style) {
        return "[" + inspect.colors[style][0] + "m" + str + "[" + inspect.colors[style][1] + "m";
      } else {
        return str;
      }
    }
    function stylizeNoColor(str, styleType) {
      return str;
    }
    function arrayToHash(array) {
      var hash = {};
      array.forEach(function(val, idx) {
        hash[val] = true;
      });
      return hash;
    }
    function formatValue(ctx, value, recurseTimes) {
      if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports.inspect && !(value.constructor && value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx);
        if (!isString(ret)) {
          ret = formatValue(ctx, ret, recurseTimes);
        }
        return ret;
      }
      var primitive = formatPrimitive(ctx, value);
      if (primitive) {
        return primitive;
      }
      var keys = Object.keys(value);
      var visibleKeys = arrayToHash(keys);
      if (ctx.showHidden) {
        keys = Object.getOwnPropertyNames(value);
      }
      if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
        return formatError(value);
      }
      if (keys.length === 0) {
        if (isFunction(value)) {
          var name = value.name ? ": " + value.name : "";
          return ctx.stylize("[Function" + name + "]", "special");
        }
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        }
        if (isDate(value)) {
          return ctx.stylize(Date.prototype.toString.call(value), "date");
        }
        if (isError(value)) {
          return formatError(value);
        }
      }
      var base = "", array = false, braces = ["{", "}"];
      if (isArray(value)) {
        array = true;
        braces = ["[", "]"];
      }
      if (isFunction(value)) {
        var n = value.name ? ": " + value.name : "";
        base = " [Function" + n + "]";
      }
      if (isRegExp(value)) {
        base = " " + RegExp.prototype.toString.call(value);
      }
      if (isDate(value)) {
        base = " " + Date.prototype.toUTCString.call(value);
      }
      if (isError(value)) {
        base = " " + formatError(value);
      }
      if (keys.length === 0 && (!array || value.length == 0)) {
        return braces[0] + base + braces[1];
      }
      if (recurseTimes < 0) {
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        } else {
          return ctx.stylize("[Object]", "special");
        }
      }
      ctx.seen.push(value);
      var output;
      if (array) {
        output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
      } else {
        output = keys.map(function(key) {
          return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
        });
      }
      ctx.seen.pop();
      return reduceToSingleString(output, base, braces);
    }
    function formatPrimitive(ctx, value) {
      if (isUndefined(value))
        return ctx.stylize("undefined", "undefined");
      if (isString(value)) {
        var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
        return ctx.stylize(simple, "string");
      }
      if (isNumber(value))
        return ctx.stylize("" + value, "number");
      if (isBoolean(value))
        return ctx.stylize("" + value, "boolean");
      if (isNull(value))
        return ctx.stylize("null", "null");
    }
    function formatError(value) {
      return "[" + Error.prototype.toString.call(value) + "]";
    }
    function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
      var output = [];
      for (var i = 0, l = value.length; i < l; ++i) {
        if (hasOwnProperty(value, String(i))) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
        } else {
          output.push("");
        }
      }
      keys.forEach(function(key) {
        if (!key.match(/^\d+$/)) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
        }
      });
      return output;
    }
    function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
      var name, str, desc;
      desc = Object.getOwnPropertyDescriptor(value, key) || {value: value[key]};
      if (desc.get) {
        if (desc.set) {
          str = ctx.stylize("[Getter/Setter]", "special");
        } else {
          str = ctx.stylize("[Getter]", "special");
        }
      } else {
        if (desc.set) {
          str = ctx.stylize("[Setter]", "special");
        }
      }
      if (!hasOwnProperty(visibleKeys, key)) {
        name = "[" + key + "]";
      }
      if (!str) {
        if (ctx.seen.indexOf(desc.value) < 0) {
          if (isNull(recurseTimes)) {
            str = formatValue(ctx, desc.value, null);
          } else {
            str = formatValue(ctx, desc.value, recurseTimes - 1);
          }
          if (str.indexOf("\n") > -1) {
            if (array) {
              str = str.split("\n").map(function(line) {
                return "  " + line;
              }).join("\n").substr(2);
            } else {
              str = "\n" + str.split("\n").map(function(line) {
                return "   " + line;
              }).join("\n");
            }
          }
        } else {
          str = ctx.stylize("[Circular]", "special");
        }
      }
      if (isUndefined(name)) {
        if (array && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify("" + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = ctx.stylize(name, "name");
        } else {
          name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
          name = ctx.stylize(name, "string");
        }
      }
      return name + ": " + str;
    }
    function reduceToSingleString(output, base, braces) {
      var numLinesEst = 0;
      var length = output.reduce(function(prev, cur) {
        numLinesEst++;
        if (cur.indexOf("\n") >= 0)
          numLinesEst++;
        return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
      }, 0);
      if (length > 60) {
        return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
      }
      return braces[0] + base + " " + output.join(", ") + " " + braces[1];
    }
    function isArray(ar) {
      return Array.isArray(ar);
    }
    exports.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports.isUndefined = isUndefined;
    function isRegExp(re) {
      return isObject(re) && objectToString(re) === "[object RegExp]";
    }
    exports.isRegExp = isRegExp;
    function isObject(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports.isObject = isObject;
    function isDate(d) {
      return isObject(d) && objectToString(d) === "[object Date]";
    }
    exports.isDate = isDate;
    function isError(e) {
      return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
    }
    exports.isError = isError;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports.isFunction = isFunction;
    function isPrimitive(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
    }
    exports.isPrimitive = isPrimitive;
    exports.isBuffer = require_isBufferBrowser2();
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
    function pad(n) {
      return n < 10 ? "0" + n.toString(10) : n.toString(10);
    }
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    function timestamp() {
      var d = new Date();
      var time = [
        pad(d.getHours()),
        pad(d.getMinutes()),
        pad(d.getSeconds())
      ].join(":");
      return [d.getDate(), months[d.getMonth()], time].join(" ");
    }
    exports.log = function() {
      console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments));
    };
    exports.inherits = require_inherits_browser2();
    exports._extend = function(origin, add) {
      if (!add || !isObject(add))
        return origin;
      var keys = Object.keys(add);
      var i = keys.length;
      while (i--) {
        origin[keys[i]] = add[keys[i]];
      }
      return origin;
    };
    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
  });

  // ../node_modules/assert/assert.js
  var require_assert = __commonJS((exports, module) => {
    "use strict";
    var objectAssign = require_object_assign();
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * @license  MIT
     */
    function compare(a, b) {
      if (a === b) {
        return 0;
      }
      var x = a.length;
      var y = b.length;
      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) {
        return -1;
      }
      if (y < x) {
        return 1;
      }
      return 0;
    }
    function isBuffer(b) {
      if (global.Buffer && typeof global.Buffer.isBuffer === "function") {
        return global.Buffer.isBuffer(b);
      }
      return !!(b != null && b._isBuffer);
    }
    var util = require_util4();
    var hasOwn = Object.prototype.hasOwnProperty;
    var pSlice = Array.prototype.slice;
    var functionsHaveNames = function() {
      return function foo() {
      }.name === "foo";
    }();
    function pToString(obj) {
      return Object.prototype.toString.call(obj);
    }
    function isView(arrbuf) {
      if (isBuffer(arrbuf)) {
        return false;
      }
      if (typeof global.ArrayBuffer !== "function") {
        return false;
      }
      if (typeof ArrayBuffer.isView === "function") {
        return ArrayBuffer.isView(arrbuf);
      }
      if (!arrbuf) {
        return false;
      }
      if (arrbuf instanceof DataView) {
        return true;
      }
      if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
        return true;
      }
      return false;
    }
    var assert = module.exports = ok;
    var regex = /\s*function\s+([^\(\s]*)\s*/;
    function getName(func) {
      if (!util.isFunction(func)) {
        return;
      }
      if (functionsHaveNames) {
        return func.name;
      }
      var str = func.toString();
      var match = str.match(regex);
      return match && match[1];
    }
    assert.AssertionError = function AssertionError(options) {
      this.name = "AssertionError";
      this.actual = options.actual;
      this.expected = options.expected;
      this.operator = options.operator;
      if (options.message) {
        this.message = options.message;
        this.generatedMessage = false;
      } else {
        this.message = getMessage(this);
        this.generatedMessage = true;
      }
      var stackStartFunction = options.stackStartFunction || fail;
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, stackStartFunction);
      } else {
        var err = new Error();
        if (err.stack) {
          var out = err.stack;
          var fn_name = getName(stackStartFunction);
          var idx = out.indexOf("\n" + fn_name);
          if (idx >= 0) {
            var next_line = out.indexOf("\n", idx + 1);
            out = out.substring(next_line + 1);
          }
          this.stack = out;
        }
      }
    };
    util.inherits(assert.AssertionError, Error);
    function truncate(s, n) {
      if (typeof s === "string") {
        return s.length < n ? s : s.slice(0, n);
      } else {
        return s;
      }
    }
    function inspect(something) {
      if (functionsHaveNames || !util.isFunction(something)) {
        return util.inspect(something);
      }
      var rawname = getName(something);
      var name = rawname ? ": " + rawname : "";
      return "[Function" + name + "]";
    }
    function getMessage(self2) {
      return truncate(inspect(self2.actual), 128) + " " + self2.operator + " " + truncate(inspect(self2.expected), 128);
    }
    function fail(actual, expected, message, operator, stackStartFunction) {
      throw new assert.AssertionError({
        message,
        actual,
        expected,
        operator,
        stackStartFunction
      });
    }
    assert.fail = fail;
    function ok(value, message) {
      if (!value)
        fail(value, true, message, "==", assert.ok);
    }
    assert.ok = ok;
    assert.equal = function equal(actual, expected, message) {
      if (actual != expected)
        fail(actual, expected, message, "==", assert.equal);
    };
    assert.notEqual = function notEqual(actual, expected, message) {
      if (actual == expected) {
        fail(actual, expected, message, "!=", assert.notEqual);
      }
    };
    assert.deepEqual = function deepEqual(actual, expected, message) {
      if (!_deepEqual(actual, expected, false)) {
        fail(actual, expected, message, "deepEqual", assert.deepEqual);
      }
    };
    assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
      if (!_deepEqual(actual, expected, true)) {
        fail(actual, expected, message, "deepStrictEqual", assert.deepStrictEqual);
      }
    };
    function _deepEqual(actual, expected, strict2, memos) {
      if (actual === expected) {
        return true;
      } else if (isBuffer(actual) && isBuffer(expected)) {
        return compare(actual, expected) === 0;
      } else if (util.isDate(actual) && util.isDate(expected)) {
        return actual.getTime() === expected.getTime();
      } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
        return actual.source === expected.source && actual.global === expected.global && actual.multiline === expected.multiline && actual.lastIndex === expected.lastIndex && actual.ignoreCase === expected.ignoreCase;
      } else if ((actual === null || typeof actual !== "object") && (expected === null || typeof expected !== "object")) {
        return strict2 ? actual === expected : actual == expected;
      } else if (isView(actual) && isView(expected) && pToString(actual) === pToString(expected) && !(actual instanceof Float32Array || actual instanceof Float64Array)) {
        return compare(new Uint8Array(actual.buffer), new Uint8Array(expected.buffer)) === 0;
      } else if (isBuffer(actual) !== isBuffer(expected)) {
        return false;
      } else {
        memos = memos || {actual: [], expected: []};
        var actualIndex = memos.actual.indexOf(actual);
        if (actualIndex !== -1) {
          if (actualIndex === memos.expected.indexOf(expected)) {
            return true;
          }
        }
        memos.actual.push(actual);
        memos.expected.push(expected);
        return objEquiv(actual, expected, strict2, memos);
      }
    }
    function isArguments(object) {
      return Object.prototype.toString.call(object) == "[object Arguments]";
    }
    function objEquiv(a, b, strict2, actualVisitedObjects) {
      if (a === null || a === void 0 || b === null || b === void 0)
        return false;
      if (util.isPrimitive(a) || util.isPrimitive(b))
        return a === b;
      if (strict2 && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
        return false;
      var aIsArgs = isArguments(a);
      var bIsArgs = isArguments(b);
      if (aIsArgs && !bIsArgs || !aIsArgs && bIsArgs)
        return false;
      if (aIsArgs) {
        a = pSlice.call(a);
        b = pSlice.call(b);
        return _deepEqual(a, b, strict2);
      }
      var ka = objectKeys(a);
      var kb = objectKeys(b);
      var key, i;
      if (ka.length !== kb.length)
        return false;
      ka.sort();
      kb.sort();
      for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] !== kb[i])
          return false;
      }
      for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!_deepEqual(a[key], b[key], strict2, actualVisitedObjects))
          return false;
      }
      return true;
    }
    assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
      if (_deepEqual(actual, expected, false)) {
        fail(actual, expected, message, "notDeepEqual", assert.notDeepEqual);
      }
    };
    assert.notDeepStrictEqual = notDeepStrictEqual;
    function notDeepStrictEqual(actual, expected, message) {
      if (_deepEqual(actual, expected, true)) {
        fail(actual, expected, message, "notDeepStrictEqual", notDeepStrictEqual);
      }
    }
    assert.strictEqual = function strictEqual(actual, expected, message) {
      if (actual !== expected) {
        fail(actual, expected, message, "===", assert.strictEqual);
      }
    };
    assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
      if (actual === expected) {
        fail(actual, expected, message, "!==", assert.notStrictEqual);
      }
    };
    function expectedException(actual, expected) {
      if (!actual || !expected) {
        return false;
      }
      if (Object.prototype.toString.call(expected) == "[object RegExp]") {
        return expected.test(actual);
      }
      try {
        if (actual instanceof expected) {
          return true;
        }
      } catch (e) {
      }
      if (Error.isPrototypeOf(expected)) {
        return false;
      }
      return expected.call({}, actual) === true;
    }
    function _tryBlock(block) {
      var error;
      try {
        block();
      } catch (e) {
        error = e;
      }
      return error;
    }
    function _throws(shouldThrow, block, expected, message) {
      var actual;
      if (typeof block !== "function") {
        throw new TypeError('"block" argument must be a function');
      }
      if (typeof expected === "string") {
        message = expected;
        expected = null;
      }
      actual = _tryBlock(block);
      message = (expected && expected.name ? " (" + expected.name + ")." : ".") + (message ? " " + message : ".");
      if (shouldThrow && !actual) {
        fail(actual, expected, "Missing expected exception" + message);
      }
      var userProvidedMessage = typeof message === "string";
      var isUnwantedException = !shouldThrow && util.isError(actual);
      var isUnexpectedException = !shouldThrow && actual && !expected;
      if (isUnwantedException && userProvidedMessage && expectedException(actual, expected) || isUnexpectedException) {
        fail(actual, expected, "Got unwanted exception" + message);
      }
      if (shouldThrow && actual && expected && !expectedException(actual, expected) || !shouldThrow && actual) {
        throw actual;
      }
    }
    assert.throws = function(block, error, message) {
      _throws(true, block, error, message);
    };
    assert.doesNotThrow = function(block, error, message) {
      _throws(false, block, error, message);
    };
    assert.ifError = function(err) {
      if (err)
        throw err;
    };
    function strict(value, message) {
      if (!value)
        fail(value, true, message, "==", strict);
    }
    assert.strict = objectAssign(strict, assert, {
      equal: assert.strictEqual,
      deepEqual: assert.deepStrictEqual,
      notEqual: assert.notStrictEqual,
      notDeepEqual: assert.notDeepStrictEqual
    });
    assert.strict.strict = assert.strict;
    var objectKeys = Object.keys || function(obj) {
      var keys = [];
      for (var key in obj) {
        if (hasOwn.call(obj, key))
          keys.push(key);
      }
      return keys;
    };
  });

  // fromCompareObject.js
  var require_fromCompareObject = __commonJS((exports, module) => {
    function fromCompareObject(object) {
      if (object === null || object === void 0)
        return object;
      if (object.__patchType === "Array") {
        let copy = [];
        let i = 0;
        for (let id in object) {
          if (id !== "__patchType") {
            copy[i] = fromCompareObject(object[id]);
            i++;
          }
        }
        return copy;
      } else if (object === Object(object)) {
        let copy = {};
        for (let name in object) {
          if (name !== "__patchType")
            copy[name] = fromCompareObject(object[name]);
        }
        return copy;
      }
      return object;
    }
    module.exports = fromCompareObject;
  });

  // applyPatch.js
  var require_applyPatch = __commonJS((exports, module) => {
    var rfc = require_rfc6902();
    var {inspect} = require_util2();
    var assert = require_assert();
    var fromCompareObject = require_fromCompareObject();
    function applyPatch({defaultConcurrency, concurrency}, dto, changes) {
      let dtoCompare = toCompareObject(dto);
      changes = validateConflict(dtoCompare, changes);
      rfc.applyPatch(dtoCompare, changes);
      let result = fromCompareObject(dtoCompare);
      if (Array.isArray(dto))
        dto.length = 0;
      else
        for (let name in dto) {
          delete dto[name];
        }
      for (let name in result) {
        dto[name] = result[name];
      }
      return dto;
      function validateConflict(object, changes2) {
        return changes2.filter((change) => {
          let expectedOldValue = change.oldValue;
          let strategy = getStrategy(change.path);
          if (strategy === "optimistic" || strategy === "skipOnConflict") {
            let oldValue = getOldValue(object, change.path);
            try {
              assert.deepEqual(oldValue, expectedOldValue);
            } catch (e) {
              if (strategy === "skipOnConflict")
                return false;
              throw new Error(`The field ${change.path} was changed by another user. Expected ${inspect(fromCompareObject(expectedOldValue), false, 10)}, but was ${inspect(fromCompareObject(oldValue), false, 10)}.`);
            }
          }
          return true;
        });
        function getOldValue(obj, path) {
          let splitPath = path.split("/");
          splitPath.shift();
          return splitPath.reduce(extract, obj);
          function extract(obj2, name) {
            if (obj2 === Object(obj2))
              return obj2[name];
            return;
          }
        }
      }
      function getStrategy(path) {
        let splitPath = path.split("/");
        splitPath.shift();
        return splitPath.reduce(extract, concurrency);
        function extract(obj, name) {
          if (Array.isArray(obj))
            return obj[0] || defaultConcurrency;
          if (obj === Object(obj))
            return obj[name] || defaultConcurrency;
          return obj;
        }
      }
    }
    function toCompareObject(object) {
      if (Array.isArray(object)) {
        let copy = {};
        Object.defineProperty(copy, "__patchType", {
          value: "Array",
          writable: true,
          enumerable: true
        });
        for (var i = 0; i < object.length; i++) {
          let element = toCompareObject(object[i]);
          if (element === Object(element) && "id" in element)
            copy[element.id] = element;
          else
            copy[i] = element;
        }
        return copy;
      } else if (object === Object(object)) {
        let copy = {};
        for (let name in object) {
          copy[name] = toCompareObject(object[name]);
        }
        return copy;
      }
      return object;
    }
    module.exports = applyPatch;
  });

  // patchTable.js
  var require_patchTable = __commonJS((exports, module) => {
    var applyPatch = require_applyPatch();
    var fromCompareObject = require_fromCompareObject();
    async function patchTable(table, patches, {defaultConcurrency = "optimistic", concurrency = {}} = {}) {
      for (let i = 0; i < patches.length; i++) {
        let patch = {path: void 0, value: void 0, op: void 0};
        Object.assign(patch, patches[i]);
        patch.path = patches[i].path.split("/").slice(1);
        if (patch.op === "add" || patch.op === "replace")
          await add({path: patch.path, value: patch.value, op: patch.op, oldValue: patch.oldValue, concurrency}, table);
        else if (patch.op === "remove")
          await remove(patch, table);
      }
      async function add({path, value, op, oldValue, concurrency: concurrency2 = {}}, table2, row, parentRow, relation) {
        let property = path[0];
        path = path.slice(1);
        if (!row && path.length > 0)
          row = row || await table2.tryGetById(property);
        if (path.length === 0) {
          let pkName = table2._primaryColumns[0].alias;
          row = table2.insert(value[pkName]);
          for (let name in value) {
            row[name] = fromCompareObject(value[name]);
          }
          if (relation && relation.joinRelation) {
            let fkName = relation.joinRelation.columns[0].alias;
            let parentPk = relation.joinRelation.childTable._primaryColumns[0].alias;
            if (!row[fkName])
              row[fkName] = parentRow[parentPk];
          }
          return;
        }
        property = path[0];
        if (isColumn(property, table2)) {
          let dto = {};
          dto[property] = row[property];
          let result = applyPatch({defaultConcurrency, concurrency: concurrency2}, dto, [{path: "/" + path.join("/"), op, value, oldValue}]);
          row[property] = result[property];
        } else if (isOneRelation(property, table2)) {
          let relation2 = table2[property]._relation;
          await add({path, value, op, oldValue, concurrency: concurrency2[property]}, relation2.childTable, await row[property], row, relation2);
        } else if (isManyRelation(property, table2)) {
          let relation2 = table2[property]._relation;
          if (path.length === 1) {
            for (let id in value) {
              await add({path: [id], value: value[id], op, oldValue, concurrency: concurrency2[property]}, relation2.childTable, {}, row, relation2);
            }
          } else
            await add({path: path.slice(1), value, oldValue, op, concurrency: concurrency2[property]}, relation2.childTable, void 0, row, relation2);
        }
      }
      async function remove({path, value, op}, table2, row) {
        let property = path[0];
        path = path.slice(1);
        row = row || await table2.getById(property);
        if (path.length === 0)
          return row.cascadeDelete();
        property = path[0];
        if (isColumn(property, table2)) {
          let dto = {};
          dto[property] = row[property];
          let result = applyPatch({defaultConcurrency: "overwrite", concurrency: void 0}, dto, [{path: "/" + path.join("/"), op}]);
          row[property] = result[property];
        } else if (isOneRelation(property, table2)) {
          let child = await row[property];
          if (!child)
            throw new Error(property + " does not exist");
          await remove({path, value, op}, table2[property], child);
        } else if (isManyRelation(property, table2)) {
          let relation = table2[property]._relation;
          if (path.length === 1) {
            let children = (await row[property]).slice(0);
            for (let i = 0; i < children.length; i++) {
              let child = children[i];
              await remove({path: path.slice(1), value, op}, table2[property], child);
            }
          } else
            await remove({path: path.slice(1), value, op}, relation.childTable);
        }
      }
      function isColumn(name, table2) {
        return table2[name] && table2[name].equal;
      }
      function isManyRelation(name, table2) {
        return table2[name] && table2[name]._relation.isMany;
      }
      function isOneRelation(name, table2) {
        return table2[name] && table2[name]._relation.isOne;
      }
    }
    module.exports = patchTable;
  });

  // patchRow.js
  var require_patchRow = __commonJS((exports, module) => {
    var patchTable = require_patchTable();
    function patchRow(table, row, patches, options) {
      patches = JSON.parse(JSON.stringify(patches));
      let pkName = table._primaryColumns[0].alias;
      let id = row[pkName];
      for (let i = 0; i < patches.length; i++) {
        patches[i].path = "/" + id + patches[i].path;
      }
      return patchTable(table, patches, options);
    }
    module.exports = patchRow;
  });

  // table/resultToRows/newDecodeDbRow.js
  var require_newDecodeDbRow = __commonJS((exports, module) => {
    var updateField = require_updateField();
    var newEmitEvent = require_emitEvent();
    var extractStrategy = require_extractStrategy();
    var extractDeleteStrategy = require_extractDeleteStrategy();
    var newCascadeDeleteStrategy = require_newCascadeDeleteStrategy();
    var _delete = require_delete();
    var newObject = require_newObject();
    var toDto = require_toDto();
    var createDto = require_createDto();
    var patchRow = require_patchRow();
    var onChange = require_on_change();
    var flags = require_flags();
    function newDecodeDbRow(table, dbRow) {
      let columns = table._columns;
      let numberOfColumns = columns.length;
      if (dbRow.offset === void 0) {
        dbRow.offset = 0;
      }
      let offset = dbRow.offset;
      let keys = Object.keys(dbRow);
      for (let i = 0; i < numberOfColumns; i++) {
        defineColumnProperty(i);
      }
      dbRow.offset += numberOfColumns;
      function defineColumnProperty(i) {
        let column = columns[i];
        let purify = column.purify;
        let name = column.alias;
        let intName = "__" + name;
        i = offset + i;
        let key = keys[i];
        Object.defineProperty(Row.prototype, intName, {
          enumerable: false,
          get: function() {
            return this._dbRow[key];
          },
          set: function(value) {
            let oldValue = this[name];
            value = purify(value);
            this._dbRow[key] = value;
            if (column.validate)
              column.validate(value, this._dbRow);
            updateField(table, column, this);
            let emit = this._emitColumnChanged[name];
            if (emit)
              emit(this, column, value, oldValue);
            this._emitChanged(this, column, value, oldValue);
          }
        });
        Object.defineProperty(Row.prototype, name, {
          get: function() {
            if (column.onChange && flags.useProxy && this[intName] !== null && typeof this[intName] === "object") {
              if (!(name in this._proxies)) {
                let value = this[intName];
                this._proxies[name] = column.onChange(this._dbRow[key], () => {
                  if (this[intName] !== onChange.target(value)) {
                    return;
                  }
                  this[intName] = this._dbRow[key];
                });
              }
              return this._proxies[name];
            }
            return this[intName];
          },
          set: function(value) {
            if (column.onChange && value !== null && typeof value === "object") {
              if (this[intName] === onChange.target(value))
                return;
              this._proxies[name] = column.onChange(value, () => {
                if (this[intName] !== onChange.target(value))
                  return;
                this[intName] = this._dbRow[key];
              });
            }
            this[intName] = value;
          }
        });
      }
      setRelated();
      function setRelated() {
        let relations = table._relations;
        for (let relationName in relations) {
          setSingleRelated(relationName);
        }
      }
      function setSingleRelated(name) {
        Object.defineProperty(Row.prototype, name, {
          get: function() {
            return createGetRelated(this, name)();
          }
        });
      }
      function createGetRelated(row, alias) {
        let get = row._related[alias];
        if (!get) {
          let relation = table._relations[alias];
          get = relation.toGetRelated(row);
          row._related[alias] = get;
        }
        return get;
      }
      Row.prototype.subscribeChanged = function(onChanged, name) {
        let emit;
        if (name) {
          emit = this._emitColumnChanged[name] || (this._emitColumnChanged[name] = newEmitEvent());
          emit.add(onChanged);
          return;
        }
        this._emitChanged.add(onChanged);
      };
      Row.prototype.unsubscribeChanged = function(onChanged, name) {
        if (name) {
          this._emitColumnChanged[name].tryRemove(onChanged);
          return;
        }
        this._emitChanged.tryRemove(onChanged);
      };
      Row.prototype.toJSON = function() {
        return this.toDto.apply(this, arguments).then(JSON.stringify);
      };
      Row.prototype.toDto = function(strategy) {
        let args = Array.prototype.slice.call(arguments, 0);
        args.push(table);
        strategy = extractStrategy.apply(null, args);
        let p = toDto(strategy, table, this);
        return Promise.resolve().then(() => p);
      };
      Row.prototype.__toDto = function(strategy) {
        let args = Array.prototype.slice.call(arguments, 0);
        args.push(table);
        strategy = extractStrategy.apply(null, args);
        return toDto(strategy, table, this);
      };
      Row.prototype.expand = function(alias) {
        let get = createGetRelated(this, alias);
        get.expanded = true;
      };
      Row.prototype.isExpanded = function(alias) {
        let get = createGetRelated(this, alias);
        return get.expanded;
      };
      Row.prototype.delete = function(strategy) {
        strategy = extractDeleteStrategy(strategy);
        _delete(this, strategy, table);
      };
      Row.prototype.cascadeDelete = function() {
        let strategy = newCascadeDeleteStrategy(newObject(), table);
        _delete(this, strategy, table);
      };
      Row.prototype.patch = async function(patches, options) {
        await patchRow(table, this, patches, options);
        return this;
      };
      function decodeDbRow(row) {
        for (let i = 0; i < numberOfColumns; i++) {
          let index = offset + i;
          let key = keys[index];
          row[key] = columns[i].decode(row[key]);
        }
        return new Row(row);
      }
      function Row(dbRow2) {
        this._dbRow = dbRow2;
        this._related = {};
        this._emitColumnChanged = {};
        this._emitChanged = newEmitEvent();
        this._proxies = {};
        this._oldValues = JSON.stringify(createDto(table, this));
      }
      return decodeDbRow;
    }
    module.exports = newDecodeDbRow;
  });

  // table/resultToRows/decodeDbRow.js
  var require_decodeDbRow = __commonJS((exports, module) => {
    var newDecodeDbRow = require_newDecodeDbRow();
    function decodeDbRow(context, table, dbRow) {
      var decode = context._decodeDbRow;
      if (!decode) {
        decode = newDecodeDbRow(table, dbRow);
        Object.defineProperty(context, "_decodeDbRow", {
          enumerable: false,
          get: function() {
            return decode;
          }
        });
      }
      return decode(dbRow);
    }
    module.exports = decodeDbRow;
  });

  // table/resultToRows/dbRowToRow.js
  var require_dbRowToRow = __commonJS((exports, module) => {
    var negotiateQueryContext = require_negotiateQueryContext();
    var decodeDbRow = require_decodeDbRow();
    var nextDbRowToRow = _nextDbRowToRow;
    function dbRowToRow(span, dbRow) {
      var table = span.table;
      var row = decodeDbRow(span, table, dbRow);
      var cache = table._cache;
      if (!cache.tryGet(row)) {
        var queryContext = span.queryContext;
        negotiateQueryContext(queryContext, row);
        row.queryContext = queryContext;
      }
      row = cache.tryAdd(row);
      var c = {};
      c.visitOne = function(leg) {
        nextDbRowToRow(leg.span, dbRow);
        leg.expand(row);
      };
      c.visitJoin = function(leg) {
        nextDbRowToRow(leg.span, dbRow);
        leg.expand(row);
      };
      c.visitMany = function() {
      };
      span.legs.forEach(onEach);
      function onEach(leg) {
        leg.accept(c);
      }
      return row;
    }
    function _nextDbRowToRow(span, dbRow) {
      nextDbRowToRow = require_dbRowToRow();
      nextDbRowToRow(span, dbRow);
    }
    module.exports = dbRowToRow;
  });

  // table/rowArray/orderBy.js
  var require_orderBy = __commonJS((exports, module) => {
    function orderBy(strategy, rows) {
      if (strategy && strategy.orderBy) {
        var comparer = createComparer(strategy.orderBy);
        return rows.sort(comparer);
      }
      return rows;
    }
    function createComparer(orderBy2) {
      var comparers = [];
      if (typeof orderBy2 === "string")
        orderBy2 = [orderBy2];
      orderBy2.forEach(function(order) {
        var elements = order.split(" ");
        var name = elements[0];
        var direction = elements[1] || "asc";
        if (direction === "asc")
          comparers.push(compareAscending);
        else
          comparers.push(compareDescending);
        function compareAscending(a, b) {
          a = a[name];
          b = b[name];
          if (a === b)
            return 0;
          if (a < b)
            return -1;
          return 1;
        }
        function compareDescending(a, b) {
          return compareAscending(b, a);
        }
      });
      function compareComposite(a, b) {
        for (var i = 0; i < comparers.length; i++) {
          var result = comparers[i](a, b);
          if (result !== 0)
            return result;
        }
        return 0;
      }
      return compareComposite;
    }
    module.exports = orderBy;
  });

  // table/rowArray/negotiateNextTick.js
  var require_negotiateNextTick = __commonJS((exports, module) => {
    var promise = require_domains();
    function negotiateNextTick(i) {
      if (i === 0)
        return;
      if (i % 1e3 === 0)
        return promise.resolve();
      return;
    }
    module.exports = negotiateNextTick;
  });

  // table/rowArray.js
  var require_rowArray = __commonJS((exports, module) => {
    var resultToPromise = require_resultToPromise();
    var orderBy = require_orderBy();
    var negotiateNextTick = require_negotiateNextTick();
    function newRowArray() {
      var c = [];
      Object.defineProperty(c, "toJSON", {
        enumerable: false,
        value: toJSON
      });
      Object.defineProperty(c, "toDto", {
        enumerable: false,
        writable: true,
        value: toDtoNativePromise
      });
      Object.defineProperty(c, "__toDto", {
        enumerable: false,
        writable: true,
        value: toDto
      });
      function toJSON() {
        return c.toDto.apply(null, arguments).then(JSON.stringify);
      }
      function toDtoNativePromise() {
        let args = arguments;
        return Promise.resolve().then(() => toDto.apply(null, args));
      }
      function toDto(optionalStrategy) {
        var args = arguments;
        var result = [];
        var length = c.length;
        var i = -1;
        return resultToPromise().then(toDtoAtIndex);
        function toDtoAtIndex() {
          i++;
          if (i === length) {
            return orderBy(optionalStrategy, result);
          }
          var row = c[i];
          return getDto().then(onDto).then(toDtoAtIndex);
          function getDto() {
            return row.__toDto.apply(row, args);
          }
          function onDto(dto) {
            result.push(dto);
            return negotiateNextTick(i);
          }
        }
      }
      return c;
    }
    module.exports = newRowArray;
  });

  // table/resultToRows/dbRowsToRows.js
  var require_dbRowsToRows = __commonJS((exports, module) => {
    var dbRowToRow = require_dbRowToRow();
    var newRowArray = require_rowArray();
    function dbRowsToRows(span, dbRows) {
      var rows = newRowArray(span.table);
      for (var i = 0; i < dbRows.length; i++) {
        var row = dbRowToRow(span, dbRows[i]);
        rows.push(row);
      }
      return rows;
    }
    module.exports = dbRowsToRows;
  });

  // table/resultToRows.js
  var require_resultToRows = __commonJS((exports, module) => {
    var dbRowsToRows = require_dbRowsToRows();
    function resultToRows(span, result) {
      return result[0].then(onResult);
      function onResult(result2) {
        return dbRowsToRows(span, result2);
      }
    }
    module.exports = resultToRows;
  });

  // table/strategyToSpan.js
  var require_strategyToSpan = __commonJS((exports, module) => {
    var newCollection = require_newCollection();
    var newQueryContext = require_newQueryContext();
    function toSpan(table, strategy) {
      var span = {};
      span.queryContext = newQueryContext();
      span.legs = newCollection();
      span.table = table;
      applyStrategy(table, span, strategy);
      return span;
      function applyStrategy(table2, span2, strategy2) {
        var legs = span2.legs;
        if (!strategy2)
          return;
        for (var name in strategy2) {
          if (table2._relations[name])
            addLeg(legs, table2, strategy2, name);
          else
            span2[name] = strategy2[name];
        }
      }
      function addLeg(legs, table2, strategy2, name) {
        var relation = table2._relations[name];
        var leg = relation.toLeg();
        legs.add(leg);
        var subStrategy = strategy2[name];
        var childTable = relation.childTable;
        applyStrategy(childTable, leg.span, subStrategy);
      }
    }
    module.exports = toSpan;
  });

  // table/getMany.js
  var require_getMany = __commonJS((exports, module) => {
    var newQuery = require_newQuery();
    var executeQueries = require_executeQueries();
    var resultToRows = require_resultToRows();
    var strategyToSpan = require_strategyToSpan();
    var emptyInnerJoin = require_newParameterized()();
    var negotiateRawSqlFilter = require_negotiateRawSqlFilter();
    function getMany(table, filter, strategy) {
      return getManyCore(table, filter, strategy);
    }
    function getManyCore(table, filter, strategy, exclusive) {
      var alias = table._dbName;
      var noOrderBy;
      filter = negotiateRawSqlFilter(filter);
      var span = strategyToSpan(table, strategy);
      var queries = newQuery([], table, filter, span, alias, emptyInnerJoin, noOrderBy, exclusive);
      return executeQueries(queries).then(onResult);
      function onResult(result) {
        return resultToRows(span, result);
      }
    }
    getMany.exclusive = function(table, filter, strategy) {
      return getManyCore(table, filter, strategy, true);
    };
    module.exports = getMany;
  });

  // table/tryGetFirstFromDb.js
  var require_tryGetFirstFromDb = __commonJS((exports, module) => {
    var getMany = require_getMany();
    var util = require_util2();
    function tryGet(table, filter, strategy) {
      strategy = setLimit(strategy);
      return getMany(table, filter, strategy).then(filterRows);
    }
    function filterRows(rows) {
      if (rows.length > 0)
        return rows[0];
      return null;
    }
    tryGet.exclusive = function(table, filter, strategy) {
      strategy = setLimit(strategy);
      return getMany.exclusive(table, filter, strategy).then(filterRows);
    };
    function setLimit(strategy) {
      return util._extend({limit: 1}, strategy);
    }
    module.exports = tryGet;
  });

  // table/tryGetFromDbById/extractStrategy.js
  var require_extractStrategy2 = __commonJS((exports, module) => {
    function extract(table) {
      var lengthWithStrategy = table._primaryColumns.length + 2;
      if (arguments.length === lengthWithStrategy)
        return arguments[lengthWithStrategy - 1];
      return emptyStrategy;
    }
    function emptyStrategy() {
    }
    module.exports = extract;
  });

  // table/tryGetFromDbById.js
  var require_tryGetFromDbById = __commonJS((exports, module) => {
    var newPrimaryKeyFilter = require_newPrimaryKeyFilter();
    var tryGetFirstFromDb = require_tryGetFirstFromDb();
    var extractStrategy = require_extractStrategy2();
    function tryGet() {
      var filter = newPrimaryKeyFilter.apply(null, arguments);
      var table = arguments[0];
      var strategy = extractStrategy.apply(null, arguments);
      return tryGetFirstFromDb(table, filter, strategy);
    }
    tryGet.exclusive = function tryGet2() {
      var filter = newPrimaryKeyFilter.apply(null, arguments);
      var table = arguments[0];
      var strategy = extractStrategy.apply(null, arguments);
      return tryGetFirstFromDb.exclusive(table, filter, strategy);
    };
    module.exports = tryGet;
  });

  // table/getFromDbById.js
  var require_getFromDbById = __commonJS((exports, module) => {
    var tryGetFromDbById = require_tryGetFromDbById();
    function get(table, ...ids) {
      return tryGetFromDbById.apply(null, arguments).then((row) => onResult(table, row, ids));
    }
    get.exclusive = function(table, ...ids) {
      return tryGetFromDbById.exclusive.apply(null, arguments).then((row) => onResult(table, row, ids));
    };
    function onResult(table, row, id) {
      if (row === null)
        throw new Error(`${table._dbName}: Row with id ${id} not found.`);
      return row;
    }
    module.exports = get;
  });

  // table/getById.js
  var require_getById = __commonJS((exports, module) => {
    var tryGetFromCacheById = require_tryGetFromCacheById();
    var getFromDbById = require_getFromDbById();
    var resultToPromise = require_resultToPromise();
    function getById() {
      var cached = tryGetFromCacheById.apply(null, arguments);
      if (cached)
        return resultToPromise(cached);
      return getFromDbById.apply(null, arguments);
    }
    getById.exclusive = getFromDbById.exclusive;
    module.exports = getById;
  });

  // table/nullPromise.js
  var require_nullPromise = __commonJS((exports, module) => {
    module.exports = require_promise()(null);
  });

  // table/newGetRelated.js
  var require_newGetRelated = __commonJS((exports, module) => {
    function newGetRelated(parent, relation) {
      function getRelated() {
        if (getRelated.expanded)
          return relation.getFromCache(parent);
        if (parent.queryContext)
          return relation.getRelatives(parent).then(onRelatives);
        return relation.getFromDb(parent).then(onFromDb);
        function onFromDb(rows) {
          getRelated.expanded = true;
          return rows;
        }
        function onRelatives() {
          return relation.getFromCache(parent);
        }
      }
      return getRelated;
    }
    module.exports = newGetRelated;
  });

  // table/negotiateExpandInverse.js
  var require_negotiateExpandInverse = __commonJS((exports, module) => {
    function negotiateExpandInverse(parent, relation, children) {
      var joinRelation = relation.joinRelation;
      if (!joinRelation)
        return;
      var firstChild = children.find(function(child) {
        return child.queryContext;
      });
      if (firstChild)
        firstChild.queryContext.expand(joinRelation);
    }
    module.exports = negotiateExpandInverse;
  });

  // table/joinRelation/getRelatives.js
  var require_getRelatives = __commonJS((exports, module) => {
    var newPrimaryKeyFilter = require_newPrimaryKeyFilter();
    var emptyFilter = require_emptyFilter();
    var negotiateExpandInverse = require_negotiateExpandInverse();
    function getRelatives(parent, relation) {
      var queryContext = parent.queryContext;
      var filter = emptyFilter;
      if (relation.columns.length === 1)
        createInFilter();
      else
        createCompositeFilter();
      function createInFilter() {
        var ids = [];
        var row;
        var id;
        var alias = relation.columns[0].alias;
        for (var i = 0; i < queryContext.rows.length; i++) {
          row = queryContext.rows[i];
          id = row[alias];
          if (!isNullOrUndefined(id))
            ids.push(id);
        }
        if (ids.length > 0)
          filter = relation.childTable._primaryColumns[0].in(ids);
      }
      function createCompositeFilter() {
        var keyFilter;
        for (var i = 0; i < queryContext.rows.length; i++) {
          keyFilter = rowToPrimaryKeyFilter(queryContext.rows[i], relation);
          if (keyFilter)
            filter = filter.or(keyFilter);
        }
      }
      return relation.childTable.getMany(filter).then(onRows);
      function onRows(rows) {
        queryContext.expand(relation);
        negotiateExpandInverse(parent, relation, rows);
        return rows;
      }
    }
    function rowToPrimaryKeyFilter(row, relation) {
      var key = relation.columns.map(function(column) {
        return row[column.alias];
      });
      if (key.some(isNullOrUndefined)) {
        return;
      }
      var args = [relation.childTable].concat(key);
      return newPrimaryKeyFilter.apply(null, args);
    }
    function isNullOrUndefined(item) {
      return item === null || item === void 0;
    }
    module.exports = getRelatives;
  });

  // table/newJoinRelation.js
  var require_newJoinRelation = __commonJS((exports, module) => {
    var newLeg = require_newJoinLeg();
    var getById = require_getById();
    var nullPromise = require_nullPromise();
    var newGetRelated = require_newGetRelated();
    var getRelatives = require_getRelatives();
    var tryGetFromCacheById = require_tryGetFromCacheById();
    function _newJoin(parentTable, childTable, columnNames) {
      var c = {};
      c.parentTable = parentTable;
      c.childTable = childTable;
      c.columns = [];
      var columns = parentTable._columns;
      addColumns();
      c.accept = function(visitor) {
        visitor.visitJoin(c);
      };
      c.toLeg = function() {
        return newLeg(c);
      };
      c.getFromDb = function(parent) {
        var key = parentToKey(parent);
        if (key.some(isNullOrUndefined)) {
          return nullPromise;
        }
        var args = [childTable].concat(key);
        return getById.apply(null, args);
      };
      c.getFromCache = c.getFromDb;
      c.toGetRelated = function(parent) {
        return newGetRelated(parent, c);
      };
      c.getRelatives = function(parent) {
        return getRelatives(parent, c);
      };
      c.expand = function(parent) {
        parent.expand(c.leftAlias);
      };
      c.getRowsSync = function(parent) {
        var key = parentToKey(parent);
        if (key.some(isNullOrUndefined)) {
          return null;
        }
        var args = [childTable].concat(key);
        return tryGetFromCacheById.apply(null, args);
      };
      return c;
      function addColumns() {
        var numberOfColumns = columnNames.length;
        for (var i = 0; i < columns.length; i++) {
          var curColumn = columns[i];
          tryAdd(curColumn);
          if (numberOfColumns === c.columns.length)
            return;
        }
      }
      function tryAdd(column) {
        for (var i = 0; i < columnNames.length; i++) {
          var name = columnNames[i];
          if (column._dbName === name) {
            c.columns.push(column);
            return;
          }
        }
      }
      function isNullOrUndefined(item) {
        return item === null || item === void 0;
      }
      function parentToKey(parent) {
        var primaryKeys = c.columns.map(function(column) {
          return parent[column.alias];
        });
        return primaryKeys;
      }
    }
    module.exports = _newJoin;
  });

  // table/relatedTable/selectSql.js
  var require_selectSql2 = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    var newBoolean = require_newBoolean();
    function newSelectSql(table, alias) {
      var colName = table._primaryColumns[0]._dbName;
      var sql = "SELECT " + alias + "." + colName + " FROM " + table._dbName + " AS " + alias;
      sql = newParameterized(sql);
      return newBoolean(sql);
    }
    module.exports = newSelectSql;
  });

  // table/relatedTable/joinSql.js
  var require_joinSql2 = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSql();
    function newJoinSql(relations) {
      if (relations.length === 1)
        return "";
      var leftAlias, rightAlias;
      var relation;
      var c = {};
      var i;
      var sql = "";
      c.visitJoin = function(relation2) {
        sql += " INNER" + newShallowJoinSql(relation2.parentTable, relation2.childTable._primaryColumns, relation2.columns, leftAlias, rightAlias);
      };
      c.visitOne = function(relation2) {
        innerJoin(relation2);
      };
      c.visitMany = c.visitOne;
      function innerJoin(relation2) {
        var joinRelation = relation2.joinRelation;
        var table = joinRelation.childTable;
        var rightColumns = table._primaryColumns;
        var leftColumns = joinRelation.columns;
        sql += " INNER" + newShallowJoinSql(table, leftColumns, rightColumns, leftAlias, rightAlias);
      }
      for (i = relations.length - 1; i > 0; i--) {
        leftAlias = "_" + (i + 1);
        rightAlias = "_" + i;
        relation = relations[i];
        relation.accept(c);
      }
      return sql;
    }
    module.exports = newJoinSql;
  });

  // table/relatedTable/whereSql.js
  var require_whereSql2 = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    function newWhereSql(relation, shallowFilter) {
      var c = {};
      var sql;
      c.visitJoin = function(relation2) {
        var table = relation2.childTable;
        var alias = relation2.parentTable._dbName;
        var leftColumns = relation2.columns;
        var rightColumns = table._primaryColumns;
        where(alias, leftColumns, rightColumns);
      };
      c.visitOne = function(relation2) {
        var joinRelation = relation2.joinRelation;
        var rightColumns = joinRelation.columns;
        var childTable = joinRelation.childTable;
        var leftColumns = childTable._primaryColumns;
        var alias = childTable._dbName;
        where(alias, leftColumns, rightColumns);
      };
      c.visitMany = c.visitOne;
      function where(alias, leftColumns, rightColumns) {
        var table = relation.childTable;
        var joinCore = newShallowJoinSql(table, leftColumns, rightColumns, alias, "_1");
        if (shallowFilter)
          sql = shallowFilter.prepend(" WHERE " + joinCore + " AND ");
        else
          sql = " WHERE " + joinCore;
      }
      relation.accept(c);
      return sql;
    }
    module.exports = newWhereSql;
  });

  // table/relatedTable/subFilter.js
  var require_subFilter2 = __commonJS((exports, module) => {
    var newSelect = require_selectSql2();
    var newJoin = require_joinSql2();
    var newWhere = require_whereSql2();
    function newSubFilter(relations, shallowFilter) {
      var relationCount = relations.length;
      var alias = "_" + relationCount;
      var table = relations[relationCount - 1].childTable;
      var filter = newSelect(table, alias).prepend("EXISTS (");
      var join = newJoin(relations);
      var where = newWhere(relations[0], shallowFilter);
      return filter.append(join).append(where).append(")");
    }
    module.exports = newSubFilter;
  });

  // table/relatedTable/relatedColumn.js
  var require_relatedColumn = __commonJS((exports, module) => {
    var newSubFilter = require_subFilter2();
    function newRelatedColumn(column, relations) {
      var c = {};
      var alias = "_" + relations.length;
      for (var propName in column) {
        var prop = column[propName];
        if (prop instanceof Function)
          c[propName] = wrapFilter(prop);
      }
      return c;
      function wrapFilter(filter) {
        return runFilter;
        function runFilter() {
          var args = [];
          for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
          }
          args.push(alias);
          var shallowFilter = filter.apply(null, args);
          return newSubFilter(relations, shallowFilter);
        }
      }
    }
    module.exports = newRelatedColumn;
  });

  // table/newRelatedTable.js
  var require_newRelatedTable = __commonJS((exports, module) => {
    var newRelatedColumn = require_relatedColumn();
    var nextRelatedTable = _nextRelatedTable;
    var subFilter = require_subFilter2();
    function newRelatedTable(relations) {
      var table = relations[relations.length - 1].childTable;
      var columns = table._columns;
      var c = {};
      Object.defineProperty(c, "_relation", {
        value: relations[relations.length - 1],
        writable: false
      });
      for (var i = 0; i < columns.length; i++) {
        var col = columns[i];
        c[col.alias] = newRelatedColumn(col, relations);
      }
      defineChildren();
      function defineChildren() {
        var childRelations = table._relations;
        for (var alias in childRelations) {
          defineChild(alias);
        }
      }
      function defineChild(alias) {
        var relation = table._relations[alias];
        var children = relations.slice(0);
        children.push(relation);
        Object.defineProperty(c, alias, {
          get: function() {
            return nextRelatedTable(children);
          }
        });
      }
      c.exists = function() {
        return subFilter(relations);
      };
      return c;
    }
    function _nextRelatedTable(relations) {
      nextRelatedTable = require_newRelatedTable();
      return nextRelatedTable(relations);
    }
    module.exports = newRelatedTable;
  });

  // table/join.js
  var require_join = __commonJS((exports, module) => {
    var newJoinRelation = require_newJoinRelation();
    var newRelatedTable = require_newRelatedTable();
    function newJoin(parentTable, childTable) {
      var c = {};
      var columnNames = [];
      c.by = function() {
        for (var i = 0; i < arguments.length; i++) {
          verifyColumnExists(arguments[i]);
          columnNames.push(arguments[i]);
        }
        return c;
      };
      function verifyColumnExists(columnName) {
        var columns = parentTable._columns;
        for (var i = 0; i < columns.length; i++) {
          if (columns[i]._dbName === columnName)
            return;
        }
        throw new Error("Unknown column: " + columnName);
      }
      c.as = function(alias) {
        var relation = newJoinRelation(parentTable, childTable, columnNames);
        relation.leftAlias = alias;
        parentTable._relations[alias] = relation;
        Object.defineProperty(parentTable, alias, {
          get: function() {
            return newRelatedTable([relation]);
          }
        });
        return relation;
      };
      return c;
    }
    module.exports = newJoin;
  });

  // table/relation/newOneLeg.js
  var require_newOneLeg = __commonJS((exports, module) => {
    var newCollection = require_newCollection();
    var newQueryContext = require_newQueryContext();
    function newLeg(relation) {
      var joinRelation = relation.joinRelation;
      var c = {};
      c.name = joinRelation.rightAlias;
      var span = {};
      span.queryContext = newQueryContext();
      span.table = joinRelation.parentTable;
      span.legs = newCollection();
      c.span = span;
      c.table = joinRelation.childTable;
      c.columns = joinRelation.columns;
      c.expand = relation.expand;
      c.accept = function(visitor) {
        visitor.visitOne(c);
      };
      return c;
    }
    module.exports = newLeg;
  });

  // table/relation/newManyLeg.js
  var require_newManyLeg = __commonJS((exports, module) => {
    var newOneLeg = require_newOneLeg();
    function newLeg(relation) {
      var c = newOneLeg(relation);
      c.name = relation.joinRelation.rightAlias;
      c.accept = function(visitor) {
        visitor.visitMany(c);
      };
      c.expand = relation.expand;
      return c;
    }
    module.exports = newLeg;
  });

  // table/relation/manyCache/extractParentKey.js
  var require_extractParentKey = __commonJS((exports, module) => {
    function extractParentKey(joinRelation, child) {
      var childTable = joinRelation.childTable;
      var primaryColumns = childTable._primaryColumns;
      var parent = {};
      joinRelation.columns.forEach(addKeyToParent);
      function addKeyToParent(childPk, index) {
        var primaryColumn = primaryColumns[index];
        parent[primaryColumn.alias] = child[childPk.alias];
      }
      return parent;
    }
    module.exports = extractParentKey;
  });

  // table/relation/manyCache/synchronizeChanged.js
  var require_synchronizeChanged = __commonJS((exports, module) => {
    var extractParentKey = require_extractParentKey();
    function synchronizeChanged(manyCache, joinRelation, parent, child) {
      var columns = joinRelation.columns;
      columns.forEach(subscribeColumn);
      child = null;
      function subscribeColumn(column) {
        child.subscribeChanged(onChanged, column.alias);
      }
      function unsubscribe(child2) {
        columns.forEach(unsubscribeColumn);
        function unsubscribeColumn(column) {
          child2.unsubscribeChanged(onChanged, column.alias);
        }
      }
      function onChanged(child2) {
        unsubscribe(child2);
        manyCache.tryRemove(parent, child2);
        var newParent = extractParentKey(joinRelation, child2);
        manyCache.tryAdd(newParent, child2);
      }
    }
    module.exports = synchronizeChanged;
  });

  // table/relation/manyCache/synchronizeAdded.js
  var require_synchronizeAdded = __commonJS((exports, module) => {
    var extractParentKey = require_extractParentKey();
    function synchronizeAdded(action, joinRelation) {
      var cache = joinRelation.parentTable._cache;
      cache.subscribeAdded(onAdded);
      function onAdded(child) {
        var parent = extractParentKey(joinRelation, child);
        action(parent, child);
      }
    }
    module.exports = synchronizeAdded;
  });

  // table/relation/manyCache/synchronizeRemoved.js
  var require_synchronizeRemoved = __commonJS((exports, module) => {
    var extractParentKey = require_extractParentKey();
    function synchronizeRemoved(action, joinRelation) {
      var cache = joinRelation.parentTable._cache;
      cache.subscribeRemoved(onRemoved);
      function onRemoved(child) {
        var parent = extractParentKey(joinRelation, child);
        action(parent, child);
      }
    }
    module.exports = synchronizeRemoved;
  });

  // table/newCache.js
  var require_newCache = __commonJS((exports, module) => {
    var newEmitEvent = require_emitEvent();
    function cacheCore() {
      var emitAdded = newEmitEvent();
      var emitRemoved = newEmitEvent();
      var c = {};
      var cache = {};
      var keyLength;
      c.tryGet = function(key) {
        var index = 0;
        var keyLength2 = key.length;
        return tryGetCore(cache, index);
        function tryGetCore(cache2, index2) {
          var keyValue = key[index2];
          var cacheValue = cache2[keyValue];
          if (typeof cacheValue === "undefined")
            return null;
          if (keyLength2 - 1 === index2)
            return cacheValue;
          return tryGetCore(cache2[keyValue], ++index2);
        }
      };
      c.tryAdd = function(key, result) {
        var index = 0;
        keyLength = key.length;
        return addCore(cache, index);
        function addCore(cache2, index2) {
          var keyValue = key[index2];
          if (keyLength - 1 === index2) {
            if (keyValue in cache2)
              return cache2[keyValue];
            cache2[keyValue] = result;
            emitAdded(result);
            return result;
          }
          if (!(keyValue in cache2))
            cache2[keyValue] = {};
          return addCore(cache2[keyValue], ++index2);
        }
      };
      c.tryRemove = function(key) {
        var index = 0;
        var keyLength2 = key.length;
        return tryRemoveCore(cache, index);
        function tryRemoveCore(cache2, index2) {
          var keyValue = key[index2];
          if (!(keyValue in cache2))
            return null;
          var cacheValue = cache2[keyValue];
          if (keyLength2 - 1 === index2) {
            delete cache2[keyValue];
            emitRemoved(cacheValue);
            return cacheValue;
          }
          return tryRemoveCore(cache2[keyValue], ++index2);
        }
      };
      c.getAll = function() {
        var index = 0;
        var result = [];
        getAllCore(cache, index);
        function getAllCore(cache2, index2) {
          for (var name in cache2) {
            var value = cache2[name];
            if (index2 === keyLength - 1)
              result.push(value);
            else
              getAllCore(value, index2 + 1);
          }
        }
        return result;
      };
      c.subscribeAdded = emitAdded.add;
      c.subscribeRemoved = emitRemoved.add;
      return c;
    }
    module.exports = cacheCore;
  });

  // table/relation/newManyCacheCore.js
  var require_newManyCacheCore = __commonJS((exports, module) => {
    var newCacheCore = require_newCache();
    var newRowArray = require_rowArray();
    function newManyCache(joinRelation) {
      var c = {};
      var cache = newCacheCore();
      var primaryColumns = joinRelation.childTable._primaryColumns;
      c.tryGet = function(parentRow) {
        var key = toKey(parentRow);
        var rows = cache.tryGet(key);
        if (!rows)
          return newArray();
        return rows;
      };
      function tryAdd(parentRow, childRow) {
        var key = toKey(parentRow);
        var existing = cache.tryGet(key);
        if (existing) {
          existing.push(childRow);
          return;
        }
        var rows = newArray();
        rows.push(childRow);
        existing = cache.tryAdd(key, rows);
      }
      function newArray() {
        return newRowArray(joinRelation.parentTable);
      }
      c.tryAdd = tryAdd;
      c.tryRemove = function(parentRow, childRow) {
        var key = toKey(parentRow);
        var existing = cache.tryGet(key);
        var index = existing.indexOf(childRow);
        existing.splice(index, 1);
      };
      function toKey(row) {
        return primaryColumns.map(onColumn);
        function onColumn(column) {
          return row[column.alias];
        }
      }
      return c;
    }
    module.exports = newManyCache;
  });

  // node_modules/uuid/lib/rng-browser.js
  var require_rng_browser = __commonJS((exports, module) => {
    var getRandomValues = typeof crypto != "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto != "undefined" && typeof window.msCrypto.getRandomValues == "function" && msCrypto.getRandomValues.bind(msCrypto);
    if (getRandomValues) {
      rnds8 = new Uint8Array(16);
      module.exports = function whatwgRNG() {
        getRandomValues(rnds8);
        return rnds8;
      };
    } else {
      rnds = new Array(16);
      module.exports = function mathRNG() {
        for (var i = 0, r; i < 16; i++) {
          if ((i & 3) === 0)
            r = Math.random() * 4294967296;
          rnds[i] = r >>> ((i & 3) << 3) & 255;
        }
        return rnds;
      };
    }
    var rnds8;
    var rnds;
  });

  // node_modules/uuid/lib/bytesToUuid.js
  var require_bytesToUuid = __commonJS((exports, module) => {
    var byteToHex = [];
    for (var i = 0; i < 256; ++i) {
      byteToHex[i] = (i + 256).toString(16).substr(1);
    }
    function bytesToUuid(buf, offset) {
      var i2 = offset || 0;
      var bth = byteToHex;
      return [
        bth[buf[i2++]],
        bth[buf[i2++]],
        bth[buf[i2++]],
        bth[buf[i2++]],
        "-",
        bth[buf[i2++]],
        bth[buf[i2++]],
        "-",
        bth[buf[i2++]],
        bth[buf[i2++]],
        "-",
        bth[buf[i2++]],
        bth[buf[i2++]],
        "-",
        bth[buf[i2++]],
        bth[buf[i2++]],
        bth[buf[i2++]],
        bth[buf[i2++]],
        bth[buf[i2++]],
        bth[buf[i2++]]
      ].join("");
    }
    module.exports = bytesToUuid;
  });

  // node_modules/uuid/v1.js
  var require_v1 = __commonJS((exports, module) => {
    var rng = require_rng_browser();
    var bytesToUuid = require_bytesToUuid();
    var _nodeId;
    var _clockseq;
    var _lastMSecs = 0;
    var _lastNSecs = 0;
    function v1(options, buf, offset) {
      var i = buf && offset || 0;
      var b = buf || [];
      options = options || {};
      var node = options.node || _nodeId;
      var clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
      if (node == null || clockseq == null) {
        var seedBytes = rng();
        if (node == null) {
          node = _nodeId = [
            seedBytes[0] | 1,
            seedBytes[1],
            seedBytes[2],
            seedBytes[3],
            seedBytes[4],
            seedBytes[5]
          ];
        }
        if (clockseq == null) {
          clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
        }
      }
      var msecs = options.msecs !== void 0 ? options.msecs : new Date().getTime();
      var nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
      var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
      if (dt < 0 && options.clockseq === void 0) {
        clockseq = clockseq + 1 & 16383;
      }
      if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) {
        nsecs = 0;
      }
      if (nsecs >= 1e4) {
        throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
      }
      _lastMSecs = msecs;
      _lastNSecs = nsecs;
      _clockseq = clockseq;
      msecs += 122192928e5;
      var tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
      b[i++] = tl >>> 24 & 255;
      b[i++] = tl >>> 16 & 255;
      b[i++] = tl >>> 8 & 255;
      b[i++] = tl & 255;
      var tmh = msecs / 4294967296 * 1e4 & 268435455;
      b[i++] = tmh >>> 8 & 255;
      b[i++] = tmh & 255;
      b[i++] = tmh >>> 24 & 15 | 16;
      b[i++] = tmh >>> 16 & 255;
      b[i++] = clockseq >>> 8 | 128;
      b[i++] = clockseq & 255;
      for (var n = 0; n < 6; ++n) {
        b[i + n] = node[n];
      }
      return buf ? buf : bytesToUuid(b);
    }
    module.exports = v1;
  });

  // node_modules/uuid/v4.js
  var require_v4 = __commonJS((exports, module) => {
    var rng = require_rng_browser();
    var bytesToUuid = require_bytesToUuid();
    function v4(options, buf, offset) {
      var i = buf && offset || 0;
      if (typeof options == "string") {
        buf = options === "binary" ? new Array(16) : null;
        options = null;
      }
      options = options || {};
      var rnds = options.random || (options.rng || rng)();
      rnds[6] = rnds[6] & 15 | 64;
      rnds[8] = rnds[8] & 63 | 128;
      if (buf) {
        for (var ii = 0; ii < 16; ++ii) {
          buf[i + ii] = rnds[ii];
        }
      }
      return buf || bytesToUuid(rnds);
    }
    module.exports = v4;
  });

  // node_modules/uuid/index.js
  var require_uuid = __commonJS((exports, module) => {
    var v1 = require_v1();
    var v4 = require_v4();
    var uuid = v4;
    uuid.v1 = v1;
    uuid.v4 = v4;
    module.exports = uuid;
  });

  // newId.js
  var require_newId = __commonJS((exports, module) => {
    module.exports = require_uuid().v4;
  });

  // table/setSessionSingleton.js
  var require_setSessionSingleton = __commonJS((exports, module) => {
    var getSessionContext = require_getSessionContext();
    module.exports = function(name, value) {
      getSessionContext()[name] = value;
    };
  });

  // table/relation/newManyCache.js
  var require_newManyCache = __commonJS((exports, module) => {
    var synchronizeChanged = require_synchronizeChanged();
    var synchronizeAdded = require_synchronizeAdded();
    var synchronizeRemoved = require_synchronizeRemoved();
    var extractParentKey = require_extractParentKey();
    var newCacheCore = require_newManyCacheCore();
    var newId = require_newId();
    var getSessionSingleton = require_getSessionSingleton();
    var setSessionSingleton = require_setSessionSingleton();
    function newManyCache(joinRelation) {
      var c = {};
      var key = newId();
      c.tryAdd = function(parent, child) {
        var cache = getSessionSingleton(key);
        cache.tryAdd(parent, child);
        synchronizeChanged(c, joinRelation, parent, child);
      };
      c.tryRemove = function(parent, child) {
        var cache = getSessionSingleton(key);
        cache.tryRemove(parent, child);
      };
      c.tryGet = function(parentRow) {
        var cache = getSessionSingleton(key);
        if (!cache) {
          cache = newCacheCore(joinRelation);
          setSessionSingleton(key, cache);
          fillCache(cache);
          synchronizeAdded(c.tryAdd, joinRelation);
          synchronizeRemoved(c.tryRemove, joinRelation);
        }
        return cache.tryGet(parentRow);
      };
      function fillCache() {
        var childTable = joinRelation.parentTable;
        var childCache = childTable._cache;
        var children = childCache.getAll();
        children.forEach(addToCache);
        function addToCache(child) {
          var parent = extractParentKey(joinRelation, child);
          c.tryAdd(parent, child);
        }
      }
      return c;
    }
    module.exports = newManyCache;
  });

  // table/relation/newForeignKeyFilter.js
  var require_newForeignKeyFilter = __commonJS((exports, module) => {
    function newForeignKeyFilter(joinRelation, parentRow) {
      var columns = joinRelation.columns;
      var rightTable = joinRelation.childTable;
      var filter = getNextFilterPart(0);
      for (var i = 1; i < columns.length; i++) {
        filter = filter.and(getNextFilterPart(i));
      }
      function getNextFilterPart(index) {
        var column = columns[index];
        var pk = rightTable._primaryColumns[index];
        return column.eq(parentRow[pk.alias]);
      }
      return filter;
    }
    module.exports = newForeignKeyFilter;
  });

  // table/oneRelation/getRelatives.js
  var require_getRelatives2 = __commonJS((exports, module) => {
    var emptyFilter = require_emptyFilter();
    var newForeignKeyFilter = require_newForeignKeyFilter();
    var negotiateExpandInverse = require_negotiateExpandInverse();
    function getRelatives(parent, relation) {
      var queryContext = parent.queryContext;
      var filter;
      var parentTable = relation.joinRelation.childTable;
      if (parentTable._primaryColumns.length === 1)
        filter = createInFilter();
      else
        filter = createCompositeFilter();
      function createInFilter() {
        var parentAlias = parentTable._primaryColumns[0].alias;
        var ids = queryContext.rows.map(function(row) {
          return row[parentAlias];
        });
        var column = relation.joinRelation.columns[0];
        return column.in(ids);
      }
      function createCompositeFilter() {
        var filters = queryContext.rows.map(function(row) {
          return newForeignKeyFilter(relation.joinRelation, row);
        });
        return emptyFilter.or.apply(emptyFilter, filters);
      }
      return relation.childTable.getMany(filter).then(onRows);
      function onRows(rows) {
        queryContext.expand(relation);
        negotiateExpandInverse(parent, relation, rows);
        return rows;
      }
    }
    module.exports = getRelatives;
  });

  // table/newManyRelation.js
  var require_newManyRelation = __commonJS((exports, module) => {
    var newLeg = require_newManyLeg();
    var newManyCache = require_newManyCache();
    var newForeignKeyFilter = require_newForeignKeyFilter();
    var getRelatives = require_getRelatives2();
    var resultToPromise = require_resultToPromise();
    var newGetRelated = require_newGetRelated();
    function newManyRelation(joinRelation) {
      var c = {};
      var manyCache = newManyCache(joinRelation);
      c.joinRelation = joinRelation;
      c.childTable = joinRelation.parentTable;
      c.isMany = true;
      c.accept = function(visitor) {
        visitor.visitMany(c);
      };
      c.getFromCache = function(parent) {
        var row = manyCache.tryGet(parent);
        return resultToPromise(row);
      };
      c.getFromDb = function(parent) {
        var filter = newForeignKeyFilter(joinRelation, parent);
        return c.childTable.getMany(filter);
      };
      c.getRelatives = function(parent) {
        return getRelatives(parent, c);
      };
      c.toGetRelated = function(parent) {
        return newGetRelated(parent, c);
      };
      c.expand = function(parent) {
        return parent.expand(joinRelation.rightAlias);
      };
      c.getRowsSync = manyCache.tryGet;
      c.toLeg = function() {
        return newLeg(c);
      };
      return c;
    }
    module.exports = newManyRelation;
  });

  // table/hasMany.js
  var require_hasMany = __commonJS((exports, module) => {
    var newManyRelation = require_newManyRelation();
    var newRelatedTable = require_newRelatedTable();
    function newOne(joinRelation) {
      var c = {};
      var parentTable = joinRelation.childTable;
      c.as = function(alias) {
        joinRelation.rightAlias = alias;
        var relation = newManyRelation(joinRelation);
        parentTable._relations[alias] = relation;
        Object.defineProperty(parentTable, alias, {
          get: function() {
            return newRelatedTable([relation]);
          }
        });
        return relation;
      };
      return c;
    }
    module.exports = newOne;
  });

  // table/relation/newOneCache.js
  var require_newOneCache = __commonJS((exports, module) => {
    var newManyCache = require_newManyCache();
    function newOneCache(joinRelation) {
      var c = {};
      var cache = newManyCache(joinRelation);
      c.tryGet = function(parent) {
        var res = cache.tryGet(parent);
        if (res.length === 0)
          return null;
        return res[0];
      };
      return c;
    }
    module.exports = newOneCache;
  });

  // table/newOneRelation.js
  var require_newOneRelation = __commonJS((exports, module) => {
    var newLeg = require_newOneLeg();
    var newOneCache = require_newOneCache();
    var newForeignKeyFilter = require_newForeignKeyFilter();
    var getRelatives = require_getRelatives2();
    var resultToPromise = require_resultToPromise();
    var newGetRelated = require_newGetRelated();
    function newOneRelation(joinRelation) {
      var c = {};
      var oneCache = newOneCache(joinRelation);
      c.joinRelation = joinRelation;
      c.childTable = joinRelation.parentTable;
      c.isOne = true;
      c.accept = function(visitor) {
        visitor.visitOne(c);
      };
      c.getFromCache = function(parent) {
        var row = oneCache.tryGet(parent);
        return resultToPromise(row);
      };
      c.getFromDb = function(parent) {
        var filter = newForeignKeyFilter(joinRelation, parent);
        return c.childTable.tryGetFirst(filter);
      };
      c.getRelatives = function(parent) {
        return getRelatives(parent, c);
      };
      c.toGetRelated = function(parent) {
        return newGetRelated(parent, c);
      };
      c.expand = function(parent) {
        return parent.expand(joinRelation.rightAlias);
      };
      c.getRowsSync = oneCache.tryGet;
      c.toLeg = function() {
        return newLeg(c);
      };
      return c;
    }
    module.exports = newOneRelation;
  });

  // table/hasOne.js
  var require_hasOne = __commonJS((exports, module) => {
    var newOneRelation = require_newOneRelation();
    var newRelatedTable = require_newRelatedTable();
    function newOne(joinRelation) {
      var c = {};
      var parentTable = joinRelation.childTable;
      c.as = function(alias) {
        joinRelation.rightAlias = alias;
        var relation = newOneRelation(joinRelation);
        parentTable._relations[alias] = relation;
        Object.defineProperty(parentTable, alias, {
          get: function() {
            return newRelatedTable([relation]);
          }
        });
        return relation;
      };
      return c;
    }
    module.exports = newOne;
  });

  // table/readStream/pg/query/singleQuery/newShallowColumnSql.js
  var require_newShallowColumnSql2 = __commonJS((exports, module) => {
    var util = require_util2();
    function _new(table, alias) {
      var columnFormat = '%s as "%s"';
      var columns = table._columns;
      var sql = "";
      var separator = alias + ".";
      for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        if (!("serializable" in column && !column.serializable))
          sql = sql + separator + util.format(columnFormat, column._dbName, column.alias);
        separator = "," + alias + ".";
      }
      return sql;
    }
    module.exports = _new;
  });

  // table/readStream/pg/query/newSingleQuery.js
  var require_newSingleQuery2 = __commonJS((exports, module) => {
    var newColumnSql = require_newShallowColumnSql2();
    var newWhereSql = require_newWhereSql();
    function _new(table, filter, span, alias, subQueries, orderBy, limit) {
      var c = {};
      c.sql = function() {
        var name = table._dbName;
        var columnSql = newColumnSql(table, alias, span);
        var whereSql = newWhereSql(table, filter, alias);
        return "select " + columnSql + subQueries + " from " + name + " " + alias + whereSql + orderBy + limit;
      };
      c.parameters = filter.parameters;
      return c;
    }
    module.exports = _new;
  });

  // table/readStream/pg/query/newSubQueries/joinLegToQuery.js
  var require_joinLegToQuery = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    var newQuery = require_newQueryCore();
    var newParameterized = require_newParameterized();
    var util = require_util2();
    function joinLegToQuery(parentAlias, leg, legNo) {
      var childAlias = parentAlias + "_" + legNo;
      var span = leg.span;
      var parentTable = leg.table;
      var childColumns = span.table._primaryColumns;
      var parentColumns = leg.columns;
      var shallowJoin = newShallowJoinSql(parentTable, childColumns, parentColumns, childAlias, parentAlias);
      var filter = newParameterized(shallowJoin);
      var query = newQuery(span.table, filter, span, childAlias);
      return util.format(',(select row_to_json(r) from (%s limit 1) r) "%s"', query.sql(), leg.name);
    }
    module.exports = joinLegToQuery;
  });

  // table/readStream/pg/query/newSubQueries/oneLegToQuery.js
  var require_oneLegToQuery = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    var newQuery = require_newQueryCore();
    var newParameterized = require_newParameterized();
    var util = require_util2();
    function oneLegToQuery(rightAlias, leg, legNo) {
      var leftAlias = rightAlias + "_" + legNo;
      var span = leg.span;
      var rightTable = leg.table;
      var rightColumns = rightTable._primaryColumns;
      var leftColumns = leg.columns;
      var shallowJoin = newShallowJoinSql(rightTable, leftColumns, rightColumns, leftAlias, rightAlias);
      var filter = newParameterized(shallowJoin);
      var query = newQuery(span.table, filter, span, leftAlias);
      return util.format(',(select row_to_json(r) from (%s limit 1) r) "%s"', query.sql(), leg.name);
    }
    module.exports = oneLegToQuery;
  });

  // table/readStream/pg/query/newSubQueries/manyLegToQuery.js
  var require_manyLegToQuery = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    var newQuery = require_newQueryCore();
    var newParameterized = require_newParameterized();
    var extractOrderBy = require_extractOrderBy();
    var util = require_util2();
    function manyLegToQuery(rightAlias, leg, legNo) {
      var leftAlias = rightAlias + "_" + legNo;
      var span = leg.span;
      var rightTable = leg.table;
      var rightColumns = rightTable._primaryColumns;
      var leftColumns = leg.columns;
      var orderBy = extractOrderBy(rightTable, rightAlias);
      var shallowJoin = newShallowJoinSql(rightTable, leftColumns, rightColumns, leftAlias, rightAlias);
      var filter = newParameterized(shallowJoin);
      var query = newQuery(span.table, filter, span, leftAlias, orderBy);
      return util.format(`,(select coalesce(json_agg(row_to_json(r)),'[]') from (%s) r ) "%s"`, query.sql(), leg.name);
    }
    module.exports = manyLegToQuery;
  });

  // table/readStream/pg/query/newSubQueries.js
  var require_newSubQueries = __commonJS((exports, module) => {
    var joinLegToQuery = _joinLegToQuery;
    var oneLegToQuery = _oneLegToQuery;
    var manyLegToQuery = _manyLegToQuery;
    function newSubQueries(table, span, alias) {
      var result = [];
      var c = {};
      var _legNo;
      c.visitJoin = function(leg) {
        result.push(joinLegToQuery(alias, leg, _legNo));
      };
      c.visitOne = function(leg) {
        result.push(oneLegToQuery(alias, leg, _legNo));
      };
      c.visitMany = function(leg) {
        result.push(manyLegToQuery(alias, leg, _legNo));
      };
      span.legs.forEach(onEachLeg);
      function onEachLeg(leg, legNo) {
        _legNo = legNo;
        leg.accept(c);
      }
      return result.join("");
    }
    function _joinLegToQuery() {
      joinLegToQuery = require_joinLegToQuery();
      return joinLegToQuery.apply(null, arguments);
    }
    function _oneLegToQuery() {
      oneLegToQuery = require_oneLegToQuery();
      return oneLegToQuery.apply(null, arguments);
    }
    function _manyLegToQuery() {
      manyLegToQuery = require_manyLegToQuery();
      return manyLegToQuery.apply(null, arguments);
    }
    module.exports = newSubQueries;
  });

  // table/readStream/extractOrderBy.js
  var require_extractOrderBy2 = __commonJS((exports, module) => {
    function extractOrderBy(alias, span) {
      var table = span.table;
      var dbNames = [];
      var orderBy = span.orderBy;
      var i;
      if (span.orderBy) {
        if (typeof orderBy === "string")
          orderBy = [orderBy];
        for (i = 0; i < orderBy.length; i++) {
          var nameAndDirection = extractNameAndDirection(orderBy[i]);
          pushColumn(nameAndDirection.name, nameAndDirection.direction);
        }
      } else
        for (i = 0; i < table._primaryColumns.length; i++) {
          pushColumn(table._primaryColumns[i].alias);
        }
      function extractNameAndDirection(orderBy2) {
        var elements = orderBy2.split(" ");
        var direction = "";
        if (elements.length > 1) {
          direction = " " + elements[1];
        }
        return {
          name: elements[0],
          direction
        };
      }
      function pushColumn(property, direction) {
        direction = direction || "";
        var column = getTableColumn(property);
        var jsonQuery = getJsonQuery(property, column.alias);
        dbNames.push(alias + "." + column._dbName + jsonQuery + direction);
      }
      function getTableColumn(property) {
        var column = table[property] || table[property.split(/(-|#)>+/g)[0]];
        if (!column) {
          throw new Error(`Unable to get column on orderBy '${property}'. If jsonb query, only #>, #>>, -> and ->> allowed. Only use ' ' to seperate between query and direction. Does currently not support casting.`);
        }
        return column;
      }
      function getJsonQuery(property, column) {
        let containsJson = /(-|#)>+/g.test(property);
        if (!containsJson) {
          return "";
        }
        return property.replace(column, "");
      }
      return " order by " + dbNames.join(",");
    }
    module.exports = extractOrderBy;
  });

  // table/readStream/extractLimit.js
  var require_extractLimit2 = __commonJS((exports, module) => {
    function extractLimit(span) {
      if (span.limit)
        return " limit " + span.limit;
      return "";
    }
    module.exports = extractLimit;
  });

  // table/readStream/pg/newQueryCore.js
  var require_newQueryCore = __commonJS((exports, module) => {
    var newSingleQuery = require_newSingleQuery2();
    var newSubQueries = require_newSubQueries();
    var extractFilter = require_extractFilter();
    var extractOrderBy = require_extractOrderBy2();
    var extractLimit = require_extractLimit2();
    var newParameterized = require_newParameterized();
    function newQuery(table, filter, span, alias) {
      filter = extractFilter(filter);
      var orderBy = extractOrderBy(alias, span);
      var limit = extractLimit(span);
      var subQueries = newSubQueries(table, span, alias);
      var query = newSingleQuery(table, filter, span, alias, subQueries, orderBy, limit);
      return newParameterized(query.sql(), query.parameters);
    }
    module.exports = newQuery;
  });

  // table/getManyDto/pg/newQuery.js
  var require_newQuery2 = __commonJS((exports, module) => {
    var newQueryCore = require_newQueryCore();
    function newQuery() {
      var query = newQueryCore.apply(null, arguments);
      return query.prepend("select json_strip_nulls(coalesce(json_agg(row_to_json(r)), '[]')) as result from (").append(") r");
    }
    module.exports = newQuery;
  });

  // table/getManyDto/newQuery.js
  var require_newQuery3 = __commonJS((exports, module) => {
    var newPgQuery = require_newQuery2();
    var getSessionContext = require_getSessionContext();
    function newQuery() {
      var c = {};
      var _newQuery;
      c.visitPg = function() {
        _newQuery = newPgQuery;
      };
      c.visitMySql = function() {
        throw new Error("MySql not supported");
      };
      c.visitSqlite = function() {
        throw new Error("Sqlite not supported");
      };
      getSessionContext().accept(c);
      return _newQuery.apply(null, arguments);
    }
    module.exports = newQuery;
  });

  // table/getManyDto.js
  var require_getManyDto = __commonJS((exports, module) => {
    var newQuery = require_newQuery3();
    var strategyToSpan = require_strategyToSpan();
    var negotiateRawSqlFilter = require_negotiateRawSqlFilter();
    var executeQueries = require_executeQueries();
    var getSessionContext = require_getSessionContext();
    function getManyDto(table, filter, strategy) {
      let isPg;
      let c = {};
      c.visitPg = function() {
        isPg = true;
      };
      c.visitMySql = function() {
      };
      c.visitSqlite = function() {
      };
      getSessionContext().accept(c);
      if (!isPg) {
        let args = [];
        for (var i = 1; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        return table.getMany.apply(null, args).then((rows) => {
          args.shift();
          return rows.toDto.apply(null, args);
        });
      }
      var alias = table._dbName;
      filter = negotiateRawSqlFilter(filter);
      var span = strategyToSpan(table, strategy);
      var query = newQuery(table, filter, span, alias);
      return executeQueries([query]).then(onResults).then(onSingleResult);
      function onResults(rowsPromises) {
        return rowsPromises[0];
      }
      function onSingleResult(result) {
        for (var p in result[0]) {
          let res = result[0][p];
          return res;
        }
      }
    }
    module.exports = getManyDto;
  });

  // table/tryGetById.js
  var require_tryGetById = __commonJS((exports, module) => {
    var tryGetFromCacheById = require_tryGetFromCacheById();
    var tryGetFromDbById = require_tryGetFromDbById();
    var resultToPromise = require_resultToPromise();
    function get() {
      var cached = tryGetFromCacheById.apply(null, arguments);
      if (cached)
        return resultToPromise(cached);
      return tryGetFromDbById.apply(null, arguments);
    }
    get.exclusive = tryGetFromDbById.exclusive;
    module.exports = get;
  });

  // table/domainCache/getCache.js
  var require_getCache = __commonJS((exports, module) => {
    var newCache = require_newCache();
    var getSessionSingleton = require_getSessionSingleton();
    var setSessionSingleton = require_setSessionSingleton();
    function getCache(id) {
      var cache = getSessionSingleton(id);
      if (cache)
        return cache;
      cache = newCache();
      setSessionSingleton(id, cache);
      return cache;
    }
    module.exports = getCache;
  });

  // table/newDomainCache.js
  var require_newDomainCache = __commonJS((exports, module) => {
    var newId = require_newId();
    var _getCache = require_getCache();
    function newDomainCache() {
      var c = {};
      var id = newId();
      c.tryGet = function(key) {
        var cache = getCache();
        return cache.tryGet(key);
      };
      c.tryAdd = function(key, value) {
        var cache = getCache();
        return cache.tryAdd(key, value);
      };
      c.getAll = function() {
        var cache = getCache();
        return cache.getAll();
      };
      c.tryRemove = function(key) {
        var cache = getCache();
        return cache.tryRemove(key);
      };
      c.subscribeAdded = function(onAdded) {
        var cache = getCache();
        return cache.subscribeAdded(onAdded);
      };
      c.subscribeRemoved = function(onRemoved) {
        var cache = getCache();
        return cache.subscribeRemoved(onRemoved);
      };
      function getCache() {
        return _getCache(id);
      }
      return c;
    }
    module.exports = newDomainCache;
  });

  // table/newRowCache.js
  var require_newRowCache = __commonJS((exports, module) => {
    var newDomainCache = require_newDomainCache();
    function newRowCache(table) {
      var c = {};
      var cache = newDomainCache();
      var pkNames;
      var rowToKey = firstRowToKey;
      function getPkNames() {
        var names = {};
        var primaryColumns = table._primaryColumns;
        var keyLength = primaryColumns.length;
        for (var i = 0; i < keyLength; i++) {
          var column = primaryColumns[i];
          names[column.alias] = null;
        }
        return names;
      }
      c.tryGet = function(row) {
        var key = rowToKey(row);
        return cache.tryGet(key);
      };
      function firstRowToKey(row) {
        pkNames = getPkNames();
        rowToKey = nextRowToKey;
        table = null;
        return rowToKey(row);
      }
      function nextRowToKey(row) {
        var key = [];
        for (var pkName in pkNames) {
          key.push(row[pkName]);
        }
        return key;
      }
      c.tryAdd = function(row) {
        var key = rowToKey(row);
        return cache.tryAdd(key, row);
      };
      c.tryRemove = function(row) {
        var key = rowToKey(row);
        cache.tryRemove(key);
      };
      c.subscribeAdded = cache.subscribeAdded;
      c.subscribeRemoved = cache.subscribeRemoved;
      c.getAll = cache.getAll;
      return c;
    }
    module.exports = newRowCache;
  });

  // table/commands/newRow.js
  var require_newRow = __commonJS((exports, module) => {
    var decodeDbRow = require_decodeDbRow();
    function newRow(table) {
      var dto = {};
      table._columns.forEach(addColumn);
      function addColumn(column2) {
        var alias = column2.alias;
        if ("default" in column2) {
          if (typeof column2.default === "function")
            dto[alias] = column2.default();
          else if (column2.toDto)
            dto[alias] = column2.toDto(column2.default);
          else
            dto[alias] = column2.default;
        } else
          dto[alias] = null;
      }
      for (var i = 1; i < arguments.length; i++) {
        var pkValue = arguments[i];
        var column = table._primaryColumns[i - 1];
        dto[column.alias] = pkValue;
      }
      return decodeDbRow(table, table, dto);
    }
    module.exports = newRow;
  });

  // table/commands/insert/getSqlTemplate.js
  var require_getSqlTemplate = __commonJS((exports, module) => {
    function getSqlTemplate(table) {
      if (table._insertTemplate)
        return table._insertTemplate;
      var columnNames = [];
      var values = [];
      var sql = "INSERT INTO " + table._dbName + " (";
      addDiscriminators();
      addColumns();
      sql = sql + columnNames.join(",") + ") VALUES (" + values.join(",") + ")";
      table._insertTemplate = sql;
      return sql;
      function addDiscriminators() {
        var discriminators = table._columnDiscriminators;
        for (var i = 0; i < discriminators.length; i++) {
          var parts = discriminators[i].split("=");
          columnNames.push(parts[0]);
          values.push(parts[1]);
        }
      }
      function addColumns() {
        var columns = table._columns;
        for (var i = 0; i < columns.length; i++) {
          var column = columns[i];
          columnNames.push(column._dbName);
          values.push("%s");
        }
      }
    }
    module.exports = getSqlTemplate;
  });

  // table/commands/newInsertCommandCore.js
  var require_newInsertCommandCore = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    var getSqlTemplate = require_getSqlTemplate();
    var util = require_util2();
    function newInsertCommandCore(table, row) {
      var parameters = [];
      var values = [getSqlTemplate(table)];
      var columns = table._columns;
      for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        var alias = column.alias;
        var encoded = column.encode(row[alias]);
        if (encoded.parameters.length > 0) {
          values.push("?");
          parameters.push(encoded.parameters[0]);
        } else
          values.push(encoded.sql());
      }
      var sql = util.format.apply(null, values);
      return newParameterized(sql, parameters);
    }
    module.exports = newInsertCommandCore;
  });

  // table/commands/newInsertCommand.js
  var require_newInsertCommand = __commonJS((exports, module) => {
    var newInsertCommandCore = require_newInsertCommandCore();
    var newImmutable = require_newImmutable();
    var createPatch = require_rdb_client().createPatch;
    var createDto = require_createDto();
    function newInsertCommand(table, row) {
      return new InsertCommand(table, row);
    }
    function InsertCommand(table, row) {
      this.__getCoreCommand = newImmutable(newInsertCommandCore);
      this._table = table;
      this._row = row;
    }
    InsertCommand.prototype._getCoreCommand = function() {
      return this.__getCoreCommand(this._table, this._row);
    };
    InsertCommand.prototype.sql = function() {
      return this._getCoreCommand().sql();
    };
    InsertCommand.prototype.matches = function(otherRow) {
      return this._row === otherRow;
    };
    InsertCommand.prototype.endEdit = function() {
      this.sql();
      var dto = createDto(this._table, this._row);
      if (this._table._emitChanged.callbacks.length > 0)
        this._patch = createPatch([], [dto]);
    };
    InsertCommand.prototype.emitChanged = function() {
      return this._table._emitChanged({row: this._row, patch: this._patch});
    };
    Object.defineProperty(InsertCommand.prototype, "parameters", {
      get: function() {
        return this._getCoreCommand().parameters;
      }
    });
    Object.defineProperty(InsertCommand.prototype, "disallowCompress", {
      get: function() {
        return this._table._emitChanged.callbacks.length > 0;
      }
    });
    module.exports = newInsertCommand;
  });

  // table/insert.js
  var require_insert = __commonJS((exports, module) => {
    var newRow = require_newRow();
    var newInsertCommand = require_newInsertCommand();
    var pushCommand = require_pushCommand();
    function insert(table) {
      var args = [].slice.call(arguments);
      var row = newRow.apply(null, args);
      row = table._cache.tryAdd(row);
      var cmd = newInsertCommand(table, row);
      pushCommand(cmd);
      expand(table, row);
      return row;
    }
    function expand(table, row) {
      var relationName;
      var visitor = {};
      visitor.visitJoin = function() {
      };
      visitor.visitMany = function() {
        row.expand(relationName);
      };
      visitor.visitOne = function() {
        row.expand(relationName);
      };
      for (relationName in table._relations) {
        var relation = table._relations[relationName];
        relation.accept(visitor);
      }
    }
    module.exports = insert;
  });

  // table/delete.js
  var require_delete2 = __commonJS((exports, module) => {
    var pushCommand = require_pushCommand();
    var newDeleteCommand = require_newDeleteCommand();
    var extractDeleteStrategy = require_extractDeleteStrategy();
    var negotiateRawSqlFilter = require_negotiateRawSqlFilter();
    var emptyPromise = require_resultToPromise()();
    function _delete(table, filter, strategy) {
      filter = negotiateRawSqlFilter(filter);
      strategy = extractDeleteStrategy(strategy);
      var relations = [];
      var cmds = [];
      cmds = newDeleteCommand(cmds, table, filter, strategy, relations);
      cmds.forEach(function(cmd) {
        pushCommand(cmd);
      });
      return emptyPromise;
    }
    module.exports = _delete;
  });

  // table/cascadeDelete.js
  var require_cascadeDelete = __commonJS((exports, module) => {
    var _delete = require_delete2();
    var newObject = require_newObject();
    var newCascadeDeleteStrategy = require_newCascadeDeleteStrategy();
    function cascadeDelete(table, filter) {
      var empty = newObject();
      var strategy = newCascadeDeleteStrategy(empty, table);
      return _delete(table, filter, strategy);
    }
    module.exports = cascadeDelete;
  });

  // table/readStream/mySql/query/singleQuery/newShallowColumnSql.js
  var require_newShallowColumnSql3 = __commonJS((exports, module) => {
    var util = require_util2();
    function _new(table, alias) {
      var columnFormat = "'%s',%s.%s";
      var columns = table._columns;
      var sql = "";
      var separator = "";
      for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        if (!("serializable" in column && !column.serializable))
          sql = sql + separator + util.format(columnFormat, column.alias, alias, column._dbName);
        separator = ",";
      }
      return sql;
    }
    module.exports = _new;
  });

  // table/readStream/mySql/query/newSingleQuery.js
  var require_newSingleQuery3 = __commonJS((exports, module) => {
    var newColumnSql = require_newShallowColumnSql3();
    var newWhereSql = require_newWhereSql();
    var template = "select json_object(%s%s) as result from %s %s%s%s%s";
    var util = require_util2();
    function _new(table, filter, alias, subQueries, orderBy, limit) {
      var c = {};
      c.sql = function() {
        var name = table._dbName;
        var columnSql = newColumnSql(table, alias);
        var whereSql = newWhereSql(table, filter, alias);
        return util.format(template, columnSql, subQueries, name, alias, whereSql, orderBy, limit);
      };
      c.parameters = filter.parameters;
      return c;
    }
    module.exports = _new;
  });

  // table/readStream/mySql/query/newSubQueries/newSingleQueryCore.js
  var require_newSingleQueryCore = __commonJS((exports, module) => {
    var newColumnSql = require_newShallowColumnSql3();
    var template = "json_object(%s%s)";
    var util = require_util2();
    function _new(table, alias, subQueries) {
      var c = {};
      c.sql = function() {
        var columnSql = newColumnSql(table, alias);
        return util.format(template, columnSql, subQueries);
      };
      c.parameters = [];
      return c;
    }
    module.exports = _new;
  });

  // table/readStream/mySql/query/newSubQueries/newQueryCore.js
  var require_newQueryCore2 = __commonJS((exports, module) => {
    var newSingleQuery = require_newSingleQueryCore();
    var newSubQueries = require_newSubQueries2();
    function newQueryCore(table, span, alias) {
      var subQueries = newSubQueries(table, span, alias);
      return newSingleQuery(table, alias, subQueries);
    }
    module.exports = newQueryCore;
  });

  // table/readStream/mySql/query/newSubQueries/joinLegToQuery.js
  var require_joinLegToQuery2 = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    var newQuery = require_newQueryCore2();
    var util = require_util2();
    function joinLegToQuery(parentAlias, leg, legNo) {
      var childAlias = parentAlias + "_" + legNo;
      var span = leg.span;
      var childTable = span.table;
      var parentTable = leg.table;
      var childColumns = span.table._primaryColumns;
      var parentColumns = leg.columns;
      var shallowJoin = newShallowJoinSql(parentTable, childColumns, parentColumns, childAlias, parentAlias);
      var query = newQuery(childTable, span, childAlias);
      return util.format(",'%s',(select %s from %s %s where %s)", leg.name, query.sql(), childTable._dbName, childAlias, shallowJoin);
    }
    module.exports = joinLegToQuery;
  });

  // table/readStream/mySql/query/newSubQueries/oneLegToQuery.js
  var require_oneLegToQuery2 = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    var newQuery = require_newQueryCore2();
    var extractOrderBy = require_extractOrderBy();
    var util = require_util2();
    function manyLegToQuery(rightAlias, leg, legNo) {
      var leftAlias = rightAlias + "_" + legNo;
      var span = leg.span;
      var rightTable = leg.table;
      var rightColumns = rightTable._primaryColumns;
      var leftColumns = leg.columns;
      var orderBy = extractOrderBy(rightTable, rightAlias);
      var shallowJoin = newShallowJoinSql(rightTable, leftColumns, rightColumns, leftAlias, rightAlias);
      var query = newQuery(span.table, span, leftAlias);
      return util.format(",'%s',(select %s from %s %s where %s%s LIMIT 1)", leg.name, query.sql(), span.table._dbName, leftAlias, shallowJoin, orderBy);
    }
    module.exports = manyLegToQuery;
  });

  // table/readStream/mySql/query/newSubQueries/manyLegToQuery.js
  var require_manyLegToQuery2 = __commonJS((exports, module) => {
    var newShallowJoinSql = require_newShallowJoinSqlCore();
    var extractOrderBy = require_extractOrderBy2();
    var newQuery = require_newQueryCore2();
    var util = require_util2();
    function manyLegToQuery(rightAlias, leg, legNo) {
      var leftAlias = rightAlias + "_" + legNo;
      var span = leg.span;
      var rightTable = leg.table;
      var rightColumns = rightTable._primaryColumns;
      var leftColumns = leg.columns;
      var orderBy = extractOrderBy(leftAlias, span);
      var shallowJoin = newShallowJoinSql(rightTable, leftColumns, rightColumns, leftAlias, rightAlias);
      var query = newQuery(span.table, span, leftAlias);
      return util.format(",'%s',(select cast(concat('[',ifnull(group_concat(%s%s),''),']') as json) from %s %s where %s)", leg.name, query.sql(), orderBy, span.table._dbName, leftAlias, shallowJoin);
    }
    module.exports = manyLegToQuery;
  });

  // table/readStream/mySql/query/newSubQueries.js
  var require_newSubQueries2 = __commonJS((exports, module) => {
    var joinLegToQuery = _joinLegToQuery;
    var oneLegToQuery = _oneLegToQuery;
    var manyLegToQuery = _manyLegToQuery;
    function newSubQueries(table, span, alias) {
      var result = [];
      var c = {};
      var _legNo;
      c.visitJoin = function(leg) {
        result.push(joinLegToQuery(alias, leg, _legNo));
      };
      c.visitOne = function(leg) {
        result.push(oneLegToQuery(alias, leg, _legNo));
      };
      c.visitMany = function(leg) {
        result.push(manyLegToQuery(alias, leg, _legNo));
      };
      span.legs.forEach(onEachLeg);
      function onEachLeg(leg, legNo) {
        _legNo = legNo;
        leg.accept(c);
      }
      return result.join("");
    }
    function _joinLegToQuery() {
      joinLegToQuery = require_joinLegToQuery2();
      return joinLegToQuery.apply(null, arguments);
    }
    function _oneLegToQuery() {
      oneLegToQuery = require_oneLegToQuery2();
      return oneLegToQuery.apply(null, arguments);
    }
    function _manyLegToQuery() {
      manyLegToQuery = require_manyLegToQuery2();
      return manyLegToQuery.apply(null, arguments);
    }
    module.exports = newSubQueries;
  });

  // table/readStream/mySql/newQuery.js
  var require_newQuery4 = __commonJS((exports, module) => {
    var newSingleQuery = require_newSingleQuery3();
    var newSubQueries = require_newSubQueries2();
    var extractFilter = require_extractFilter();
    var extractOrderBy = require_extractOrderBy2();
    var extractLimit = require_extractLimit2();
    function newQuery(table, filter, span, alias) {
      filter = extractFilter(filter);
      var orderBy = extractOrderBy(alias, span);
      var limit = extractLimit(span);
      var subQueries = newSubQueries(table, span, alias);
      return newSingleQuery(table, filter, alias, subQueries, orderBy, limit);
    }
    module.exports = newQuery;
  });

  // table/readStream/pg/newQuery.js
  var require_newQuery5 = __commonJS((exports, module) => {
    var newQueryCore = require_newQueryCore();
    function newQuery() {
      var query = newQueryCore.apply(null, arguments);
      return query.prepend("select row_to_json(r)::text as result from (").append(") r");
    }
    module.exports = newQuery;
  });

  // table/readStream/newQuery.js
  var require_newQuery6 = __commonJS((exports, module) => {
    var newMySqlQuery = require_newQuery4();
    var newPgQuery = require_newQuery5();
    function newQuery(db) {
      var c = {};
      var _newQuery;
      c.visitPg = function() {
        _newQuery = newPgQuery;
      };
      c.visitMySql = function() {
        _newQuery = newMySqlQuery;
      };
      c.visitSqlite = function() {
        throw new Error("Sqlite not supported");
      };
      db.accept(c);
      var args = [];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      return _newQuery.apply(null, args);
    }
    module.exports = newQuery;
  });

  // table/readStream/newQueryStream.js
  var require_newQueryStream = __commonJS((exports, module) => {
    var getSessionSingleton = require_getSessionSingleton();
    function newQueryStream(query, options) {
      var dbClient = getSessionSingleton("dbClient");
      return dbClient.streamQuery(query, options);
    }
    module.exports = newQueryStream;
  });

  // table/createReadStreamCoreNative.js
  var require_createReadStreamCoreNative = __commonJS((exports, module) => {
    var newQuery = require_newQuery6();
    var strategyToSpan = require_strategyToSpan();
    var negotiateRawSqlFilter = require_negotiateRawSqlFilter();
    var newQueryStream = require_newQueryStream();
    function createReadStreamCoreNative(table, db, filter, strategy, transformer, streamOptions) {
      var alias = table._dbName;
      filter = negotiateRawSqlFilter(filter);
      var span = strategyToSpan(table, strategy);
      if (process.domain)
        process.domain.add(transformer);
      db.transaction(async () => {
        await start();
      }).then(null, onError);
      function start() {
        return new Promise((resolve, reject) => {
          var query = newQuery(db, table, filter, span, alias);
          var queryStream = newQueryStream(query, streamOptions);
          queryStream.on("end", resolve);
          queryStream.on("error", onStreamError);
          queryStream.pipe(transformer);
          function onStreamError(e) {
            reject(e);
          }
        });
      }
      function onError(e) {
        transformer.emit("error", e);
      }
      return transformer;
    }
    module.exports = createReadStreamCoreNative;
  });

  // (disabled):stream
  var require_stream = __commonJS(() => {
  });

  // table/createReadStreamNative.js
  var require_createReadStreamNative = __commonJS((exports, module) => {
    var createReadStreamCore = require_createReadStreamCoreNative();
    var Stream = require_stream();
    function createReadStreamNative(table, db, filter, strategy, streamOptions) {
      var transformer = Stream.Transform({objectMode: true});
      transformer._transform = function(chunk, _enc, cb) {
        var row = JSON.parse(chunk.result);
        transformer.push(row);
        cb();
      };
      return createReadStreamCore(table, db, filter, strategy, transformer, streamOptions);
    }
    module.exports = createReadStreamNative;
  });

  // table/cloneStrategy.js
  var require_cloneStrategy = __commonJS((exports, module) => {
    function cloneStrategy(strategy, target) {
      target = target || {};
      for (var name in strategy) {
        target[name] = mapChild(strategy[name]);
      }
      return target;
    }
    function mapChild(strategy) {
      if (strategy instanceof Array)
        return cloneStrategy(strategy, []);
      if (strategy instanceof Object) {
        return cloneStrategy(strategy, {});
      }
      return strategy;
    }
    module.exports = cloneStrategy;
  });

  // table/readStreamDefault/createBatchFilter.js
  var require_createBatchFilter = __commonJS((exports, module) => {
    var emptyFilter = require_emptyFilter();
    function createBatchFilter(table, filter, strategy, lastDto) {
      if (!lastDto) {
        return filter;
      }
      var orderBy = strategy.orderBy;
      for (var i = 0; i < strategy.orderBy.length; i++) {
        var subFilter = createSubFilter(i);
        filter = filter.or(subFilter);
      }
      function createSubFilter(index) {
        var subFilter2 = emptyFilter;
        for (var i2 = 0; i2 < index + 1; i2++) {
          var order = orderBy[i2];
          var elements = order.split(" ");
          var name = elements[0];
          var direction = elements[1] || "asc";
          var value = lastDto[name];
          if (index === i2) {
            if (direction === "asc")
              subFilter2 = subFilter2.and(table[name].greaterThan(value));
            else
              subFilter2 = subFilter2.and(table[name].lessThan(value));
          } else
            subFilter2 = subFilter2.and(table[name].eq(value));
        }
        return subFilter2;
      }
      return filter;
    }
    module.exports = createBatchFilter;
  });

  // table/createReadStreamDefault.js
  var require_createReadStreamDefault = __commonJS((exports, module) => {
    var extractFilter = require_extractFilter();
    var cloneStrategy = require_cloneStrategy();
    var defaultBatchSize = 200;
    var Readable = require_stream().Readable;
    var createBatchFilter = require_createBatchFilter();
    function createReadStream(table, db, filter, strategy, streamOptions) {
      filter = extractFilter(filter);
      var batchFilter;
      strategy = cloneStrategy(strategy);
      calculateOrderBy();
      streamOptions = streamOptions || {};
      var batchSize = streamOptions.batchSize || defaultBatchSize;
      batchSize = (batchSize + 1) / 2 >> 0;
      var maxRows = strategy.limit;
      var currentRowCount = 0;
      var busy;
      var waitingforMore;
      var dtos = [];
      var lastDto;
      var done;
      var stream = Readable({objectMode: true});
      stream._read = function() {
        waitingforMore = true;
        if (!busy) {
          if (dtos.length > 0)
            negotiatePushStream();
          else
            getDtos();
        }
      };
      if (process.domain)
        process.domain.add(stream);
      function getDtos() {
        busy = true;
        return db.transaction(async () => {
          await getBatch().then(onRows).then(onDtos);
        }).then(negotiatePushStream, onError);
      }
      function onRows(rows) {
        return rows.toDto(strategy);
      }
      function onDtos(result) {
        busy = false;
        currentRowCount += result.length;
        lastDto = result[result.length - 1];
        dtos = dtos.concat(result);
        if (currentRowCount >= maxRows || result.length < batchSize) {
          dtos.push(null);
          done = true;
        }
      }
      function negotiatePushStream() {
        if (dtos.length <= batchSize && !done)
          getDtos();
        if (!waitingforMore)
          return;
        waitingforMore = false;
        stream.push(dtos.shift());
      }
      function getBatch() {
        calculateLimit();
        calculateBatchFilter();
        return table.getMany(batchFilter, strategy);
      }
      function calculateLimit() {
        if (maxRows === void 0 || maxRows === null)
          strategy.limit = batchSize;
        else {
          var rowsLeft = maxRows - currentRowCount;
          strategy.limit = Math.min(rowsLeft, batchSize);
        }
      }
      function calculateOrderBy() {
        strategy.orderBy = strategy.orderBy || [];
        if (typeof strategy.orderBy === "string") {
          strategy.orderBy = [strategy.orderBy];
        }
        var primaryColumns = table._primaryColumns;
        for (var i = 0; i < primaryColumns.length; i++) {
          strategy.orderBy.push(primaryColumns[i].alias);
        }
      }
      function calculateBatchFilter() {
        batchFilter = createBatchFilter(table, filter, strategy, lastDto);
      }
      function onError(e) {
        stream.emit("error", e);
      }
      return stream;
    }
    module.exports = createReadStream;
  });

  // table/createReadStream.js
  var require_createReadStream = __commonJS((exports, module) => {
    var createReadStreamNative = require_createReadStreamNative();
    var createReadStreamDefault = require_createReadStreamDefault();
    function createReadStream(table, db, filter, strategy, streamOptions) {
      var create;
      var c = {};
      c.visitPg = function() {
        create = createReadStreamNative;
      };
      c.visitMySql = c.visitPg;
      c.visitSqlite = function() {
        create = createReadStreamDefault;
      };
      db.accept(c);
      return create(table, db, filter, strategy, streamOptions);
    }
    module.exports = createReadStream;
  });

  // table/createJSONReadStreamNative.js
  var require_createJSONReadStreamNative = __commonJS((exports, module) => {
    var createReadStreamCore = require_createReadStreamCoreNative();
    var Stream = require_stream();
    function createJSONReadStream(table, db, filter, strategy, streamOptions) {
      var transformer = Stream.Transform({
        objectMode: true
      });
      var started;
      transformer._transform = function(chunk, enc, cb) {
        if (started)
          transformer.push("," + chunk.result);
        else {
          transformer.push("[");
          transformer.push(chunk.result);
          started = true;
        }
        cb();
      };
      transformer._flush = function(cb) {
        transformer.push("]");
        cb();
      };
      return createReadStreamCore(table, db, filter, strategy, transformer, streamOptions);
    }
    module.exports = createJSONReadStream;
  });

  // table/createJSONReadStreamDefault.js
  var require_createJSONReadStreamDefault = __commonJS((exports, module) => {
    var createReadStreamCore = require_createReadStreamDefault();
    var Stream = require_stream();
    function createJSONReadStream(table, db, filter, strategy, streamOptions) {
      var transformer = Stream.Transform({objectMode: true});
      var started;
      transformer._transform = function(obj, enc, cb) {
        var data = JSON.stringify(obj);
        if (started)
          transformer.push("," + data);
        else {
          transformer.push("[");
          transformer.push(data);
          started = true;
        }
        cb();
      };
      transformer._flush = function(cb) {
        transformer.push("]");
        cb();
      };
      var objectStream = createReadStreamCore(table, db, filter, strategy, streamOptions);
      objectStream.on("error", onError);
      return objectStream.pipe(transformer);
      function onError(e) {
        transformer.emit("error", e);
      }
    }
    module.exports = createJSONReadStream;
  });

  // table/createJSONReadStream.js
  var require_createJSONReadStream = __commonJS((exports, module) => {
    var createJSONReadStreamNative = require_createJSONReadStreamNative();
    var createJSONReadStreamDefault = require_createJSONReadStreamDefault();
    function createJSONReadStream(table, db, filter, strategy, streamOptions) {
      var create;
      var c = {};
      c.visitPg = function() {
        create = createJSONReadStreamNative;
      };
      c.visitMySql = c.visitPg;
      c.visitSqlite = function() {
        create = createJSONReadStreamDefault;
      };
      db.accept(c);
      return create(table, db, filter, strategy, streamOptions);
    }
    module.exports = createJSONReadStream;
  });

  // table.js
  var require_table = __commonJS((exports, module) => {
    var newColumn = require_newColumn();
    var column = require_column();
    var join = require_join();
    var hasMany = require_hasMany();
    var hasOne = require_hasOne();
    var getMany = require_getMany();
    var getManyDto = require_getManyDto();
    var getById = require_getById();
    var tryGetById = require_tryGetById();
    var tryGetFirst = require_tryGetFirstFromDb();
    var newCache = require_newRowCache();
    var newContext = require_newObject();
    var insert = require_insert();
    var _delete = require_delete2();
    var cascadeDelete = require_cascadeDelete();
    var createReadStream = require_createReadStream();
    var createJSONReadStream = require_createJSONReadStream();
    var extractStrategy = require_extractStrategy();
    var patchTable = require_patchTable();
    var newEmitEvent = require_emitEvent();
    function _new(tableName) {
      var table = newContext();
      table._dbName = tableName;
      table._primaryColumns = [];
      table._columns = [];
      table._columnDiscriminators = [];
      table._formulaDiscriminators = [];
      table._relations = {};
      table._cache = newCache(table);
      table._emitChanged = newEmitEvent();
      table.primaryColumn = function(columnName) {
        var columnDef = newColumn(table, columnName);
        table._primaryColumns.push(columnDef);
        return column(columnDef, table);
      };
      table.column = function(columnName) {
        var columnDef = newColumn(table, columnName);
        return column(columnDef, table);
      };
      table.join = function(relatedTable) {
        return join(table, relatedTable);
      };
      table.hasMany = function(joinRelation) {
        return hasMany(joinRelation);
      };
      table.hasOne = function(joinRelation) {
        return hasOne(joinRelation);
      };
      table.getMany = function(filter, strategy) {
        return Promise.resolve().then(() => getMany(table, filter, strategy));
      };
      table.getManyDto = function(filter, strategy) {
        if (arguments.length < 2)
          strategy = extractStrategy(table);
        return Promise.resolve().then(() => getManyDto(table, filter, strategy));
      };
      table.getMany.exclusive = function(filter, strategy) {
        return Promise.resolve().then(() => getMany.exclusive(table, filter, strategy));
      };
      table.tryGetFirst = function() {
        return callAsync(tryGetFirst, arguments);
      };
      table.tryGetFirst.exclusive = function() {
        return callAsync(tryGetFirst.exclusive, arguments);
      };
      function callAsync(func, args) {
        return Promise.resolve().then(() => call(func, args));
      }
      function call(func, args) {
        var mergedArgs = [table];
        for (var i = 0; i < args.length; i++) {
          mergedArgs.push(args[i]);
        }
        return func.apply(null, mergedArgs);
      }
      table.getById = function() {
        return callAsync(getById, arguments);
      };
      table.getById.exclusive = function() {
        return callAsync(getById.exclusive, arguments);
      };
      table.tryGetById = function() {
        return callAsync(tryGetById, arguments);
      };
      table.tryGetById.exclusive = function() {
        return callAsync(tryGetById.exclusive, arguments);
      };
      table.columnDiscriminators = function() {
        for (var i = 0; i < arguments.length; i++) {
          table._columnDiscriminators.push(arguments[i]);
        }
        return table;
      };
      table.formulaDiscriminators = function() {
        for (var i = 0; i < arguments.length; i++) {
          table._formulaDiscriminators.push(arguments[i]);
        }
        return table;
      };
      table.insert = function() {
        return call(insert, arguments);
      };
      table.delete = _delete.bind(null, table);
      table.cascadeDelete = cascadeDelete.bind(null, table);
      table.createReadStream = createReadStream.bind(null, table);
      table.createJSONReadStream = createJSONReadStream.bind(null, table);
      table.exclusive = function() {
        table._exclusive = true;
        return table;
      };
      table.patch = patchTable.bind(null, table);
      table.subscribeChanged = table._emitChanged.add;
      table.unsubscribeChanged = table._emitChanged.remove;
      return table;
    }
    module.exports = _new;
  });

  // table/commands/commitCommand.js
  var require_commitCommand = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    var command = newParameterized("COMMIT");
    function empty() {
    }
    command.endEdit = empty;
    command.matches = empty;
    module.exports = command;
  });

  // table/deleteSessionContext.js
  var require_deleteSessionContext = __commonJS((exports, module) => {
    var useHook = require_useHook();
    var cls = require_node_cls();
    function deleteSessionContext() {
      if (useHook()) {
        let context = cls.get("rdb");
        delete context.rdb;
        if (context.exit)
          cls.exit("rdb");
      } else
        delete process.domain.rdb;
    }
    module.exports = deleteSessionContext;
  });

  // table/releaseDbClient.js
  var require_releaseDbClient = __commonJS((exports, module) => {
    var getSessionSingleton = require_getSessionSingleton();
    var deleteSessionContext = require_deleteSessionContext();
    function release() {
      var done = getSessionSingleton("dbClientDone");
      var pool = getSessionSingleton("pool");
      deleteSessionContext();
      if (done)
        done();
      if (pool)
        return pool.end();
    }
    module.exports = release;
  });

  // table/commit.js
  var require_commit = __commonJS((exports, module) => {
    var commitCommand = require_commitCommand();
    var pushCommand = require_pushCommand();
    var executeChanges = require_executeChanges();
    var releaseDbClient = require_releaseDbClient();
    var popChanges = require_popChanges();
    function commit(result) {
      return popAndPushChanges().then(releaseDbClient).then(onReleased);
      function onReleased() {
        return result;
      }
      async function popAndPushChanges() {
        let changes = popChanges();
        while (changes.length > 0) {
          await executeChanges(changes);
          changes = popChanges();
        }
        pushCommand(commitCommand);
        return executeChanges(popChanges());
      }
    }
    module.exports = function(result) {
      return Promise.resolve().then(() => commit(result));
    };
  });

  // table/commands/rollbackCommand.js
  var require_rollbackCommand = __commonJS((exports, module) => {
    var newParameterized = require_newParameterized();
    var command = newParameterized("ROLLBACK");
    function empty() {
    }
    command.endEdit = empty;
    command.matches = empty;
    module.exports = command;
  });

  // table/tryReleaseDbClient.js
  var require_tryReleaseDbClient = __commonJS((exports, module) => {
    var release = require_releaseDbClient();
    function tryReleaseDbClient() {
      try {
        release();
      } catch (e) {
      }
    }
    module.exports = tryReleaseDbClient;
  });

  // table/newThrow.js
  var require_newThrow = __commonJS((exports, module) => {
    var tryReleaseDbClient = require_tryReleaseDbClient();
    function newThrow(e, previousPromise) {
      return previousPromise.then(throwError, throwError);
      function throwError() {
        tryReleaseDbClient();
        throw e;
      }
    }
    module.exports = newThrow;
  });

  // table/rollback.js
  var require_rollback = __commonJS((exports, module) => {
    var rollbackCommand = require_rollbackCommand();
    var executeQuery = require_executeQuery();
    var releaseDbClient = require_releaseDbClient();
    var popChanges = require_popChanges();
    var newThrow = require_newThrow();
    var resultToPromise = require_resultToPromise();
    function rollback(e) {
      var executeRollback = executeQuery.bind(null, rollbackCommand);
      var chain = resultToPromise().then(popChanges).then(executeRollback).then(releaseDbClient);
      if (e)
        return newThrow(e, chain);
      return chain;
    }
    module.exports = function(e) {
      return Promise.resolve().then(() => rollback(e));
    };
  });

  // pools.js
  var require_pools = __commonJS((exports, module) => {
    var pools = require_newObject()();
    Object.defineProperty(pools, "end", {
      enumerable: false,
      value: end
    });
    function end() {
      var all = [];
      for (var poolId in pools) {
        var endPool = pools[poolId].end();
        all.push(endPool);
      }
      return Promise.all(all);
    }
    module.exports = pools;
  });

  // table/log.js
  var require_log = __commonJS((exports, module) => {
    var logger = function() {
    };
    function log() {
      logger.apply(null, arguments);
    }
    log.registerLogger = function(cb) {
      logger = cb;
    };
    module.exports = log;
  });

  // query/negotiateSql.js
  var require_negotiateSql = __commonJS((exports, module) => {
    function negotiateSql(query) {
      if (typeof query === "string")
        return function() {
          return query;
        };
      var sql = query.sql;
      if (typeof sql === "function")
        return sql;
      else if (typeof sql === "string")
        return function() {
          return sql;
        };
      else
        throw new Error("Query lacks sql property string or function");
    }
    module.exports = negotiateSql;
  });

  // query/negotiateParameters.js
  var require_negotiateParameters = __commonJS((exports, module) => {
    function negotiateParameters(parameters) {
      if (parameters === void 0)
        return [];
      else if (parameters.length !== void 0)
        return parameters;
      else
        throw new Error("Query has invalid parameters property. Must be undefined or array");
    }
    module.exports = negotiateParameters;
  });

  // query/wrapQuery.js
  var require_wrapQuery = __commonJS((exports, module) => {
    var negotiateSql = require_negotiateSql();
    var negotiateParameters = require_negotiateParameters();
    function wrapQuery(query) {
      var safeSql = negotiateSql(query);
      var safeParameters = negotiateParameters(query.parameters);
      let obj = {
        sql: safeSql,
        parameters: safeParameters
      };
      if (query.types)
        obj.types = query.types;
      return obj;
    }
    module.exports = wrapQuery;
  });

  // query.js
  var require_query = __commonJS((exports, module) => {
    var executeQueries = require_executeQueries();
    var wrapQuery = require_wrapQuery();
    function doQuery(query) {
      var wrappedQuery = wrapQuery(query);
      return executeQueries([wrappedQuery]).then(unwrapResult);
    }
    function unwrapResult(results) {
      return results[0];
    }
    module.exports = doQuery;
  });

  // lock/toIntKey.js
  var require_toIntKey = __commonJS((exports, module) => {
    function toIntKey(key) {
      if (isInteger())
        return key;
      if (isIntegerString())
        return trim(key);
      var intKey = "";
      for (var i = 0; i < key.length; ++i) {
        var value = key[i].toUpperCase();
        value = parseInt(value, 16);
        if (!isNaN(value))
          intKey += value;
      }
      return trim(intKey);
      function isIntegerString() {
        var pattern = /^-?\d+\.?\d*$/;
        var reg = new RegExp(pattern);
        return typeof key === "string" && reg.test(key);
      }
      function isInteger() {
        return typeof key === "number" && Math.floor(key) === key;
      }
      function trim(value2) {
        var maxBigInt = "9223372036854775807";
        value2 = value2.substring(0, 19);
        if (value2 > maxBigInt)
          return value2.substring(0, 18);
        return value2;
      }
    }
    module.exports = toIntKey;
  });

  // lock.js
  var require_lock = __commonJS((exports, module) => {
    var query = require_query();
    var toIntKey = require_toIntKey();
    function lock(key, func) {
      key = toIntKey(key);
      if (typeof func === "function") {
        return inLock(key, func);
      } else {
        var sql = "SELECT pg_advisory_xact_lock(" + key + ")";
        return query(sql);
      }
    }
    async function inLock(key, func) {
      await query("SELECT pg_advisory_lock(" + key + ")");
      try {
        let result = await func();
        await query("SELECT pg_advisory_unlock(" + key + ")");
        return result;
      } catch (e) {
        await query("SELECT pg_advisory_unlock(" + key + ")");
        throw e;
      }
    }
    module.exports = lock;
  });

  // pg/schema.js
  var require_schema = __commonJS((exports, module) => {
    var query = require_query();
    function executeSchema(schema) {
      if (!schema)
        throw new Error("Missing schema");
      if (!Array.isArray(schema))
        schema = [schema];
      return query("SET LOCAL search_path TO " + schema.join(","));
    }
    module.exports = executeSchema;
  });

  // (disabled):sqlite/newDatabase
  var require_newDatabase4 = __commonJS(() => {
  });

  // index.js
  var require_rdb = __commonJS((exports, module) => {
    var newPg = require_newDatabase();
    var hostExpress = require_hostExpress();
    var _sqlite;
    var flags = require_flags();
    var connectViaPool = function(connectionString) {
      if (connectionString.indexOf && connectionString.indexOf("mysql") === 0)
        return connectViaPool.mySql.apply(null, arguments);
      if (connectionString.indexOf && connectionString.indexOf("postgres") === 0)
        return newPg.apply(null, arguments);
      else
        return connectViaPool.http.apply(null, arguments);
    };
    connectViaPool.pg = newPg;
    connectViaPool.mySql = require_newDatabase2();
    connectViaPool.http = require_newDatabase3();
    connectViaPool.table = require_table();
    connectViaPool.filter = require_emptyFilter();
    connectViaPool.commit = require_commit();
    connectViaPool.rollback = require_rollback();
    connectViaPool.end = require_pools().end;
    connectViaPool.log = require_log().registerLogger;
    connectViaPool.query = require_query();
    connectViaPool.lock = require_lock();
    connectViaPool.schema = require_schema();
    Object.defineProperty(connectViaPool, "sqlite", {
      get: function() {
        if (!_sqlite)
          _sqlite = require_newDatabase4();
        return _sqlite;
      }
    });
    connectViaPool.express = hostExpress;
    connectViaPool.useHook = function(bool) {
      flags.useHook = bool;
    };
    module.exports = connectViaPool;
  });
  require_rdb();
})();
