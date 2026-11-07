const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

export function apiUrl(path) {
  return `${configuredApiUrl || ''}${path}`;
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
