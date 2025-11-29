import { useDatabase } from '../contexts/Database';
import { useErrorModal } from '../contexts/ErrorModal';
import { usePassword } from '../contexts/Password';

const BASE_URL = './';

export function fetchSqliteApi({ url, params, password, database = '' }) {
  return fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      Password: password,
      Database: database,
    },
    body: JSON.stringify(params),
  }).then((response) => {
    const type = response.headers.get('Content-Type');

    if (type === 'application/json') {
      return response.json();
    }
    if (type === 'application/octet-stream') {
      return response.blob();
    }

    return response;
  });
}

export function useApi() {
  const { open } = useErrorModal();
  const { database } = useDatabase();
  const { password } = usePassword();

  const fetch = async (url, params) => {
    const response = await fetchSqliteApi({
      url,
      params,
      password,
      database,
    });

    if (response.error) {
      open(
        response.error.title || 'Error!',
        response.error.message ?? JSON.stringify(response.error)
      );
      return Promise.reject();
    }

    return response;
  };

  const executeQuery = async (query, params) => {
    return fetch('api/sql', { query, params });
  };

  const download = async (database) => {
    return fetch('api/download', { database });
  };

  return { fetch, executeQuery, download };
}
