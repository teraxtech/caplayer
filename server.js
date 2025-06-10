const http = require("http");
const server = http.createServer();
const { Server } = require("socket.io");
const io = new Server(server);

io.on("connection", (socket) => {
	console.log(`user ${socket.id} has connected`);

	socket.broadcast.emit("addConnection", socket.id, Array.from(io.sockets.sockets).map(socket => socket[0]));

	socket.on("disconnect", () => {
		console.log("user disconnected");
		socket.broadcast.emit("deleteConnection", socket.id);
	});

	socket.on("pan", msg => {
		console.log("recieved message PAN from" + socket.id);
		socket.broadcast.emit("relayPan", msg);
	});

	socket.on("zoom", msg => {
		console.log("recieved message ZOOM from" + socket.id);
		socket.broadcast.emit("relayZoom", msg);
	});

	socket.on("draw", (time, msg) => {
		console.log("recieved message DRAW from" + socket.id);
		socket.broadcast.emit("relayDraw", time, msg);
	});

	socket.on("undoDraw", (time, msg) => {
		console.log("recieved message UNDODRAW from" + socket.id);
		socket.broadcast.emit("relayUndoDraw", time, msg);
	});

	socket.on("paste", (time, msg) => {
		console.log("recieved message PASTE from" + socket.id);
		socket.broadcast.emit("relayPaste", time, msg);
	});

	socket.on("undoPaste", (time, msg) => {
		console.log("recieved message UNDOPASTE from" + socket.id);
		socket.broadcast.emit("relayUndoPaste", time, msg);
	});

	socket.on("requestInformation", id => {
		console.log("request Information frow " + id);
		io.to(id).emit("relayRequestInformation", socket.id);
	});

	socket.on("requestGrid", id => {
		console.log("request grid from " + id);
		io.to(id).emit("relayRequestGrid", socket.id);
	});

	socket.on("sendGridToIndividual", (data, id) => {
		console.log("send grid to " + id);
		io.to(id).emit("relaySendGrid", data);
	});

	socket.on("rule", data => {
		console.log("set rule to " + data);
		socket.broadcast.emit("relayRule", data);
	});

	socket.on("sendGrid", msg => {
		console.log("set grid to mode " + msg);
		socket.broadcast.emit("relaySendGrid", msg);
	});

	socket.on("updateName", msg => {
		console.log(msg.id + " changed name to " + msg.name);
		socket.broadcast.emit("relayUpdateName", msg);
	});

	socket.on("requestConnection", _ => {
		socket.emit("initializeConnection", socket.id, Array.from(io.sockets.sockets).map(socket => socket[0]));
	});
});

server.listen(process.env.PORT || 3000, () => {
	console.log("listening on *:3000");
});
