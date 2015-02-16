var React = require('react');
var App = require('./app/app.jsx');

var items = [{name: 'egyikcuccc'}, {name: 'masikcucc'}];

React.renderComponent(
    App({
      items: items
    }),
    document.getElementById('content'));
