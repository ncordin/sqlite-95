import React, { useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableHeadCell,
  TableBody,
  TableDataCell,
  Checkbox,
  Anchor,
} from 'react95';
import styled from 'styled-components';

import { BoldIf } from '../../components/BoldIf';
import { Null } from '../../components/Null';
import { ContentModal } from '../../components/ContentModal';

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CellContent = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  opacity: 0.7;
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`;

const MAX_CELL_LENGTH = 50;

function isTruncated(value) {
  if (value === null || value === undefined) return false;
  return String(value).length > MAX_CELL_LENGTH;
}

export function BrowseResults({
  data,
  orderBy,
  changeOrderBy,
  selectEditingRow,
  selected,
  setSelected,
}) {
  const [modalContent, setModalContent] = useState(null);
  const headers = data[0] ? Object.keys(data[0]) : [];
  const headersWithoutRowid = headers.filter((header) => header !== 'rowid');
  const rows = Array.isArray(data) ? data : [];

  const changeSelection = (isSelected, index) => {
    if (isSelected) {
      setSelected([...selected, index]);
    } else {
      setSelected(selected.filter((value) => value !== index));
    }
  };

  const openModal = (columnName, content) => {
    setModalContent({ columnName, content });
  };

  const closeModal = () => {
    setModalContent(null);
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <>
      {modalContent && (
        <ContentModal title={modalContent.columnName} onClose={closeModal}>
          {modalContent.content}
        </ContentModal>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell></TableHeadCell>
            <TableHeadCell></TableHeadCell>
            {headers
              .filter((header) => header !== 'rowid')
              .map((header) => (
                <TableHeadCell
                  key={header}
                  onClick={() => changeOrderBy(header)}
                  style={{ cursor: 'pointer' }}
                >
                  <BoldIf condition={orderBy === header}>{header}</BoldIf>
                </TableHeadCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const values = Object.entries(row)
              .filter(([key]) => key !== 'rowid')
              .map(([, value]) => value);

            return (
              <TableRow key={index}>
                <TableDataCell style={{ width: 40 }}>
                  <Checkbox
                    checked={selected.includes(index)}
                    onChange={(event) =>
                      changeSelection(event.target.checked, index)
                    }
                  />
                </TableDataCell>
                <TableDataCell style={{ width: 40 }}>
                  <Anchor
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectEditingRow(row.rowid)}
                  >
                    edit
                  </Anchor>
                </TableDataCell>

                {values.map((value, valuesIndex) => {
                  const columnName = headersWithoutRowid[valuesIndex];
                  const shouldShowExpand = isTruncated(value);

                  return (
                    <TableDataCell
                      key={`${index}-${valuesIndex}`}
                      style={{
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {value === null ? (
                        <Null />
                      ) : (
                        <CellContainer>
                          <CellContent>{value}</CellContent>
                          {shouldShowExpand && (
                            <ExpandButton
                              onClick={() => openModal(columnName, value)}
                            >
                              🔍
                            </ExpandButton>
                          )}
                        </CellContainer>
                      )}
                    </TableDataCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
