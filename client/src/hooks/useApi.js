import { useAuth } from '../context/AuthContext';

export const useApi = () => {
  const { token } = useAuth();

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const get = (url) =>
    fetch(url, { headers: authHeaders() }).then(r => r.json());

  const post = (url, body) =>
    fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(r => r.json());

  return { get, post };
};
