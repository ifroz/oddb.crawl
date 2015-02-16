var React = require('react');


var List = React.createClass({
  render: function() {
    var listItems = this.props.items.map(function(item) {
      return <li>{item.name}</li>;
    });

    return (
      <table class='table'>
          <thead>
              <th>Name</th>
          </thead>
          <tbody>{listItems}</tbody>
      </table>
    );
  }
});

var Whatever = React.createClass({
  render: function() {
    console.log(this.props);
    return (
      <div className='whatever'>
        <h1>Such React! So helloworld!</h1>
        <List items={this.props.items} />
      </div>
    );
  }
});

var suchList = [
  {name: 'whatever'},
  {name: 'something else'}
];

React.render(<Whatever items={suchList} />, document.getElementById('content'));
