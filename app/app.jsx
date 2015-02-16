var React = require('react');
var List = require('./List.jsx');

var ShoppingListApp = React.createClass({
  render: function() {
    return (
      <div className='whatever'>
        <h1>Such React! So helloworld and everything!</h1>
        <List items={this.props.items} />
      </div>
    );
  }
});

module.exports = ShoppingListApp;
