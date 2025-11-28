import React, { useState, useEffect } from 'react';
import { Button, GroupBox } from 'react95';

import { useTables } from '../../contexts/Tables';
import styled from 'styled-components';
import { SearchForm } from './SearchForm';
import { useApi } from '../../utils/useApi';
import { InnerPanel } from '../../components/InnerPanel';
import { escapeFieldName, escapeValue } from '../../utils/query';
import { BrowseResults } from '../BrowseTab/BrowseResults';
import { useUrlParam } from '../../utils/useUrlParam';
import { Edit } from '../BrowseTab/Edit';
import { Space } from '../../components/Space';
import { BottomContent } from '../../components/BottomContent';
import { makeDelete } from '../../utils/query';

const FlexRow = styled.div`
  display: flex;
  align-items: center;
`;

const FlexColumn = styled.div`
  margin-right: 8px;
  display: flex;
`;

export function SearchTab() {
  const [rowid, setRowid] = useUrlParam('rowid');
  const { currentTable, refresh } = useTables();
  const { executeQuery } = useApi();
  const [searchCriteria, setSearchCriteria] = useState({});
  const [results, setResults] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [orderByDirection, setOrderByDirection] = useState(true);
  const [selected, setSelected] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Génère la clause WHERE basée sur les critères de recherche
  const buildWhereClause = () => {
    const conditions = Object.entries(searchCriteria)
      .filter(
        ([, fieldCriteria]) =>
          fieldCriteria.operator && fieldCriteria.operator !== ''
      )
      .map(([fieldName, fieldCriteria]) => {
        const escapedFieldName = escapeFieldName(fieldName);

        // Opérateurs qui ne nécessitent pas de valeur
        if (
          fieldCriteria.operator === 'IS NULL' ||
          fieldCriteria.operator === 'IS NOT NULL'
        ) {
          return `${escapedFieldName} ${fieldCriteria.operator}`;
        }

        return `${escapedFieldName} ${fieldCriteria.operator} ${escapeValue(
          fieldCriteria.value
        )}`;
      })
      .filter((condition) => condition !== '');

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  };

  const whereClause = buildWhereClause();
  const orderCommand = orderBy
    ? `ORDER BY \`${orderBy}\` ${orderByDirection ? 'ASC' : 'DESC'}`
    : '';

  const query = `SELECT rowid, * FROM \`${currentTable.name}\` ${whereClause} ${orderCommand} LIMIT 100;`;

  // Réexécuter la recherche quand l'ordre change
  useEffect(() => {
    if (hasSearched && orderBy) {
      executeSearch();
    }
  }, [orderBy, orderByDirection]);

  const executeSearch = async () => {
    const data = await executeQuery(query);
    setResults(data || []);
    setHasSearched(true);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    executeSearch();
  };

  const changeOrderBy = (field) => {
    field === orderBy && setOrderByDirection(!orderByDirection);
    setOrderBy(field);
  };

  const deleteSelected = async () => {
    const rows = selected.map((index) => results[index]);
    setSelected([]);

    for (const row of rows) {
      const sql = makeDelete(currentTable.name, row);
      await executeQuery(sql);
    }

    executeSearch();
    refresh();
  };

  if (rowid) {
    return <Edit />;
  }

  return (
    <>
      <form onSubmit={onSubmit} style={{ padding: 0, margin: 0 }}>
        <GroupBox label={`Search into ${currentTable.name}`}>
          <SearchForm criteria={searchCriteria} onChange={setSearchCriteria} />
        </GroupBox>

        <Space vertical size={0.5} />

        <InnerPanel>{query}</InnerPanel>

        <Space vertical size={0.5} />

        <FlexRow>
          <FlexColumn>
            <Button type="submit">Search</Button>
            <Button
              onClick={deleteSelected}
              disabled={!selected.length}
              style={{ width: 150, marginLeft: 8 }}
            >
              Delete selected ({selected.length})
            </Button>
          </FlexColumn>
          {hasSearched && <InnerPanel>{results.length} results</InnerPanel>}
        </FlexRow>
      </form>

      {results.length > 0 && (
        <BottomContent>
          <BrowseResults
            data={results}
            orderBy={orderBy}
            changeOrderBy={changeOrderBy}
            selectEditingRow={setRowid}
            selected={selected}
            setSelected={setSelected}
          />
        </BottomContent>
      )}
    </>
  );
}
