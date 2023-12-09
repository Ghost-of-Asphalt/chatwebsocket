const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();
let messages = [];

wss.on('connection', (ws, req) => {
  const id = req.headers['sec-websocket-key'];
  clients.set(id, { ws, name: null, avatar: null, id });

  ws.on('message', message => {
    const parsed = JSON.parse(message);

    if (parsed.type === 'setName') {
      clients.get(id).name = parsed.name;
      clients.get(id).avatar = parsed.avatar; // Stocker l'avatar
      broadcastClientList();
    } else if (parsed.type === 'message') {
      const newMessage = { senderId: id, name: parsed.name, avatar: clients.get(id).avatar, message: parsed.message };
      messages.push(newMessage);
      broadcastMessages();
    } else if (parsed.type === 'message') {
      const newMessage = {
        senderId: id, // C'est l'identifiant de l'expéditeur du message
        name: parsed.name,
        avatar: clients.get(id).avatar,
        message: parsed.message
      };
      messages.push(newMessage);
      broadcastMessages();
    }
    else if (parsed.type === 'getMessages') {
      const historyStr = JSON.stringify({ type: 'messages', messages });
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(historyStr);
      }
    }
    
  });

  ws.on('close', () => {
    clients.delete(id);
    broadcastClientList();
  });
  
});

function broadcastMessages() {
  const messageStr = JSON.stringify({ type: 'messages', messages });
  wss.clients.forEach(client => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message", error);
    }
  });
}



function broadcastClientList() {
  const clientList = Array.from(clients.values()).map(client => ({ name: client.name, avatar: client.avatar })).filter(client => client.name);
  const clientListStr = JSON.stringify({ type: 'clientList', clients: clientList });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(clientListStr);
    }
  });
}