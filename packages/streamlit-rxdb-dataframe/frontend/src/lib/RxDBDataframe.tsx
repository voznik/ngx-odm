/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RxCollectionExtended as RxCollection } from '@ngx-odm/rxdb/config';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import React, { Fragment, ReactNode, useEffect } from 'react';
import {
  ArrowTable,
  ComponentProps,
  Streamlit,
  withStreamlitConnection,
} from 'streamlit-component-lib';
import * as Database from './Database';
import { Subscription } from 'rxjs';
import type { RxCollection as _RxCollection, RxDatabase } from 'rxdb';
import { Todo } from '@shared';

const { logger, range } = NgxRxdbUtils;

interface TableProps {
  element: ArrowTable;
}

class Table extends React.PureComponent<TableProps> {
  subs: Subscription[] = [];
  collection!: RxCollection<Todo>;

  public returnDataframe = (): void => {
    // NOTE: Returning Styler data is not supported,
    // so it won't be included in the returned dataframe.
    Streamlit.setComponentValue(this.props.element);
  };

  async componentDidMount() {
    const db: RxDatabase<any> = await Database.get();
    this.collection = db.collections['todo'];
    const meta = await this.collection.getMetadata();
    logger.log('meta', meta);
  }

  componentWillUnmount() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  public render = (): ReactNode => {
    logger.log(this.props.element);

    const table = this.props.element;
    const hasHeader = table.headerRows > 0;
    const hasData = table.dataRows > 0;
    const id = table.uuid ? 'T_' + table.uuid : undefined;
    const classNames = 'table table-bordered' + (hasData ? undefined : 'empty-table');
    const caption = table.caption ? <caption>{table.caption}</caption> : null;

    return (
      <>
        <div className="streamlit-table stTable">
          <style>{table.styles}</style>
          <table id={id} className={classNames}>
            {caption}
            {hasHeader && (
              <thead>
                <TableRows isHeader={true} table={table} />
              </thead>
            )}
            <tbody>
              {hasData ? (
                <TableRows isHeader={false} table={table} />
              ) : (
                <tr>
                  <td colSpan={table.columns || 1}>empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="btn btn-primary" onClick={this.returnDataframe}>
          Return dataframe
        </button>
      </>
    );
  };
}

/**
 * Purely functional component returning a list of rows.
 *
 * isHeader     - Whether to display the header.
 * table        - The table to display.
 */

interface TableRowsProps {
  isHeader: boolean;
  table: ArrowTable;
}

const TableRows: React.FC<TableRowsProps> = props => {
  const { isHeader, table } = props;
  const { headerRows, rows } = table;
  const startRow = isHeader ? 0 : headerRows;
  const endRow = isHeader ? headerRows : rows;

  const tableRows = range(startRow, endRow).map(rowIndex => (
    <tr key={rowIndex}>
      <TableRow rowIndex={rowIndex} table={table} />
    </tr>
  ));

  return <Fragment>{tableRows}</Fragment>;
};

/**
 * Purely functional component returning a list entries for a row.
 *
 * rowIndex - The row index.
 * table    - The table to display.
 */

interface TableRowProps {
  rowIndex: number;
  table: ArrowTable;
}

const TableRow: React.FC<TableRowProps> = props => {
  const { rowIndex, table } = props;
  const { columns } = table;

  const cells = range(0, columns).map(columnIndex => {
    const { classNames, content, id, type } = table.getCell(rowIndex, columnIndex);

    // Format the content if needed
    const formattedContent = (content || '').toString();

    switch (type) {
      case 'blank': {
        return <th key={columnIndex} className={classNames} />;
      }
      case 'index': {
        return (
          <th key={columnIndex} scope="row" className={classNames}>
            {formattedContent}
          </th>
        );
      }
      case 'columns': {
        return (
          <th key={columnIndex} scope="col" id={id} className={classNames}>
            {formattedContent}
          </th>
        );
      }
      case 'data': {
        return (
          <td key={columnIndex} id={id} className={classNames}>
            {formattedContent}
          </td>
        );
      }
      default: {
        throw new Error(`Cannot parse type "${type}".`);
      }
    }
  });

  return <Fragment>{cells}</Fragment>;
};

/**
 * Dataframe example using Apache Arrow.
 */
const RxDBDataframe: React.FC<ComponentProps> = props => {
  useEffect(() => {
    Streamlit.setFrameHeight();
  });

  return <Table element={props.args.data} />;
};

export default withStreamlitConnection(RxDBDataframe);
