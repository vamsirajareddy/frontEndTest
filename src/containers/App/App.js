import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Cell, Column, ColumnGroup, Table } from 'fixed-data-table';
import '../../../node_modules/fixed-data-table/dist/fixed-data-table.css';
import _ from 'lodash';

const TIME_DURATION = 500;

@connect(
    state => ({rows: state.rows, cols: state.cols || new Array(10)})
)
export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      cols: new Array(10),
        lastUpdated: 0,
    };
      this.previousState = Object.assign({}, this.state);
    this.onSnapshotReceived = this.onSnapshotReceived.bind(this);
      this.onUpdateReceived = this.onUpdateReceived.bind(this);
      this._cell = this._cell.bind(this);
      this._headerCell = this._headerCell.bind(this);
      this._generateCols = this._generateCols.bind(this);
    }

  onSnapshotReceived(data) {
      const now = Date.now();
    let rows = [];
    data.forEach(row => {
     rows[row.id] = row;
    });
    // const rows = this.state.rows.concat(data);
    console.log('snapshot' + rows);
    const cols = Object.keys(rows[0]);
    this.previousState = {rows, cols, lastUpdated: now}
    this.setState({rows, cols, lastUpdated: now});
  //  this.setState({rows, cols});
  };
  onUpdateReceived(data) {
    // const rows = this.state.rows.concat(data);
    const { rows, lastUpdated } = this.state;
    const now = Date.now();
    if (TIME_DURATION < (now - lastUpdated)) {
      const newRows = rows.slice();
      data.forEach(newRow => {
        newRows[newRow.id] = newRow;
      });
      this.previousState = Object.assign({}, this.state);
      this.setState({rows: newRows, lastUpdated: now});
    }
  };
  _cell(cellProps) {
    const { state, previousState } = this;
    const { rowIndex, columnKey } = cellProps;
    const column = state.cols[columnKey];
        const rowData = this.state.rows[rowIndex];
    const col = this.state.cols[cellProps.columnKey];
    const content = rowData[col];
    const previousRowData = previousState.rows[rowIndex];
    const previousContent = previousRowData[column];

    if (previousContent > content) {
      return <Cell style={ {color:'white', backgroundColor:'red', width:'129'} }>{content}</Cell>;
    } else if (previousContent < content) {
      return <Cell style={ {color:'white', backgroundColor:'green', width:'129'} }>{content}</Cell>;
    } else {
      return <Cell>{content}</Cell>;
    }

  }

  _headerCell(cellProps) {
    const col = this.state.cols[cellProps.columnKey];
    return (
      <Cell>{col}</Cell>
    );
  }

  _generateCols() {
    console.log('generating...');
    let cols = [];
    this.state.cols.forEach((row, index) => {
      cols.push(
        <Column
          width={100}
          flexGrow={1}
          cell={this._cell}
          header={this._headerCell}
          columnKey={index}
          />
      );
    });
console.log("Columns",cols)
  return cols;
  };
  componentDidMount() {
    if (socket) {
      socket.on('snapshot', this.onSnapshotReceived);
      socket.on('updates', this.onUpdateReceived);
    }
  };
  componentWillUnmount() {
    if (socket) {
      socket.removeListener('snapshot', this.onSnapshotReceived);
      socket.removeListener('updates', this.onUpdateReceived);
    }
  };

  render() {
    const columns = this._generateCols();
    return (
      <Table
        rowHeight={30}
        width={window.innerWidth}
        maxHeight={window.innerHeight}
        headerHeight={35}
        rowsCount={this.state.rows.length}
        >
        {columns}
      </Table>
    );
  }
}
