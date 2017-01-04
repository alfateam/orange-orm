function act(c) {
    c.key = '9223372036854775808';
    c.expected = '922337203685477580';
    c.returned = c.sut(c.key);
}

module.exports = act;
