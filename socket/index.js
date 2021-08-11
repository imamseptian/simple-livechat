const PORT_SOCKET = process.env.PORT || 8000;
const InitiateMongoServer = require("./config/mongo");
let connected_users = [];
InitiateMongoServer();
const User = require("./model/User");
const Message = require("./model/Message");

// const io = require("socket.io")(PORT_SOCKET, {
//   cors: {
//     origin: "http://localhost:3000",
//   },
// });
const io = require("socket.io")(PORT_SOCKET, {
  cors: {
    origin: "https://react-livechat.vercel.app",
  },
});

io.on("connection", async (socket) => {
  console.log("user connected id :" + socket.id);
  let userData = socket.handshake.query;
  connected_users.push({ socketID: socket.id, userID: userData.userId });
  console.log(`connected users : ${connected_users.length}`);
  const doc = await User.findOne({ _id: userData.userId });
  const update_data = { isOnline: true, lastOnline: Date.now() };
  await doc.updateOne(update_data);
  await doc.save();

  socket.on("sendMessage", async (msg) => {
    // console.log(msg);
    let myMessage = new Message({
      sender: msg.sender,
      receiver: msg.receiver,
      content: msg.content,
      createdAt: msg.createdAt,
    });

    await myMessage.save();
    console.log("message saved");
    // console.log(`${userData.userId} / ${msg.receiver}`);

    let selected_socket = [];
    connected_users.forEach((item) => {
      if (item.userID === msg.receiver) {
        selected_socket.push(item.socketID);
      }
    });
    console.log(selected_socket);
    if (selected_socket.length > 0) {
      io.to(selected_socket).emit("clientMessage", {
        sender: msg.sender,
        receiver: msg.receiver,
        content: msg.content,
        createdAt: msg.createdAt,
      });
    }

    console.log(connected_users.length);
    // console.log(selected_socket);
  });

  socket.on("disconnect", async () => {
    console.log("user disconnected");
    connected_users = connected_users.filter((item) => {
      return item.socketID !== socket.id;
    });
    const doc = await User.findOne({ _id: userData.userId });
    const update_data = { isOnline: false, lastOnline: Date.now() };
    await doc.updateOne(update_data);
    await doc.save();

    console.log(`connected users : ${connected_users.length}`);
  });
});
