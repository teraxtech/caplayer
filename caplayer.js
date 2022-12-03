class TreeNode {
	constructor(distance){
		this.distance=distance;
		this.value=null;
		this.key=null;
		this.child = [null,null,null,null];
		this.result = null;
		this.depth = null;
		this.nextHashedNode=null;
		this.population = 0;
	}
}

class ListNode {
	constructor(parent){
		this.value = 0;
		this.tree = null;
		this.child = null;
		this.parent = parent;
	}
}

class EventNode {
	constructor(parent){
		this.parent=parent;
		if(parent!==null)parent.child=this;
		this.child=null;
		if(arguments.length===1){
			this.rule=rulestring;
			if(GRID.type===0){
				this.head=GRID.head;
			}else{
			  this.finiteArea={left:GRID.finiteArea.left, top:GRID.finiteArea.top, margin:GRID.finiteArea.margin};
				this.finiteArray=patternToRLE(GRID.finiteArray);
			}
			this.type=GRID.type;
			this.backgroundState=backgroundState;
			this.generation=genCount;
			this.resetEvent=resetEvent;
			this.time=Date.now();
		}else{
			for(let i=2;i<arguments.length;i+=1){
				const name=arguments[i],data=arguments[i+1];
				if(name==="draw"){
					this.draw=data;
				}
				if(name==="paste"){
					this.paste=data;
				}
			}
			this.time=arguments[1];
		}
	}
}

var //canvas element
	canvas=document.getElementById("ourCanvas"),
	//canvas context
	ctx=canvas.getContext("2d"),
	//window and canvas dimensions
	windowHeight=0,windowWidth=0,canvasWidth=0,canvasHeight=0,
	//state of the grid
	GRID={
		//which kind of grid is being used
		type:0,//0=infinite,1=finite,2=toroidal
		//data for the cells on an infinte grid
		head:null,
		//data for the cells on a finite grid
		finiteArray:[],
		//area representing a finite portion of the grid
		finiteArea:{margin:0,top:0,right:0,bottom:0,left:0,newTop:0,newRight:0,newBottom:0,newLeft:0}},
	//state of the background(used for B0 rules)
	backgroundState=0,
	//list of empty nodes with differnt states for B0.
	emptyNodes=[],
	//0 area is inactive, 1 area is active select, 2 area is active paste
	selectArea={isActive:false,top:0,right:0,bottom:0,left:0,pastLeft:0,pastTop:0,pastRight:0,pastBottom:0},
	pasteArea={isActive:false,top:0,left:0,pastTop:0,pastLeft:0},
	//copy paste clipboard
	clipboard=new Array(3),
	activeClipboard=1,
	//these are the 6 markers which can be placed on the grid
	markers=[{activeState:0,top:0,right:0,bottom:0,left:0},
	         {activeState:0,top:0,right:0,bottom:0,left:0},
	         {activeState:0,top:0,right:0,bottom:0,left:0},
	         {activeState:0,top:0,right:0,bottom:0,left:0},
	         {activeState:0,top:0,right:0,bottom:0,left:0},
	         {activeState:0,top:0,right:0,bottom:0,left:0}],
	//index of the marker being selected and interacted with
	selectedMarker=-1,
	//this determines whether the simulation is in draw, move, or select mode
	editMode=0,

	//this determines if the UI is using the dark theme.
	darkMode=1,
	//canvas fill color(0-dark,1-light)
	detailedCanvas=true,
	//array of key states
	key=[],
	//used for rendering user caused changes
	isKeyBeingPressed=false,
	//mouse and touch inputs
	mouse={//which button is down
	       clickType:0,
	       //active if clicked or touched
	       active:false,
	       //position of input
	       x:0,y:0,
	       //past position
	       pastX:0,pastY:0,
	       //position of 2nd input
	       x2:0,y2:0,
	       //past position
	       pastX2:0,pastY2:0},
	//number of genertions updated
	stepSize=1,
	//rulestring
	rulestring="B3/S23",
	//rule transition array
	ruleArray=[],
	//ID of the thing being dragged(0=nothing,-4 to -1 and 4 to 4 for each corner)
	dragID=0,
	//finite population
	gridPopulation=0,
	//whether the cursor draws a specific state or changes automatically;-1=auto, other #s =state
	drawMode=-1,
	//whether or not the sim is playing
	isPlaying=0,
	//state currently being drawn by the cursor, -1=none
	drawnState=-1,
	//time elapsed
	genCount=0,
	//keeps track of when the last simulation update occurred
	timeOfLastUpdate=0,
	//keeps track of when the last generation occurred
	timeOfLastGeneration=0,
	//changes the amount of movement based on frame rate
	frameMultiplier=1,
	//point where the simulator resets to
	resetEvent=null,
	//set to true if the sim was reset in/before the current generation
	wasReset=false,
	//width of each cell
	cellWidth=20,

	//position of the current view(x/y position,zoom)
	view={x:-15,y:-10,z:1,
	      //position of the view for when a pointer clicks or touches
	      touchX:0,touchY:0,touchZ:1,
	      //amount that the grid shifts, which is used to undo patterns which moved
	      shiftX:0,shiftY:0,
	      //position of the view during a copy, so the pattern is pasted in the same place relative to the screen.
	      copyX:0,copyY:0},
	maxDepth=20000,
	hashTable=new Array(999953),
	//metric of the number of nodes in the hashtable
	numberOfNodes=0,
	//average depth of nodes being read from the hashtable
	avgNodeDepth=0,
	//collect changest to be saved as a single event
	accumulateChanges=new ListNode(null),
	//number of accumulated change
	changeCount=0;

let socket;
try{
	socket=io();
}catch(error){
	socket=null;
}

var clientId, clientList={};

if(socket)socket.on("addConnection", (id,connectionList) =>  {
	console.log(connectionList);
	if(clientList[id]===undefined){
		clientList[id]={xPosition:-15,yPosition:-10,zoom:1,color:[Math.ceil(360*Math.random()),Math.ceil(255*Math.random()),Math.ceil(255*Math.random())]};
	}
	for(let id in clientList){
		if(connectionList.indexOf(id)===-1){
			console.log(`deleted ${id}`);
			delete clientList[id];
		}
	}
	render();
});

if(socket)socket.on("initializeConnection", (id, connectionList) => {
	clientId=id;
	//make a copy of the list which excludes the clients own id
	let otherConnections=connectionList.slice();
	otherConnections.splice(connectionList.indexOf(socket.id),1);

	//get user position from all other clients
	for(let index in otherConnections){
		console.log(otherConnections[index]);
		clientList[otherConnections[index]]={xPosition:-15,yPosition:-10,zoom:1,color:[Math.ceil(360*Math.random()),Math.ceil(255*Math.random()),Math.ceil(255*Math.random())]};
		socket.emit("requestPosition", otherConnections[index]);
	}

	//request the current state of the grid from a random client
	if(otherConnections.length>0)socket.emit("requestGrid", otherConnections[Math.floor(Math.random()*otherConnections.length)]);
});

if(socket)socket.on("relayRequestPosition", () => {
	socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
	socket.emit("zoom", {id:clientId, zoom:view.z});
});

if(socket)socket.on("relayRequestGrid", (id) => {
	console.log("sending grid");
	if(resetEvent===null){
		if(GRID.type===0){
			console.log(readPattern((getTopBorder(GRID.head)??0)/2-0.5,(getRightBorder(GRID.head)??0)/2+0.5,(getBottomBorder(GRID.head)??0)/2+0.5,(getLeftBorder(GRID.head)??0)/2-0.5));
			socket.emit("sendGrid",{type:GRID.type, finite:GRID.finiteArea, data:[(getLeftBorder(GRID.head)??0)/2-0.5, (getTopBorder(GRID.head)??0)/2-0.5, readPattern((getTopBorder(GRID.head)??0)/2-0.5,(getRightBorder(GRID.head)??0)/2+0.5,(getBottomBorder(GRID.head)??0)/2+0.5,(getLeftBorder(GRID.head)??0)/2-0.5)]}, id);
		}else{
			socket.emit("sendGrid",{type:GRID.type, finite:GRID.finiteArea, data:GRID.finiteArray}, id);
		}
	}else{
		if(GRID.type===0){
			socket.emit("sendGrid",{type:resetEvent.type, finite:GRID.finiteArea, data:[(getLeftBorder(GRID.head)??0)/2-0.5, (getTopBorder(GRID.head)??0)/2-0.5, readPattern((getTopBorder(GRID.head)??0)/2-0.5,(getRightBorder(GRID.head)??0)/2+0.5,(getBottomBorder(GRID.head)??0)/2+0.5,(getLeftBorder(GRID.head)??0)/2-0.5,resetEvent)]}, id);
		}else{
			socket.emit("sendGrid",{type:resetEvent.type, finite:GRID.finiteArea, data:resetEvent.finiteArray}, id);
		}
	}
	if(socket)socket.emit("rule", rulestring);
});

if(socket)socket.on("relaySendGrid", msg => {
	console.log(msg);
	GRID.type=msg.type;
	if(GRID.type!==0){
		GRID.finiteArea.margin=msg.finite.margin;
		GRID.finiteArea.top=msg.finite.top;
		GRID.finiteArea.right=msg.finite.right;
		GRID.finiteArea.bottom=msg.finite.bottom;
		GRID.finiteArea.left=msg.finite.left;
		GRID.finiteArea.newTop=msg.finite.top;
		GRID.finiteArea.newRight=msg.finite.right;
		GRID.finiteArea.newBottom=msg.finite.bottom;
		GRID.finiteArea.newLeft=msg.finite.left;
		GRID.finiteArray=msg.data;
		console.log(GRID.finiteArray);
		console.log(GRID.finiteArea);
	}else{
		if(msg.data[2].length>0)writePattern(...msg.data, GRID);
	}
	render();
});

if(socket)socket.on("deleteConnection", id => {
	delete clientList[id];
	render();
});

if(socket)socket.on("relayPan", msg => {
	clientList[msg.id].xPosition=msg.xPosition;
	clientList[msg.id].yPosition=msg.yPosition;
	render();
});

if(socket)socket.on("relayZoom", msg => {
	clientList[msg.id].zoom=msg.zoom;
	render();
});

if(socket)socket.on("relayDraw", (time, msg) => {
	console.log(msg);
	if(resetEvent===null){
		for(let i=0;i<msg.length;i++){
			writePattern(msg[i].x,msg[i].y,[[msg[i].newState]], GRID);
		}
	}else{
		for(let i=0;i<msg.length;i++){
			writePattern(msg[i].x,msg[i].y,[[msg[i].newState]],resetEvent);
		}
	}
	render();
});

if(socket)socket.on("relayUndoDraw", (time, msg) => {
	console.log(msg);
	if(resetEvent===null){
		for(let i=0;i<msg.length;i++){
			writePattern(msg[i].x,msg[i].y,[[msg[i].oldState]], GRID);
		}
	}else{
		for(let i=0;i<msg.length;i++){
			writePattern(msg[i].x,msg[i].y,[[msg[i].oldState]],resetEvent);
		}
	}
	render();
});

if(socket)socket.on("relayPaste", (time, msg) => {
	console.log(msg);
	if(resetEvent===null){
		writePattern(...msg.newPatt, GRID);
	}else{
		writePattern(...msg.newPatt, resetEvent);
	}
	render();
});

if(socket)socket.on("relayUndoPaste", (time, msg) => {
	console.log(msg);
	if(resetEvent===null){
		writePattern(...msg.oldPatt, GRID);
	}else{
		writePattern(...msg.newPatt, resetEvent);
	}
	render();
});

if(socket)socket.on("relayRule", msg => {
	if(msg!==rulestring){
		rule(msg);
		resetHashtable();
		document.getElementById("rule").value=msg;
		alert("rule changed to: "+msg);
	}
});

if(socket)socket.on("relayChangeGrid", msg => {
	let results=exportPattern();
	GRID.type=msg;
	console.log("importGridPattern");
	importPattern(results.pattern,results.xOffset,results.yOffset);
	render();
});

function calculateKey(node){
	//sets key to the nodes value if it has one
	if(node.distance===1){
		node.key=node.value;
		node.population=node.value===1?1:0;
		//otherwise sets the key based of the children's keys
	}else{
		node.key=ruleArray[2];
		node.population=0;
		for(let h=0;h<4;h++) if(node.child[h]!==null){
			if(node.child[h].key===null){
				calculateKey(node.child[h]);
			}
			node.key=(node.key^(node.child[h].key*23)<<h)&4294967295;
			node.population+=node.child[h].population;
		}
	}
}

function mod(num1,num2){
	return (num1%num2+num2)%num2;
}

function iteratePattern(array,top,right,bottom,left){
	const lookupTable1=[1,0,-1,-1,-1,0,1,1],
	      lookupTable2=[1,1,1,0,-1,-1,-1,0];

	let result=new Array(right-left);
	for(let i = left; i < right; i++){
		result[i-left]=new Array(bottom-top);
		for(let j = top; j < bottom; j++){
			let total = 0;
			for(let k = 0;k<8;k++)
				if(array[mod(i+lookupTable1[k],array.length)][mod(j+lookupTable2[k],array[0].length)]===1)
					total+=1<<k;
			if(array[i][j]===0||array[i][j]===1){
				result[i-left][j-top]=ruleArray[array[i][j]][total];
			}else if(array[i][j]===ruleArray[2]-1){
				result[i-left][j-top]=0;
			}else{
				result[i-left][j-top]=array[i][j]+1;
			}
		}
	}
	return result;
}

function getResult(node){
	let result = new TreeNode(node.distance>>>1);

	if(node.distance<4){
		console.log("Error: Cannot find result of node smaller than 4");
	}else if(node.distance===4){
		//the result of nodes 4 cells wide are calculated conventionally
		result=writePatternToGrid(-1,-1,iteratePattern(readPattern(-2,2,2,-2,{head:node}),1,3,3,1),getEmptyNode(2));
	}else if(node.distance>=8){
		//the result of larger nodes are calculated based on the results of their child nodes
		//
		//   _______________
		//  |               |
		//  |    _______    |
		//  |   |       |   |
		//  |   | find  |   |
		//  |   |  this |   |
		//  |   |_______|   |
		//  |               |
		//  |_______________|
		//
		//by first making four empty 1/4 width nodes
		//   _______________
		//  |               |
		//  |    _______    |
		//  |   |1  |2  |   |
		//  |   |___|___|   |
		//  |   |3  |4  |   |
		//  |   |___|___|   |
		//  |               |
		//  |_______________|
		//
		//then setting the corner 1/8 width corner nodes
		//   _______________
		//  |               |
		//  |    _______    |
		//  |   |1|   |2|   |
		//  |   |       |   |
		//  |   |       |   |
		//  |   |3|___|4|   |
		//  |               |
		//  |_______________|
		//
		//using on the results from the nodes four 1/2 width children
		//   _______________
		//  |  ___  |  ___  |
		//  | |  _| | |_  | |
		//  | |_|1| | |2|_| |
		//  |_______|_______|
		//  |  ___  |  ___  |
		//  | | |3| | |4| | |
		//  | |___| | |___| |
		//  |_______|_______|
		//
		for(let i = 0;i < 4;i++){
			result.child[i]=new TreeNode(node.distance>>>2);
			result.child[i].child[i]=node.child[i].result.child[3-i];
		}

		//to find the rest of the 1/8 width potions of the result, temporary 1/2 width nodes are made on each edge and the center
		//   _______________        _______________        _______________        _______________        _______________
		//  |   |   |   |   |      |               |      |               |      |               |      |               |
		//  |   |___|___|   |      |        _______|      |               |      |_______        |      |    _______    |
		//  |   |   |   |   |      |       |   |   |      |               |      |   |   |       |      |   |   |   |   |
		//  |   |___|___|   |      |       |___|___|      |    _______    |      |___|___|       |      |   |___|___|   |
		//  |               |      |       |   |   |      |   |   |   |   |      |   |   |       |      |   |   |   |   |
		//  |               |      |       |___|___|      |   |___|___|   |      |___|___|       |      |   |___|___|   |
		//  |               |      |               |      |   |   |   |   |      |               |      |               |
		//  |_______________|      |_______________|      |___|___|___|___|      |_______________|      |_______________|
		//
		//next the result is calculated for each temporary node
		//   _______________        _______________        _______________        _______________        _______________
		//  |   |   |   |   |      |               |      |               |      |               |      |               |
		//  |   |___|___|   |      |        _______|      |               |      |_______        |      |    _______    |
		//  |   | |1|2| |   |      |       |  _|   |      |               |      |   |_  |       |      |   |  _|_  |   |
		//  |   |___|___|   |      |       |_|2|___|      |    _______    |      |___|1|_|       |      |   |_|1|2|_|   |
		//  |               |      |       | |4|   |      |   |  _|_  |   |      |   |3| |       |      |   | |3|4| |   |
		//  |               |      |       |___|___|      |   |_|3|4|_|   |      |___|___|       |      |   |___|___|   |
		//  |               |      |               |      |   |   |   |   |      |               |      |               |
		//  |_______________|      |_______________|      |___|___|___|___|      |_______________|      |_______________|
		//
		//those results are used to assemble the result of the main node
		//   _______________
		//  |               |
		//  |    _______    |
		//  |   |1|1|2|2|   |
		//  |   |1|1|2|2|   |
		//  |   |3|3|4|4|   |
		//  |   |3|3|4|4|   |
		//  |               |
		//  |_______________|
		//
		//top
		let temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[0].child[1];
		temporaryNode.child[1]=node.child[1].child[0];
		temporaryNode.child[2]=node.child[0].child[3];
		temporaryNode.child[3]=node.child[1].child[2];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		result.child[0].child[1]=temporaryNode.result.child[2];
		result.child[1].child[0]=temporaryNode.result.child[3];


		//right
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[1].child[2];
		temporaryNode.child[1]=node.child[1].child[3];
		temporaryNode.child[2]=node.child[3].child[0];
		temporaryNode.child[3]=node.child[3].child[1];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		result.child[1].child[3]=temporaryNode.result.child[0];
		result.child[3].child[1]=temporaryNode.result.child[2];


		//bottom
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[2].child[1];
		temporaryNode.child[1]=node.child[3].child[0];
		temporaryNode.child[2]=node.child[2].child[3];
		temporaryNode.child[3]=node.child[3].child[2];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		result.child[3].child[2]=temporaryNode.result.child[1];
		result.child[2].child[3]=temporaryNode.result.child[0];


		//left
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[0].child[2];
		temporaryNode.child[1]=node.child[0].child[3];
		temporaryNode.child[2]=node.child[2].child[0];
		temporaryNode.child[3]=node.child[2].child[1];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		result.child[2].child[0]=temporaryNode.result.child[3];
		result.child[0].child[2]=temporaryNode.result.child[1];


		//center
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[0].child[3];
		temporaryNode.child[1]=node.child[1].child[2];
		temporaryNode.child[2]=node.child[2].child[1];
		temporaryNode.child[3]=node.child[3].child[0];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);
		result.child[0].child[3]=temporaryNode.result.child[0];
		result.child[1].child[2]=temporaryNode.result.child[1];
		result.child[2].child[1]=temporaryNode.result.child[2];
		result.child[3].child[0]=temporaryNode.result.child[3];

		//store each child of the result node in the hashtable
		for(let i = 0;i < 4;i++){
			result.child[i].value=getValue(result.child[i]);
			result.child[i]=writeNode(result.child[i]);
		}
		result.value=getValue(result);
	}
	//store the result node in the hashtable
	return writeNode(result);
}

function writeNode(node){
	calculateKey(node);
	let hashedList=hashTable[node.key%hashTable.length], previousNode=null;
	//search through the linked list stored at the hash value
	for(let h=0;;h++){
		if(h>maxDepth){
			console.log(`maxDepth of ${maxDepth} reached.`);
			break;
		}
		if(!hashedList){
			//uses a weighted average of the max depth read within the hashtable 
			avgNodeDepth=0.01*(avgNodeDepth*99+h);
			node.depth=h;
			if(node.result===null&node.distance>=4){
				node.result = getResult(node);
			}

			if(previousNode)previousNode.nextHashedNode=node;
			if(!hashTable[node.key%hashTable.length]){
				hashTable[node.key%hashTable.length]=node;
			}

			numberOfNodes++;
			break;
		}else if(isEqual(hashedList,node)){
			node=hashedList;
			if(previousNode)previousNode.nextHashedNode=node;
			if(!hashTable[node.key%hashTable.length]){
				hashTable[node.key%hashTable.length]=node;
			}
			break;
		}

		previousNode=hashedList;
		hashedList=hashedList.nextHashedNode;
	}

	return node;
}

