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

// Map lưu callbacks cho từng project
// { [projectId]: Set<callback> }
const projectCallbacks = {};

// Map lưu subscriptions theo projectId
// { [projectId]: StompSubscription }
const projectSubscriptions = {};

// Admin topic subscription
let adminSubscription = null;
let adminCallback     = null;

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
      Object.keys(projectCallbacks).forEach((projectId) => {
        _subscribeProjectInternal(Number(projectId));
      });

      // Re-subscribe admin topic nếu có
      if (adminCallback) {
        adminSubscription = stompClient.subscribe('/topic/admin', (message) => {
          try {
            const payload = JSON.parse(message.body);
            adminCallback(payload);
            // Phát lên window để bất kỳ component nào cũng có thể lắng nghe
            window.dispatchEvent(new CustomEvent('ws:admin', { detail: payload }));
          } catch (e) {
            console.error('[WS] Admin message parse error', e);
          }
        });
        console.log('[WS] Subscribed to /topic/admin');
      }

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
const _subscribeProjectInternal = (projectId) => {
  const destination = `/topic/project.${projectId}`;
  const subscription = stompClient.subscribe(destination, (message) => {
    try {
      const payload = JSON.parse(message.body);
      const callbacks = projectCallbacks[projectId];
      if (callbacks) {
        callbacks.forEach((cb) => {
          try { cb(payload); } catch (err) { console.error('[WS] Listener error', err); }
        });
      }
    } catch (e) {
      console.error('[WS] Project message parse error', e);
    }
  });
  projectSubscriptions[projectId] = subscription;
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
  if (!projectCallbacks[projectId]) {
    projectCallbacks[projectId] = new Set();
  }
  projectCallbacks[projectId].add(callback);

  if (stompClient?.active && stompClient?.connected) {
    if (!projectSubscriptions[projectId]) {
      _subscribeProjectInternal(projectId);
    }
  } else {
    // WS chưa connect — subscription sẽ được khôi phục trong onConnect
    console.log(`[WS] Queued subscription for project ${projectId} (not connected yet)`);
  }
};

/**
 * Hủy subscribe project khi rời khỏi màn hình project.
 *
 * @param {number} projectId
 * @param {function} [callback]
 */
export const unsubscribeFromProject = (projectId, callback) => {
  const callbacks = projectCallbacks[projectId];
  if (callbacks && callback) {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      const subscription = projectSubscriptions[projectId];
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) { /* ignore */ }
        delete projectSubscriptions[projectId];
      }
      delete projectCallbacks[projectId];
      console.log(`[WS] Unsubscribed from project ${projectId} (no remaining listeners)`);
    }
  } else if (!callback) {
    const subscription = projectSubscriptions[projectId];
    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (e) { /* ignore */ }
      delete projectSubscriptions[projectId];
    }
    delete projectCallbacks[projectId];
    console.log(`[WS] Cleared all listeners for project ${projectId}`);
  }
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
  adminCallback     = null;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  // Clear tất cả project subscriptions & callbacks
  Object.keys(projectSubscriptions).forEach(id => {
    const sub = projectSubscriptions[id];
    if (sub) {
      try { sub.unsubscribe(); } catch (e) { /* ignore */ }
    }
    delete projectSubscriptions[id];
  });
  Object.keys(projectCallbacks).forEach(id => delete projectCallbacks[id]);
  // Clear admin subscription
  if (adminSubscription) {
    try { adminSubscription.unsubscribe(); } catch (e) { /* ignore */ }
    adminSubscription = null;
  }
  if (stompClient?.active) stompClient.deactivate();
  stompClient = null;
  console.log('[WS] Disconnected by user');
};

export const isConnected = () => stompClient?.active ?? false;

/**
 * Subscribe nhận realtime events từ /topic/admin.
 * Dùng cho Admin Management để nhận sự kiện PASSWORD_CHANGED, v.v.
 *
 * @param {function} callback - callback(realtimeMessage)
 */
export const subscribeToAdmin = (callback) => {
  adminCallback = callback;
  if (stompClient?.active && stompClient?.connected) {
    adminSubscription = stompClient.subscribe('/topic/admin', (message) => {
      try {
        const payload = JSON.parse(message.body);
        adminCallback(payload);
        window.dispatchEvent(new CustomEvent('ws:admin', { detail: payload }));
      } catch (e) {
        console.error('[WS] Admin message parse error', e);
      }
    });
    console.log('[WS] Subscribed to /topic/admin');
  }
};

/**
 * Hủy subscribe /topic/admin.
 */
export const unsubscribeFromAdmin = () => {
  adminCallback = null;
  if (adminSubscription) {
    try { adminSubscription.unsubscribe(); } catch (e) { /* ignore */ }
    adminSubscription = null;
  }
  console.log('[WS] Unsubscribed from /topic/admin');
};

const websocketService = {
  connect,
  disconnect,
  isConnected,
  subscribeToProject,
  unsubscribeFromProject,
  subscribeToAdmin,
  unsubscribeFromAdmin,
  onReconnect,
};
export default websocketService;
