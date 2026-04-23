import { Client } from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8080/ws/websocket';

// Exponential backoff delays: 2s → 4s → 8s → 16s → 30s
const RECONNECT_DELAYS = [2000, 4000, 8000, 16000, 30000];

let stompClient       = null;
let reconnectAttempt  = 0;
let reconnectTimer    = null;
let onMessageCallback = null;
let currentToken      = null;

/**
 * Kết nối WebSocket với JWT token.
 * Dùng native WebSocket (không cần SockJS) — tương thích Vite ESM.
 *
 * @param {string}   token     - JWT access token
 * @param {function} onMessage - callback(notification)
 */
export const connect = (token, onMessage) => {
  if (stompClient?.active) disconnect();
  currentToken      = token;
  onMessageCallback = onMessage;
  _createAndConnect();
};

const _createAndConnect = () => {
  stompClient = new Client({
    brokerURL: `${WS_URL}`,

    // Gắn JWT vào header STOMP CONNECT frame
    connectHeaders: {
      Authorization: `Bearer ${currentToken}`,
    },

    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: 0, // Ta tự quản lý reconnect

    debug: (msg) => {
      if (import.meta.env.DEV) console.debug('[STOMP]', msg);
    },

    onConnect: () => {
      reconnectAttempt = 0;
      console.log('[WS] Connected ✓');

      stompClient.subscribe('/user/queue/notifications', (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (onMessageCallback) onMessageCallback(payload);
        } catch (e) {
          console.error('[WS] Parse error', e);
        }
      });
    },

    onStompError: (frame) => {
      console.error('[WS] STOMP error', frame.headers?.message);
    },

    onWebSocketClose: () => {
      console.warn('[WS] WebSocket closed — scheduling reconnect');
      _scheduleReconnect();
    },

    onDisconnect: () => {
      console.log('[WS] Disconnected');
    },
  });

  stompClient.activate();
};

const _scheduleReconnect = () => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (!currentToken) return;

  const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
  reconnectAttempt++;
  console.log(`[WS] Reconnect in ${delay / 1000}s (attempt ${reconnectAttempt})`);
  reconnectTimer = setTimeout(() => {
    if (currentToken) _createAndConnect();
  }, delay);
};

export const disconnect = () => {
  currentToken      = null;
  onMessageCallback = null;
  reconnectAttempt  = 0;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (stompClient?.active) stompClient.deactivate();
  stompClient = null;
  console.log('[WS] Disconnected by user');
};

export const isConnected = () => stompClient?.active ?? false;

const websocketService = { connect, disconnect, isConnected };
export default websocketService;