function isEqual(tree1, tree2){
	if(tree1===tree2){
		return true;
	}else if(tree1&&tree2){
		if(tree1.distance===1&&tree2.distance===1){
			if(tree1.value===tree2.value){
				return true;
			}
		}else if(tree1.distance===tree2.distance){
			for(let h = 0;h<4;h++){
				if(isEqual(tree1.child[h],tree2.child[h])===false)return false;
			}
			return true;
		}
	}
	return false;
}

function getValue(node){
	if(node.distance===1){
		return node.value;
	}else if(node.child[0].value!==null&&
	         node.child[0].value===node.child[1].value&&
	         node.child[1].value===node.child[2].value&&
	         node.child[2].value===node.child[3].value){
		return node.child[0].value;
	}else{
		return null;
	}
}

function doubleSize(node){
	emptyNodes=emptyNodes.map(()=>null);
	let temporaryNode=new TreeNode(node.distance<<1);
	for(let i = 0;i < 4;i++){
		temporaryNode.child[i]=new TreeNode(node.distance);
		temporaryNode.child[i].child[3-i]=node.child[i];

		emptyNodes[backgroundState]=getEmptyNode(node.distance>>>1);
		for(let j = 0;j < 4;j++){
			if(j!==3-i){
				temporaryNode.child[i].child[j]=emptyNodes[backgroundState];
			}
		}
		temporaryNode.child[i].value=getValue(temporaryNode.child[i]);
		temporaryNode.child[i]=writeNode(temporaryNode.child[i]);
	}
	temporaryNode.value=getValue(temporaryNode);
	return writeNode(temporaryNode);
}

//set the rule to Conway's Game of Life
parseINTGen("B3/S23");
GRID.head=writeNode(getEmptyNode(8));
let currentEvent=new EventNode(null);
updateDropdownMenu();
setActionMenu(selectArea.isActive);
//initializes the menu of draw states
setDrawMenu();
//set the rule and step size if cached by the browser
save();

if(location.search!==""){
	let params= new URLSearchParams(location.search);

	for (const [key, value] of params){
		console.log(`${key}:${value}`);
		let area, attributes;
		switch(key){
		case "gen":
			genCount=parseInt(value);
			document.getElementById("gens").innerHTML="Generation "+genCount;
			break;
		case "background":
			backgroundState=parseInt(value);
			break;
		case "step":
			stepSize=parseInt(value);
			document.getElementById("step").value=stepSize;
			break;
		case "resetStop":
			if(value==="false"){
				document.getElementById("resetStop").checked=false;
			}
			break;
		case "ratio":
			document.getElementById("density").value=parseInt(value);
			document.getElementById("percent").innerHTML = `${value}%`;
			break;
		case "selA":
			selectArea.isActive=true;
			setActionMenu(selectArea.isActive);
			area=value.split(".").map(str => parseInt(str));

			selectArea.top=area[0];
			selectArea.right=area[1];
			selectArea.bottom=area[2];
			selectArea.left=area[3];
			break;
		case "pasteA":
			pasteArea.isActive=true;
			setActionMenu(pasteArea.isActive);
			area=value.split(".").map(str => parseInt(str));

			pasteArea.top=area[0];
			pasteArea.left=area[1];
			break;
		case "pat":{
			area=[0,0,0,0];
			for(let i=0;i<4;i++)area[i]=parseInt(value.split(".")[i]);
			if(value.split(".").length===5){
				let pattern=base32ToPattern(area[1]-area[3],area[2]-area[0],LZ77ToBase32(value.split(".")[4]));
				GRID.head=widenTree({top:area[0],right:area[1],bottom:area[2],left:area[3]});
				GRID.head=writePatternToGrid(area[3],area[0],pattern,GRID.head);
				document.getElementById("population").innerHTML="Population "+(backgroundState===0?GRID.head.population:GRID.head.distance*GRID.head.distance-GRID.head.population);
			}else{
				GRID.type=parseInt(value.split(".")[4]);
				GRID.finiteArea={margin:GRID.type===1?1:0,top:area[0],right:area[1],bottom:area[2],left:area[3],newTop:area[0],newRight:area[1],newBottom:area[2],newLeft:area[3]},
				//add appropriate margin to pattern
				GRID.finiteArray=base32ToPattern(area[1]-area[3]+2*GRID.finiteArea.margin,area[2]-area[0]+2*GRID.finiteArea.margin,LZ77ToBase32(value.split(".")[5]));
				document.getElementById("population").innerHTML="Population "+gridPopulation;
			}
			break;
		}
		case "rule":
			document.getElementById("rule").value=decodeURIComponent(value);
			rule(decodeURIComponent(value));
			break;
		case "slot":
			activeClipboard=parseInt(value);
			document.getElementById("copyMenu").children[0].innerHTML=value;
			for(let i=0;i<document.getElementById("copyMenu").children[1].children.length;i++){
				if(value===document.getElementById("copyMenu").children[1].children[i].innerHTML){
					document.getElementById("copyMenu").children[1].children[i].style.display="none";
				}else{
					document.getElementById("copyMenu").children[1].children[i].style.display="inline-block";
				}
			}
			break;
		case "slots":
			attributes=value.split(".");
			for(let i=0;i*3<attributes.length;i++){
				clipboard[i+1]=base32ToPattern(parseInt(attributes[i*3]),parseInt(attributes[i*3+1]),LZ77ToBase32(attributes[i*3+2]));
				if(i>0){
					document.getElementById("copyMenu").children[1].innerHTML+=`<button onclick="changeOption(this);">${i+2}</button>`;
					clipboard.push([]);
				}
			}
			break;
		case "marker":
			attributes=value.split(".").map(str => parseInt(str));
			for(let i=0;i*5<attributes.length;i++){
				markers[attributes[i*5]]={activeState:1,top:attributes[i*5+1],right:attributes[i*5+2],bottom:attributes[i*5+3],left:attributes[i*5+4]};
			}
			break;

		case "rleMargin":
			document.getElementById("rleMargin").value=value;
			break;
		case "userReset":
			document.getElementById("userReset").checked=true;
			break;

		//import search options
		case "search":{
			//iterate trough each option to be imported
			attributes=value.split(".");
			for(let i = 0; i < attributes.length; i++){
				const fields=attributes[i].split(",");
				let currentFieldElement=document.getElementById("searchOptions").lastElementChild.children[1].children[0];
				let shipInfo=null;
				//import information for the "Generate Salvo" option
				if(decodeURIComponent(fields[0])==="Generate Salvo"&&isNaN(fields[3])){
					shipInfo={clipboardSlot:-1, ship:[], dx:0, dy:0, repeatTime:0, minIncrement:0, minAppend:0, progress:[{delay:[0],isActiveBranch:0}]};
					//setting the info property prevents it from being initialized within changeOption();
					const shipWidth=parseInt(fields[1]),shipHeight=parseInt(fields[2]);
					for(let k=3;k<maxDepth;k++){
						if(!isNaN(fields[k])){
							shipInfo.dx=parseInt(fields[k]);
							shipInfo.dy=parseInt(fields[k+1]);
							fields.splice(1,k+1);
							break;
						}
						shipInfo.ship.push(base32ToPattern(shipWidth,shipHeight,LZ77ToBase32(fields[k])));
					}
					currentFieldElement.nextElementSibling.info=shipInfo;
				}
				//iterate through each setting within the option
				for(let j=0;j<fields.length;j++){
					if(currentFieldElement.className==="dropdown"){
						//fix issue of changeOption analyzing the clipboard before the repeatTime, clipboardSlot, etc are set
						if(fields[j]!=="")changeOption(findElementContaining(currentFieldElement,decodeURIComponent(fields[j])));
						currentFieldElement=currentFieldElement.nextElementSibling;
					}else if(currentFieldElement.tagName==="INPUT"){
						currentFieldElement.value=fields[j];
						if(shipInfo!==null){
							switch(j){
							case 1:
								shipInfo.repeatTime=parseInt(fields[j]);
								break;
							case 2:
								shipInfo.clipboardSlot=parseInt(fields[j]);
								break;
							case 3:
								for(let k=0;k<=parseInt(fields[j]);k++){
									incrementSearch(shipInfo);
								}
								break;
							}
						}
						currentFieldElement=currentFieldElement.nextElementSibling;
					}
					if(currentFieldElement.className==="conditionTerm"){
						if(currentFieldElement.children.length===0){
							break;
						}else{
							currentFieldElement=currentFieldElement.children[0];
						}
					}
				}
			}
		}
		}
	}

	currentEvent=new EventNode(null);
	render();
}

function findElementContaining(element,str){
	if(element.innerHTML===str){
		return element;
	}else{
		for (let i = 0; i < element.children.length; i++) {
			let result=findElementContaining(element.children[i],str);
			if(result!==null)return result;
		}
		return null;
	}
}

function exportOptions(){
	let text=window.location.protocol +
	         "//" +
	         window.location.host +
	         window.location.pathname+
	         "?v=0.3.5";

	if(resetEvent!==null)setEvent(resetEvent);
	if(drawMode!==-1){
		text+="&draw="+drawMode;
	}

	if(genCount!==0)text+="&gen="+genCount;

	if(backgroundState!==0)text+="&background="+backgroundState;

	if(stepSize!==1)text+="&step="+stepSize;

	if(selectArea.isActive)text+=`&selA=${selectArea.top}.${selectArea.right}.${selectArea.bottom}.${selectArea.left}`;

	if(pasteArea.isActive)text+=`&pasteA=${pasteArea.top}.${pasteArea.left}`;
	
	if(isElementCheckedById("resetStop")===false)text+="&resetStop=false";

	if(rulestring!=="B3/S23"){
		text+="&rule="+encodeURIComponent(rulestring);
	}
	
	let area, patternCode;
	if(GRID.type===0){
		if(GRID.head.value!==0){
			const buffer=GRID.head;
			if(resetEvent!==null)GRID.head=resetEvent.head;
			area=[(getTopBorder(GRID.head)??0)/2-0.5,(getRightBorder(GRID.head)??0)/2+0.5,(getBottomBorder(GRID.head)??0)/2+0.5,(getLeftBorder(GRID.head)??0)/2-0.5];
			patternCode=base32ToLZ77(patternTobase32(readPattern(...area,GRID)));
			GRID.head=buffer;
			text+=`&pat=${area.join(".")}.${patternCode}`;
		}
	}else{
		area=[GRID.finiteArea.top,GRID.finiteArea.right,GRID.finiteArea.bottom,GRID.finiteArea.left];
		patternCode=base32ToLZ77(patternTobase32(GRID.finiteArray));
		text+=`&pat=${area.join(".")}.${GRID.type}.${patternCode}`;
	}

	if(activeClipboard!==1)text+="&slot="+activeClipboard;

	if(clipboard.length>3||clipboard[1]){
		text+="&slots=";
		for(let i=1;i<clipboard.length-1;i++){
			if(i>1)text+=".";
			if(clipboard[i]&&clipboard[i].length>0){
				text+=`${clipboard[i].length}.${clipboard[i][0].length}.${base32ToLZ77(patternTobase32(clipboard[i]))}`;
			}else{
				text+="0.0.";
			}
		}
	}

	if(document.getElementById("density").value!=="50"){
		text+="&ratio="+document.getElementById("density").value;
	}

	let markerString="";
	for(let i=0;i<markers.length;i++){
		if(markers[i].activeState){
			if(markerString!=="")markerString+=".";
			markerString+=`${i}.${markers[i].top}.${markers[i].right}.${markers[i].bottom}.${markers[i].left}`;
		}
	}
	if(markerString!=="")text+="&marker="+markerString;

	if(document.getElementById("rleMargin").value!=="16")text+="&rleMargin="+document.getElementById("rleMargin").value;

	if(isElementCheckedById("userReset")===true)text+="&userReset=true";

	const options=document.getElementById("searchOptions").children;
	if(options.length>1){
		text+="&search=";
		for(let i=0;i<options.length-1;i++){
			let currentField=options[i].children[1].children[0];
			for(let j=0;j<maxDepth;j++){
				if(currentField.className==="dropdown"&&currentField.nextElementSibling.className==="conditionTerm"&&currentField.nextElementSibling.innerHTML===""){
					break;
				}
				if(j===0){
					if(i!==0)text+=".";
				}else{
					text+=",";
				}
				if(currentField.className==="dropdown"){
					text+=encodeURIComponent(currentField.children[0].innerHTML);
					currentField=currentField.nextElementSibling;
				}else if(currentField.tagName==="INPUT"){
					text+=encodeURIComponent(currentField.value);
					currentField=currentField.nextElementSibling;
				}
				if(currentField.className==="conditionTerm"){
					if("info" in currentField){
						text+=`,${currentField.info.ship[0].length},${currentField.info.ship[0][0].length}`;
						for(let k=0;k<currentField.info.ship.length;k++){
							text+=","+base32ToLZ77(patternTobase32(currentField.info.ship[k]));
						}
						text+=`,${currentField.info.dx},${currentField.info.dy}`;
					}
					if(currentField.children.length===0/*||(currentField.children[0].className==="dropdown"&&currentField.children[0].children[0].innerHTML==="")*/){
						break;
					}else{
						currentField=currentField.children[0];
					}
				}
			}
		}
	}

	document.getElementById("settingsExport").innerHTML=text;
	document.getElementById("settingsExport").href=text;

	if(resetEvent!==null)setEvent(currentEvent);
}

//mouse input
canvas.onmousedown = function(event){
	mouse.clickType = event.buttons;
	if(event.target.nodeName==="CANVAS")canvas.focus();
	dragID=0;
	getInput(event);
	inputReset();
	if(isKeyBeingPressed===false&&isPlaying===0){
		if(mouse.active)update();
		render();
	}
	event.preventDefault();
};
canvas.onmousemove = function(event){
	mouse.clickType = event.buttons;
	getInput(event);
	if(isKeyBeingPressed===false&&isPlaying===0){
		if(mouse.active)update();
		render();
	}
};

window.onmouseup = function(event){
	mouse.clickType= 0;
	dragID=0;
	getInput(event);
	inputReset();
	if(isKeyBeingPressed===false&&isPlaying===0){
		if(mouse.active)update();
		render();
	}
};

window.onkeydown = function(event){
	//if a key is pressed for the first time then reset the timer for the movement multiplier
	if(isKeyBeingPressed===false)timeOfLastUpdate=0;
	
	if(event.ctrlKey===false&&event.keyCode!==9&&event.keyCode!==32&&(event.keyCode<37||event.keyCode>40)&&event.target.nodeName!=="TEXTAREA"&&(event.target.nodeName!=="INPUT"||event.target.type!="text")){
		key[event.keyCode]=true;
		if(isKeyBeingPressed===false&&isPlaying===0){
			update();
			render();
		}
		//set the flag that a key is down
		isKeyBeingPressed=true;

		//1,2 and 3 for switching modes
		if(key[49])draw();
		if(key[50])move();
		if(key[51])select();

		//x,c and v for cut,copy and paste
		if(key[88])cut();
		if(key[67])copy();
		if(key[86]){
			paste();
			render();
		}
		//enter to start and stop
		if(key[13])start(0);

		//n for next gen
		if(key[78])next();

		//shift and s to select all
		if(key[16]&&key[83])selectAll();

		//r to randomize
		if(key[82]&&selectArea.isActive)randomizeGrid(selectArea);

		//delete to clear
		if(key[75])clearGrid();

		//i to return to initial state
		if(key[73])invertGrid();

		//f to fit view
		if(key[70])fitView();

		//m to set a marker
		if(key[77])setMark();

		//delete key to delete a marker
		if(key[46])deleteMarker();

		// z for undo and shift z for redo
		if(key[90]){
			if(key[16]){
				redo();
			}else{
				undo();
			}
		}
		//t to reset to initial state
		if(key[84]){
			reset(isElementCheckedById("resetStop")===true);
			resetActions();
		}

		event.preventDefault();
	}
};

window.onkeyup = function(event){
	key[event.keyCode]=false;

	isKeyBeingPressed=false;
	for(let h in key){
		if(key[h]===true)isKeyBeingPressed=true;
	}
};

window.onresize = function(){
	if(isPlaying===0){
		scaleCanvas();
		render();
	}
	updateDropdownMenu();
};

window.onscroll = function(){
	updateDropdownMenu();
};

//touch inputs
canvas.ontouchstart = function(event){
	dragID=  0;
	getInput(event);
	inputReset();
	if(event.cancelable)event.preventDefault();
	if(isKeyBeingPressed===false&&isPlaying===0){
		if(mouse.active)update();
		render();
	}
};

canvas.ontouchend = function(event){
	dragID=  0;
	getInput(event);
	inputReset();
	if(isKeyBeingPressed===false&&isPlaying===0){
		if(mouse.active)update();
		render();
	}
};

canvas.ontouchmove = function(event){
	getInput(event);
	if(isKeyBeingPressed===false&&isPlaying===0){
		if(mouse.active)update();
		render();
	}
};

//controls zooming of the camera using the mouse wheel
canvas.onwheel = function(event){
	const deltaZoom=0.1;
	if(event.deltaY<0){
		view.x+=(mouse.x-300)/cellWidth/view.z*deltaZoom/(1+deltaZoom);
		view.y+=(mouse.y-200)/cellWidth/view.z*deltaZoom/(1+deltaZoom);
		view.z*=1+deltaZoom;
	}else{
		view.z/=1+deltaZoom;
		view.x-=(mouse.x-300)/cellWidth/view.z*deltaZoom/(1+deltaZoom);
		view.y-=(mouse.y-200)/cellWidth/view.z*deltaZoom/(1+deltaZoom);
	}
	if(event.cancelable)event.preventDefault();
	if(isKeyBeingPressed===false&&isPlaying===0){
		update();
		render();
	}
};

//update the randomize density slider
document.getElementById("density").oninput = function() {
	document.getElementById("percent").innerHTML = `${this.value}%`;
};

function updateDropdownMenu(){
	if(document.getElementsByClassName("dropdown-button")[1].getBoundingClientRect().top<240||
	   document.getElementsByClassName("dropdown-button")[1].getBoundingClientRect().bottom<window.innerHeight-240){
	   document.getElementsByClassName("dropdown-content")[1].style.bottom="unset";
	}else{
		document.getElementsByClassName("dropdown-content")[1].style.bottom="30px";
	}
}

//resets various values at the start and end of inputs
function inputReset(){
	//reset mouse variables
	mouse.pastX=mouse.x;
	mouse.pastY=mouse.y;
	mouse.pastX2=mouse.x2;
	mouse.pastY2=mouse.y2;
	//reset viewport variables
	view.touchX=view.x;
	view.touchY=view.y;
	view.touchZ=view.z;
	//reset drawState and save any changes to the grid
	if(drawnState!==-1){
		drawnState=-1;
		let currentChange=accumulateChanges, changedCells=new Array(changeCount);
		for(let i=0;i<changeCount;i++){
			if(currentChange.parent===null)break;
			currentChange=currentChange.parent;
			changedCells[i]=currentChange.value;
		}

		if(socket&&resetEvent===null)socket.emit("draw", Date.now(), changedCells);
		currentEvent=new EventNode(currentEvent, Date.now(), "draw", changedCells);
		
		changeCount=0;
		accumulateChanges=new ListNode(null);
	}
	//reset the selected area variables
	if(selectArea.isActive===true){
		selectArea.pastLeft=selectArea.left;
		selectArea.pastTop=selectArea.top;
		selectArea.pastRight=selectArea.right;
		selectArea.pastBottom=selectArea.bottom;
	}
	if(pasteArea.isActive){
		pasteArea.pastLeft=pasteArea.left;
		pasteArea.pastTop=pasteArea.top;
	}
	if(GRID.finiteArea.newTop!==GRID.finiteArea.top||GRID.finiteArea.newRight!==GRID.finiteArea.right||GRID.finiteArea.newBottom!==GRID.finiteArea.bottom||GRID.finiteArea.newLeft!==GRID.finiteArea.left){
		let resizedArray=new Array(GRID.finiteArea.newRight-GRID.finiteArea.newLeft+(GRID.type===1?2:0));
		for(let i=0; i<resizedArray.length;i++){
			resizedArray[i]=new Array(GRID.finiteArea.newBottom-GRID.finiteArea.newTop+(GRID.type===1?2:0));
			for(let j=0; j<resizedArray[0].length;j++){
				if(i>=GRID.finiteArea.left-GRID.finiteArea.newLeft+GRID.finiteArea.margin&&i<GRID.finiteArea.left-GRID.finiteArea.newLeft+GRID.finiteArray.length-GRID.finiteArea.margin&&j>=GRID.finiteArea.top-GRID.finiteArea.newTop+GRID.finiteArea.margin&&j<GRID.finiteArea.top-GRID.finiteArea.newTop+GRID.finiteArray[0].length-GRID.finiteArea.margin){
					resizedArray[i][j]=GRID.finiteArray[i+GRID.finiteArea.newLeft-GRID.finiteArea.left][j+GRID.finiteArea.newTop-GRID.finiteArea.top];
				}else{
					resizedArray[i][j]=backgroundState;
				}
			}
		}
		GRID.finiteArray=resizedArray;
		GRID.finiteArea.top=GRID.finiteArea.newTop;
		GRID.finiteArea.right=GRID.finiteArea.newRight;
		GRID.finiteArea.bottom=GRID.finiteArea.newBottom;
		GRID.finiteArea.left=GRID.finiteArea.newLeft;
	}

	//reset the markers
	selectedMarker=-1;
	if(selectArea.left===selectArea.right||selectArea.top===selectArea.bottom){
		selectArea.isActive=false;
		setActionMenu(selectArea.isActive);
	}
}

