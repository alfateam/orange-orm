function act(c) {
    c.key = 'foo466bar-1223-ffdfd fd dfadfdf df134234 v3 34334 3 13232';
    c.expected = '1546611101223151513'; //15131310131513151315134234334334313232
    c.returned = c.sut(c.key);

    // 9223372036854775807
}

module.exports = act;
