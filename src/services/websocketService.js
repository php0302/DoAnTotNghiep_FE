import { Client } from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8080/ws';

// Exponential backoff delays: 2s → 4s → 8s → 16s → 30s
const RECONNECT_DELAYS = [2000, 4000, 8000, 16000, 30000];

let stompClient       = null;
let reconnectAttempt  = 0;
let reconnectTimer    = null;
let onMessageCallback = null;  // Callback cho /user/queue/notifications
let currentToken      = null;
let isFirstConnect    = true;  // Phân biệt lần kết nối đầu vs reconnect

// Map lưu subscriptions theo projectId
// { [projectId]: StompSubscription }
const projectSubscriptions = {};

// Callbacks khi reconnect thành công (để refetch data bị miss)
const reconnectCallbacks = new Set();

/**
 * Kết nối WebSocket với JWT token.
 * Dùng native WebSocket (không cần SockJS) — tương thích Vite ESM.
 *
 * @param {string}   token     - JWT access token
 * @param {function} onMessage - callback(notification) cho personal notifications
 */
export const connect = (token, onMessage) => {
  if (stompClient?.active) disconnect();
  currentToken      = token;
  onMessageCallback = onMessage;
  isFirstConnect    = true;
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

      // Subscribe personal notifications
      stompClient.subscribe('/user/queue/notifications', (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (onMessageCallback) onMessageCallback(payload);
        } catch (e) {
          console.error('[WS] Parse error', e);
        }
      });

      // Re-subscribe tất cả project topics (quan trọng khi reconnect)
      Object.entries(projectSubscriptions).forEach(([projectId, sub]) => {
        if (sub?.callback) {
          _subscribeProjectInternal(Number(projectId), sub.callback);
        }
      });

      // Nếu là reconnect (không phải lần kết nối đầu), trigger refetch
      if (!isFirstConnect) {
        console.log('[WS] Reconnected — triggering data sync callbacks');
        reconnectCallbacks.forEach(cb => {
          try { cb(); } catch (e) { /* ignore */ }
        });
      }
      isFirstConnect = false;
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

/** Internal: thực sự gọi stompClient.subscribe */
const _subscribeProjectInternal = (projectId, callback) => {
  const destination = `/topic/project.${projectId}`;
  const subscription = stompClient.subscribe(destination, (message) => {
    try {
      const payload = JSON.parse(message.body);
      callback(payload);
    } catch (e) {
      console.error('[WS] Project message parse error', e);
    }
  });
  projectSubscriptions[projectId] = { subscription, callback };
  console.log(`[WS] Subscribed to ${destination}`);
  return subscription;
};

/**
 * Subscribe theo dõi realtime events của một project.
 * Tự động re-subscribe sau khi reconnect.
 *
 * @param {number}   projectId - ID của project
 * @param {function} callback  - callback(realtimeMessage) nhận WS message
 */
export const subscribeToProject = (projectId, callback) => {
  // Lưu callback để re-subscribe sau reconnect
  projectSubscriptions[projectId] = { callback, subscription: null };

  if (stompClient?.active && stompClient?.connected) {
    _subscribeProjectInternal(projectId, callback);
  } else {
    // WS chưa connect — subscription sẽ được khôi phục trong onConnect
    console.log(`[WS] Queued subscription for project ${projectId} (not connected yet)`);
  }
};

/**
 * Hủy subscribe project khi rời khỏi màn hình project.
 *
 * @param {number} projectId
 */
export const unsubscribeFromProject = (projectId) => {
  const sub = projectSubscriptions[projectId];
  if (sub?.subscription) {
    try {
      sub.subscription.unsubscribe();
    } catch (e) { /* ignore */ }
  }
  delete projectSubscriptions[projectId];
  console.log(`[WS] Unsubscribed from project ${projectId}`);
};

/**
 * Đăng ký callback được gọi khi WebSocket reconnect thành công.
 * Dùng để refetch data bị miss trong lúc mất kết nối.
 *
 * @param {function} callback
 * @returns {function} cleanup function
 */
export const onReconnect = (callback) => {
  reconnectCallbacks.add(callback);
  return () => reconnectCallbacks.delete(callback);
};

export const disconnect = () => {
  currentToken      = null;
  onMessageCallback = null;
  reconnectAttempt  = 0;
  isFirstConnect    = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  // Clear tất cả project subscriptions
  Object.keys(projectSubscriptions).forEach(id => delete projectSubscriptions[id]);
  if (stompClient?.active) stompClient.deactivate();
  stompClient = null;
  console.log('[WS] Disconnected by user');
};

export const isConnected = () => stompClient?.active ?? false;

const websocketService = {
  connect,
  disconnect,
  isConnected,
  subscribeToProject,
  unsubscribeFromProject,
  onReconnect,
};
export default websocketService;