//gets mouse and touch inputs
function getInput(e){
	if(e.touches&&e.touches.length>0){
		mouse.x=(e.touches[0].clientX-canvas.getBoundingClientRect().left)/canvasHeight*400;
		mouse.y=(e.touches[0].clientY-canvas.getBoundingClientRect().top)/canvasHeight*400;
		mouse.active=true;
		if(e.touches.length>1){
			mouse.x2=(e.touches[1].clientX-canvas.getBoundingClientRect().left)/canvasHeight*400;
			mouse.y2=(e.touches[1].clientY-canvas.getBoundingClientRect().top)/canvasHeight*400;
		}else{
			mouse.x2=0;
			mouse.y2=0;
		}
	}else{
		if(mouse.clickType>0){
			mouse.active=true;
		}else{
			mouse.active=false;
		}
		mouse.x=(e.clientX-canvas.getBoundingClientRect().left)/canvasHeight*400;
		mouse.y=(e.clientY-canvas.getBoundingClientRect().top)/canvasHeight*400;
	}
}

//gets key inputs
function keyInput(){
	//] to zoom in
	if(key[221]){
		//code for zooming ralative to the cursor
		//view.x+=(mouse.x-300)/cellWidth/view.z*0.05/1.05*frameMultiplier;
		//view.y+=(mouse.y-200)/cellWidth/view.z*0.05/1.05*frameMultiplier;
		view.z*=1+0.05*frameMultiplier;
	}
	//[ to zoom out
	if(key[219]){
		view.z/=1+0.05*frameMultiplier;
		//code for zooming ralative to the cursor
		//view.x-=(mouse.x-300)/cellWidth/view.z*0.05/1.05*frameMultiplier;
		//view.y-=(mouse.y-200)/cellWidth/view.z*0.05/1.05*frameMultiplier;
	}
	if((key[219]||key[221])&&socket&&resetEvent===null)socket.emit("zoom", {id:clientId, zoom:view.z});
	if(view.z<0.2&&detailedCanvas===true){
		detailedCanvas=false;
		if(darkMode){
			canvas.style.backgroundColor="#282828";
		}else{
			canvas.style.backgroundColor="#e7e7e7";
		}
	}else if(view.z>0.2&&detailedCanvas===false){
		detailedCanvas=true;
		if(darkMode){
			canvas.style.backgroundColor="#222222";
		}else{
			canvas.style.backgroundColor="#f1f1f1";
		}
	}

	//wasd keys for move when shift is not pressed
	if(!key[16]){
		if(key[65])view.x-=0.5/view.z*frameMultiplier;
		if(key[87])view.y-=0.5/view.z*frameMultiplier;
		if(key[68])view.x+=0.5/view.z*frameMultiplier;
		if(key[83])view.y+=0.5/view.z*frameMultiplier;
		if((key[65]||key[87]||key[68]||key[83])&&socket&&resetEvent===null)socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
	}
}

function getColor(cellState){
	if(darkMode){
		if(cellState===0){
			return "#222";
		}else if(cellState===1){
			return "#f1f1f1";
		}else{
			let color=240/ruleArray[2]*(ruleArray[2]-cellState);
			return `rgb(${color},${color},${color})`;
		}
	}else{
		if(cellState===0){
			return "#f1f1f1";
		}else if(cellState===1){
			return "#000";
		}else{
			let color=240/ruleArray[2]*(cellState-1);
			return `rgb(${color},${color},${color})`;
		}
	}
}

//switch to draw mode
function draw(){
	if(pasteArea.isActive){
		pasteArea.isActive=false;
		if(activeClipboard===0)activeClipboard=parseInt(document.getElementById("copyMenu").children[0].innerHTML,10);
	}
	editMode=0;
	if(isPlaying===0)render();
}

//switch to move mode
function move(){
	editMode=1;
}

//swith to select mode
function select(){
	if(selectArea.isActive===true&&editMode===2)selectArea.isActive=false;
	pasteArea.isActive=false;
	if(activeClipboard===0)activeClipboard=parseInt(document.getElementById("copyMenu").children[0].innerHTML,10);
	setActionMenu(selectArea.isActive);
	editMode=2;
	if(isPlaying===0)render();
}

function setActionMenu(selectMode){
	let buttons=document.getElementsByClassName("selectDependent");
	if(selectMode===true){
		for(let i=0;i<buttons.length;i++)buttons[i].style.display="block";
	}else{
		for(let i=0;i<buttons.length;i++)buttons[i].style.display="none";
	}
	buttons=document.getElementsByClassName("markerDependent");
	for (let i = 0; i < markers.length; i++) {
		if(markers[i].activeState!==0){
			for(let i=0;i<buttons.length;i++)buttons[i].style.display="block";
			return 0;
		}
	}
	for(let i=0;i<buttons.length;i++)buttons[i].style.display="none";
}

function setDrawMenu(){
	document.getElementById("drawMenu").children[1].innerHTML="<button onclick=\"changeOption(this);\" style=\"display: none;\">Auto</button>";
	for(let i=0;i<ruleArray[2];i++){
		document.getElementById("drawMenu").children[1].innerHTML+=`<button onclick="changeOption(this);">${i}</button>`;

		if(i!==0)document.getElementById("drawMenu").children[1].children[i+1].style.backgroundColor=getColor(i);
		if(i>ruleArray[2]*0.8||i===0){
			if(darkMode){
				document.getElementById("drawMenu").children[1].children[i+1].style.color="#bbb";
			}else{
				document.getElementById("drawMenu").children[1].children[i+1].style.color="#000";
			}
		}else{
			if(darkMode){
				document.getElementById("drawMenu").children[1].children[i+1].style.color="#000";
			}else{
				document.getElementById("drawMenu").children[1].children[i+1].style.color="#bbb";
			}
		}
	}
}

function identify(){
	if(selectArea.isActive===false)selectAll();
	let patternInfo=findShip(selectArea,readPattern(selectArea.top,selectArea.right,selectArea.bottom,selectArea.left));
	document.getElementById("identifyOutput").innerHTML=`select area width: ${selectArea.right-selectArea.left}\n
	                                                     select area height: ${selectArea.bottom-selectArea.top}\n
	                                                     period: ${patternInfo.period}\n
	                                                     x displacement: ${patternInfo.dx}\n
	                                                     y displacement: ${patternInfo.dy}`;
}

function findShip(area,pattern){
	if(-1===findPattern(readPattern(area.top,area.right,area.bottom,area.left),pattern).x){
		return {dx:0, dy:0, period:0};
	}

	const maxPeriod=300,initialEvent=new EventNode(null);
	for(let period=1;period<maxPeriod;period++){
		gen();
		let searchArea=[area.top-period,area.right+period,area.bottom+period,area.left-period];
		let location=findPattern(readPattern(...searchArea),pattern);
		if(location.x!==-1){
			setEvent(initialEvent);
			return {dx:location.x+(searchArea[3]-area.left), dy:location.y+(searchArea[0]-area.top), period:period};
		}
	}
	
	setEvent(initialEvent);
	return {dx:0, dy:0, period:0};
}

function analyzeShip(pattern,searchData){
	if(!pattern){
		console.log("Invalid pattern submitted as ship/signal");
		alert("Invalid pattern submitted as ship/signal");
		return -1;
	}
	let initialEvent=new EventNode(null);
	//find period
	let shipInfo=findShip(selectArea,pattern);
	if(shipInfo.period!==0){
		searchData.dx=shipInfo.dx;
		searchData.dy=shipInfo.dy;
	}else{
		selectAll();
		shipInfo=findShip(selectArea,pattern);
		if(shipInfo.period!==0){
			searchData.dx=shipInfo.dx;
			searchData.dy=shipInfo.dy;
		}else{
			console.log("Ship/signal not found");
			alert("Ship/signal not found");
			return -1;
		}
	}

	//find displacement
	searchData.ship=new Array(shipInfo.period);
	let maxTop=   Math.min(selectArea.top,selectArea.top+searchData.dy);
	let maxRight= Math.max(selectArea.right,selectArea.right+searchData.dx);
	let maxBottom=Math.max(selectArea.bottom,selectArea.bottom+searchData.dy);
	let maxLeft=  Math.min(selectArea.left,selectArea.left+searchData.dx);

	//find pattern
	for(let j=0;j<shipInfo.period;j++){
		render();
		searchData.ship[j]=readPattern(maxTop,maxRight,maxBottom,maxLeft);
		console.log(maxTop+" "+maxRight);
		console.log(searchData.ship[j]);
		gen();
	}
	//reset
	setEvent(initialEvent);
	alert(`found ship\n period: ${shipInfo.period} width: ${maxRight-maxLeft} height: ${maxBottom-maxTop} dx: ${searchData.dx} dy: ${searchData.dy}`);
	console.log(`ship p${shipInfo.period} w${maxRight-maxLeft} h${maxBottom-maxTop} dx${searchData.dx} dy${searchData.dy}`);
	render();
	return 0;
}

function setMenu(elementId, value){
	if(!document.getElementById(elementId))return;
	for (let i = 0; i < document.getElementById(elementId).children[1].children.length; i++) {
		document.getElementById(elementId).children[1].children[i].style.display="block";
	}
	document.getElementById(elementId).children[1].children[value].style.display="none";
	document.getElementById(elementId).children[0].innerHTML=document.getElementById(elementId).children[1].children[value].innerHTML;
}

function searchAction(element){
	let conditionElement=element.children[1],i=0;
	while(conditionElement.lastElementChild.innerHTML!==""){
		if(conditionElement.condition(conditionElement.lastElementChild)===true){
			conditionElement=conditionElement.lastElementChild;
		}else{
			return -1;
		}
		i++;
		if(i>maxDepth)return -1;
	}
	//element is usually the expression class
	if(i>0)element.action(element.children[1]);
	return 0;
}

function getValuesFromRanges(string){
	let values=string.split(",");
	for(let i=0;i<values.length;i++){
		if(values[i].split("").includes("-")){
			const endPoints=values[i].split("-").map(num => parseInt(num));
			console.log(endPoints);
			let range=new Array(endPoints[1]-endPoints[0]+1);
			for(let j=0;j<range.length;j++){
				range[j]=endPoints[0]+j;
			}
			values[i]=range;
		}else{
			values[i]=parseInt(values[i]);
		}
	}
	return values.flat();
}

function setSalvoIteration(searchData, value){
	selectArea.isActive=true;
	selectArea.top=pasteArea.top+Math.min(0,-Math.ceil(searchData.progress.slice(-1)[0].delay.slice(-1)[0]/searchData.ship.length*searchData.dy));
	selectArea.right=pasteArea.left+Math.max(0,-Math.ceil(searchData.progress.slice(-1)[0].delay.slice(-1)[0]/searchData.ship.length*searchData.dx))+searchData.ship[0].length;
	selectArea.bottom=pasteArea.top+Math.max(0,-Math.ceil(searchData.progress.slice(-1)[0].delay.slice(-1)[0]/searchData.ship.length*searchData.dy))+searchData.ship[0][0].length;
	selectArea.left=pasteArea.left +Math.min(0,-Math.ceil(searchData.progress.slice(-1)[0].delay.slice(-1)[0]/searchData.ship.length*searchData.dx));
	GRID.head=widenTree(selectArea);
	let clearedArray = new Array(selectArea.right-selectArea.left);
	for(let i=0; i< clearedArray.length; i++){
		clearedArray[i]=new Array(selectArea.bottom-selectArea.top);
		clearedArray[i].fill(0);
	}
	GRID.head=writePatternToGrid(selectArea.left,selectArea.top, clearedArray, GRID.head);

	let numberOfCycles=parseInt(value);
	searchData.progress=[{delay:[0],isActiveBranch:0}];
	searchData.minIncrement=0;
	searchData.minAppend=0;
	for(let i = 0; i <= numberOfCycles; i++){
		incrementSearch(searchData);
	}

	console.log(searchData.progress);
	for(let i=0;i<searchData.progress.slice(-1)[0].delay.length;i++){
		let xPosition=searchData.progress.slice(-1)[0].delay[i]/searchData.ship.length, yPosition=searchData.progress.slice(-1)[0].delay[i]/searchData.ship.length;
		GRID.head=writePatternToGrid((pasteArea.left-(xPosition > 0 ? Math.ceil(xPosition) : Math.floor(xPosition))*searchData.dx+Math.min(0,searchData.dx)),(pasteArea.top-(yPosition > 0 ? Math.ceil(yPosition) : Math.floor(yPosition))*searchData.dy+Math.min(0,searchData.dy)), searchData.ship[(searchData.ship.length-searchData.progress.slice(-1)[0].delay[i]%searchData.ship.length)%searchData.ship.length], GRID.head);
	}
}

