const app = require("express")();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

let users = 0;
let lobbies = [
  {
    admin: "Hk02Vyv4vmNWR7EkL963mkmSQdq1",
    lobbyName: "test lobby",
    players: [],
    stage: 0,
    round: 0,
  },
];

/* Checks if provided value equals any value of provided attrib in
 provided array and if true, returns object where it's true */
const isValueInArrayOfObjects = (array, attrib, value) => {
  let result = [];
  array.forEach((obj) => {
    if (obj[attrib] === value) {
      result.push(obj);
    }
  });
  if (result.length === 0) {
    result = false;
  }
  return result;
};

io.on("connection", (socket) => {
  users++;
  console.log(`Currently ${users} active users`);

  let currentLobby;
  let currentUser;

  const sendUpdate = () => {
    io.to(currentLobby.admin).emit("update", currentLobby);
  };

  socket.on("user", ({ userId, displayName }, callback) => {
    /* Checks if userId is in lobbies.admin */
    const userLobby = isValueInArrayOfObjects(lobbies, "admin", userId);
    if (userLobby) {
      /* Returns lobby that client is Admin of */
      callback(userLobby);
    }
  });

  socket.on("createLobby", ({ admin, lobbyName }, callback) => {
    /* Adds lobby to memory and returns it to client */
    const lobby = { admin, lobbyName, players: [], stage: 0 };
    lobbies.push(lobby);
    callback(lobby);
  });

  socket.on("login", ({ userId, displayName, lobby }, callback) => {
    const isLobbyInDb = isValueInArrayOfObjects(lobbies, "admin", lobby);
    if (isLobbyInDb) {
      currentLobby = isLobbyInDb[0];
      currentUser = userId;
      // Check if user can join lobby (game hasn't started)
      socket.join(currentLobby.admin);
      currentLobby.players.push({
        userId,
        displayName,
        status: "Dołączył",
        score: 0,
      });
      sendUpdate();
      callback(currentLobby);
    }
  });

  socket.on("removePlayerFromLobby", (playerUid) => {
    if (currentLobby) {
      const isUserInLobby = isValueInArrayOfObjects(
        currentLobby.players,
        "userId",
        playerUid
      );
      if (isUserInLobby) {
        const indexOfUser = currentLobby.players.indexOf(isUserInLobby[0]);
        if (indexOfUser > -1) {
          currentLobby.players.splice(indexOfUser, 1);
        }
        sendUpdate();
      }
    }
    sendUpdate();
  });

  socket.on("startGame", () => {
    currentLobby.stage++;
    sendUpdate();
  });

  socket.on("sentencesReady", ({ playerUid, sentences, lie, isReady }) => {
    const isUserInLobby = isValueInArrayOfObjects(
      currentLobby.players,
      "userId",
      playerUid
    );
    if (isUserInLobby) {
      userInLobby = isUserInLobby[0];
      userInLobby.status = isReady ? "Gotowy" : "Nie Gotowy";
      userInLobby.sentences = sentences;
      userInLobby.lie = lie;
    }
    const areAllReady = currentLobby.players.every(
      ({ status }) => status === "Gotowy"
    );
    if (areAllReady) {
      currentLobby.stage++;
      currentLobby.timer = Date.now();
      currentLobby.lier = currentLobby.players[currentLobby.round];
      /* Changes all players status to Wybiera as they are now choosing a lie */
      for (var player in currentLobby.players) {
        currentLobby.players[player].status = "Wybiera";
      }
    }
    sendUpdate();
  });

  socket.on("choosen", ({ playerUid, index, isReady }) => {
    const isUserInLobby = isValueInArrayOfObjects(
      currentLobby.players,
      "userId",
      playerUid
    );
    if (isUserInLobby) {
      userInLobby = isUserInLobby[0];
      userInLobby.status = isReady ? "Gotowy" : "Wybiera";
      userInLobby.isHeRight = index === currentLobby.lier.lie;
    }
    const areAllReady = currentLobby.players.every(
      ({ status }) => status === "Gotowy"
    );
    if (areAllReady) {
      currentLobby.stage++;
      /* Changes all players status to Wybiera as they are now choosing a lie */
      for (var player in currentLobby.players) {
        currentLobby.players[player].status = "Wybiera";
      }
      for (var index in currentLobby.players) {
        let player = currentLobby.players[index];
        if (player.userId === currentLobby.lier.userId) {
          let count = 0;
          currentLobby.players.forEach((player) => {
            if (!player.isHeRight) count++;
          });
          count--;
          player.score += count;
          player.newScore = count;
        } else {
          if (player.isHeRight) {
            player.score += 1;
            player.newScore = 1;
          } else {
            player.newScore = 0;
          }
        }
      }
    }
    sendUpdate();
  });

  socket.on("endGame", () => {
    if (currentLobby.round < currentLobby.players.length - 1) {
      currentLobby.stage = 2;
      currentLobby.round++;
      currentLobby.lier = currentLobby.players[currentLobby.round];
    } else {
      currentLobby.stage = 0;
      currentLobby.round = 0;
    }
    sendUpdate();
  });

  socket.on("disconnect", () => {
    if (currentLobby && currentUser) {
      const isUserInLobby = isValueInArrayOfObjects(
        currentLobby.players,
        "userId",
        currentUser
      );
      if (isUserInLobby) {
        const indexOfUser = currentLobby.players.indexOf(isUserInLobby[0]);
        if (indexOfUser > -1) {
          currentLobby.players.splice(indexOfUser, 1);
        }
        if (currentLobby.players.length === 0) {
          currentLobby.stage = 0;
          currentLobby.round = 0;
        }
        sendUpdate();
      }
    }
    users--;
    console.log(`Currently ${users} active users`);
  });
});

httpServer.listen(PORT, () =>
  console.log(`Server running on port: ${PORT} 🚀`)
);
