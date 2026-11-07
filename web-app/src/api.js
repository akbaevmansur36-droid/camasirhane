const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

export function apiUrl(path) {
  return `${configuredApiUrl || ''}${path}`;
}

// WebSocket is used only with the Express server (local dev or VITE_WS_URL/VITE_API_URL set).
export function shouldUseWebSocket() {
  return Boolean(import.meta.env.VITE_WS_URL || configuredApiUrl || window.location.port === '5173');
}

// fetch wrapper: after a change, ask the app to refresh state immediately (used with polling).
export async function apiFetch(url, init) {
  const response = await fetch(url, init);
  if (init?.method && init.method !== 'GET') {
    window.dispatchEvent(new Event('laundry:changed'));
  }
  return response;
}

export function websocketUrl() {
  const configuredWebSocketUrl = import.meta.env.VITE_WS_URL;
  let url;

  if (configuredWebSocketUrl) {
    url = new URL(configuredWebSocketUrl);
  } else if (configuredApiUrl) {
    url = new URL(configuredApiUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  } else {
    const { hostname, host, port, protocol } = window.location;
    const socketProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    const socketHost = port === '5173' ? `${hostname}:3000` : host;
    url = new URL(`${socketProtocol}//${socketHost}`);
  }

  return url.toString();
}