//save area of "contains"is the next task
function changeOption(target){
	let dropdown = target.parentElement;
	let expression=dropdown.parentElement.parentElement;
	let option=expression.parentElement;

	let menuIndex=Array.from(dropdown.children).indexOf(target);

	//add another space to the search options when the last is selected
	if(option===option.parentElement.lastElementChild&&expression.className==="expression"){
		let newExpression=document.createElement("div");
		newExpression.innerHTML=option.innerHTML;
		option.parentElement.appendChild(newExpression);
	}

	if(target===dropdown.lastElementChild&&dropdown.parentElement.id==="copyMenu"){
		dropdown.innerHTML+=`<button onclick="changeOption(this);">${menuIndex+2}</button>`;
		clipboard.push([]);
	}

	if(dropdown.parentElement.id==="gridMenu"){
		for(let i = 0; i < dropdown.children.length; i++){
			if(target===dropdown.children[i]){
				if(GRID.type!==i){
					let results=exportPattern();
					GRID.type=i;
					if(socket)socket.emit("changeGrid", GRID.type);
					console.log("importGridPattern");
					importPattern(results.pattern,results.xOffset,results.yOffset);
				}
				currentEvent=new EventNode(currentEvent);
				break;
			}
		}
	}

	//hide the selected option within the dropdown menu
	for(let i=0;i<dropdown.children.length;i++){
		dropdown.children[i].style.display="inline-block";
	}
	target.style.display="none";

	const conditionHTML=`<div class="dropdown">
		                     <button class="dropdown-button"></button>
			                   <div class="dropdown-content">
				                   <button onclick="changeOption(this);">Pattern Stablizes</button>
				                   <button onclick="changeOption(this);">Generation</button>
				                   <button onclick="changeOption(this);">Population</button>
				                   <button onclick="changeOption(this);">Pattern Contains</button>
			                   </div>
		                   </div>
		                   <div class="conditionTerm" style="display: inline-block"></div>`;
	const dropdownOptions=[[
		{name: "Reset",
		 html: " when "+conditionHTML,
		 action: () => {reset(false);}},
		{name: "Shift",
		 html: `<div class="dropdown">
			        <button class="dropdown-button"></button>
				      <div class="dropdown-content">
					      <button onclick="changeOption(this);">Select Area</button>
					      <button onclick="changeOption(this);">Paste Area</button>
				      </div>
			      </div>
			      right
			      <input type="text" value="0" class="shortText">
			      and down 
			      <input type="text" value="0" class="shortText">
			      `+" when "+conditionHTML,
		 action: (element) => {
			 if(element.children[0].children[0].innerHTML==="Select Area"){
				 selectArea.top+=parseInt(element.children[2].value);
				 selectArea.right+=parseInt(element.children[1].value);
				 selectArea.bottom+=parseInt(element.children[2].value);
				 selectArea.left+=parseInt(element.children[1].value);
			 }else if(element.children[0].children[0].innerHTML==="Paste Area"&&pasteArea.isActive){
				 pasteArea.top+=parseInt(element.children[2].value);
				 pasteArea.left+=parseInt(element.children[1].value);
				 currentEvent=writePatternAndSave(pasteArea.left,pasteArea.top,clipboard[activeClipboard]);
				 if(socket&&resetEvent===null)socket.emit("paste", Date.now(), currentEvent.paste);
			 }
		 }},
		{name: "Randomize",
		 html: `<div class="dropdown">
			        <button class="dropdown-button"></button>
				      <div class="dropdown-content area-dropdown">
					      <button onclick="changeOption(this);">Select Area</button>
				      </div>
			      </div>
		        when`+conditionHTML,
		 action: (element) => {
			 if(selectArea.isActive&&element.children[0].children[0].innerHTML==="Select Area"){
				 randomizeGrid(selectArea);
			 }else if(element.children[0].children[0].innerHTML.includes("Marker")){
				 const marker=markers[parseInt(element.children[1].children[0].innerHTML[7])-1];
			   if(marker.activeState!==0)randomizeGrid(marker);
			 }
			 currentEvent=new EventNode(currentEvent);
		 }},
		{name: "Save Pattern",
		 html: " when "+conditionHTML,
		 action: () => {
			 if(document.getElementById("rle").value==="")document.getElementById("rle").value="x = 0, y = 0, rule = "+rulestring+"\n";
			 document.getElementById("rle").value=appendRLE(exportRLE());
		 }},
		{name: "Generate Salvo",
		 html: ` with repeat time <input type="text" value="0" class="shortText" onchange="this.parentElement.info.repeatTime=parseInt(this.value);">
		         using pattern in copy slot <input type="text" placeholder="None" style="width:40px;" onchange="if(clipboard[parseInt(this.value)]&&0===analyzeShip(clipboard[parseInt(this.value)],this.parentElement.info))this.parentElement.info.clipboardSlot=parseInt(this.value);">;
		         iteration <input type="text" class="salvoProgress" value="${0}" onchange="setSalvoIteration(this.parentElement.info,parseInt(this.value))" style="width:40px;">
		         when `+conditionHTML,
		 Info: class{
			 constructor(){
				 this.clipboardSlot=-1;
				 this.ship=[];
				 this.dx=0;
				 this.dy=0;
				 this.repeatTime=0;
				 this.minIncrement=0;
				 this.minAppend=0;
				 this.progress=[{delay:[0],isActiveBranch:0}];
				 //analyze ship initializes the info of the ship if a ship is found
				 if(clipboard[activeClipboard]&&0===analyzeShip(clipboard[activeClipboard],this)){
					 this.clipboardSlot=activeClipboard;
				 }
			 }
		 },
		 action: (element) => {
			 if(element.info.ship.length>0&&pasteArea.isActive){
				 incrementSearch(element.info);
				 selectArea.isActive=true;
				 selectArea.top=pasteArea.top+Math.min(0,-Math.ceil(element.info.progress.slice(-1)[0].delay.slice(-1)[0]/element.info.ship.length*element.info.dy));
				 selectArea.right=pasteArea.left+Math.max(0,-Math.ceil(element.info.progress.slice(-1)[0].delay.slice(-1)[0]/element.info.ship.length*element.info.dx))+element.info.ship[0].length;
				 selectArea.bottom=pasteArea.top+Math.max(0,-Math.ceil(element.info.progress.slice(-1)[0].delay.slice(-1)[0]/element.info.ship.length*element.info.dy))+element.info.ship[0][0].length;
				 selectArea.left=pasteArea.left +Math.min(0,-Math.ceil(element.info.progress.slice(-1)[0].delay.slice(-1)[0]/element.info.ship.length*element.info.dx));
				 GRID.head=widenTree(selectArea);
				 let clearedArray = new Array(selectArea.right-selectArea.left);
				 for(let i=0; i< clearedArray.length; i++){
					 clearedArray[i]=new Array(selectArea.bottom-selectArea.top);
					 clearedArray[i].fill(0);
				 }
				 const previousPattern=readPattern(selectArea.top,selectArea.right, selectArea.bottom,selectArea.left);
				 writePattern(selectArea.left,selectArea.top, clearedArray, GRID);

				 for(let i=0;i<element.info.progress.slice(-1)[0].delay.length;i++){
					 let LeftPosition=element.info.progress.slice(-1)[0].delay[i]/element.info.ship.length, TopPosition=element.info.progress.slice(-1)[0].delay[i]/element.info.ship.length;
					 writePattern((pasteArea.left-(LeftPosition > 0 ? Math.ceil(LeftPosition) : Math.floor(LeftPosition))*element.info.dx+Math.min(0,element.info.dx)),(pasteArea.top-(TopPosition > 0 ? Math.ceil(TopPosition) : Math.floor(TopPosition))*element.info.dy+Math.min(0,element.info.dy)), element.info.ship[(element.info.ship.length-element.info.progress.slice(-1)[0].delay[i]%element.info.ship.length)%element.info.ship.length], GRID);
				 }
				 if(socket)socket.emit("paste", Date.now(), {newPatt:[selectArea.left,selectArea.top,readPattern(selectArea.top,selectArea.right, selectArea.bottom,selectArea.left)], oldPatt:[selectArea.left,selectArea.top,previousPattern]});
				 element.children[2].value=`${element.info.progress.length-1}`;
				 currentEvent=new EventNode(currentEvent);
			 }
		 }},
		{name: "Increment Area",
		 html: `<div class="dropdown">
			        <button class="dropdown-button"></button>
				      <div class="dropdown-content area-dropdown">
					      <button onclick="changeOption(this);">Select Area</button>
				      </div>
			      </div>
		        when`+conditionHTML,
		 action: (element) => {
			 if(selectArea.isActive&&element.children[0].children[0].innerHTML==="Select Area"){
				 incrementArea(selectArea);
			 }else if(element.children[0].children[0].innerHTML.includes("Marker")){
				 const marker=markers[parseInt(element.children[1].children[0].innerHTML[7])-1];
			   if(marker.activeState!==0)incrementArea(marker);
			 }
			 currentEvent=new EventNode(currentEvent);
		 }}],
	 [{name: "Reset",
		 html: "and when "+conditionHTML,
		 condition: () => wasReset},
	  {name: "Pattern Stablizes",
		 html: `except period(s) <input type="text" placeholder="2,3,7,18" data-name="excludedPeriods">
		        and when `+conditionHTML,
		 condition: (element) => {
			 let indexedEvent=currentEvent.parent;
			 let excludedPeriods=getValuesFromRanges(element.children[0].value);
			 for(let i=1;i<100;i++){
				 if(!indexedEvent)break;
				 if(GRID.head===indexedEvent.head){
				 	 if(!excludedPeriods.includes(i))return true;
				 	 break;
			   }
			   indexedEvent=indexedEvent.parent;
			 }
			 return false;
		 }},
	  {name: "Generation",
		 html: `is <input type="text" class="shortText">
		        and when`+conditionHTML,
		 condition: (element) =>  genCount>=parseInt(element.children[0].value)},
	  {name: "Population",
		 html: `is <input type="text" class="shortText" placeholder="6,15,20-24">
		        and when`+conditionHTML,
		 condition: (element) =>  {
			 let populationCounts=getValuesFromRanges(element.children[0].value);
			 if(GRID.type===0){
				 return populationCounts.includes(GRID.head.population);
			 }else{
				 return populationCounts.includes(gridPopulation);
			 }
		 }},
	  {name: "Pattern Contains",
		 html: `<div class="dropdown">
			        <button class="dropdown-button"></button>
				      <div class="dropdown-content area-dropdown copy-slot">
					      <button onclick="changeOption(this);">Select Area</button>
				      </div>
			      </div>
		        within
		        <div class="dropdown">
			        <button class="dropdown-button"></button>
				      <div class="dropdown-content area-dropdown">
					      <button onclick="changeOption(this);">Select Area</button>
				      </div>
			      </div>
		        and when`+conditionHTML,
		 condition: (element) => {
			 let pattern=[];
			 if(element.children[0].children[0].innerHTML==="Select Area"&&selectArea.isActive){
				 pattern=readPattern(selectArea.top,selectArea.right,selectArea.bottom,selectArea.left);
			 }else if(element.children[0].children[0].innerHTML.includes("Marker")){
			 	 //get marker based on the number within the button element
				 const marker=markers[parseInt(element.children[0].children[0].innerHTML.slice(7))-1];
				 if(marker.activeState!==0){
					 pattern=readPattern(marker.top,marker.right,marker.bottom,marker.left);
				 }else{
					 pattern=[];
				 }
			 }else if(element.children[0].children[0].innerHTML.includes("Copy Slot")){
			 	 //get clipboard based on the number within the button element
				 pattern=clipboard[parseInt(element.children[0].children[0].innerHTML.slice(10))];
			 }
			 console.log(pattern);
			 
			 if(!pattern||pattern.length===0)return false;
			 if(element.children[1].children[0].innerHTML==="Select Area"){
				 return selectArea.isActive&&-1!==findPattern(readPattern(selectArea.top,selectArea.right,selectArea.bottom,selectArea.left),pattern).x;
			 }else if(element.children[1].children[0].innerHTML.includes("Marker")){
				 const marker=markers[parseInt(element.children[1].children[0].innerHTML[7])-1];
				 if(marker.activeState!==0){
					 return -1!==findPattern(readPattern(marker.top,marker.right,marker.bottom,marker.left),pattern).x;
				 }else{
					 return false;
				 }
			 }else{
				 return false;
			 }}}]];


	if(expression.className==="expression"){
		for(let i=0;i<dropdownOptions[0].length;i++){
			if(dropdownOptions[0][i].name===target.innerText){
				expression.action=dropdownOptions[0][i].action;
				const firstCondition=expression.lastElementChild;
				firstCondition.innerHTML=dropdownOptions[0][i].html;
				//append a reset option to the top level condition dropdown(prevents feedbackloops by only adding reset condition to non reset actions)
				if(target.innerText!=="Reset")firstCondition.children[firstCondition.children.length-2].children[1].innerHTML+="<button onclick='changeOption(this);'>Reset</button>";
				//when setting up the condition, add info if the template has the Info property(and if the info property doesn't exist FSR? breaks without 2nd part)
				if(dropdownOptions[0][i].Info&&!("info" in firstCondition)){
					firstCondition.info=new dropdownOptions[0][i].Info;
					firstCondition.children[1].value=firstCondition.info.clipboardSlot===-1?"":`${firstCondition.info.clipboardSlot}`;
				}else if(!dropdownOptions[0][i].Info&&("info" in firstCondition)){
					//removes the info condition if a action with "Info" is changed to one without
					delete firstCondition.info;
					console.log(firstCondition);
					console.log("deleted info property from an element which shouldn't have it");
				}
				break;
			}
		}
	}
	if(expression.className==="conditionTerm"){
		for(let i=0;i<dropdownOptions[1].length;i++){
			if(dropdownOptions[1][i].name===target.innerText){
				expression.condition=dropdownOptions[1][i].condition;
				expression.lastElementChild.innerHTML=dropdownOptions[1][i].html;
				break;
			}
		}
	}
	//if the "action" menu is changed, clear the next elements
	let editedElement=document.createElement("button");
	editedElement.setAttribute("class", "dropdown-button");
	editedElement.innerHTML=target.innerHTML;
	//replaces the main button with the new action
	dropdown.previousElementSibling.replaceWith(editedElement);

	//update the copy slot settings
	if(dropdown.parentElement.id==="copyMenu"){
		activeClipboard=menuIndex+1;
		if(isPlaying===0)render();
	}

	//update the draw state settings
	if(dropdown.parentElement.id==="drawMenu"){
		drawMode=menuIndex-1;
		if(menuIndex>0){
			document.getElementById("drawMenu").children[0].style.backgroundColor=getColor(menuIndex-1);
		}
		if((menuIndex-1)>ruleArray[2]*0.8||menuIndex===1||menuIndex===0){
			if(darkMode){
				document.getElementById("drawMenu").children[0].style.color="#bbb";
			}else{
				document.getElementById("drawMenu").children[0].style.color="#000";
			}
		}else{
			if(darkMode){
				document.getElementById("drawMenu").children[0].style.color="#000";
			}else{
				document.getElementById("drawMenu").children[0].style.color="#bbb";
			}
		}
	}

	//update the menus containing "Select Area","Marker 1", "Marker 2", etc...
	updateSelectors();
	if(isPlaying===0)render();
}

function deleteOption(target){
	let option=target.parentElement;
	if(option.nodeName==="BUTTON")option=option.parentElement;
	if(option!==option.parentElement.lastElementChild)option.remove();
}

function widenTree(area,tree=GRID.head){
	let newTree=tree;
	for(let h=0;;h++){
		if(h>maxDepth){
			console.log(`maxDepth of ${maxDepth} reached.`);
			break;
		}
		if(-newTree.distance>4*area.top||newTree.distance<=4*area.right||newTree.distance<=4*area.bottom||-newTree.distance>4*area.left){
			newTree=doubleSize(newTree);
		}else{
			break;
		}
	}
	return newTree;
}

function selectAll(){
	if(GRID.head.value!==0){
		selectArea.isActive=true;
		setActionMenu(selectArea.isActive);
		if(GRID.type===0){
			selectArea.top=(getTopBorder(GRID.head)??0)/2-0.5;
			selectArea.right=(getRightBorder(GRID.head)??0)/2+0.5;
			selectArea.bottom=(getBottomBorder(GRID.head)??0)/2+0.5;
			selectArea.left=(getLeftBorder(GRID.head)??0)/2-0.5;
		}else{
			selectArea.top=GRID.finiteArea.top;
			selectArea.right=GRID.finiteArea.right;
			selectArea.bottom=GRID.finiteArea.bottom;
			selectArea.left=GRID.finiteArea.left;
		}
		if(isPlaying===0)render();
	}
}

function findPattern(area,pattern){
	for(let i=0;i<area.length-pattern.length+1;i++){
		for(let j=0;j<area[0].length-pattern[0].length+1;j++){
			let foundDifference=false;
			for(let k=0;k<pattern.length;k++){
				for(let l=0;l<pattern[0].length;l++){
					if(pattern[k][l]!==area[i+k][j+l]){
						foundDifference=true;
						break;
					}
				}
				if(foundDifference)break;
			}
			if(foundDifference===false)return {x:i,y:j};
		}
	}
	return {x:-1,y:-1};
}

function updateSalvoPattern(){
	if(!document.getElementById("searchOptions"))return;
	for(let i=0;i<document.getElementById("searchOptions").children.length-1;i++){
		if(document.getElementById("searchOptions").children[i].children[1].children[0].children[0].innerHTML==="Generate Salvo"){
			const conditionElement=document.getElementById("searchOptions").children[i].children[1].lastElementChild;
			if(conditionElement.children[1].value===""){
				conditionElement.info={clipboardSlot:-1,ship:[],dx:0,dy:0,repeatTime:parseInt(conditionElement.children[0].value),minIncrement:0,minAppend:0,progress:[{delay:[0],isActiveBranch:0}]};
				//analyze ship initializes the info of the ship if a ship is found
				if(clipboard[activeClipboard]&&0===analyzeShip(clipboard[activeClipboard],conditionElement.info)){
					conditionElement.info.clipboardSlot=activeClipboard;
					conditionElement.children[1].value=`${activeClipboard}`;
				}
			}
		}
	}
}

function copy(){
	if(pasteArea.isActive){
		pasteArea.isActive=false;
		if(activeClipboard===0)activeClipboard=parseInt(document.getElementById("copyMenu").children[0].innerHTML,10);
	}else if(selectArea.isActive===true){
		GRID.head=widenTree(selectArea);
		clipboard[activeClipboard]=readPattern(selectArea.top,selectArea.right,selectArea.bottom,selectArea.left);
		pasteArea.left=selectArea.left;
		pasteArea.top=selectArea.top;
		selectArea.isActive=false;
		setActionMenu(selectArea.isActive);
		updateSalvoPattern();
		render();
	}
}

function cut(){
	if(pasteArea.isActive){
		pasteArea.isActive=false;
		if(activeClipboard===0)activeClipboard=parseInt(document.getElementById("copyMenu").children[0].innerHTML,10);
	}else if(selectArea.isActive===true){
		GRID.head=widenTree(selectArea);
		clipboard[activeClipboard]=readPattern(selectArea.top,selectArea.right,selectArea.bottom,selectArea.left);
		pasteArea.left=selectArea.left;
		pasteArea.top=selectArea.top;
		let clearedArray = new Array(selectArea.right-selectArea.left);
		for(let i=0; i< clearedArray.length; i++){
			clearedArray[i]=new Array(selectArea.bottom-selectArea.top);
			clearedArray[i].fill(0);
		}
		currentEvent=writePatternAndSave(selectArea.left,selectArea.top, clearedArray);
		if(socket&&resetEvent===null)socket.emit("paste", Date.now(), currentEvent.paste);
		isPlaying=0;
		selectArea.isActive=false;
		setActionMenu(selectArea.isActive);
		render();
	}
}

function paste(){
	if(clipboard[activeClipboard]&&clipboard[activeClipboard].length!==0){
		if(pasteArea.isActive){
			currentEvent=writePatternAndSave(pasteArea.left,pasteArea.top,clipboard[activeClipboard]);
			console.log(currentEvent);
			if(socket&&resetEvent===null)socket.emit("paste", Date.now(), currentEvent.paste);
		}else{
			pasteArea.isActive=true;
			editMode=1;
			if(isPlaying===0)render();
		}
	}
}

//fill the grid with random cell states
function randomizeGrid(area){
	let randomArray=new Array(area.right-area.left);
	for(let i=0;i<randomArray.length;i++){
		randomArray[i]=new Array(area.bottom-area.top);
		for(let j=0;j<randomArray[0].length;j++){
			if(Math.random()<document.getElementById("density").value/100){
				randomArray[i][j]=1;
			}else{
				randomArray[i][j]=0;
			}
		}
	}

	currentEvent=writePatternAndSave(area.left,area.top, randomArray);
	if(socket&&resetEvent===null)socket.emit("paste", Date.now(), currentEvent.paste);
	render();
}

//run the CA for one generation within the provided area
function incrementArea(area){
	let initalArray=readPattern(area.top-1,area.right+1,area.bottom+1,area.left-1);

	currentEvent=writePatternAndSave(area.left,area.top, iteratePattern(initalArray,1,initalArray.length-1,initalArray[0].length-1,1));
	if(socket&&resetEvent===null)socket.emit("paste", Date.now(), currentEvent.paste);
	render();
}

//clear the grid
function clearGrid(){
	if(selectArea.isActive===true){
		let clearedArray = new Array(selectArea.right-selectArea.left);
		for(let i=0; i< clearedArray.length; i++){
			clearedArray[i]=new Array(selectArea.bottom-selectArea.top);
			clearedArray[i].fill(0);
		}
		currentEvent=writePatternAndSave(selectArea.left,selectArea.top, clearedArray);
		if(socket&&resetEvent===null)socket.emit("paste", Date.now(), currentEvent.paste);
	}
	render();
}

//fill the grid with the opposite cell state, states 2+ are unchanged
function invertGrid(){
	if(pasteArea.isActive){
		pasteArea.isActive=false;
		if(activeClipboard===0)activeClipboard=parseInt(document.getElementById("copyMenu").children[0].innerHTML,10);
	}else if(selectArea.isActive===true){
		GRID.head=widenTree(selectArea);
		let invertedArea=readPattern(selectArea.top,selectArea.right,selectArea.bottom,selectArea.left);

		for(let i=0; i<invertedArea.length; i++){
			for(let j=0; j<invertedArea[0].length; j++){
				if(invertedArea[i][j]===0||invertedArea[i][j]===1)invertedArea[i][j]=1-invertedArea[i][j];
			}
		}

		currentEvent=writePatternAndSave(selectArea.left,selectArea.top, invertedArea);
		if(socket&&resetEvent===null)socket.emit("paste", Date.now(), currentEvent.paste);
	}
	isPlaying=0;
	render();
}

function updateSelectors(){
	for(let i=0;i<document.getElementsByClassName("dropdown-content").length;i++){
		if(document.getElementsByClassName("dropdown-content")[i].className!=="dropdown-content")
			document.getElementsByClassName("dropdown-content")[i].innerHTML="";
		if(document.getElementsByClassName("dropdown-content")[i].className.includes("area-dropdown")){
			console.log(document.getElementsByClassName("dropdown-content")[i].className);
			document.getElementsByClassName("dropdown-content")[i].innerHTML+="<button onclick='changeOption(this);'>Select Area</button>";
			for(let j=0;j<markers.length;j++){
				if(markers[j].activeState){
					document.getElementsByClassName("dropdown-content")[i].innerHTML+=`\n<button onclick="changeOption(this);">Marker ${j+1}</button>`;
				}
			}
		}
		if(document.getElementsByClassName("dropdown-content")[i].className.includes("copy-slot")){
			for(let j=1;j<clipboard.length-1;j++){
				document.getElementsByClassName("dropdown-content")[i].innerHTML+=`\n<button onclick="changeOption(this);">Copy Slot ${j}</button>`;
			}
		}
	}
}

function deleteMarker(){
	for(let h = 0;h<markers.length;h++)
		if(markers[h].activeState===2)
			markers[h].activeState=0;
	updateSelectors();
	render();
}

//set default view
function fitView(){
	let top, right, bottom, left;
	if(GRID.type===0){
		top=(getTopBorder(GRID.head)??0)/2-0.5;
		right=(getRightBorder(GRID.head)??0)/2+0.5;
		bottom=(getBottomBorder(GRID.head)??0)/2+0.5;
		left=(getLeftBorder(GRID.head)??0)/2-0.5;
	}else{
		top=GRID.finiteArea.top;
		right=GRID.finiteArea.right;
		bottom=GRID.finiteArea.bottom;
		left=GRID.finiteArea.left;
	}
	if(top||top===0){
		view.x=(right+left)/2-15;
		view.y=(bottom+top)/2-10;
		view.touchX=0;
		view.touchY=0;
		view.z=Math.min(600/cellWidth/(right-left+2),400/cellWidth/(bottom-top+2));
		view.touchZ=view.z;
		if(view.z<0.2&&detailedCanvas===true){
			detailedCanvas=false;
			if(darkMode){
				canvas.style.backgroundColor="#282828";
			}else{
				canvas.style.backgroundColor="#e4e4e4";
			}
		}else if(view.z>0.2&&detailedCanvas===false){
			detailedCanvas=true;
			if(darkMode){
				canvas.style.backgroundColor="#222222";
			}else{
				canvas.style.backgroundColor="#f1f1f1";
			}
		}
		if(socket&&resetEvent===null){
			socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
			socket.emit("zoom", {id:clientId, zoom:view.z});
		}
		if(isPlaying===0)render();
	}
}

function setMark(){
	if(selectArea.isActive===true){
		for(let h=0;h<markers.length;h++){
			if(markers[h].activeState===0){
				selectArea.isActive=false;
				setActionMenu(selectArea.isActive);
				markers[h].activeState=1;
				markers[h].top=selectArea.top;
				markers[h].right=selectArea.right;
				markers[h].bottom=selectArea.bottom;
				markers[h].left=selectArea.left;
				break;
			}
		}
		updateSelectors();
	}
	if(isPlaying===0)render();
}

function isElementCheckedById(id){
	return document.getElementById(id).checked;
}

