const io = require('socket.io-client');
const users = require('./data.json');

const createBody = (message, senderData, receiverData) => {
  return {
    message: `${message}`,
    chatType: 'PRIVATE',
    sender: {
      senderSocketId: `${senderData.userSocketId}`,
      senderUsername: `${senderData.userName}`, // Generate random username
      senderFullname: `Random User`, // Use client ID for now
      senderUserId: '',
    },
    receiver: {
      receiverSocketId: `${receiverData.userSocketId}`, // Randomly choose a receiver
      receiverUsername: `${receiverData.userName}`, // Generate random username for receiver
      receiverFullname: `Random User`, // Generate random fullname for receiver
      receiverUserId: '',
    },
    client: {
      clientname: `${senderData.userName}`,
      clientId: `${senderData.userSocketId}`,
    }, // Include client ID in the message
    room: { roomname: '', roomId: '' },
    contentType: 'text',
    file: { filename: '', fileurl: '' },
  };
};

// Define event listeners outside of the connectClient function
const setupEventListeners = (socket, senderUserName) => {
  socket.on('onMessage', (message) => {
    console.log(
      `Received message from Client ${message} as Client ${senderUserName} through onMessage event:`,
      JSON.parse(message)
    );
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected from server as Client ${senderUserName}`);
  });
};

// Function to connect a client to the server with random name and ID
let numClientsConnected = 0;

const connectClient = (clientId, allSockets, senderData) => {
  let message;
  return new Promise((resolve, reject) => {
    const socket = io(
      'http://139.59.52.156?payload=508edc31de081e773616d5b1e3c1cc4ed1f7217cf0c25f2087e866664b5a32c5f3b7c924874abb8a8cdfcfcd4d07fe9492810f941e89e2842f794755d45ae61dfa6a9dac6dd2f0706de658e0768035e5abe38cc0185c02f22a930f970e93b65694a26bb6724143fdb7f3aeb8972b1e3f60222248989c76261701e17e460a3b67&iv=5c16521503bfc0ef28bc52f6099c3db8&digest=35ab313fa7daad1fc29f1e71949b9a795f194d6b8cb5018dce1639bc93c8ef6d',
      { transports: ['websocket'], path: '/TrainingRoomSocketServer/' }
    );


    socket.on('connect', () => {
      console.log(`Connected to server as ${senderData.sender.userName} with ${senderData.sender.userSocketId} id`);
      socket.userName = senderData.sender.userName;
      senderData.sender.userSocketId = socket.id;
      numClientsConnected++;

      if (numClientsConnected > 1) {
        // Emit action when at least two clients are connected
        const msg = 'kyu bhai kya hua';
        const receiverSocketIndex = Math.floor(
          Math.random() * allSockets.length
        );
        const receiverSocket = allSockets[receiverSocketIndex];
        const receiverData = {
          userName: receiverSocket.userName,
          userSocketId: receiverSocket.id,
        };
        message = createBody(msg, senderData.sender, receiverData);
        console.log(message);
        for(var i = 0 ; i<5;i++){
          socket.emit('SEND_CHAT_MESSAGE', JSON.stringify(message));
        } // Emit message here when it's available
      }

      resolve(socket);
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected from server as Client ${clientId}`);
    });
    // Setup event listeners
    // setupEventListeners(socket, senderData.sender.userName);
    socket.on('onMessage', (message) => {
      console.log(JSON.parse(message));
      console.log(
        `Received message from Client ${message} as Client ${senderData.sender.userName} through onMessage event:`,
        message
      );
    });
  });
};

// Function to connect multiple clients with random names and IDs
const connectMultipleClients = async (pairs) => {
  const sockets = [];

  // Connect clients
  for (let i = 0; i < pairs.length; i++) {
    const socket = await connectClient(i, sockets, pairs[i]);
    sockets.push(socket);

  }
  // if (!process.env.DISABLE_NODEMON) {
  //   fs.writeFileSync('./data.json', JSON.stringify(users, null, 2));
  // }
  return sockets;
};

connectMultipleClients([...users])
  .then((sockets) => {
  })
  .catch((error) => {
    console.error('Error connecting clients:', error);
  });


