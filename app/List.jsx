var React = require('react'),
    _ = require('lodash');

var List = React.createClass({
    render: function() {
        var listItems = _.map(this.props.items || [], function(item) {
            return (
                <tr>
                    <td>{item.name}</td>
                    <td>
                        <span className="glyphicon glyphicon-trash pull-right"></span>
                    </td>
                </tr>
            );
        });

        return (
            <table className='table'>
                <thead>
                    <th>Name</th>
                    <th>
                        Actions
                        <span className="glyphicon glyphicon-plus pull-right"></span>
                    </th>
                </thead>
                <tbody>{listItems}</tbody>
            </table>
        );
    }
});

module.exports = List;