function setDark(){
	if(document.getElementById("darkTheme").checked){
		darkMode=1;
		if(detailedCanvas===true){
			canvas.style.backgroundColor="#222";
		}else{
			canvas.style.backgroundColor="#282828";
		}
		document.getElementById("LightTheme").disabled =true;
		document.getElementById("DarkTheme").disabled =false;
	}else{
		darkMode=0;
		if(detailedCanvas===true){
			canvas.style.backgroundColor="#f1f1f1";
		}else{
			canvas.style.backgroundColor="#e4e4e4";
		}
		document.getElementById("LightTheme").disabled =false;
		document.getElementById("DarkTheme").disabled =true;
	}
	setDrawMenu();
	render();
}

//move e frames forward
function next(){
	if(isPlaying===0){
		isPlaying=-1;
		main();
	}
}

//toggle updating the simulation
function start(newFrame){
	if(isPlaying===0){
		isPlaying=1;
		if(newFrame!==0)requestAnimationFrame(main);
	}else{
		isPlaying=0;
	}
}

function setEvent(gridEvent){
	if(!("type" in gridEvent)){
		setEvent(gridEvent.parent);
		if("draw" in gridEvent){
			for(let i=0;i<gridEvent.draw.length;i++){
				writePattern(gridEvent.draw[i].x,gridEvent.draw[i].y,[[gridEvent.draw[i].newState]], GRID);
			}
			if(socket&&resetEvent===null)socket.emit("draw",Date.now(),gridEvent.draw);
		}else if("paste" in gridEvent){
			writePattern(...gridEvent.paste.newPatt, GRID);
			if(socket&&resetEvent===null)socket.emit("paste",Date.now(),gridEvent.paste);
		}
	}else{
		if("generation" in gridEvent){
			genCount=gridEvent.generation;
			document.getElementById("gens").innerHTML="Generation "+genCount;
		}
		if("backgroundState" in gridEvent)backgroundState=gridEvent.backgroundState;

		if("resetEvent" in gridEvent)resetEvent=gridEvent.resetEvent;

		//redundent, remove at some point if "type" is still used for events storing the entire grid
		if("type" in gridEvent){
			GRID.type=gridEvent.type;
			setMenu("gridMenu",GRID.type);
			
			emptyNodes=emptyNodes.map(()=>null);
			if(GRID.type===0){
				GRID.head=gridEvent.head;
				document.getElementById("population").innerHTML="Population "+GRID.head.population;
			}else{
				if(typeof(gridEvent.finiteArray)==="string"){
					GRID.finiteArray=readRLE(gridEvent.finiteArray);
				}else{
					GRID.finiteArray=gridEvent.finiteArray;
				}
				GRID.finiteArea.top=gridEvent.finiteArea.top;
				GRID.finiteArea.right=gridEvent.finiteArea.right+GRID.finiteArray.length;
				GRID.finiteArea.bottom=gridEvent.finiteArea.bottom+GRID.finiteArray[0].length;
				GRID.finiteArea.left=gridEvent.finiteArea.left;
				GRID.finiteArea.margin=GRID.type===1?1:0;
			}
		}
	}
	currentEvent=gridEvent;
}

function undo(){
	if(currentEvent.parent!==null){
		if("draw" in currentEvent){
			for(let i=0;i<currentEvent.draw.length;i++){
				writePattern(currentEvent.draw[i].x,currentEvent.draw[i].y,[[currentEvent.draw[i].oldState]], GRID);
			}
			if(socket&&resetEvent===null)socket.emit("undoDraw",Date.now(),currentEvent.draw);
			currentEvent=currentEvent.parent;
		}else if("paste" in currentEvent){
			writePattern(...currentEvent.paste.oldPatt, GRID);
			
			if(socket&&resetEvent===null)socket.emit("undoPaste",Date.now(),currentEvent.paste);
			currentEvent=currentEvent.parent;
		}else{
			setEvent(currentEvent.parent);
		}
		//compare parents because the reset event may be a different event with identical values
		if(resetEvent!==null&&resetEvent.parent===currentEvent.parent)resetEvent=null;
	}
	isPlaying=0;
	render();
}

function redo(){
	if(currentEvent.child!==null){
		if("draw" in currentEvent.child){
			currentEvent=currentEvent.child;
			for(let i=0;i<currentEvent.draw.length;i++){
				writePattern(currentEvent.draw[i].x,currentEvent.draw[i].y,[[currentEvent.draw[i].newState]], GRID);
			}
			if(socket&&resetEvent===null)socket.emit("draw",Date.now(),currentEvent.draw);
		}else if("paste" in currentEvent){
			currentEvent=currentEvent.child;
			writePattern(...currentEvent.paste.newPatt, GRID);

			if(socket&&resetEvent===null)socket.emit("paste",Date.now(),currentEvent.paste);
		}else{
			setEvent(currentEvent.child);
		}
	}
	isPlaying=0;
	render();
}

//go to before the simulation started
function reset(pause=true){
	if(resetEvent!==null){
		setEvent(resetEvent);
		resetEvent=null;
		backgroundState=0;
	}
	wasReset=true;
	if(pause)isPlaying=0;
	render();
}

function resetActions(){
	if(isElementCheckedById("userReset")===false)return;

	const optionElements=document.getElementById("searchOptions").children;
	for(let i=0;i<optionElements.length-1;i++){
		if(optionElements[i].children[1].children[1].children[optionElements[i].children[1].children[1].children.length-2].children[0].innerHTML==="Reset"){
			searchAction(optionElements[i].children[1]);
		}
	}
}

function incrementSearch(searchData){
	if(searchData.progress.slice(-1)[0].delay.slice(-1)[0]===0){
		searchData.progress.slice(-1)[0].delay[1]=searchData.repeatTime;
	}else{
		if(searchData.repeatTime<=searchData.progress[searchData.minIncrement].delay.slice(-1)[0]-searchData.progress[searchData.minAppend].delay.slice(-1)[0]){
			searchData.progress.push({delay:[...searchData.progress[searchData.minAppend].delay,searchData.progress[searchData.minAppend].delay.slice(-1)[0]+searchData.repeatTime]});
			searchData.minAppend++;
		}else{
			searchData.progress.push({delay:[...searchData.progress[searchData.minIncrement].delay]});
			searchData.progress.slice(-1)[0].delay[searchData.progress.slice(-1)[0].delay.length-1]++;
			searchData.minIncrement++;
		}
	}
}

function appendRLE(rleText){
	let currentText=document.getElementById("rle").value;
	//remove exclamation mark from the end of the current RLE
	currentText=currentText.replace("!","").replace(/x *= *[0-9]+, *y *= *[0-9]+,/,"x = 0, y = 0,");
	let i=currentText.length;
	while("\n"!==currentText[i]&&i>0)i--;
	i+=70;
	currentText+=document.getElementById("rleMargin").value+"$"+rleText.replace(/.+\n/,"").replace(/\n/g,"");
	while(i<currentText.length){
		while(!isNaN(currentText[i])&&i>0){
			i--;
		}
		currentText=currentText.slice(0,i+1)+"\n"+currentText.slice(i+1);
		i+=70;
	}
	return currentText;
}

function menu(n){
	if(document.getElementById(`menu${n.toString()}`).style.display==="block"){
		document.getElementById(`arrow${n.toString()}`).innerHTML="&#x27A1";//rightward unicode arrow
		document.getElementById(`menu${n.toString()}`).style.display="none";
	}else{
		document.getElementById(`arrow${n.toString()}`).innerHTML="&#x2B07";//downward unicode arrow
		document.getElementById(`menu${n.toString()}`).style.display="block";
	}
}

//import several settings
function save(){
	//save the rule
	if(document.getElementById("rule").value!==rulestring&&document.getElementById("rule").value!==""){
		rule(document.getElementById("rule").value);
		if(socket)socket.emit("rule", rulestring);
	}
	//save step size
	if(document.getElementById("step").value){
		if(isNaN(document.getElementById("step").value)){
			alert("Genertions Per Update must be a number");
		}else{
			stepSize=parseInt(document.getElementById("step").value,10);
		}
	}
	isPlaying=0;
	render();
}

function getCell(startNode,xPos,yPos){
	let node=startNode,relativeX=xPos,relativeY=yPos;
	for(let h=0;;h++){
		if(h>maxDepth){
			console.log(`maxDepth of ${maxDepth} reached.`);
			break;
		}
		if(relativeY<0){
			if(relativeX<0){
				if(node.child[0]&&relativeX>=-node.distance&&relativeY>=-node.distance){
					node=node.child[0];
					relativeX+=node.distance;
					relativeY+=node.distance;
					if(node.distance===1){
						return node;
					}
				}else{
					return null;
				}
			}else{
				if(node.child[1]&&relativeX<node.distance&&relativeY>=-node.distance){
					node=node.child[1];
					relativeX-=node.distance;
					relativeY+=node.distance;
					if(node.distance===1){
						return node;
					}
				}else{
					return null;
				}
			}
		}else{
			if(relativeX<0){
				if(node.child[2]&&relativeX>=-node.distance&&relativeY<node.distance){
					node=node.child[2];
					relativeX+=node.distance;
					relativeY-=node.distance;
					if(node.distance===1){
						return node;
					}
				}else{
					return null;
				}
			}else{
				if(node.child[3]&&relativeX<node.distance&&relativeY<node.distance){
					node=node.child[3];
					relativeX-=node.distance;
					relativeY-=node.distance;
					if(node.distance===1){
						return node;
					}
				}else{
					return null;
				}
			}
		}
	}
}

function writePatternToGrid(xPos, yPos, pattern, node){
	const xSign=[-1,1,-1,1];
	const ySign=[-1,-1,1,1];
	if(node.distance===1){
		if(xPos<=0&&xPos+0.5>-pattern.length&&yPos<=0&&yPos+0.5>-pattern[0].length){
			let temporaryNode =  new TreeNode(node.distance);
			temporaryNode.value=pattern[-xPos-0.5][-yPos-0.5];
			return writeNode(temporaryNode);
		}else{
			return node;
		}
	}else{
		let temporaryNode=new TreeNode(node.distance);
		for(let i=0; i<4; i++){
			if((yPos>0&&i<2)||(xPos<-pattern.length&&i%2===1)||(xPos>0&&i%2===0)||(yPos<-pattern[0].length&&i>3)){
				temporaryNode.child[i]=node.child[i];
			}else{
				temporaryNode.child[i]=writePatternToGrid(xPos-0.25*(node.distance*xSign[i]), yPos-0.25*(node.distance*ySign[i]), pattern, node.child[i]);
			}
		}
		temporaryNode.value=getValue(temporaryNode);
		return writeNode(temporaryNode);
	}
}

function readPattern(topBorder,rightBorder,bottomBorder,leftBorder){
	let pattern=new Array(rightBorder-leftBorder);
	if(GRID.type===0){
		const tree=(arguments[4]===undefined)?GRID.head:arguments[4].head;
		for(let i=0;i<pattern.length;i++){
			pattern[i]=new Array(bottomBorder-topBorder);
			for(let j=0;j<pattern[i].length;j++){
				let cell=getCell(tree,2*(leftBorder+i),2*(topBorder+j));
				if(cell!==null){
					pattern[i][j]=cell.value;
				}else{
					pattern[i][j]=backgroundState;
				}
			}
		}
	}else{
		const finiteGrid=(arguments[4]!==undefined)?arguments[4].finiteArray:GRID.finiteArray;
		const finiteGridMargin=(arguments[4]!==undefined)?arguments[4].finiteArea.margin:GRID.finiteArea.margin;
		const finiteGridLeft=(arguments[4]!==undefined)?arguments[4].finiteArea.left:GRID.finiteArea.left;
		const finiteGridTop=(arguments[4]!==undefined)?arguments[4].finiteArea.top:GRID.finiteArea.top;
		for(let i=0;i<pattern.length;i++){
			pattern[i]=new Array(bottomBorder-topBorder);
			for(let j=0;j<pattern[i].length;j++){
				if(j+topBorder>=finiteGridTop-finiteGridMargin&&i+leftBorder<finiteGridLeft+finiteGrid.length+finiteGridMargin&&j+topBorder<finiteGridTop+finiteGrid[0].length+finiteGridMargin&&i+leftBorder>=finiteGridLeft-finiteGridMargin){
					pattern[i][j]=finiteGrid[i-finiteGridLeft+finiteGridMargin+leftBorder][j-finiteGridTop+finiteGridMargin+topBorder];
				}else{
					pattern[i][j]=arguments[4]?0:backgroundState;
				}
			}
		}
	}
	return pattern;
}

function writePatternAndSave(xPosition,yPosition,pattern){
	if(!pattern||pattern.length===0)return currentEvent;
	
	const previousPattern=readPattern(yPosition,xPosition+pattern.length,yPosition+pattern[0].length,xPosition,GRID);
	//if a grid other than the "main" grid is passed as a 4th argument
	if(GRID.type===0){
		//write to the provided infinte grid
		GRID.head=widenTree({top:yPosition,right:xPosition+pattern.length,bottom:yPosition+pattern[0].length,left:xPosition},GRID.head);
		GRID.head=writePatternToGrid(xPosition,yPosition, pattern, GRID.head);
	}else{
		//write to the provided finite grid
		let somethingChanged=false;
		/*for (let i = 0; i < pattern.length; i++) {
			for (let j = 0; j < pattern[0].length; j++) {
				if(j+yPosition>=finiteGridTop-finiteGridMargin&&i+xPosition<finiteGridLeft+finiteGrid.length-2+finiteGridMargin&&j+yPosition<finiteGridTop+finiteGrid[0].length-2+GRID.finiteArea.margin&&i+xPosition>=finiteGridLeft-finiteGridMargin){
					finiteGrid[i-finiteGridLeft+finiteGridMargin+xPosition][j-finiteGridTop+finiteGridMargin+yPosition]=pattern[i][j];
					somethingChanged=true;
				}
			}
		}*/
		for (let i = 0; i < pattern.length; i++) {
			for (let j = 0; j < pattern[0].length; j++) {
				if(j+yPosition>=GRID.finiteArea.top-GRID.finiteArea.margin&&i+xPosition<GRID.finiteArea.right+GRID.finiteArea.margin&&j+yPosition<GRID.finiteArea.bottom+GRID.finiteArea.margin&&i+xPosition>=GRID.finiteArea.left-GRID.finiteArea.margin){
					GRID.finiteArray[i-GRID.finiteArea.left+GRID.finiteArea.margin+xPosition][j-GRID.finiteArea.top+GRID.finiteArea.margin+yPosition]=pattern[i][j];
					somethingChanged=true;
				}
			}
		}
		if(somethingChanged===false)return currentEvent;
	}
	return new EventNode(currentEvent, Date.now(), "paste", {newPatt:[xPosition,yPosition,pattern], oldPatt:[xPosition,yPosition,previousPattern]});
}

function writePattern(xPosition,yPosition,pattern,objectWithGrid){
	//if the grid is infinite
	if(objectWithGrid.type!==0){
		//write to the finite grid
		for (let i = 0; i < pattern.length; i++) {
			for (let j = 0; j < pattern[0].length; j++) {
				if(j+yPosition>=objectWithGrid.finiteArea.top-objectWithGrid.finiteArea.margin&&i+xPosition<objectWithGrid.finiteArea.left+objectWithGrid.finiteArray.length-objectWithGrid.finiteArea.margin&&j+yPosition<objectWithGrid.finiteArea.top+objectWithGrid.finiteArray[0].length-objectWithGrid.finiteArea.margin&&i+xPosition>=objectWithGrid.finiteArea.left-objectWithGrid.finiteArea.margin){
					objectWithGrid.finiteArray[i-objectWithGrid.finiteArea.left+objectWithGrid.finiteArea.margin+xPosition][j-objectWithGrid.finiteArea.top+objectWithGrid.finiteArea.margin+yPosition]=pattern[i][j];
				}
			}
		}
	}else{
		//write to the  infinte grid
		objectWithGrid.head=widenTree({top:yPosition,right:xPosition+pattern.length,bottom:yPosition+pattern[0].length,left:xPosition},objectWithGrid.head);
		objectWithGrid.head=writePatternToGrid(xPosition,yPosition, pattern, objectWithGrid.head);
	}
}

function getTopBorder(node){
	const xSign=[-1,1,-1,1];
	const ySign=[-1,-1,1,1];
	if(node.distance===1)return node.value===1?0:null;
	
	let currentMin=null, cache;
	for(let i=0;i<4;i++){
		cache=getTopBorder(node.child[i]);
		if(cache!==null&&(currentMin===null||currentMin>(node.distance>>1)*ySign[i]+cache)){
			currentMin=(node.distance>>1)*ySign[i]+cache;
		}
	}
	return currentMin;
}

function getRightBorder(node){
	const xSign=[-1,1,-1,1];
	if(node.distance===1)return node.value===1?0:null;
	
	let currentMax=null, cache;
	for(let i=0;i<4;i++){
		cache=getRightBorder(node.child[i]);
		if(cache!==null&&(currentMax===null||currentMax<(node.distance>>1)*xSign[i]+cache)){
			currentMax=(node.distance>>1)*xSign[i]+cache;
		}
	}
	return currentMax;
}

function getBottomBorder(node){
	const ySign=[-1,-1,1,1];
	if(node.distance===1)return node.value===1?0:null;
	
	let currentMax=null, cache;
	for(let i=0;i<4;i++){
		cache=getBottomBorder(node.child[i]);
		if(cache!==null&&(currentMax===null||currentMax<(node.distance>>1)*ySign[i]+cache)){
			currentMax=(node.distance>>1)*ySign[i]+cache;
		}
	}
	return currentMax;
}

function getLeftBorder(node){
	const xSign=[-1,1,-1,1];
	if(node.distance===1)return node.value===1?0:null;
	
	let currentMin=null, cache;
	for(let i=0;i<4;i++){
		cache=getLeftBorder(node.child[i]);
		if(cache!==null&&(currentMin===null||currentMin>(node.distance>>1)*xSign[i]+cache)){
			currentMin=(node.distance>>1)*xSign[i]+cache;
		}
	}
	return currentMin;
}

function patternTobase32(pattern){
	let result="", stack=0, numberOfBits=0;
	const blockSize=(ruleArray[2]-1).toString(2).length;
	const lookupTable="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	for(let i=0;i<pattern[0].length;i++){
		for(let j=0;j<pattern.length;j++){
			//push cell state onto bottom of stack
			stack=stack<<blockSize;
			stack=stack|pattern[j][i];
			numberOfBits+=blockSize;
			if(numberOfBits>=5){
				result+=lookupTable[stack>>>(numberOfBits-5)];
				stack=stack^(stack>>>(numberOfBits-5)<<(numberOfBits-5));
				numberOfBits-=5;
			}
		}
	}
	if(numberOfBits!==0)result+=lookupTable[stack<<(5-numberOfBits)];
	return result;
}

function base32ToPattern(width,height,str){
	let pattern=new Array(width), stack=0, numberOfBits=0, strIndex=0;
	for(let i=0;i<width;i++){
		pattern[i]=new Array(height);
	}
	const blockSize=(ruleArray[2]-1).toString(2).length;
	for(let i=0;i<height;i++){
		for(let j=0;j<width;j++){
			if(numberOfBits<blockSize){
				stack=stack<<5;
				stack=stack|"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(str[strIndex]);
				numberOfBits+=5;
				strIndex++;
			}
			pattern[j][i]=stack>>(numberOfBits-blockSize);
			stack=stack&((1<<(numberOfBits-blockSize))-1);
			numberOfBits-=blockSize;
		}
	}
	return pattern;
}

function LZ77ToBase32(string){
	let result="",number=0,offset=0;
	for(let i=0;i<string.length&&i<maxDepth;i++){
		//write any letters directly to the result
		if(isNaN(string[i])){
			if(string[i]!=="-")result+=string[i];
		}else{
			//add digits to the number buffer
			number=10*number+parseInt(string[i]);
			//if the number is finished
			if(isNaN(string[i+1])){
				//use the number as the offset if there is a hyphen
				if(string[i+1]==="-"){
					offset=number;
				//use the number to count out the repeated letters otherwise
				}else{
					for(let j=0;j<number;j++){
						result+=result[result.length-offset-1];
					}
					offset=0;
				}
				number=0;
			}
		}
	}
	return result;
}

function base32ToLZ77(string){
	let result="";
	for(let i=0;i<string.length;i++){
		let offset=0,repeat=1;
		for(let j=0;j<8&&j<i+1;j++){
			//search the previous j characters
			let stack=string.slice(i-j,i+1);
			for(let k=0;;k++){
				//find as how far the previous j characters repeat
				if(i+k+1>=string.length||stack[k%stack.length]!==string[i+k+1]){
					if(k>repeat&&k>j){
						offset=j;
						repeat=k;
					}
					break;
				}
			}
		}
		result+=string[i];
		if(repeat>2){
			if(offset!==0)
				result+=`${offset}-`;
			result+=`${repeat}`;
			i+=repeat;
		}
	}
	return result;
}

