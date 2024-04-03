const io = require('socket.io-client');

const sockets = [];
const maxClients = 4;
const noOfMessages = 100;
// const payload = "508edc31de081e773616d5b1e3c1cc4ed1f7217cf0c25f2087e866664b5a32c5f3b7c924874abb8a8cdfcfcd4d07fe9492810f941e89e2842f794755d45ae61dfa6a9dac6dd2f0706de658e0768035e5abe38cc0185c02f22a930f970e93b65694a26bb6724143fdb7f3aeb8972b1e3f60222248989c76261701e17e460a3b67";
// const iv  = "5c16521503bfc0ef28bc52f6099c3db8";
// const digest = "35ab313fa7daad1fc29f1e71949b9a795f194d6b8cb5018dce1639bc93c8ef6d";

const payload = "fc1ef388d507bb481f7127465f1e028d4092977b835c31cde481812862e77e01e85a3cce1c70f62b5b414bb72724f8a5e1bc9f1464c80b0e0307466d0ef2a65851d1b3a41e3eab7dfd0c88971e5a107d8a5d8110373456becc10b4d67673f848e8702377e8b3e0baefc04670159ea113"
const iv = "504248b7a273943e6a4bf9fb28084c37"
const digest = "7f4365da8ef0aa07f27dec209e85336acd4339682b6e919a3d572846bd2eedc3"

const generateRandomUsername = () => {
  const adjectives = [
    'Red',
    'Blue',
    'Green',
    'Yellow',
    'Orange',
    'Purple',
    'Indigo',
    'Black',
    'White',
    'Gray',
  ];
  const nouns = [
    'Cat',
    'Dog',
    'Bird',
    'Lion',
    'Tiger',
    'Elephant',
    'Snake',
    'Rabbit',
    'Fox',
    'Bear',
  ];

  const randomAdjectiveIndex = Math.floor(Math.random() * adjectives.length);
  const randomNounIndex = Math.floor(Math.random() * nouns.length);

  const randomUsername = `${adjectives[randomAdjectiveIndex]}${nouns[randomNounIndex]}`;

  return randomUsername;
};

const createBody = (message, senderData, receiverData) => {
  return {
    message: `${message}`,
    chatType: 'PRIVATE',
    sender: {
      senderSocketId: `${senderData.id}`,
      senderUsername: `${senderData.userName}`,
      senderFullname: `Random User`,
      senderUserId: '',
    },
    receiver: {
      receiverSocketId: `${receiverData.id}`,
      receiverUsername: `${receiverData.userName}`,
      receiverFullname: `Random User`,
      receiverUserId: '',
    },
    client: {
      clientname: `${senderData.userName}`,
      clientId: `${senderData.id}`,
    }, // Include client ID in the message
    room: { roomname: '', roomId: '' },
    contentType: 'text',
    file: { filename: '', fileurl: '' },
  };
};

let numClientsConnected = 0;

const connectClient = (clientId, allSockets) => {
  return new Promise((resolve, reject) => {
    const socket = io('http://139.59.52.156', {
      query: {
        payload,     
        iv,
        digest
      },
      
      transports: ['websocket'],
      path: '/TrainingRoomSocketServer/',
    });

    socket.on('connect', () => {
      socket.userName = generateRandomUsername();
      console.log(
        `Connected to server as ${socket.userName} with id ${socket.id}`
      );
      numClientsConnected++;

      resolve(socket);
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected from server as Client ${clientId}`);
    });
  });
};

const connectMultipleClients = async (numClients) => {
  // Connect clients
  for (let i = 0; i < numClients; i++) {
    const socket = await connectClient(i, sockets);
    sockets.push(socket);
    console.log(i, 'connected');
  }

  // Check if all clients are connected
  if (sockets.length === numClients) {
    // Emit messages from all clients to randomly selected receivers
    for (let i = 0; i < sockets.length; i++) {
      const senderSocket = sockets[i];
      let receiverSocketIndex;
      let receiverSocket;

      do {
        receiverSocketIndex = Math.floor(Math.random() * sockets.length);
        receiverSocket = sockets[receiverSocketIndex];
      } while (receiverSocket === senderSocket);

      console.log(senderSocket.id, receiverSocket.id, 'connected');

      let count = 0;
      const msg = `Hello from ${senderSocket.userName} to ${receiverSocket.userName} with id ${receiverSocket.id}`;
      const message = createBody(msg, senderSocket, receiverSocket);
      receiverSocket.on('onMessage', (message) => {
        let msg = JSON.parse(message);

        if (msg.type === 'NEW_CHAT_MESSAGE') {
          console.log(
            `message got from ${msg.type} with sender ${senderSocket.userName}` +
              ` and reciever as Client ${receiverSocket.userName} through onMessage event:`,
            msg.message,
            count
          );
        }
      });

      console.log(message);
      const interval = setInterval(() => {
        senderSocket.emit('SEND_CHAT_MESSAGE', JSON.stringify(message));

        count++;
        if (count === noOfMessages) {
          clearInterval(interval);
        }
      }, 1000); // 1-second interval
    }
  }
};

connectMultipleClients(maxClients)
  .then((sockets) => {})
  .catch((error) => {
    console.error('Error connecting clients:', error);
  });
