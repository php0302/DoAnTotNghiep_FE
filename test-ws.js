const { Client } = require('@stomp/stompjs');
const WebSocket = require('ws');
Object.assign(global, { WebSocket });

const client = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  onConnect: () => {
    console.log('Connected to WS');
    client.subscribe('/topic/project.1', (msg) => {
      console.log('Received:', msg.body);
    });
    console.log('Subscribed to /topic/project.1');
  },
  onStompError: (frame) => console.log('Error:', frame.headers['message'])
});

client.activate();