function patternToRLE(pattern){
	if(pattern.length===0)return `x = 0, y = 0, rule = ${rulestring}\n!`;
	let RLE=`x = ${pattern.length}, y = ${pattern[0].length}, rule = ${rulestring}`, numberOfAdjacentLetters=0;
	if(GRID.type===1)RLE+=`:P${pattern.length},${pattern[0].length}`;
	if(GRID.type===2)RLE+=`:T${pattern.length},${pattern[0].length}`;
	RLE+="\n";
	for(let j=0;j<pattern[0].length;j++){
		let endOfLine=0;
		for(let i=pattern.length-1;i>=0;i--){
			if(pattern[i][j]!==0){
				if(numberOfAdjacentLetters>1)RLE+=numberOfAdjacentLetters;
				endOfLine=i+1;
				break;
			}
		}
		if(endOfLine===0){
			numberOfAdjacentLetters++;
		}else{
			if(numberOfAdjacentLetters!==0){
				RLE+="$";
				numberOfAdjacentLetters=0;
			}
			for(let i=0;i<endOfLine;i++){
				numberOfAdjacentLetters++;
				if(i===endOfLine-1||pattern[i][j]!==pattern[i+1][j]){
					if(numberOfAdjacentLetters>1){
						RLE+=numberOfAdjacentLetters;
					}
					if(ruleArray[2]===2){
						if(pattern[i][j]===0){
							RLE+="b";
						}else{
							RLE+="o";
						}
					}else{
						if(pattern[i][j]===0){
							RLE+=".";
						}else{
							RLE+=String.fromCharCode(64+pattern[i][j]);
						}
					}
					numberOfAdjacentLetters=0;
				}
			}
			numberOfAdjacentLetters=1;
		}
	}

	//adds a line break at least every 70 chars
	//avoids splitting numbers
	RLE=RLE.split("");
	let lineLength=0;
	for(let i=0;i<RLE.length;i++){
		//skip the header line
		if(i===0)while(RLE[i]!=="\n"&&i<RLE.length)i++;
		lineLength++;
		if(RLE[i]==="\n")lineLength=0;
		if(lineLength>70){
			for(let j=0;j<70;j++){
				if(isNaN(RLE[i-j-1])){
					RLE.splice(i-j,0,"\n");
					lineLength=j;
					break;
				}
			}
		}
	}
	return RLE.join("")+"!";
}

function update(){
	//coordinates of the touched cell
	let x=Math.floor(((mouse.x-300)/view.z+300)/cellWidth+view.x);
	let y=Math.floor(((mouse.y-200)/view.z+200)/cellWidth+view.y);
	let node=GRID.head;
	let sumX=0, sumY=0;
	let progress= new ListNode(null);
	//if in write mode
	if(editMode===0){
		//if the grid is infinite
		if(GRID.type===0){
			for(let h=0;;h++){
				if(h>maxDepth){
					console.log(`maxDepth of ${maxDepth} reached.`);
					break;
				}
				if(node.distance<=Math.abs(4*x)||node.distance<=Math.abs(4*y)||node.distance<8){
					node=doubleSize(node);
				}else{
					break;
				}
			}
			for(let h=0;; h++){
				if(h>maxDepth){
					console.log(`maxDepth of ${maxDepth} reached.`);
					break;
				}
				if(y*2<sumY){
					if(x*2<sumX){
						progress.value=0;
						progress.tree=node;
						node=node.child[0];
						sumX-=node.distance;
						sumY-=node.distance;
						progress= new ListNode(progress);
						if(node.distance===1){
							break;
						}
					}else{
						progress.value=1;
						progress.tree=node;
						node=node.child[1];
						sumX+=node.distance;
						sumY-=node.distance;
						progress= new ListNode(progress);
						if(node.distance===1){
							break;
						}
					}
				}else{
					if(x*2<sumX){
						progress.value=2;
						progress.tree=node;
						node=node.child[2];
						sumX-=node.distance;
						sumY+=node.distance;
						progress= new ListNode(progress);
						if(node.distance===1){
							break;
						}
					}else{
						progress.value=3;
						progress.tree=node;
						node=node.child[3];
						sumX+=node.distance;
						sumY+=node.distance;
						progress= new ListNode(progress);
						if(node.distance===1){
							break;
						}
					}
				}
			}
			if(node!==null){
				if(node.value===null)node.value=0;
				if(drawMode===-1){
					//if the finger is down
					if(drawnState=== -1){
						isPlaying=0;
						if(node.value===0){
							//set cell state to live(highest state)
							drawnState=1;
						}else{
							//otherwise set cell state to zero
							drawnState=0;
						}
					}
				}else{
					drawnState=drawMode;
					isPlaying=0;
				}

				if(node.value!==drawnState){
					accumulateChanges.value={x:x,y:y,newState:drawnState,oldState:node.value};
					accumulateChanges=accumulateChanges.child=new ListNode(accumulateChanges);
					changeCount++;
					//make a copy of the node with the new state
					let newNode=new TreeNode(1);
					newNode.value=drawnState;

					//go through the edited node and all the parents
					for(let h=0;;h++){
						if(h>maxDepth){
							console.log(`maxDepth of ${maxDepth} reached.`);
							break;
						}
						newNode=writeNode(newNode);

						//end if parent doesn't exist
						if(progress.parent===null){
							GRID.head=newNode;
							break;
						}
						progress=progress.parent;
						//make a copy of the parent node
						let parentNode=new TreeNode(progress.tree.distance);
						for(let i=0;i<4;i++){
							if(i===progress.value){
								parentNode.child[i]=newNode;
							}else{
								parentNode.child[i]=progress.tree.child[i];
							}
						}
						newNode=parentNode;
					}
					document.getElementById("population").innerHTML="Population "+GRID.head.population;
				}
			}
		}else{
			if(x>=GRID.finiteArea.left&&x<GRID.finiteArea.right&&y>=GRID.finiteArea.top&&y<GRID.finiteArea.bottom){
				if(drawMode===-1){
					//if the finger is down
					if(drawnState=== -1){
						isPlaying=0;
						if(GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]===0){
							//set cell state to live(highest state)
							drawnState=1;
						}else{
							//otherwise set cell state to zero
							drawnState=0;
						}
					}
				}else{
					drawnState=drawMode;
					isPlaying=0;
				}
				gridPopulation+=drawnState===1?1:-1;
				accumulateChanges.value={x:x,y:y,newState:drawnState,oldState:GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]};
				accumulateChanges=accumulateChanges.child=new ListNode(accumulateChanges);
				changeCount++;
				GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]=drawnState;
			}
		}
		//if in move mode
	}else if(editMode===1){
		//if 2 fingers are touching the canvas
		if(mouse.x2&&mouse.pastX2){
			//scale the grid
			view.z=view.touchZ*Math.sqrt((mouse.x2-mouse.x)*(mouse.x2-mouse.x)+
			                             (mouse.y2-mouse.y)*(mouse.y2-mouse.y))/
			                   Math.sqrt((mouse.pastX2-mouse.pastX)*(mouse.pastX2-mouse.pastX)+
			                             (mouse.pastY2-mouse.pastY)*(mouse.pastY2-mouse.pastY));
			if(socket&&resetEvent===null)socket.emit("zoom", {id:clientId, zoom:view.z});

			//turn off lines if zoomed out significantly
			//then change canvas tone to match
			if(view.z<0.2&&detailedCanvas===true){
				detailedCanvas=false;
				if(darkMode){
					canvas.style.backgroundColor="#282828";
				}else{
					canvas.style.backgroundColor="#e4e4e4";
				}
			}else if(view.z>0.2&&detailedCanvas===false){
				detailedCanvas=true;
				if(darkMode){
					canvas.style.backgroundColor="#222222";
				}else{
					canvas.style.backgroundColor="#f1f1f1";
				}
			}
		}else{
			switch(dragID){
			case 0:
				if(pasteArea.isActive&&clipboard[activeClipboard]&&x>=pasteArea.left&&x<pasteArea.left+clipboard[activeClipboard].length&&y>=pasteArea.top&&y<pasteArea.top+clipboard[activeClipboard][0].length){
					dragID=5;
					pasteArea.pastLeft=pasteArea.left;
					pasteArea.pastTop=pasteArea.top;
					mouse.pastX=mouse.x;
					mouse.pastY=mouse.y;
				}else if(GRID.type!==0&&
				         x>=GRID.finiteArea.left-1-Math.max(0,4/view.z+GRID.finiteArea.left-GRID.finiteArea.right)&&
				         x<GRID.finiteArea.right+1+Math.max(0,4/view.z+GRID.finiteArea.left-GRID.finiteArea.right)&&
				         y>=GRID.finiteArea.top-1-Math.max(0,4/view.z+GRID.finiteArea.top-GRID.finiteArea.bottom)&&
				         y<GRID.finiteArea.bottom+1+Math.max(0,4/view.z+GRID.finiteArea.top-GRID.finiteArea.bottom)){
					//select the grid edges if necessary
					if(x<Math.min(GRID.finiteArea.left+4/view.z,(GRID.finiteArea.right+GRID.finiteArea.left)/2)){
						dragID=3;
						isPlaying=0;
					}else if(x>Math.max(GRID.finiteArea.right-4/view.z,(GRID.finiteArea.right+GRID.finiteArea.left)/2)){
						dragID=1;
						isPlaying=0;
					}
					if(y<Math.min(GRID.finiteArea.top+4/view.z,(GRID.finiteArea.bottom+GRID.finiteArea.top)/2)){
						dragID=4;
						isPlaying=0;
					}else if(y>Math.max(GRID.finiteArea.bottom-4/view.z,(GRID.finiteArea.bottom+GRID.finiteArea.top)/2)){
						dragID=2;
						isPlaying=0;
					}
				}else{
					//translate the grid
					view.x=view.touchX+(mouse.pastX-mouse.x)/cellWidth/view.z;
					view.y=view.touchY+(mouse.pastY-mouse.y)/cellWidth/view.z;
					if(socket&&resetEvent===null)socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
				}
				break;
				//drag left edge
			case 3:
				//drag the left edge
				if(x<GRID.finiteArea.right){
					GRID.finiteArea.newLeft=x;
					GRID.finiteArea.newRight=GRID.finiteArea.right;
				}else{
					GRID.finiteArea.newLeft=GRID.finiteArea.right;
					GRID.finiteArea.newRight=x+1;
				}
				//draw rect across the left
				break;
				//drag right edge
			case 1:
				//drag the right egde
				if(x<GRID.finiteArea.left){
					GRID.finiteArea.newLeft=x;
					GRID.finiteArea.newRight=GRID.finiteArea.left;
				}else{
					GRID.finiteArea.newLeft=GRID.finiteArea.left;
					GRID.finiteArea.newRight=x+1;
				}
				//draw rect across the right
				break;
				//drag upper edge
			case 2:
				//drag the top edge
				if(y<GRID.finiteArea.top){
					GRID.finiteArea.newTop=y;
					GRID.finiteArea.newBottom=GRID.finiteArea.top;
				}else{
					GRID.finiteArea.newTop=GRID.finiteArea.top;
					GRID.finiteArea.newBottom=y+1;
				}
				//draw rect across the top
				break;
				//drag downward edge
			case 4:
				//drag the bottom edge
				if(y<GRID.finiteArea.bottom){
					GRID.finiteArea.newTop=y;
					GRID.finiteArea.newBottom=GRID.finiteArea.bottom;
				}else{
					GRID.finiteArea.newTop=GRID.finiteArea.bottom;
					GRID.finiteArea.newBottom=y+1;
				}
				//draw rect across the bottom
				break;
			case 5:
				pasteArea.left=pasteArea.pastLeft+Math.floor((mouse.x-mouse.pastX)/view.z/cellWidth);
				pasteArea.top=pasteArea.pastTop+Math.floor((mouse.y-mouse.pastY)/view.z/cellWidth);
				break;
			}
		}
		//if in select mode
	}else if(editMode===2){
		// Select an edge of the selectArea if the cursor is within the area
		// The marigin for selecting is increased on the left and right if
		// the area is narrower than 4/view.z, and likewise for the
		// top and bottom.
		if(selectArea.isActive===true&&dragID===0&&x>=selectArea.left-1-Math.max(0,4/view.z+selectArea.left-selectArea.right)&&x<selectArea.right+1+Math.max(0,4/view.z+selectArea.left-selectArea.right)&&y>=selectArea.top-1-Math.max(0,4/view.z+selectArea.top-selectArea.bottom)&&y<selectArea.bottom+1+Math.max(0,4/view.z+selectArea.top-selectArea.bottom)){
			// The margin for selecting the edges within the selectArea
			// is 4/view.z wide, but also less than the half the width
			//
			// dragID:
			//-4 = bottom -left edge
			//-3 = left edge
			//-2 = top-left edge
			//-1 = bottom edge
			// 0 = no edge is selected
			// 1 = top edge
			// 2 = bottom-right edge
			// 3 = bottom edge
			// 4 = top-right edge
			//
			//     +1
			//      ^
			//  -3<=0=>+3
			//      v
			//     -1
			if(x<Math.min(selectArea.left+4/view.z,(selectArea.right+selectArea.left)/2)){
				dragID=-3;
				isPlaying=0;
			}else if(x>Math.max(selectArea.right-4/view.z,(selectArea.right+selectArea.left)/2)){
				dragID=3;
				isPlaying=0;
			}
			if(y<Math.min(selectArea.top+4/view.z,(selectArea.bottom+selectArea.top)/2)){
				dragID+=1;
				isPlaying=0;
			}else if(y>Math.max(selectArea.bottom-4/view.z,(selectArea.bottom+selectArea.top)/2)){
				dragID-=1;
				isPlaying=0;
			}
			//deselect all markers
			for(let h=0;h<markers.length;h++){
				if(markers[h].activeState===2)markers[h].activeState=1;
			}
		}else if(selectArea.isActive===true&dragID!==0){
			//drag bottom edge
			if(dragID===-4||dragID===-1||dragID===2){
				if(y<selectArea.pastTop){
					selectArea.top=y;
					selectArea.bottom=selectArea.pastTop;
				}else{
					selectArea.top=selectArea.pastTop;
					selectArea.bottom=y+1;
				}
				if(dragID===-1){
					if(x<selectArea.pastLeft)dragID=-4;
					if(x>selectArea.pastRight)dragID=2;
				}
			}
			//drag left edge
			if(dragID===-4||dragID===-3||dragID===-2){
				if(x<selectArea.pastRight){
					selectArea.left=x;
					selectArea.right=selectArea.pastRight;
				}else{
					selectArea.left=selectArea.pastRight;
					selectArea.right=x+1;
				}
				if(dragID===-3){
					if(y<selectArea.pastTop)dragID=-2;
					if(y>selectArea.pastBottom)dragID=-4;
				}
			}
			//drag top edge
			if(dragID===-2||dragID===1||dragID===4){
				if(y<selectArea.pastBottom){
					selectArea.top=y;
					selectArea.bottom=selectArea.pastBottom;
				}else{
					selectArea.top=selectArea.pastBottom;
					selectArea.bottom=y+1;
				}
				if(dragID===1){
					if(x<selectArea.pastLeft)dragID=-2;
					if(x>selectArea.pastRight)dragID=4;
				}
			}
			//drag right edge
			if(dragID===4||dragID===3||dragID===2){
				if(x<selectArea.pastLeft){
					selectArea.left=x;
					selectArea.right=selectArea.pastLeft;
				}else{
					selectArea.left=selectArea.pastLeft;
					selectArea.right=x+1;
				}
				if(dragID===3){
					if(y<selectArea.pastTop)dragID=4;
					if(y>selectArea.pastBottom)dragID=2;
				}
			}
		}else{
			//marker[#].activeState:
			//0 = inactive,non visible,
			//1 = active, visible
			//2 = active, selected and outlined
			//selectedMarker:
			//-1 = no marker is selected
			//0  = marker[0] is selected
			//>0 = marker[#] is selected
			if(selectedMarker===-1){
				for(let h=0;h<markers.length;h++){
					if(markers[h].activeState===2){
						//if the loop reached a selected marker, deselect it
						//and select the most recent indexed marker within
						//the click area
						markers[h].activeState=1;
						if(selectedMarker>=0)markers[selectedMarker].activeState=2;
						if(selectedMarker!==-1){
							selectedMarker=-2;
							break;
						}
					}else if(markers[h].activeState===1&&x>=markers[h].left&&x<markers[h].right&&y>=markers[h].top&&y<markers[h].bottom){
						// if the current marker is active, unselected, and
						// being clicked, then mark it for being selected
						// later
						selectedMarker=h;
					}
				}
			}
			// if all markers have been looped through without being selected
			// select the last indexed marker
			if(selectedMarker!==-1){
				if(selectedMarker>=0)markers[selectedMarker].activeState=2;
				console.log(`${markers[0].activeState} ${markers[1].activeState} ${markers[2].activeState} ${markers[3].activeState}`);
			}else if(selectArea.isActive===false){
				// make a selectArea if there are no selectable markers
				// this happens when the cursor clicks in an empty area.
				selectArea.isActive=true;
				setActionMenu(selectArea.isActive);
				dragID=0;
				selectArea.left=x;
				selectArea.top=y;
				selectArea.right=x+1;
				selectArea.bottom=y+1;
				selectArea.pastLeft=x;
				selectArea.pastTop=y;
				selectArea.pastRight=x+1;
				selectArea.pastBottom=y+1;
			}
		}
	}
}

function getEmptyNode(distance){
	if(emptyNodes[backgroundState]&&emptyNodes[backgroundState].distance===distance)return emptyNodes[backgroundState];
	let node=new TreeNode(distance);
	node.value=backgroundState;
	if(distance===1)return writeNode(node);
	node.child[0]=getEmptyNode(distance>>>1);
	node.child[1]=node.child[0];
	node.child[2]=node.child[1];
	node.child[3]=node.child[2];
	return writeNode(node);
}

function gen(){
	//record that a generation was run
	genCount++;

	let newBackgroundState;

	//the newBackgroundState variable is necessary because doubleSize() uses emptyNode(backgroundState)
	if(backgroundState===0&&ruleArray[0][0]===1){
		newBackgroundState=1;
	}else if(backgroundState===1){
		newBackgroundState=ruleArray[1][255];
	}else if(backgroundState===ruleArray[2]-1){
		newBackgroundState=0;
	}else if(backgroundState>1){
		newBackgroundState=backgroundState+1;
	}else{
		newBackgroundState=backgroundState;
	}

	let toBeExtended = false;
	if(GRID.type===0){
		for(let i = 0;i < 4;i++){
			for(let j = 0;j < 4;j++){
				if(i!==3-j&&GRID.head.child[i].result.child[j].value!==newBackgroundState){
					toBeExtended=true;
					break;
				}
			}
			if(toBeExtended===true)break;
		}

		//top
		let temporaryNode=new TreeNode(GRID.head.distance>>>1);
		temporaryNode.child[0]=GRID.head.child[0].child[1];
		temporaryNode.child[1]=GRID.head.child[1].child[0];
		temporaryNode.child[2]=GRID.head.child[0].child[3];
		temporaryNode.child[3]=GRID.head.child[1].child[2];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[0].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[1].value!==newBackgroundState)toBeExtended=true;


		//right
		temporaryNode=new TreeNode(GRID.head.distance>>>1);
		temporaryNode.child[0]=GRID.head.child[1].child[2];
		temporaryNode.child[1]=GRID.head.child[1].child[3];
		temporaryNode.child[2]=GRID.head.child[3].child[0];
		temporaryNode.child[3]=GRID.head.child[3].child[1];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[1].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[3].value!==newBackgroundState)toBeExtended=true;


		//bottom
		temporaryNode=new TreeNode(GRID.head.distance>>>1);
		temporaryNode.child[0]=GRID.head.child[2].child[1];
		temporaryNode.child[1]=GRID.head.child[3].child[0];
		temporaryNode.child[2]=GRID.head.child[2].child[3];
		temporaryNode.child[3]=GRID.head.child[3].child[2];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[3].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[2].value!==newBackgroundState)toBeExtended=true;


		//left
		temporaryNode=new TreeNode(GRID.head.distance>>>1);
		temporaryNode.child[0]=GRID.head.child[0].child[2];
		temporaryNode.child[1]=GRID.head.child[0].child[3];
		temporaryNode.child[2]=GRID.head.child[2].child[0];
		temporaryNode.child[3]=GRID.head.child[2].child[1];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[2].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[0].value!==newBackgroundState)toBeExtended=true;

		if(toBeExtended===true)GRID.head=doubleSize(GRID.head);
		backgroundState=newBackgroundState;

		let newGen=new TreeNode(GRID.head.distance);

		if(!emptyNodes[backgroundState]){
			emptyNodes[backgroundState]=getEmptyNode(GRID.head.distance>>2);
		}

		for(let i = 0;i < 4;i++){
			newGen.child[i]=new TreeNode(GRID.head.distance>>>1);

			for(let j = 0;j < 4;j++){
				if(i === 3 - j){
					newGen.child[i].child[j]=GRID.head.result.child[i];
				}else{
					newGen.child[i].child[j]=emptyNodes[backgroundState];
				}
			}
			newGen.child[i].value=getValue(newGen.child[i]);
			newGen.child[i]=writeNode(newGen.child[i]);
		}

		newGen.value=getValue(newGen);
		GRID.head=writeNode(newGen);
	}else if(GRID.type>0){
		const margin=GRID.type===1?1:0,
		      nextGeneration=iteratePattern(GRID.finiteArray,margin,GRID.finiteArray.length-margin,GRID.finiteArray[0].length-margin,margin);
		
		gridPopulation=0;
		for (let i = 0; i < GRID.finiteArray.length; i++) {
			for (let j = 0; j < GRID.finiteArray[0].length; j++) {
				if(j>=GRID.finiteArea.margin&&i<GRID.finiteArray.length-GRID.finiteArea.margin&&j<GRID.finiteArray[0].length-GRID.finiteArea.margin&&i>=GRID.finiteArea.margin){
					GRID.finiteArray[i][j]=nextGeneration[i-GRID.finiteArea.margin][j-GRID.finiteArea.margin];
				}else{
					GRID.finiteArray[i][j]=newBackgroundState;
				}
				if(GRID.finiteArray[i][j]!==newBackgroundState)gridPopulation++;
			}
		}
		backgroundState=newBackgroundState;
	}
	//document.getElementById("numberOfNodes").innerHTML=numberOfNodes;
}

function getScreenXPosition(coordinate){
	return 300-((view.x-coordinate)*cellWidth+300)*view.z;
}

function getScreenYPosition(coordinate){
	return 200-((view.y-coordinate)*cellWidth+200)*view.z;
}

function getCellColor(state){
	const displayedState=isElementCheckedById("antiStrobing")===true?((state-backgroundState)%ruleArray[2]+ruleArray[2])%ruleArray[2]:state;
	if(displayedState===1){
		if(darkMode){
			return 240;
		}else{
			return 0;
		}
	}else{
		if(darkMode){
			return 208/ruleArray[2]*(ruleArray[2]-displayedState)+32;
		}else{
			return 255/ruleArray[2]*(displayedState-1);
		}
	}
}

//function which recursively draws squares within the quadtree
function drawSquare(node,xPos,yPos){
	const xSign=[-1,1,-1,1];
	const ySign=[-1,-1,1,1];
	if(node.distance!==1){
		for(let i = 0;i < 4;i++){
			//check if the node is empty or has a null child
			if(node.value!==backgroundState&&node.child[i]!==null){
				drawSquare(node.child[i],xPos+node.child[i].distance*xSign[i],yPos+node.child[i].distance*ySign[i]);
				if(isElementCheckedById("debugVisuals")===true&&node.value===null){
					ctx.strokeStyle="rgba(240,240,240,0.7)";
					ctx.beginPath();
					ctx.moveTo(getScreenXPosition(xPos/2),getScreenYPosition(yPos/2),view.z*cellWidth,view.z*cellWidth);
					ctx.lineTo(getScreenXPosition((xPos+xSign[i]*node.child[i].distance)/2),getScreenYPosition((yPos+ySign[i]*node.child[i].distance)/2),view.z*cellWidth,view.z*cellWidth);
					ctx.lineWidth=view.z;
					ctx.stroke();
				}
			}
		}
	}else{
		if(node.value!==backgroundState){
			let color=getCellColor(node.value);
			ctx.fillStyle=`rgba(${color},${color},${color},1)`;
			ctx.fillRect(getScreenXPosition((xPos-1)/2),getScreenYPosition((yPos-1)/2),view.z*cellWidth,view.z*cellWidth);
			//ctx.fillRect(300-((view.x-(xPos-1)/2)*cellWidth+300)*view.z,200-((view.y-(yPos-1)/2)*cellWidth+200)*view.z,view.z*cellWidth,view.z*cellWidth);
		}
	}
	if(isElementCheckedById("debugVisuals")===true){
		if(node.depth===null){
			ctx.strokeStyle="#FF0000";
		}else{
			ctx.strokeStyle=`#${(Math.floor((Math.abs(Math.sin(3+node.depth*5+(node.key*7%hashTable.length)) * 16777215))).toString(16))}`;
		}
		ctx.lineWidth=view.z*4/node.distance;
		ctx.strokeRect(300-((view.x-(xPos-node.distance)*0.5)*cellWidth+300-2/node.distance)*view.z,200-((view.y-(yPos-node.distance)*0.5)*cellWidth+200-2/node.distance)*view.z,(node.distance*cellWidth-4/node.distance)*view.z,(node.distance*cellWidth-4/node.distance)*view.z);
	}
}

//function which renders graphics to the canvas
function render(){
	let x=view.x%1, y=view.y%1, color=0, scaledCellWidth=cellWidth*view.z;

	//clear screen
	ctx.clearRect(0,0,600,400);

	if(darkMode){
		ctx.fillStyle="#fff";
	}else{
		ctx.fillStyle="#000";
	}

	ctx.font = "20px Arial";

	if(isElementCheckedById("debugVisuals")===true){
		ctx.fillText(`${numberOfNodes} hashnodes`,10,20);
		ctx.fillText(`${avgNodeDepth} hashnode depth`,10,40);
	}

	//draw selected area
	if(selectArea.isActive===true){
		if(editMode===2&&dragID!==0){
			if(darkMode){
				ctx.fillStyle="#333";
			}else{
				ctx.fillStyle="#999";
			}
		}else{
			if(darkMode){
				ctx.fillStyle="#292929";
			}else{
				ctx.fillStyle="#ccc";
			}
		}
		ctx.fillRect(300-((view.x-selectArea.left)*cellWidth+300)*view.z,200-((view.y-selectArea.top)*cellWidth+200)*view.z,(selectArea.right-selectArea.left)*scaledCellWidth-1,(selectArea.bottom-selectArea.top)*scaledCellWidth-1);
	}

	//draw paste
	if(pasteArea.isActive&&clipboard[activeClipboard]){
		if(editMode===2&&dragID!==0){
			if(darkMode){
				ctx.fillStyle="#555";
			}else{
				ctx.fillStyle="#999";
			}
		}else{
			if(darkMode){
				ctx.fillStyle="#333";
			}else{
				ctx.fillStyle="#ccc";
			}
		}
		ctx.fillRect(300-((view.x-pasteArea.left)*cellWidth+300)*view.z,200-((view.y-pasteArea.top)*cellWidth+200)*view.z,clipboard[activeClipboard].length*scaledCellWidth-1,clipboard[activeClipboard][0].length*scaledCellWidth-1);
	}

	//draw the various cells
	if(GRID.type===0){
		//draw for the infinite grid
		drawSquare(GRID.head,0,0);
	}else{
		//draw for the finite grids
		for(let i = 0; i < GRID.finiteArray.length-2*GRID.finiteArea.margin; i++){
			for (let j = 0; j < GRID.finiteArray[0].length-2*GRID.finiteArea.margin; j++) {
				if(backgroundState!==GRID.finiteArray[i+GRID.finiteArea.margin][j+GRID.finiteArea.margin]){
					let color=getCellColor(GRID.finiteArray[i+GRID.finiteArea.margin][j+GRID.finiteArea.margin]);
					ctx.fillStyle=`rgba(${color},${color},${color},1)`;
					ctx.fillRect(300-((view.x-(GRID.finiteArea.left+i))*cellWidth+300)*view.z,200-((view.y-(GRID.finiteArea.top+j))*cellWidth+200)*view.z,view.z*cellWidth,view.z*cellWidth);
				}
			}
		}
	}

	if(pasteArea.isActive&&clipboard[activeClipboard]&&clipboard[activeClipboard].length){
		for(let h=0;h<clipboard[activeClipboard].length;h++){
			for(let i=0;i<clipboard[activeClipboard][0].length;i++){
				if(clipboard[activeClipboard][h][i]>0){
					//find the cell's color depending on the state
					if(clipboard[activeClipboard][h][i]===1){
						if(darkMode){
							color=240;
						}else{
							color=0;
						}
					}else{
						if(darkMode){
							color=208/ruleArray[2]*(ruleArray[2]-clipboard[activeClipboard][h][i]+1)+32;
						}else{
							color=255/ruleArray[2]*(clipboard[activeClipboard][h][i]-1);
						}
					}
					//set the color
					ctx.fillStyle=`rgba(${color},${color},${color},0.8)`;
					ctx.fillRect(300-(300+view.x*cellWidth)*view.z+(pasteArea.left+h)*scaledCellWidth,200-(200+view.y*cellWidth)*view.z+(pasteArea.top+i)*scaledCellWidth,scaledCellWidth,scaledCellWidth);
				}
			}
		}
	}
	ctx.fillStyle="rgba(0,0,0,0.5)";
	if(editMode===1)switch(dragID){
	//draw left edge
	case 1:
		//draw rect across the left row of cells
		break;
		//draw right edge
	case 2:
		//draw rect across the right right of cells
		break;
		//draw upper edge
	case 3:
		//draw rect across the top row of cells
		break;
		//draw downward edge
	case 4:
		//draw rect across the bottom row of cells
		break;
	}
	//if the toggle grid variable is true
	if(isElementCheckedById("gridLines")===true){
		//draw a grid
		if(darkMode){
			ctx.strokeStyle="#999";
		}else{
			ctx.strokeStyle="#000000";
		}
		if(detailedCanvas===true){
			ctx.lineWidth=0.5*view.z;
			ctx.beginPath();
			//draw horizonal lines
			for(let h= -Math.ceil(300/scaledCellWidth);h<300/scaledCellWidth+1;h++){
				ctx.moveTo(300+(h-x)*scaledCellWidth,0);
				ctx.lineTo(300+(h-x)*scaledCellWidth,400);
			}
			//draw virtical lines
			for(let h= -Math.ceil(200/scaledCellWidth);h<200/scaledCellWidth+1;h++){
				ctx.moveTo(0  ,200+(h-y)*scaledCellWidth);
				ctx.lineTo(600,200+(h-y)*scaledCellWidth);
			}
			ctx.stroke();
		}
	}
	//draw a rectangle around each marker
	for(let h=0;h<2;h++){
		for(let i=0;i<markers.length;i++){
			if(markers[i].activeState!==0){
				if(markers[i].activeState===1){
					if(darkMode){
						ctx.strokeStyle="#888";
					}else{
						ctx.strokeStyle="#999";
					}
				}else if(markers[i].activeState===2){
					if(darkMode){
						ctx.strokeStyle="#bbb";
						ctx.fillStyle="#bbb";
					}else{
						ctx.strokeStyle="#999";
						ctx.fillStyle="#999";
					}
					ctx.lineWidth=1;
					ctx.fillText((i+1),300+1*view.z-((view.x-markers[i].left)*cellWidth+300)*view.z,200-6*view.z-((view.y-markers[i].top)*cellWidth+200)*view.z,(markers[i].right-markers[i].left)*scaledCellWidth-1);
				}
				ctx.lineWidth=5*view.z;
				if((h===0&&markers[i].activeState===1)||
				   (h===1&&markers[i].activeState===2))ctx.strokeRect(300-((view.x-markers[i].left)*cellWidth+300)*view.z,200-((view.y-markers[i].top)*cellWidth+200)*view.z,(markers[i].right-markers[i].left)*scaledCellWidth-1,(markers[i].bottom-markers[i].top)*scaledCellWidth-1);
			}
		}
	}
	//draw a rectangle around the right-selectArea.
	if(selectArea.isActive===true){
		ctx.lineWidth=3*view.z;
		ctx.strokeStyle="#666";
		ctx.strokeRect(300-((view.x-selectArea.left)*cellWidth+300)*view.z,200-((view.y-selectArea.top)*cellWidth+200)*view.z,(selectArea.right-selectArea.left)*scaledCellWidth-1,(selectArea.bottom-selectArea.top)*scaledCellWidth-1);
	}
	//draw a rectangle around the pattern to be pasted.
	if(pasteArea.isActive&&clipboard[activeClipboard]){
		ctx.lineWidth=3*view.z;
		ctx.strokeStyle="#666";
		ctx.strokeRect(300-((view.x-pasteArea.left)*cellWidth+300)*view.z,200-((view.y-pasteArea.top)*cellWidth+200)*view.z,clipboard[activeClipboard].length*scaledCellWidth-1,clipboard[activeClipboard][0].length*scaledCellWidth-1);
	}

	//draw the border of the finite grids
	if(GRID.type!==0){
		ctx.lineWidth=8*view.z;
		if(darkMode){
			ctx.strokeStyle="#888";
		}else{
			ctx.strokeStyle="#999";
		}
		ctx.strokeRect(300-((view.x-GRID.finiteArea.newLeft)*cellWidth+300)*view.z,200-((view.y-GRID.finiteArea.newTop)*cellWidth+200)*view.z,(GRID.finiteArea.newRight-GRID.finiteArea.newLeft)*scaledCellWidth-1,(GRID.finiteArea.newBottom-GRID.finiteArea.newTop)*scaledCellWidth-1);
	}

	//draw the view of the other clients
	for(let client in clientList){
		ctx.strokeStyle=`hsla(${clientList[client].color[0]},100%,80%,1)`;
		ctx.lineWidth=4;
		ctx.strokeRect(300-((view.x-clientList[client].xPosition+15/clientList[client].zoom)*cellWidth)*view.z,200-((view.y-clientList[client].yPosition+10/clientList[client].zoom)*cellWidth)*view.z,600*view.z/clientList[client].zoom,400*view.z/clientList[client].zoom);
		ctx.fillStyle=ctx.strokeStyle;
		ctx.font = "30px Arial";
		ctx.fillText(client,300-((view.x-clientList[client].xPosition+15/clientList[client].zoom)*cellWidth)*view.z,180-((view.y-clientList[client].yPosition+10/clientList[client].zoom)*cellWidth)*view.z);
	}
}

function scaleCanvas(){
	windowWidth=window.innerWidth || document.documentElement.clientWidth;
	windowHeight=window.innerHeight || document.documentElement.clientHeight;
	if(windowWidth<windowHeight*1.2){
		canvasHeight=(windowWidth-20)/1.5;
		canvasWidth=windowWidth-20;
	}else{
		canvasHeight=windowHeight*0.8;
		canvasWidth=windowHeight*1.2;
	}
	if(windowWidth-canvasWidth>300){
		document.getElementById("top").style.width=`${windowWidth-canvasWidth-70}px`;
	}else{
		document.getElementById("top").style.width="auto";
	}

	canvas.width =canvasWidth;
	canvas.height=canvasHeight;
	ctx.scale(canvasHeight/400,canvasHeight/400);
}

function readRLE(rle){
	let step=0,
	    textIndex=0,
	    stages=["x","=",",","y","=",","],
	    dimension=[],
	    width=-1,
	    height=-1;
	for(let i=0;;i++){
		if(i>=rle.length){
			console.log("RLE not found");
			return -1;
		}
		//skips lines which begin with "#"
		if(rle[i]==="#"&&(i===0||rle[i-1]==="\n")){
			while(rle[i]!=="\n"&&i<rle.length){
				i++;
				textIndex++;
			}
		}
		if(isNaN(rle[i])){
			if(rle[i]===stages[step]){
				step++;
				if(dimension.length!==0){
					if(width===-1){
						width=parseInt(dimension.join(""),10);
						dimension=[];
					}else{
						height=parseInt(dimension.join(""),10);
						dimension=[];
					}
				}
			}else{
				width=-1;
				height=-1;
				textIndex++;
				i=textIndex;
				step=0;
			}
		}else if(rle[i]!==" "&&step>1){
			dimension.push(rle[i]);
		}
		if(step===6){
			textIndex=i;
			break;
		}
	}

	let charArray=[];
	//transcribe rule
	if(rle[textIndex+1]==="r"||rle[textIndex+2]==="r"){
		charArray=[];
		for(let h=textIndex;h<rle.length;h++){
			if(rle[h]==="\n"||rle[h]===":"){
				textIndex=h;
				break;
			}else{
				if(textIndex===-1){
					if(rle[h]===" "){
						if(charArray.length>0){
							textIndex=h;
							break;
						}
					}else{
						charArray.push(rle[h]);
					}
				}
			}
			if(rle[h]==="="){
				textIndex=-1;
			}
		}
		if(rulestring!==charArray.join("")){
			document.getElementById("rule").value=charArray.join("");
			rule(charArray.join(""));
			if(socket)socket.emit("rule", rulestring);
		}
	}else{
		if(rulestring!=="B3/S23"){
			document.getElementById("rule").value="B3/S23";
			parseINTGen("B3/S23");
			resetHashtable();
		}
	}
	//transcribe info for a toroidal grid
	if(rle[textIndex]===":"){
		if(rle[textIndex+1]==="P"){
			GRID.type=1;
		}else if(rle[textIndex+1]==="T"){
			GRID.type=2;
		}else{
			throw new Error("unsupported finite grid type");
		}
		charArray=[];
		if(rle[textIndex+2]==="0"){
			width+=50;
			textIndex+=4;
		}else{
			for(let h=textIndex+2;h<rle.length;h++){
				if(isNaN(rle[h])){
					//set the width to charArray.join("")
					width=parseInt(charArray.join(""));
					charArray=[];
					textIndex=h+1;
					break;
				}else{
					charArray.push(rle[h]);
				}
			}
		}
		if(rle[textIndex]==="0"){
			//document.getElementById("yloop").checked=false;
			height+=50;
			textIndex++;
		}else{
			for(let h=textIndex;h<rle.length;h++){
				if(isNaN(rle[h])||rle[h]==="\n"){
					//set the height to charArray.join("")
					height=parseInt(charArray.join(""));
					charArray=[];
					textIndex=h-1;
					break;
				}else{
					charArray.push(rle[h]);
				}
			}
		}
	}else{
		GRID.type=0;
	}

	textIndex++;
	const patternArray=rleToPattern(rle.slice(-(rle.length-textIndex)),width,height);

	if(rulestring==="LifeHistory"||rulestring==="LifeSuper"){
		for (let i = 0; i < patternArray.length; i++) {
			for (let j = 0; j < patternArray[i].length; j++) {
				patternArray[i][j]=patternArray[i][j]%2===1?1:0;
			}
		}
	}

	return patternArray;
}

function rleToPattern(string,width,height){
	let textIndex=0,
	    repeat=1,
	    xPosition=0,
	    yPosition=0,
	    array = new Array(width),
	    number=[];
	for(let i=0; i< array.length; i++){
		array[i]=new Array(height);
		array[i].fill(0);
	}
	while(textIndex<string.length){
		for (let i=0;i<repeat;i++) {
			if(array[xPosition+i]===undefined){
				array[xPosition+i]=new Array(height);
				array[xPosition+i].fill(0);
			}
		}
		//if "b" or "." keep the cell as a 0
		if(string[textIndex]==="b"||string[textIndex]==="."){
			xPosition+=repeat;
			textIndex++;
			repeat=1;
			//if "o" set the cell as 1
		}else if(string[textIndex]==="o"){
			for(let i=0;i<repeat;i++){
				array[xPosition][yPosition]=1;
				xPosition++;
			}
			textIndex++;
			repeat=1;
			//if "A-Z" set the cell as 1-27
		}else if(string[textIndex].charCodeAt(0)>=65&&string[textIndex].charCodeAt(0)<=91){
			for(let i=0;i<repeat;i++){
				array[xPosition][yPosition]=string[textIndex].charCodeAt(0)-64;
				xPosition++;
			}
			textIndex++;
			repeat=1;
			//if Number set repeat char
		}else if(!isNaN(string[textIndex])&&string[textIndex]!=="\n"){
			number=[];
			for(let i=0;i<70;i++){
				if(isNaN(string[textIndex])){
					break;
				}else{
					number.push(string[textIndex]);
					textIndex++;
				}
			}
			repeat=parseInt(number.join(""),10);
		}else if(string[textIndex]==="$"){
			xPosition=0;
			yPosition+=repeat;
			textIndex++;
			repeat=1;
		}else if(string[textIndex]==="!"){
			break;
		}else{
			textIndex++;
		}
	}
	for(let i=0;i<array.length;i++)
		for(let j=0;j<=yPosition;j++)
			if(!array[i][j])array[i][j]=0;
	return array;
}

function exportPattern(){
	switch(GRID.type){
	case 0:
		return {xOffset:(getLeftBorder(GRID.head)??0)/2-0.5,
		        yOffset:(getTopBorder(GRID.head)??0)/2-0.5,
		        pattern:readPattern((getTopBorder(GRID.head)??0)/2-0.5,(getRightBorder(GRID.head)??0)/2+0.5,(getBottomBorder(GRID.head)??0)/2+0.5,(getLeftBorder(GRID.head)??0)/2-0.5)};
	case 1:{
		let pattern=new Array(GRID.finiteArray.length-2);
		for(let i=0; i<pattern.length;i++){
			pattern[i]=new Array(GRID.finiteArray[0].length-2);
			for(let j=0; j<pattern[0].length;j++){
				if(i<GRID.finiteArray.length-1&&j<GRID.finiteArray[0].length-1){
					pattern[i][j]=GRID.finiteArray[i+1][j+1];
				}else{
					pattern[i][j]=backgroundState;
				}
			}
		}
		return {xOffset:GRID.finiteArea.left,
			yOffset:GRID.finiteArea.top,
			pattern:pattern};

	}
	case 2:
		return {xOffset:GRID.finiteArea.left,
			yOffset:GRID.finiteArea.top,
			pattern:GRID.finiteArray};
	default:
		throw new Error("exporting unknown grid type");
	}
}

//places a pattern and moves the grid down and to the right by some offset
function importPattern(pattern,xOffset,yOffset){
	switch(GRID.type){
	case 0:
		GRID.head=getEmptyNode(8);
		GRID.head=widenTree({top:yOffset,right:xOffset+pattern.length,bottom:yOffset+pattern[0].length,left:xOffset});
		GRID.head=writePatternToGrid(xOffset,yOffset,pattern,GRID.head);
		break;
	case 1:
		GRID.finiteArea.margin=1;

		GRID.finiteArea.top=yOffset;
		GRID.finiteArea.right=pattern.length+xOffset;
		GRID.finiteArea.bottom=pattern[0].length+yOffset;
		GRID.finiteArea.left=xOffset;

		GRID.finiteArray=new Array(pattern.length+2);
		for(let i=0; i<GRID.finiteArray.length;i++){
			GRID.finiteArray[i]=new Array(pattern[0].length+2);
			for(let j=0; j<GRID.finiteArray[0].length;j++){
				if(i>=1&&i<pattern.length+1&&j>=1&&j<pattern[0].length+1){
					GRID.finiteArray[i][j]=pattern[i-1][j-1];
				}else{
					GRID.finiteArray[i][j]=backgroundState;
				}
			}
		}
		break;
	case 2:
		GRID.finiteArea.margin=0;

		GRID.finiteArea.top=yOffset;
		GRID.finiteArea.right=pattern.length+xOffset;
		GRID.finiteArea.bottom=pattern[0].length+yOffset;
		GRID.finiteArea.left=xOffset;

		GRID.finiteArray=pattern;
		break;
	default:
		throw new Error("importing unknown grid type");
	}
	GRID.finiteArea.newTop=GRID.finiteArea.top;
	GRID.finiteArea.newRight=GRID.finiteArea.right;
	GRID.finiteArea.newBottom=GRID.finiteArea.bottom;
	GRID.finiteArea.newLeft=GRID.finiteArea.left;
}

function importRLE(){
	const rleText=document.getElementById("rle").value.split("");
	if(rleText.length===0){
		console.log("RLE box empty");
		return -1;
	}

	const pattern=readRLE(rleText);
	if(pattern===-1)return -1;
	if(rleText&&pattern){
		if(GRID.head.value===0){
			let previousPattern=new Array(pattern.length);
			for(let i=0;i<previousPattern.length;i++){
				previousPattern[i]=new Array(pattern[0].length).fill(0);
			}
			importPattern(pattern,-Math.ceil(pattern.length/2),-Math.ceil(pattern[0].length/2));
			if(socket)socket.emit("paste", Date.now(), {newPatt:[-Math.ceil(pattern.length/2),-Math.ceil(pattern[0].length/2),pattern], oldPatt:[-Math.ceil(pattern.length/2),-Math.ceil(pattern[0].length/2),previousPattern]});
			//fitView();
		}else{
			activeClipboard=0;
			clipboard[activeClipboard]=pattern;
			editMode=1;
			pasteArea.isActive=true;
			pasteArea.left=-Math.ceil(pattern.length/2);
			pasteArea.top=-Math.ceil(pattern[0].length/2);
		}
	}
	render();

	currentEvent=new EventNode(currentEvent);
}

function exportRLE(){
	return patternToRLE(exportPattern().pattern);
}

function clearRLE(){
	document.getElementById("rle").value="";
}

function copyRLE(){
	document.getElementById("rle").select();
	document.getElementById("rle").setSelectionRange(0, 99999);
	document.execCommand("copy");
}

function resetHashtable(){
	reset();
	currentEvent.child=null;
	hashTable=new Array(hashTable.length);
	GRID.head.result=recalculateResult(GRID.head);
}

function recalculateResult(node){
	if(node.distance>4){
		for(let i=0;i<4;i++){
			node.child[i].result=recalculateResult(node.child[i]);
		}
	}
	return getResult(node);
}

//handle the various kinds of rule strings
function rule(ruleText){
	rulestring=ruleText;
	switch (ruleText) {
	case "Life":
		parseINTGen("B3/S23");
		break;
	case "LifeSuper":
		parseINTGen("B3/S23");
		break;
	case "LifeHistory":
		parseINTGen("B3/S23");
		break;
	case "Highlife":
		parseINTGen("B36/S23");
		break;

	default:
		parseINTGen(ruleText);
		rulestring=clean(ruleText.split(""));
	}
	resetHashtable();
}

//parse Isotropic Non-Totalistic Generations rules
function parseINTGen(ruleText){
	//the weights for decoding rule strings.
	// 16 32  64
	//  8     128
	//  4  2  1
	let ruleMap=[[0,"-"],[1,"c"],[1,"e"],[2,"a"],[1,"c"],[2,"c"],[2,"a"],[3,"i"],[1,"e"],[2,"k"],//00
	             [2,"e"],[3,"j"],[2,"a"],[3,"n"],[3,"a"],[4,"a"],[1,"c"],[2,"n"],[2,"k"],[3,"q"],//10
	             [2,"c"],[3,"c"],[3,"n"],[4,"n"],[2,"a"],[3,"q"],[3,"j"],[4,"w"],[3,"i"],[4,"n"],//20
	             [4,"a"],[5,"a"],[1,"e"],[2,"k"],[2,"i"],[3,"r"],[2,"k"],[3,"y"],[3,"r"],[4,"t"],//30
	             [2,"e"],[3,"k"],[3,"e"],[4,"j"],[3,"j"],[4,"k"],[4,"r"],[5,"n"],[2,"a"],[3,"q"],//40
	             [3,"r"],[4,"z"],[3,"n"],[4,"y"],[4,"i"],[5,"r"],[3,"a"],[4,"q"],[4,"r"],[5,"q"],//50
	             [4,"a"],[5,"j"],[5,"i"],[6,"a"],[1,"c"],[2,"c"],[2,"k"],[3,"n"],[2,"n"],[3,"c"],//60
	             [3,"q"],[4,"n"],[2,"k"],[3,"y"],[3,"k"],[4,"k"],[3,"q"],[4,"y"],[4,"q"],[5,"j"],//70
	             [2,"c"],[3,"c"],[3,"y"],[4,"y"],[3,"c"],[4,"c"],[4,"y"],[5,"e"],[3,"n"],[4,"y"],//80
	             [4,"k"],[5,"k"],[4,"n"],[5,"e"],[5,"j"],[6,"e"],[2,"a"],[3,"n"],[3,"r"],[4,"i"],//90
	             [3,"q"],[4,"y"],[4,"z"],[5,"r"],[3,"j"],[4,"k"],[4,"j"],[5,"y"],[4,"w"],[5,"k"],//100
	             [5,"q"],[6,"k"],[3,"i"],[4,"n"],[4,"t"],[5,"r"],[4,"n"],[5,"e"],[5,"r"],[6,"i"],//110
	             [4,"a"],[5,"j"],[5,"n"],[6,"k"],[5,"a"],[6,"e"],[6,"a"],[7,"e"],[1,"e"],[2,"a"],//120
	             [2,"e"],[3,"a"],[2,"k"],[3,"n"],[3,"j"],[4,"a"],[2,"i"],[3,"r"],[3,"e"],[4,"r"],//130
	             [3,"r"],[4,"i"],[4,"r"],[5,"i"],[2,"k"],[3,"q"],[3,"k"],[4,"q"],[3,"y"],[4,"y"],//140
	             [4,"k"],[5,"j"],[3,"r"],[4,"z"],[4,"j"],[5,"q"],[4,"t"],[5,"r"],[5,"n"],[6,"a"],//150
	             [2,"e"],[3,"j"],[3,"e"],[4,"r"],[3,"k"],[4,"k"],[4,"j"],[5,"n"],[3,"e"],[4,"j"],//160
	             [4,"e"],[5,"c"],[4,"j"],[5,"y"],[5,"c"],[6,"c"],[3,"j"],[4,"w"],[4,"j"],[5,"q"],//170
	             [4,"k"],[5,"k"],[5,"y"],[6,"k"],[4,"r"],[5,"q"],[5,"c"],[6,"n"],[5,"n"],[6,"k"],//180
	             [6,"c"],[7,"c"],[2,"a"],[3,"i"],[3,"j"],[4,"a"],[3,"q"],[4,"n"],[4,"w"],[5,"a"],//190
	             [3,"r"],[4,"t"],[4,"j"],[5,"n"],[4,"z"],[5,"r"],[5,"q"],[6,"a"],[3,"n"],[4,"n"],//200
	             [4,"k"],[5,"j"],[4,"y"],[5,"e"],[5,"k"],[6,"e"],[4,"i"],[5,"r"],[5,"y"],[6,"k"],//210
	             [5,"r"],[6,"i"],[6,"k"],[7,"e"],[3,"a"],[4,"a"],[4,"r"],[5,"i"],[4,"q"],[5,"j"],//220
	             [5,"q"],[6,"a"],[4,"r"],[5,"n"],[5,"c"],[6,"c"],[5,"q"],[6,"k"],[6,"n"],[7,"c"],//230
	             [4,"a"],[5,"a"],[5,"n"],[6,"a"],[5,"j"],[6,"e"],[6,"k"],[7,"e"],[5,"i"],[6,"a"],//240
	             [6,"c"],[7,"c"],[6,"a"],[7,"e"],[7,"c"],[8,"-"]];

	if(!ruleText)ruleText="B3/S23";

	ruleText=ruleText.split("");
	let readMode=1,transitionNumber=-1,isBirthDone=false;
	let splitString=[[],[],[]];

	//split the rulestring into the Birth, Survial, and Generations values
	for(let h=0;h<ruleText.length;h++){
		if(ruleText[h]==="s"||ruleText[h]==="S"){
			readMode=1;
			transitionNumber=-1;
		}else if(ruleText[h]==="b"||ruleText[h]==="B"){
			readMode=0;
			transitionNumber=-1;
			isBirthDone=true;
		}else if(ruleText[h]==="g"||ruleText[h]==="G"||ruleText[h]==="C"){
			readMode=2;
			transitionNumber=-1;
		}else if(ruleText[h]==="/"||ruleText[h]==="_"){
			if(isBirthDone===false){
				readMode=0;
				isBirthDone=true;
			}else{
				readMode=2;
			}
			transitionNumber=-1;
		}else{
			if(isNaN(ruleText[h])){
				if(transitionNumber===-1){
					alert("Illegal Character In Rule");
					splitString=[["3"],["2","3"],"2"];
					break;
				}else{
					splitString[readMode].push(ruleText[h]);
				}
			}else{
				transitionNumber=parseInt(ruleText[h],10);
				splitString[readMode].push(ruleText[h]);
			}
		}
	}

	if(splitString[2].length===0){
		splitString[2]=2;
	}else{
		splitString[2]=parseInt(splitString[2].join(""),10);
	}
	emptyNodes=new Array(ruleArray[2]);
	//empty arrays which will set how the cell states update
	ruleArray=[[],[],splitString[2]];

	//for all 255 possible states of the 8 neighbors
	for(let h=0;h<256;h++){
		//for both birth and survival states
		for(let i=0;i<2;i++){
			//assume that the cell will be dead
			ruleArray[i].push(0);
			let transitionNumber=-1;
			//for each character in the splitString
			for(let j=0;j<splitString[i].length;j++){
				if(transitionNumber===-1){
					if(splitString[i][j]==ruleMap[h][0]){
						transitionNumber=splitString[i][j];
						if(splitString[i][j+1]&&isNaN(splitString[i][j+1])){
							ruleArray[i][h]=0;
						}else{
							ruleArray[i][h]=1;
						}
					}
				}else{
					if(isNaN(splitString[i][j])){
						if(splitString[i][j]==="-"){
							j++;
							ruleArray[i][h]=1;
						}
						if(splitString[i][j]===ruleMap[h][1]){
							ruleArray[i][h]=1-ruleArray[i][h];
							break;
						}
					}else{
						break;
					}
				}
			}
		}
		if(ruleArray[2]>2&&ruleArray[1][h]===0){
			ruleArray[1][h]=2;
		}
	}

	setDrawMenu();
}

function clean(dirtyString){
	//make string to be modified into a clean version
	let cleanString=dirtyString,
	    number=0,
	    numIndex=0,
	    transitionLength=0,
	    searchIndex=0,
	    newString=[],
	    table=[["-"],
	      ["c","e"],
	      ["a","c","e","i","k","n"],
	      ["a","c","e","i","j","k","n","q","r","y"],
	      ["a","c","e","i","j","k","n","q","r","t","w","y","z"],
	      ["a","c","e","i","j","k","n","q","r","y"],
	      ["a","c","e","i","k","n"],
	      ["c","e"],
	      ["-"]],
		buffer="";
	for(;searchIndex<=cleanString.length;searchIndex++){
		if(isNaN(cleanString[searchIndex])&&searchIndex<cleanString.length){
			//check if character cleanString[searchIndex] is a transition
			if(cleanString[searchIndex]!=="/"&&
			   cleanString[searchIndex]!=="s"&&
			   cleanString[searchIndex]!=="b"&&
			   cleanString[searchIndex]!=="g"&&
			   cleanString[searchIndex]!=="S"&&
			   cleanString[searchIndex]!=="B"&&
			   cleanString[searchIndex]!=="G"){
				//remove the character if it is not a hyphen and is not a valid transition
				if(cleanString[searchIndex]!=="-"&&
				   table[number].indexOf(cleanString[searchIndex])===-1){
					cleanString.splice(searchIndex,1);
				}else{//save the character if it is a valid transition
					transitionLength++;
					newString.push(cleanString[searchIndex]);
				}
			}
		}else{
			//if the transitions are longer than 1/2 the total, then invert them
			if(transitionLength>table[number].length/2){
				if(newString[0]==="-"){
					//if all transitions are removed
					if(transitionLength-1===table[number].length){
						newString=[];
						cleanString.splice(numIndex,transitionLength+1);
						searchIndex+=newString.length-transitionLength-1;
					}else{
						for(let tableIndex = 0; tableIndex<table[number].length;tableIndex++){
							if(newString.indexOf(table[number][tableIndex])===-1){
								newString.push(table[number][tableIndex]);
							}
						}
						newString.splice(0,transitionLength);
						cleanString.splice(numIndex+1,transitionLength,...newString);
						searchIndex+=newString.length-transitionLength;
					}
				}else{
					//if all transitions are present
					if(transitionLength===table[number].length){
						newString=[];
					}else{
						//avoid a loop between transitions like 4aceijkn and 4-qrtwyz
						if(number!==4||transitionLength!==7){
							newString.push("-");
							for(let tableIndex = 0; tableIndex<table[number].length;tableIndex++){
								if(newString.indexOf(table[number][tableIndex])===-1){
									newString.push(table[number][tableIndex]);
								}
							}
							newString.splice(0,transitionLength);
						}
					}
					cleanString.splice(numIndex+1,transitionLength,...newString);
					searchIndex+=newString.length-transitionLength;
				}
			}
			if(searchIndex<cleanString.length)number=parseInt(cleanString[searchIndex],10);
			numIndex=searchIndex;
			transitionLength=0;
			newString=[];
		}
	}
	searchIndex=0;
	numIndex=0;
	while(numIndex+1<cleanString.length&&searchIndex+1<cleanString.length){
		if(["a","c","e","i","j","k","n","q","r","t","w","y","z"].indexOf(cleanString[searchIndex])!==-1){
			if(["a","c","e","i","j","k","n","q","r","t","w","y","z"].indexOf(cleanString[searchIndex+1])!==-1){
				if(cleanString[searchIndex].charCodeAt(0)>cleanString[searchIndex+1].charCodeAt(0)){
					buffer=cleanString[searchIndex+1];
					cleanString[searchIndex+1]=cleanString[searchIndex];
					cleanString[searchIndex]=buffer;
					searchIndex--;
				}else{
					numIndex++;
					searchIndex=numIndex;
				}
			}else{
				numIndex++;
				searchIndex=numIndex;
			}
		}else{
			number=cleanString[numIndex];
			numIndex++;
			searchIndex=numIndex;
		}
	}
	return cleanString.join("");
}

function main(){
	//resized the canvas whenever the window changes size
	if(windowWidth!==(window.innerWidth || document.documentElement.clientWidth)||
	   (windowHeight<(window.innerHeight || document.documentElement.clientHeight))||
	   (windowHeight>(window.innerHeight || document.documentElement.clientHeight)+40))scaleCanvas();
	//adjust a movement multplier based on the current framerate
	if(timeOfLastUpdate===0){
		frameMultiplier=1;
	}else{
		//use a weighted sum which changes frameMultiplier by 1/10th the difference
		frameMultiplier=0.1*(9*frameMultiplier+(Date.now()-timeOfLastUpdate)*0.04);
	}
	timeOfLastUpdate=Date.now();
	
	//register key inputs
	keyInput();
	//register mouse and touch inputs
	if(mouse.active)update();
	//run a generation of the simulation
	if(isPlaying!==0&&Date.now()-timeOfLastGeneration>1000-10*parseInt(document.getElementById("speed").value)){
		timeOfLastGeneration=Date.now();
		if(resetEvent===null){
			resetEvent=new EventNode(currentEvent.parent);
			resetEvent.child=currentEvent.child;
			if(GRID.type!==0&&typeof(resetEvent.finiteArray)==="string")resetEvent.finiteArray=readRLE(resetEvent.finiteArray);
		}
		for(let i=0;i<stepSize;i++){
			gen();
			currentEvent=new EventNode(currentEvent);
			if(isPlaying<0)isPlaying++;
		}

		if(GRID.type===0){
			document.getElementById("population").innerHTML="Population "+(backgroundState===0?GRID.head.population:GRID.head.distance*GRID.head.distance-GRID.head.population);
		}else{
			document.getElementById("population").innerHTML="Population "+gridPopulation;
		}
		document.getElementById("gens").innerHTML="Generation "+genCount;

		wasReset=false;
		for(let i=0;i<document.getElementById("searchOptions").children.length-1;i++){
			searchAction(document.getElementById("searchOptions").children[i].children[1]);
		}
	}
	//draw the simulation
	render();
	//call the next frame if if the simulation is playing or a key is pressed
	if(isPlaying!==0||isKeyBeingPressed)requestAnimationFrame(main);
}
requestAnimationFrame(main);
