"use strict"

class Coordinate{
	constructor(x, y){
		this.x = arguments.length==1?arguments.x:x;
		this.y = arguments.length==1?arguments.y:y;
	}
	relativeTo(offset){
		return new Coordinate(this.x - offset.x, this.y - offset.y);
	}
}

class Pointer {
	constructor(coordinate, id=0) {
		this.startPosition=this.position=coordinate;
		this.id=id;
    this.objectBeingDragged=null;
	}
	get changeIn() { return this.startPosition.relativeTo(this.position); }
	get gridPosition() { return new Coordinate(
		Math.floor(((pointers[0].position.x-canvasWidth*0.5)/view.z+canvasWidth*0.5)/cellWidth+view.x),
		Math.floor(((pointers[0].position.y-canvasHeight*0.5)/view.z+canvasHeight*0.5)/cellWidth+view.y)
	)}
}

//TODO: implement an object to handle backaend state and methods, possibly with general worker class.
let usedIDs = 0;
class Thread{
	constructor(worker){
		this.worker = new Worker(worker);
		this.timeOfLastMessage = Date.now();
		this.actionHandlerMap = {};
		this.worker.onmessage = this.onmessage.bind(this);
	}

	call(functionName, transfer, ...args){
		const id = usedIDs++;
		return new Promise((resolve) => {
			const message = { id, type:functionName, args};
			this.worker.postMessage(message, transfer);
			//store a callback for the funtion which handles the response from the worker
			this.actionHandlerMap[id] = (response) => {
				resolve(response);
			};
		});
	}

	onmessage(e){
		this.timeOfLastMessage = Date.now();
		if(Object.hasOwn(e.data, "id")){
			const { id, response } = e.data;
			if(!this.actionHandlerMap[id]) return;
			this.actionHandlerMap[id].call(this, response);
			delete this.actionHandlerMap[id];
		}

		switch(e.data.type){
			case "simulatorLoaded":
				simulator.call("setSpeed", [], parseInt(document.getElementById("speed").value));
				simulator.call("sendVisibleCells");
				initialize();
				break;
			case "alert":
        alert(e.data.value);
				break;
			case "render":
				e.data.pattern = new Pattern(e.data.pattern);
				visibleArea=new Area(e.data);
				visibleArea.pattern.height = e.data.bottom-e.data.top;
				if(GRID.backgroundState!==e.data.backgroundState){
					canvas.style.backgroundColor=ruleMetadata.color[e.data.backgroundState][e.data.backgroundState];
				}
				GRID.backgroundState = e.data.backgroundState;
				if(clearDrawnCells){
					drawnCells=[];
					clearDrawnCells=false;
				}

				if(visibleArea.pattern.cells.buffer.byteLength!==0){
					renderer.call("renderCells", [visibleArea.pattern.cells.buffer], visibleArea, view, cellWidth, ruleMetadata, darkMode, GRID.backgroundState, isElementCheckedById("gridLines") && detailedCanvas).then((bitmap) => {
						if(cellBitmap!==null)cellBitmap.close();
						cellBitmap = bitmap;

						render();
						simulator.call("requestFrames", []);
					});
				}else{
					requestAnimationFrame(render);
					simulator.call("requestFrames", []);
				}

				document.getElementById("population").innerHTML="Population "+e.data.population;
				document.getElementById("gens").innerHTML="Generation "+e.data.generation;

				if(e.data.population===0){
					window.removeEventListener("beforeunload", beforeUnload);
				} else {//if the grid is not empty, ask to save work before closing the program
					window.addEventListener("beforeunload", beforeUnload);
				}
				break;
			case "returnTransfer":
				visibleArea.pattern.cells=e.data.object;
				break;
			case "shift":
				if(e.data.args[0]==="Select Area"){
					if(selectArea)selectArea.setLocation(new Coordinate(e.data.args[1], e.data.args[2]));
				}else if(e.data.args[0]==="Paste Area"&&pasteArea!==null){
					clipboard[activeClipboard].setLocation(new Coordinate(e.data.args[1], e.data.args[2]));
				}
				break;
			case "savePattern":
				if(document.getElementById("rle").value==="")document.getElementById("rle").value="x = 0, y = 0, rule = "+ruleMetadata.string+"\n";
				document.getElementById("rle").value=appendRLE(e.data.args);
				break;
			case "modifySearchOption":
				document.getElementById("searchOptions").children[e.data.optionIndex].children[e.data.elementIndex+1].value=e.data.newValue;
				break;
		}
	}
}

function beforeUnload(event){
	event.preventDefault();
	event.returnValue = true;
}

const simulator = new Thread("simulator.js");
const renderer = new Thread("renderer.js");

const {pattern_to_base_n, base_n_to_pattern} = wasm_bindgen;

var Pattern, Area, DraggableArea, ClipboardSlot, module;
Promise.all([
	import("./Pattern.js"),
  import("./Area.js"),
	import("./DraggableArea.js"),
	import("./ClipboardSlot.js"),
	WebAssembly.compileStreaming(fetch("pkg/caplayer_utils_bg.wasm"))
]).then(async (imports) => {
	[{default: Pattern}, {default: Area}, {default: DraggableArea}, {default: ClipboardSlot}, module] = imports; 
	// wasm_bindgen({module});

	simulator.call("initializeWorker", [], module);
});

async function initialize(){
	clipboard = Array.from({length: 3}, () => new ClipboardSlot(new Pattern()));
	GRID = {
		//which kind of grid is being used
		type:0,//0=infinite,1=finite,2=toroidal
		//area representing a finite portion of the grid
		finiteArea:new DraggableArea(),
		//state of the background(used for B0 rules)
		backgroundState:0
	};
	visibleArea = new Area();

	//sets the available buttons in the Other Actions menu
	setActionMenu();
	setDark();

	if(location.search!=="")importSettings();
}

var
	//index of currently active clipbaord
	activeClipboard=1,
	//cached bitmap of the currently visible cells
	cellBitmap=null,
	//canvas element
	canvas=document.getElementById("ourCanvas"),
	//whether the code should capture the onScroll event for zooming in and out
	captureScroll=false,
	//width of each cell
	cellWidth=20,
	//copy paste clipboard
	clipboard,
	//canvas context
	ctx=canvas.getContext("2d"),
	//this determines if the UI is using the dark theme.
	darkMode=1,
	//canvas fill color(0-dark,1-light)
	detailedCanvas=true,
	//whether the cursor draws a specific state or changes automatically;-1=auto, other #s =state
	drawMode=1,
	//list of cells drawn in one action
	drawnCells=[],
	//to be cleared
	clearDrawnCells=false,
	//this determines whether the simulation is in draw, move, or select mode
	editMode=0,
	//what format should the rulestring be exported as
	exportFormat="BSG",
	//state of the grid
	GRID,
	//used for rendering user caused changes
	isKeyPressed=false,
	//whether or not the sim is playing
	isPlaying=false,
	//array of key states
	key=[],
	//list of mouse,pointers, touch instances, and other styluses
	pointers=[],
	//area containing the pattern to be pasted
	pasteArea=null,
	//point where the simulator resets to
	resetEvent=null,
	//rule stored internally as an n-tree for a n state rule
	rule,
	//number of nodes in the rule, rule family(INT, Generations, History), color
	ruleMetadata={
		size:0, //track how many nodes are used to represent the ruletree
		string:"B3/S23", //rulestring representing th ecurrent rule
		family:"INT",color:[[]], //current rule type; used to determine the colorscheme
		numberOfStates:2,
		aliveState:[1,1], // which state to transition to for birth/survival
		deadState:[0,0], //wich state to transition to for death/staying dead
		forceDeath:[false,false], // force neighboring cells to turn on
		forceLife:[false,false]  //force neighboring cells to turn off
	},
	//selected area
	selectArea=null,
	//keeps track of when the last generation occurred
	timeOfLastGeneration=0,
	//position of the current view(x/y position,zoom)
	view={
		x:-30,y:-20,z:1,
		//position of the view for when a pointer clicks or touches
		touchX:0,touchY:0,touchZ:1,
	},
	//initialize as empty marker
	visibleArea,
	//set to true if the sim was reset in/before the current generation
	wasReset=false,
	//window and canvas dimensions
	windowHeight=0,windowWidth=0,canvasWidth=0,canvasHeight=0;

let countRenders = 0;
let socket;
try{
	socket=io();
}catch(error){
	socket=null;
}

var clientId, clientName, clientList={};

//scales the canvas to fit the window
scaleCanvas();
//moves all dropdown menu to be above or below the parent button to best fit in the window
updateDropdownMenu();
//reset input fields
document.getElementById("rule").value = "";
document.getElementById("step").value = "";

function main(){
	//register key inputs
	repeatingInput();
	//draw the simulation
	render();
	//call the next frame if if the simulation is playing or a key is pressed
	if(isKeyPressed)requestAnimationFrame(main);
}

function mod(num1,num2){
	return (num1%num2+num2)%num2;
}

function distance(vec2){
	return Math.sqrt(vec2.x*vec2.x+vec2.y*vec2.y);
}

function importSettings(){
	let queryParamaters= window.location.search.split("&");

	let parsedParams = {};
	for(let i=0;i<queryParamaters.length;i++){
		const [key, value]=queryParamaters[i].split("=");
		parsedParams[key]=isNaN(value)?value:parseInt(value);
	}
	console.log(parsedParams);

	if("gens" in parsedParams)document.getElementById("gens").innerHTML="Generation "+parsedParams.gens;

	if("background" in parsedParams) GRID.backgroundState=parsedParams.background;

	if("step" in parsedParams){
		simulator.call("setStepSize", [], parsedParams.step);
		document.getElementById("step").value=parsedParams.step;
	}

	if("resetStop" in parsedParams && parsedParams.resetStop) document.getElementById("resetStop").checked=false;

	if("ratio" in parsedParams){
		document.getElementById("density").value=parsedParams.ratio;
		document.getElementById("percent").innerHTML = `${parsedParams.ratio}%`;
	}

	if("slot" in parsedParams){
		activeClipboard=parsedParams.slot;
		const copyMenu = document.getElementById("copyMenu").children;
		for(let i=0;i<copyMenu.length;i++){
			if(copyMenu[i].innerHTML.includes(parsedParams.slot.toString())){
				replaceDropdownElement(copyMenu[i]);
			}
		}
	}

	let promises = [];
	if("slots" in parsedParams){
		const attributes=parsedParams.slots.split(".");

		for(let i=0;i*4<attributes.length;i++){
			if(attributes[i*4+2]!==""){
				if(i>0){
					document.getElementById("copyMenu").innerHTML+=`<button onclick="changeCopySlot(this);" onmouseenter="showPreview(this);">${i+2}<canvas class="patternPreview"></canvas></button>`;
					clipboard.push(new ClipboardSlot(new Pattern()));
				}
				updateSelectors();

				promises.push(simulator.call("importLZ77", [], new Area(0, parseInt(attributes[i*4]), parseInt(attributes[i*4+1]), 0), attributes[i*4+2], "clipboard"+(i+1)).then((response) => {
					clipboard[i+1]=new ClipboardSlot(new Pattern(response));
				}));
			}
		}
	}

	if("rule" in parsedParams){
		document.getElementById("rule").value=decodeURIComponent(parsedParams.rule);
		promises.push(simulator.call("setRule", [], decodeURIComponent(parsedParams.rule)).then(setRuleMetaData));
	}

	if("selA" in parsedParams){
		setActionMenu();
		const area=parsedParams.selA.split(".").map(str => parseInt(str));
		promises.push(selectArea=new DraggableArea(new Area(...area)));
	}
	
	if("pat" in parsedParams){
		let args = parsedParams.pat.split(".");
		if(args.length===5)args.splice(4, 0, "0");//inserts, infinite grid typo 0 for backwards compatability
		const area=new Area(...args.slice(0,4).map((string) => parseInt(string)));
		promises.push(simulator.call("importLZ77", [], area, args[5], parseInt(args[4])).then((response) => {
			setView(new Area(-response.height/2, response.width/2, response.height/2, -response.width/2));
			GRID = response;
			GRID.finiteArea = new DraggableArea(GRID.finiteArea);
			document.getElementById("population").innerHTML="Population "+(GRID.population);
		}));
	}
	
	if("marker" in parsedParams){
		const attributes=parsedParams.marker.split(".").map(str => (isNaN(str)||str==="")?str:parseInt(str));
		for(let i=0;i<attributes.length;i+=7){
			const area=new Area(...parsedParams.marker.split(".").slice(i+1,i+5).map((string) => parseInt(string)));
			Area.markerList[attributes[i]]=area;
			if(attributes[i+5]!=="")promises.push(simulator.call("importLZ77", [], area, parsedParams.marker.split(".")[i+5], "-1").then((response) => {
				Area.markerList[attributes[i]].pattern=response;
			}));
		}
	}

	Promise.all(promises) .then(() => {
		if("pasteA" in parsedParams){
			setActionMenu();
			const area=parsedParams.pasteA.split(".").map(str => parseInt(str));
			clipboard[activeClipboard].setLocation(new Coordinate(area[1],area[0]));
			pasteArea=clipboard[activeClipboard];
			return simulator.call("setPattern", [], pasteArea, activeClipboard);
		}
		return;//may be incorrect
	}).then(() => {
		//import search options
		if("search" in parsedParams){
			//iterate trough each option to be imported
			const attributes=parsedParams.search.split(".");
			for(let i = 0; i < attributes.length; i++){
				const fields=attributes[i].split(",");
				let searchOption=document.getElementById("searchOptions").lastElementChild;

				changeAction(findElementContaining(searchOption.children[1].children[1],decodeURIComponent(fields[0])));
				//iterate through each setting within the option
				for(let j=1;j<fields.length-1;j++){
					if(!searchOption.children[j+1]||fields[j]==="")continue;
					if(searchOption.children[j+1].tagName==="INPUT"){
						searchOption.children[j+1].setAttribute("value",decodeURIComponent(fields[j]));
					}else if(searchOption.children[j+1].className.includes("condition")){
						changeCondition(findElementContaining(searchOption.children[j+1],decodeURIComponent(fields[j])));
						updateSelectors();
					}else if(searchOption.children[j+1].className.includes("conjunction")){
						//this shouldn't need an if statment but breaks URI parsing otherwise
						if(decodeURIComponent(fields[j])==="Not When")replaceDropdownElement(findElementContaining(searchOption.children[j+1],decodeURIComponent(fields[j])));
					}else if(searchOption.children[j+1].className.includes("dropdown")){
						replaceDropdownElement(findElementContaining(searchOption.children[j+1],decodeURIComponent(fields[j])));
					}
				}
				updateSearch(searchOption.children[1]);
			}
		}
	});

	if("rleMargin" in parsedParams) document.getElementById("rleMargin").value=parsedParams.rleMargin;

	if("userReset" in parsedParams) document.getElementById("userReset").checked=true;

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

async function exportSimulation(){
	let text=`${window.location.protocol}//${window.location.host}
		${window.location.pathname}?v=0.4.4`;

	reset();

	text+="&draw="+drawMode;

	const generation=parseInt(document.getElementById("gens").innerHTML.match(/\d+/)[0]);

	if(generation!==0)text+="&gen="+generation;

	if(GRID.backgroundState!==0)text+="&background="+GRID.backgroundState;

	const stepSize = parseInt(document.getElementById("step").value);
	if(stepSize&&stepSize!==1)text+="&step="+stepSize;

	if(activeClipboard!==1)text+="&slot="+activeClipboard;

	let workerTasks=[];

	let clipboardParameters;
	if(clipboard.length>3||!clipboard[1].pattern.isEmpty){
		clipboardParameters = new Array(clipboard.length).fill("");
		let clipboardTasks = [];
		clipboard.forEach((value, index) => {
			if(!(value.pattern.isEmpty)){
				clipboardTasks.push( simulator.call("getPattern", [], "LZ77", "clipboard"+(index+1)).then((response) => {
					clipboardParameters[index]+=`${value.pattern.width}.${value.pattern.height}.${response}`;
				}));
			}else{
				clipboardParameters[index]+="0.0.";
			}
		});
		setTimeout(() => {console.log(clipboardTasks);},2000);
		workerTasks.push(Promise.all(clipboardTasks).then(() => {
			console.log(clipboardParameters);
			return "&slots="+clipboardParameters.join(".");
		}));
	}

	if(selectArea)text+=`&selA=${selectArea.top}.${selectArea.right}.${selectArea.bottom}.${selectArea.left}`;

	if(pasteArea)text+=`&pasteA=${pasteArea.top}.${pasteArea.left}`;
	
	if(isElementCheckedById("resetStop")===false)text+="&resetStop=false";

	if(ruleMetadata.string!=="B3/S23"){
		text+="&rule="+encodeURIComponent(ruleMetadata.string);
	}
	
	workerTasks.push(Promise.all([
		simulator.call("calculateBounds"),
		simulator.call("getPattern", [], "LZ77", "Grid")
	]).then((responses) => {
		text+=`&pat=${GRID.type}.${responses[0].join(".")}.${responses[1]}`;
		console.log("type0write");
	}));

	if(document.getElementById("density").value!=="50"){
		text+="&ratio="+document.getElementById("density").value;
	}

	const markerPromises = [];
	let markerParameters = [];
	for (const [index, marker] of Area.markerList.entries())if(marker){
		if(marker.pattern.isEmpty){
			markerParameters[index]=`${marker.bounds.join(".")}.`;
		}else{
			markerPromises.push(simulator.call("getPattern", [], "LZ77", marker.pattern).then((response) => {
				markerParameters[index]=`${marker.bounds.join(".")}.${response}`;
			}));
		}
	}
	workerTasks.push(Promise.all(markerPromises).then(() => {
		if(markerParameters.length>0) return "&marker="+markerParameters.join(".");
		return "";
	}));

	if(document.getElementById("rleMargin").value!=="16")text+="&rleMargin="+document.getElementById("rleMargin").value;

	if(isElementCheckedById("userReset")===true)text+="&userReset=true";

	const options=document.getElementById("searchOptions").children;
	if(options.length>1){
		text+="&search=";
		for(let i=0;i<options.length-1;i++){
			for(let j=1;j<options[i].children.length-1;j++){
				if(j===1){
					if(i!==0)text+=".";
				}else{
					text+=",";
				}
				if(options[i].children[j].className.includes("dropdown")){
					text+=encodeURIComponent(options[i].children[j].children[0].innerHTML);
				}else if(options[i].children[j].tagName==="INPUT"){
					text+=encodeURIComponent(options[i].children[j].value);
				}
			}
		}
	}
	
	Promise.all(workerTasks).then((responses) => {
		text+=responses.join("");

		document.getElementById("settingsExport").innerHTML=text;
		document.getElementById("settingsExport").href=text;
	});
}

function drawCell(pointerPosition){
	let queueEnd = drawnCells[drawnCells.length - 1];
	if(GRID.type===0||GRID.finiteArea.isWithinBounds(pointerPosition)){
		if(queueEnd.length===0){
			let oldState=visibleArea.isWithinBounds(pointerPosition)?visibleArea.pattern.getCell(pointerPosition.x - visibleArea.left, pointerPosition.y - visibleArea.top):GRID.backgroundState;
			queueEnd.push({x:pointerPosition.x, y:pointerPosition.y, oldState:null, newState: drawMode==0?(oldState==0?1:0):(drawMode==oldState?0:drawMode)});
		}else if(queueEnd[queueEnd.length-1].x!==pointerPosition.x||queueEnd[queueEnd.length-1].y!==pointerPosition.y){
			queueEnd.push({x:pointerPosition.x, y:pointerPosition.y, oldState:null, newState: queueEnd[0].newState});
		}
	}
	render();
}

//TODO: replace reading and writing to clipboard with navigator API
window.addEventListener("copy", (event) => {
	if (/[^input|textarea|select]/i.test(document.activeElement.tagName)) {
		if(event.cancelable)event.preventDefault();
		exportRLE().then((response) => {
			return navigator.clipboard.writeText(response);
		}).then(
			() => { console.log("successfully copied"); },
			() => { alert("failed to copy pattern to clipboard"); }
		);
	}
});

window.addEventListener("paste", (event) => {
	if (/[^input|textarea|select]/i.test(document.activeElement.tagName)) {
		if(event.cancelable)event.preventDefault();
		const text=event.clipboardData||window.clipboardData;
		importRLE(text.getData("text"));
	}
});

window.onkeydown = function(event){
  if([9,32,37,38,39,40].includes(event.keyCode))return;
  if(event.target.nodeName==="TEXTAREA")return;
  if(event.target.nodeName==="INPUT"&&event.target.type==="text")return;
  if(event.ctrlKey===true)return;

  key[event.keyCode]=true;

  if(isKeyPressed===false)requestAnimationFrame(main);
  //set the flag that a key is down
  isKeyPressed=true;

  switch(event.keyCode){
  case 13: isPlaying?stop():start(); break;//enter
  case 46: deleteMarker(); break;//delete
  case 49: setDrawMode(); break;//1
  case 50: setMoveMode(); break;//2
  case 51: setSelectMode(); break;//3
  case 67: editArea("copy"); break;//c
  case 70://f
    if(pasteArea){
      //to rotate the paste area
      if(key[16]){
        //counter clockwise
        flipOrtho("vertical");//F
      }else{
        //clockwise
        flipOrtho("horizonal");//f
      }
    }else{
      fitView();
    }
    break;
  case 73: //i
    if(key[16]){
      editArea("increment"); break;//I
    }else{
      editArea("invert"); break;//i
    }
  case 75: editArea("clear"); break;//k
  case 77: setMark(); break;//m
  case 78: next(); break;//n
  case 82://r
    if(selectArea){
      //to randomize the select area
			editArea("randomize");
    }else if(pasteArea){
      //to rotate the paste area
      flipDiag();
      if(key[16]){
        //counter clockwise
        flipOrtho("vertical");
      }else{
        //clockwise
        flipOrtho("horizonal");
      }
    }
    break;
  case 83: if(key[16])selectAll(); break;//s and shift
  case 84://t
    reset();
    break;
  case 86://v
    paste();
    // TODO: replace render() here
    break;
  case 88://x
    editArea("cut");
    break;
  case 90://z
    if(key[16]){
      redo();
    }else{
      undo();
    }
    break;
  }
  event.preventDefault();
};

window.onkeyup = function(event){
	key[event.keyCode]=false;

	isKeyPressed=false;
	for(let h in key){
		if(key[h]===true)isKeyPressed=true;
	}
};

window.onresize = function(){
	scaleCanvas();
	render();
	updateDropdownMenu();
};

window.onscroll = function(){
	captureScroll=false;
	updateDropdownMenu();
};

canvas.onpointerdown = (event) => {
	canvas.setPointerCapture(event.pointerId);
	inputReset();
  //resets clearDrawnCells after a non draw pointer event, one which deesn't trigger a render message from the worker
  clearDrawnCells=false;

	const startPosition = new Coordinate(event.clientX-canvas.getBoundingClientRect().left,event.clientY-canvas.getBoundingClientRect().top);
	pointers.push(new Pointer(startPosition, event.pointerId));

	//coordinates of the touched cell
	switch(editMode){
		case 0:
		drawnCells.push([]);
		drawCell(pointers[0].gridPosition);
		break;
		case 1: move(pointers[0].gridPosition); break;
		case 2: select(pointers[0].gridPosition); break;
	}
}

canvas.onpointermove = (event) => {
	const index = pointers.findIndex((p) => p.id === event.pointerId);
  //TODO: add ability to draw while the rule (eg. history) is loading
	if(pointers.length>0){
		pointers[index].position=new Coordinate(event.clientX - canvas.getBoundingClientRect().left,event.clientY - canvas.getBoundingClientRect().top);
		if(pointers[0].objectBeingDragged!==null){
			pointers[0].objectBeingDragged.drag(pointers[0].gridPosition);
			render();
		}else{
			switch(editMode){
				case 0: drawCell(pointers[0].gridPosition); break;
				case 1: move(pointers[0].gridPosition); break;
				case 2: select(pointers[0].gridPosition); break;
			}
		}
	}
}

canvas.onpointerup = (event) => {
	inputReset();
	if(pointers[0]&&pointers[0].objectBeingDragged){
		if(pointers[0].objectBeingDragged===pasteArea)
			simulator.call("setPattern", [], pasteArea, activeClipboard);
		if(pointers[0].objectBeingDragged===selectArea) updateAllSearchOptions();
		pointers[0].objectBeingDragged.reset();
	}
	pointers = [];
	const index = pointers.findIndex((p) => p.id === event.pointerId);
	pointers.splice(index, 1);

	clearDrawnCells=true;
  render();
}

//controls zooming of the camera using the mouse wheel
canvas.onwheel = function(event){
	if(captureScroll===true){
		if(event.cancelable)event.preventDefault();
		const mouseX = event.clientX-canvas.getBoundingClientRect().left;
		const mouseY = event.clientY-canvas.getBoundingClientRect().top;
		zoom(1-0.1*Math.sign(event.deltaY), mouseX, mouseY);

		simulator.call("setView", [], view.x, view.y, view.z);
		render();
	}
};

function previewFile() {
	const content = document.getElementById("rle");
	const [file] = document.querySelector("input[type=file]").files;
	const reader = new FileReader();

	reader.addEventListener( "load", () => {
			// this will then display a text file
			content.value = reader.result;
			importRLE(reader.result);
		},
		false,
	);

	if (file) {
		reader.readAsText(file);
	}
}

function download(){
	var hiddenElement = document.createElement('a');
	hiddenElement.href = 'data:attachment/text,' + encodeURI(document.getElementById("rle").value);
	hiddenElement.target = '_blank';
	hiddenElement.download = 'pattern.rle';
	hiddenElement.click();
}

//update the randomize density slider
document.getElementById("density").oninput = function() {
	document.getElementById("percent").innerText = `${this.value}%`;
};

function updateDropdownMenu(){
	let dropdownElements=document.getElementsByClassName("dropdown");
	for(let i=0;i<dropdownElements.length;i++){
		let dropdownHeight=parseInt(dropdownElements[i].children[1].getBoundingClientRect().height);
		let dropdownPosition=dropdownElements[i].children[0].getBoundingClientRect();
		
		if(dropdownPosition.top<dropdownHeight||dropdownPosition.bottom+dropdownHeight<window.innerHeight){
			//place dropdown under button
			dropdownElements[i].children[1].style.bottom="unset";
		}else{
			//place dropdown over button
			dropdownElements[i].children[1].style.bottom=dropdownElements[i].offsetHeight+"px";
		}
	}
}

function sendDrawnCells(element, index){
	//TODO: clear cells to be drawn after a new pattern to render is received
	if(element.length>0&&element[0].newState!==-1){
		simulator.call("drawListOfCells", [], element).then((changedCells) => {
			if(socket&&resetEvent===null)socket.emit("draw", Date.now(), changedCells);
		});
		// delete drawnCells[index];
	}
}

//resets various values at the start and end of inputs
function inputReset(){
	captureScroll=true;
	//reset viewport variables
	view.touchX=view.x;
	view.touchY=view.y;
	view.touchZ=view.z;
	//reset drawState and save any changes to the grid
	drawnCells.forEach(sendDrawnCells);
  //shift the pattern if the finite area is resized
	if(GRID.finiteArea.edgeBeingDragged!==0){
		simulator.call("resizeFiniteArea", [], GRID.finiteArea).then(() => {
			socket.emit("sendGrid",response);
		});
	}
}

//gets key inputs
function repeatingInput(){
	//] to zoom in
	if(key[221]) zoom(1.05);
	//[ to zoom out
	if(key[219]) zoom(0.95);
	//wasd keys for move when shift is not pressed
	if(!key[16]){
		if(key[65]) view.x-=0.5/view.z;
		if(key[87]) view.y-=0.5/view.z;
		if(key[68]) view.x+=0.5/view.z;
		if(key[83]) view.y+=0.5/view.z;
		if((key[65]||key[87]||key[68]||key[83]||key[219]||key[221])&&resetEvent===null){
			if(socket)socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
			//coordinates of the touched cell
			simulator.call("setView", [], view.x, view.y, view.z);
      //drawstate can be !=-1 without a pointer due to async if you draw and move while busy(eg. loading a rule)
			if(pointers.length>0&&drawnCells&&drawnCells[drawnCells.length-1]) drawCell(pointers[0].gridPosition);
		}
	}
	if(pointers.length>0&&pointers[0].objectBeingDragged){
		pointers[0].objectBeingDragged.drag(pointers[0].gridPosition);
		render();
	}
}

//TODO: add + and - keybingings to adjust speed
function setSimSpeed(element){
  simulator.call("setSpeed", [], parseInt(element.value));
}

function setColors(){
  if(ruleMetadata.family !== "INT" && ruleMetadata.family !== "Generations")return;

  for (let backgroundState = 0; backgroundState < ruleMetadata.numberOfStates; backgroundState++) {
    const palette = ruleMetadata.color[backgroundState] = new Array(ruleMetadata.numberOfStates);
    for (let cellState = 0; cellState < palette.length; cellState++) {
      const displayedState = document.getElementById("antiStrobing").checked?(cellState-backgroundState+ruleMetadata.numberOfStates)%ruleMetadata.numberOfStates:cellState;
       
			if(displayedState===0){
				palette[cellState] = darkMode?"#222222":"#F1F1F1";
			}else if(displayedState===1){
				palette[cellState] = darkMode?"#F1F1F1":"#000000";
			}else{
				let color=240/ruleMetadata.numberOfStates*(darkMode?(ruleMetadata.numberOfStates-displayedState):(displayedState-1));
				palette[cellState] = `rgb(${color},${color},${color})`;
			}
    }
  }
	render();
}

function getColor(cellState){
  return ruleMetadata.color[GRID.backgroundState][cellState];
}

//switch to draw mode
function setDrawMode(){
	if(pasteArea){
		resetClipboard();
	}
	captureScroll=true;
	editMode=0;
	render();
}

//switch to move mode
function setMoveMode(){
	editMode=1;
	captureScroll=true;
}

//swith to select mode
function setSelectMode(){
	if(selectArea&&editMode===2)selectArea=null;
	resetClipboard();
	// setActionMenu();
	updateAllSearchOptions();
	editMode=2;
	captureScroll=true;
	render();
}

function setActionMenu(){
	for(let button of document.getElementsByClassName("displayIf")){
		button.style.display="none";
		if(button.classList.contains("select")&&selectArea)button.style.display="block";
		if(button.classList.contains("noSelect")&&selectArea==null)button.style.display="block";
		if(button.classList.contains("noArea")&&selectArea==null&&pasteArea==null)button.style.display="block";
		if(button.classList.contains("paste")&&pasteArea)button.style.display="block";
		if(button.classList.contains("marker")&&Area.selectedMarker!==null) button.style.display="block";
	}
}

function setButtonColor(element,state){
  let brightness = 0;
  if(/#[0-9A-F]{6}/.test(getColor(state))){
    const [R, G, B] = getColor(state).match(/[0-F]{2}/g).map((value) => parseInt(value, 16));
    brightness = Math.sqrt(0.299*R*R + 0.587*G*G + 0.114*B*B);//source: https://alienryderflex.com/hsp.html
  }else console.log(getColor(state), " is not in #RRGGBB format");
	element.style.backgroundColor=getColor(state);
	if(brightness>128){
		element.style.color="#000000";
	}else{
		element.style.color="#BBBBBB";
	}
}

function setDrawMenu(){
  //calculate colors for each state of the current rule
  setColors();
  
	const menu = document.getElementById("drawMenu").children[1];
	menu.innerHTML="";
	for(let i=0;i<ruleMetadata.numberOfStates;i++){
		menu.innerHTML+=`<button onclick="changeDrawMode(this);">${i}</button>`;
		setButtonColor(menu.children[i], i);
	}
	menu.children[drawMode].style.display = "none";
	setButtonColor(menu.parentNode.children[0], drawMode);
}

function setMenu(elementId, value){
	if(!document.getElementById(elementId))return;
	for (let i = 0; i < document.getElementById(elementId).children[1].children.length; i++) {
		document.getElementById(elementId).children[1].children[i].style.display="block";
	}
	document.getElementById(elementId).children[1].children[value].style.display="none";
	document.getElementById(elementId).children[0].innerHTML=document.getElementById(elementId).children[1].children[value].innerHTML;
}

function duplicateLastChild(element){
	element.appendChild(element.lastElementChild.cloneNode(true));
}

function changeCondition(element){
	const dropdown=element.parentElement.parentElement;

	while(dropdown.nextSibling){
		dropdown.nextSibling.remove();
	}

	replaceDropdownElement(element);
	dropdown.parentElement.appendChild(document.getElementById(element.innerText+" Condition Template").content.cloneNode(true));
	dropdown.parentElement.appendChild(document.getElementById("conditionHTML").content.cloneNode(true));
}

function updateAllSearchOptions(){
	simulator.call("resetSearchOptions").then(() => {
		let searchOptions=document.getElementById("searchOptions").children;
		for(let i = 0; i < searchOptions.length - 1; i++)
			updateSearch(searchOptions[i].children[1]);
	});
}

function updateSearch(element){
	const searchOption = element.parentElement;
	const optionIndex = Array.from(searchOption.parentElement.children).indexOf(searchOption);
	const args = searchOption.children;
	let conditionIndices = [], parsedArgs = [];
	for(let i=1;i<args.length-1;i++){
		parsedArgs.push(args[i].tagName==="INPUT"||args[i].tagName==="INPUT"?args[i].value:args[i].children[0].innerText);
		if(args[i].classList.contains("condition")) conditionIndices.push(i-1);
		// replaces area with bounds; in case worker would modify area directly
		switch(parsedArgs[i-1]){
			case "Select Area":
				if(selectArea!==null)parsedArgs[i-1]={name:"Select Area", bounds:selectArea.bounds};
				break;
			case "Paste Area":
				if(pasteArea!==null)parsedArgs[i-1]={name:"Paste Area", bounds:pasteArea.bounds, index: activeClipboard};
				break;
			default:
				if(parsedArgs[i-1].includes("Marker")){
					let marker = Area.markerList[parseInt(parsedArgs[i-1].slice(7))-1];
					parsedArgs[i-1]={name:parsedArgs[i-1], bounds:marker.bounds, pattern: marker.pattern};
				}else if(parsedArgs[i-1].includes("Copy Slot")){
					parsedArgs[i-1]={name:parsedArgs[i-1], index:parseInt(parsedArgs[i-1].slice(10))};
				}
		}
	}
	simulator.call("updateSearchOption", [], optionIndex, conditionIndices, parsedArgs).then(() => {});
	updateSelectors();
	setActionMenu();
}
//TODO: add funtion which copies all the parameters of a search option to the web worker
function changeAction(element){

	const option=element.parentElement.parentElement.parentElement;
	const dropdown=element.parentElement.parentElement;
	while(dropdown.nextSibling){
		dropdown.nextSibling.remove();
	}

	//add another space to the search options when the last is selected
	if(document.getElementById("searchOptions").lastElementChild===option){
		duplicateLastChild(document.getElementById("searchOptions"));
	}
	
	replaceDropdownElement(element);
	option.appendChild(document.getElementById(element.innerText+" Action Template").content.cloneNode(true));
	option.appendChild(document.getElementById("conditionHTML").content.cloneNode(true));
	//append a reset option to the top level condition dropdown(prevents feedbackloops by only adding reset condition to non reset actions)
	if(element.innerText!=="Reset"){
		option.lastElementChild.children[1].innerHTML+="<button onclick='changeCondition(this);updateSearch(this.parentElement.parentElement);'>Reset</button>";
	}
}

function replaceDropdownElement(target){
	if(!target){
		console.trace(target);
		return;
	}
	let dropdown = target.parentElement;
	
	//replaces the main button with the new action
	dropdown.previousElementSibling.innerHTML=target.innerHTML;
	
	//hide the selected option within the dropdown menu
	for(let i=0;i<dropdown.children.length;i++){
		dropdown.children[i].style.display="block";
	}
	target.style.display="none";
}

function showPreview(element){
	let previewCanvas=element.lastElementChild;
	const clipboardIndex=parseInt(element.innerText);
	if(!clipboard[clipboardIndex].pattern.isEmpty){
		if(clipboard[clipboardIndex].previewBitmap===null){
			clipboard[clipboardIndex].previewBitmap=clipboard[clipboardIndex].pattern.toBitmap();
		}

		previewCanvas.width=clipboard[clipboardIndex].previewBitmap.width;
		previewCanvas.height=clipboard[clipboardIndex].previewBitmap.height;
		previewCanvas.getContext("2d").drawImage(clipboard[clipboardIndex].previewBitmap,0,0);
	}
}

function changeCopySlot(target){
	let dropdown = target.parentElement;

	if(document.getElementById("copyMenu").lastElementChild===target){
		duplicateLastChild(dropdown);
		dropdown.lastElementChild.innerHTML=`${dropdown.children.length}<canvas class="patternPreview"></canvas>`;
		clipboard.push({pattern:new Pattern(),previewBitmap:null});
	}
	
	//update the copy slot settings
	activeClipboard=parseInt(target.innerText);
	if(pasteArea) pasteArea=clipboard[activeClipboard];

	replaceDropdownElement(target);
	//update the menus containing "Select Area","Marker 1", "Marker 2", etc...
	updateSelectors();
	render();
}

function changeGridType(target){
	let dropdown = target.parentElement;

	let targetIndex = Array.from(dropdown.children).indexOf(target);
	console.log("change GRID");
	simulator.call("setGridType", [],  targetIndex).then((response) => {
		GRID.type=targetIndex;
		GRID.finiteArea=new DraggableArea(response);
		render();
		return simulator.call("sendEntireGrid");
	}).then((response) => {
			console.log(response);
		socket.emit("sendGrid",response);
	});



	replaceDropdownElement(target);
	render();
}

function changeDrawMode(target){
	let dropdown = target.parentElement;

	//update the draw state settings
	drawMode=Array.from(dropdown.children).indexOf(target);

	setButtonColor(document.getElementById("drawMenu").children[0],drawMode);

	replaceDropdownElement(target);
}

function deleteOption(target){
	let option=target.parentElement;
	if(option.nodeName==="BUTTON")option=option.parentElement;
	if(option!==option.parentElement.lastElementChild)option.remove();
	updateAllSearchOptions();
}

function selectAll(){
  pasteArea=null;
	simulator.call("calculateBounds").then((response) => {
		console.log(response);
		selectArea=new DraggableArea(new Area(...response));
		// setActionMenu();
		updateAllSearchOptions();
	});
  render();
}

function editArea(action){
	if(pasteArea){
		resetClipboard();
	}else if(selectArea){
    simulator.call(action, [], selectArea, drawMode, activeClipboard, document.getElementById('density').value/100).then((response) => {
			if(response.hasOwnProperty("modifiedArea")){
				if(socket&&resetEvent===null)socket.emit("paste", Date.now(), [selectArea.left, selectArea.top, response.modifiedArea]);
			}
			if(response.hasOwnProperty("pattern")){
				clipboard[activeClipboard]=new ClipboardSlot(new Pattern(response.pattern), selectArea.left, selectArea.top);
        selectArea=null;
      }
			setActionMenu();
			render();
    });
		render();
	}
}

function paste(){
	captureScroll=true;
	if(pasteArea){
		simulator.call("writePatternFromClipboard", [], pasteArea.left,pasteArea.top,activeClipboard);
		//TODO: reimplement this
		if(socket&&resetEvent===null)socket.emit("paste", Date.now(), [pasteArea.left, pasteArea.top, pasteArea.pattern]);
	}else{
		if(clipboard[activeClipboard]&&!clipboard[activeClipboard].pattern.isEmpty){
			pasteArea = clipboard[activeClipboard];
		}
		selectArea=null;
		editMode=1;
		render();
	}
	// setActionMenu();
	updateAllSearchOptions();
}

//TODO: have these funtions take the pattern as an argument
//flip the pattern to be pasted
function flipDiag(){
	let newPattern=new Pattern(pasteArea.pattern.height, pasteArea.pattern.width);
	newPattern.iterate((_, x, y) => pasteArea.pattern.getCell(y, x));
	pasteArea.left-=Math.trunc(newPattern.width/2-newPattern.height/2);
	pasteArea.top +=Math.trunc(newPattern.width/2-newPattern.height/2);
	pasteArea.pattern=newPattern;
}

//flip the pattern to be pasted
function flipOrtho(direction="horizonal"){
	let newPattern=new Pattern(pasteArea.pattern.width, pasteArea.pattern.height);
	newPattern.iterate((_, x, y) => {
			if(direction==="horizonal"){
				return pasteArea.pattern.getCell(pasteArea.pattern.width-1-x, y);
			}else{
				return pasteArea.pattern.getCell(x, pasteArea.pattern.height-1-y);
			}
	});
	pasteArea.pattern=newPattern;
	simulator.call("setPattern", [], pasteArea, activeClipboard);
	pasteArea.previewBitmap=pasteArea.pattern.toBitmap();
	render();
}

//Chnages the content of dropdowns so that only elements present on the grid
function updateSelectors(){
	let dropdownContents=document.getElementsByClassName("dropdown-content");
	for(let i=0;i<dropdownContents.length;i++){
		const checkForTag = (tag) => dropdownContents[i].className.includes(tag);
		let newDropdownContent = "";
		//keep unchanging portion
		if(checkForTag("pattern-marker")){
			// if(dropdownContents[i].children[0])newDropdownContent += dropdownContents[i].children[0].outerHTML;
			for(const [index, marker] of Area.markerList.entries())if(marker){
				newDropdownContent += `\n<button onclick="replaceDropdownElement(this);updateSearch(this.parentElement.parentElement);">Marker ${index+1}</button>`;
			}
		}
		if(checkForTag("copy-slot")){
			for(let j=1;j<clipboard.length-1;j++){
				newDropdownContent +=`<button onclick="replaceDropdownElement(this);updateSearch(this.parentElement.parentElement);">Copy Slot ${j}</button>`;
			}
		}
		if(newDropdownContent)dropdownContents[i].innerHTML = newDropdownContent;
	}
}

function setView(area){
	view.x=(area.right+area.left-canvasWidth/cellWidth)/2;
	view.y=(area.bottom+area.top-canvasHeight/cellWidth)/2;
	view.touchX=0;
	view.touchY=0;
	view.z=Math.min(canvasWidth/cellWidth/(area.right-area.left+2),canvasHeight/cellWidth/(area.bottom-area.top+2));
	view.touchZ=view.z;
	simulator.call("setView", [], view.x, view.y, view.z);
	updateCanvasColor();
	if(socket&&resetEvent===null){
		socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
		socket.emit("zoom", {id:clientId, zoom:view.z});
	}
}

function fitView(){
	simulator.call("calculateBounds").then((response) => setView(new Area(response)));
}

function identify(area){
	simulator.call("identify", [], area).then((response) => {
		document.getElementById("identifyOutput").innerHTML=`
			<span>
				select area width: ${response.area.right-response.area.left}\n
				select area height: ${response.area.bottom-response.area.top}\n
				period: ${response.period}\n
				x displacement: ${response.dx}\n
				y displacement: ${response.dy}
				time elapsed: ${Math.ceil(response.timeElapsed)}
			</span>
			<canvas id="identifiedShip" style="float: none;margin: none;"></canvas>`;
		let canvasElement=document.getElementById("identifiedShip").getContext("2d");

		const bitmap=new Pattern(response.phases[0]).toBitmap();
		document.getElementById("identifiedShip").width=bitmap.width;
		document.getElementById("identifiedShip").height=bitmap.height;
		canvasElement.drawImage(bitmap,0,0);
	});
}

function deleteMarker(){
	if(Area.selectedMarker!==null) Area.markerList[Area.selectedMarker]=null;
	updateSelectors();
	setActionMenu();
	render();
}

//set default view
function setMark(){
	if(pasteArea){
		for(let h=0;h<Area.markerList.length+1;h++){
			if(!Area.markerList[h]){
				Area.markerList[h]=new Area(pasteArea);
				pasteArea=null;
				setActionMenu();
				break;
			}
		}
		updateSelectors();
	}else if(selectArea){
		for(let h=0;h<Area.markerList.length+1;h++){
			if(!Area.markerList[h]){
				setActionMenu();
				Area.markerList[h]=new Area(selectArea);//{activeState:1, top:selectArea.top, right:selectArea.right, bottom:selectArea.bottom, left:selectArea.left, pattern:new Pattern()};
				selectArea=null;
				break;
			}
		}
		updateSelectors();
	}
	render();
}

function isElementCheckedById(id){
	return document.getElementById(id).checked;
}

function setDark(){
	if(document.getElementById("darkTheme").checked){
		darkMode=1;
		document.getElementById("LightTheme").disabled =true;
		document.getElementById("DarkTheme").disabled =false;
	}else{
		darkMode=0;
		document.getElementById("LightTheme").disabled =false;
		document.getElementById("DarkTheme").disabled =true;
	}
	setDrawMenu();
  updateCanvasColor();
	// TODO: replace render() here
}

//move e frames forward
function next(){
	simulator.call("stepSimulation");
}

//toggle updating the simulation
function start(){
	simulator.call("start");
	document.getElementById("startStop").innerText = "Stop";
	isPlaying=true;
}

function stop(){
	simulator.call("stop");
	document.getElementById("startStop").innerText = "Start";
	isPlaying=false;
}

function setGridState(state){
	GRID.finiteArea = new DraggableArea(state.finiteArea);
	GRID.type = state.type;
}

function undo(){
	stop();
	simulator.call("undo").then(setGridState);
}

function redo(){
	stop();
	simulator.call("redo").then(setGridState);
}

function reset() {
	if(isElementCheckedById("resetStop")===true) stop();
	simulator.call("reset", [], isElementCheckedById("userReset")).then(setGridState);
	wasReset=true;
}

//returns the body of the passed in RLE appended to the text box's rle
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

function setRuleMetaData(metaData){
	ruleMetadata=metaData;
	//initializes the menu of draw states
	setDrawMenu();
	if(socket)socket.emit("rule", metaData.string);
	updateCanvasColor(true);
}

//import several settings
function saveRule(){
	//save the rule
	if(document.getElementById("rule").value!==""){
		simulator.call("setRule", [], document.getElementById("rule").value).then(setRuleMetaData);
		isPlaying=false;
	}
}

function saveStepSize(){
	// //save step size
	if(isNaN(document.getElementById("step").value)){
		alert("Genertions Per Update must be a number");
	}else{
		simulator.call("setStepSize", [], parseInt(document.getElementById("step").value,10));
	}
}

function zoom(deltaZoom, xFocus=0.5*canvasWidth, yFocus=0.5*canvasHeight, pastViewX=view.x, pastViewY=view.y, pastViewZ=view.z) {
	view.z=pastViewZ * deltaZoom;
	view.x=pastViewX + (xFocus-0.5*canvasWidth)*(deltaZoom-1)/(deltaZoom)/cellWidth/pastViewZ;
	view.y=pastViewY + (yFocus-0.5*canvasHeight)*(deltaZoom-1)/(deltaZoom)/cellWidth/pastViewZ;
	if(socket&&resetEvent===null)socket.emit("zoom", {id:clientId, zoom:view.z});

	updateCanvasColor();
}

//turn off lines if zoomed out significantly
//then change canvas tone to match
function updateCanvasColor(forceUpdate=false){
	if(detailedCanvas!==view.z > 0.2||forceUpdate){
    detailedCanvas = view.z > 0.2;
		if(detailedCanvas){
			canvas.style.backgroundColor=ruleMetadata.color[GRID.backgroundState][0];
		}else{
			//calculate average of main color and offset for hidden lines
			canvas.style.backgroundColor=ruleMetadata.color[GRID.backgroundState][0];
		}
	}
}

function move(coordinate){
	if(pointers.length===0)return;
	//if 2 fingers are touching the canvas
	if(pointers.length>=2){
		//scale the grid
		let pastSpacing = distance(pointers[0].startPosition.relativeTo(pointers[1].startPosition));
		let currentSpacing = distance(pointers[0].position.relativeTo(pointers[1].position));
		zoom(currentSpacing/pastSpacing, 0.5*(pointers[0].startPosition.x+pointers[1].startPosition.x), 0.5*(pointers[0].startPosition.y+pointers[1].startPosition.y), view.touchX,view.touchY,view.touchZ);
	}else{
		if(pasteArea!==null&&pasteArea.isWithinBounds(coordinate)){
			pointers[0].objectBeingDragged=pasteArea.attemptDrag(coordinate);
		}else if(GRID.type!==0&&GRID.finiteArea.isWithinBounds(coordinate)){
			//select the grid edges if necessary
			console.log("in bounds?");
			pointers[0].objectBeingDragged=GRID.finiteArea.attemptDrag(coordinate);
		}else{
			//translate the grid
			view.x=view.touchX+(pointers[0].changeIn.x)/cellWidth/view.z;
			view.y=view.touchY+(pointers[0].changeIn.y)/cellWidth/view.z;
			if(socket&&resetEvent===null)socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
		}
	}
	simulator.call("setView", [], view.x, view.y, view.z);
	render();
}

function select(coordinate){
	// select an edge of the selectArea if the cursor is within the area
	if(selectArea&&selectArea.isWithinBounds(coordinate)){
		pointers[0].objectBeingDragged=selectArea.attemptDrag(coordinate);
	}else{
		//selects the previous marker fram the sparse markkers array
		//selects the last marker if the first is currently selected
		let previousMarker = null;
		for( let [index, marker] of Area.markerList.entries())if(marker){
			if(marker.isWithinBounds(coordinate)){
				if(previousMarker!==null&&marker===Area.markerList[Area.selectedMarker]) break;
				previousMarker=index;
			}
		}
		if(previousMarker!==null)Area.selectedMarker=previousMarker;

		//if not clicking on a marker or selectArea, create a selectArea
		if(previousMarker===null&&selectArea===null){
			// make a selectArea if there are no selectable markers
			// this happens when the cursor clicks in an empty area.
			selectArea=new DraggableArea(new Area(coordinate.y, coordinate.x+1, coordinate.y+1, coordinate.x));
			pointers[0].objectBeingDragged=selectArea.attemptDrag(coordinate);
		}
		// setActionMenu();
		updateAllSearchOptions();
	}
	render();
}

//function which renders graphics to the canvas
function render(){
	//clear screen
	ctx.clearRect(0,0,canvasWidth,canvasHeight);
	countRenders++;
	if(cellBitmap!==null) ctx.drawImage(cellBitmap,0,0);
	let scaledCellWidth = cellWidth*view.z;

	ctx.font = "20px Arial";

	if(isElementCheckedById("debugVisuals")===true){
		if(darkMode){
			ctx.fillStyle="#999999";
		}else{
			ctx.fillStyle="#000000";
		}
		ctx.fillText(`view: ${Math.round(view.x * 100)/100} ${Math.round(view.touchX * 100)/100} ${Math.round(view.y*100)/100} ${Math.round(view.touchY *100)/100}`,10,15);
		ctx.fillText(countRenders+ ` renders`,10,35);
		//ctx.fillText(`${depthTotal/depthCount} hashnode depth`,10,45);
		ctx.fillText(`${ruleMetadata.size} rule nodes depth`,10,55);
		for (let i = 0; i < pointers.length; i++) {
			ctx.fillText(`cursor position: ${pointers[i].position.x} ${pointers[i].position.y}`,10,75+15*i);
		}
		/*let indexedEvent=currentEvent;
		for(let i=0;i<maxDepth;i++){
			ctx.fillText(indexedEvent.action,500,20+20*i);
			indexedEvent=indexedEvent.parent;
			if(indexedEvent==null)break;
		}*/
		// for(let i=1;i<hashTableDepths.length;i++){
		// 	if(hashTableDepths[i]&&hashTableDepths[i]){
		// 		ctx.fillRect(10*i,40,10,2*(hashTableDepths[i]).toString(2).length);
		// 	}
		// }
	}

	if(drawnCells.length>0&&isElementCheckedById("debugVisuals")===false){
		drawnCells.forEach((element) => {
			for (let i = 0; i < element.length; i++) {
				ctx.fillStyle=getColor(element[i].newState);
				ctx.fillRect(canvasWidth*0.5-((view.x-element[i].x)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-((view.y-element[i].y)*cellWidth+canvasHeight*0.5)*view.z,view.z*cellWidth,view.z*cellWidth);
			}
		});
	}

	ctx.globalAlpha=0.25;
	//draw selected area
	if(selectArea){
		if(editMode===2&&selectArea.edgeBeingDragged!==0){
			if(darkMode){
				ctx.fillStyle="#555555";
			}else{
				ctx.fillStyle="#999999";
			}
		}else{
			if(darkMode){
				ctx.fillStyle="#333333";
			}else{
				ctx.fillStyle="#CCCCCC";
			}
		}
		ctx.fillRect(canvasWidth*0.5-((view.x-selectArea.left)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-((view.y-selectArea.top)*cellWidth+canvasHeight*0.5)*view.z,(selectArea.right-selectArea.left)*scaledCellWidth-1,(selectArea.bottom-selectArea.top)*scaledCellWidth-1);
	}
	ctx.globalAlpha=1;

	//draw paste
	if(pasteArea!==null){
		ctx.globalAlpha = 0.6;
    if(darkMode){
      ctx.fillStyle="#333333";
    }else{
      ctx.fillStyle="#CCCCCC";
    }
		ctx.fillRect(canvasWidth*0.5-((view.x-pasteArea.left)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-((view.y-pasteArea.top)*cellWidth+canvasHeight*0.5)*view.z,pasteArea.pattern.width*scaledCellWidth-1,pasteArea.pattern.height*scaledCellWidth-1);

		pasteArea.pattern.render(new Coordinate(pasteArea.left, pasteArea.top), 0.8);
	}
	
	Area.markerList.forEach( (marker) => {if(marker)marker.pattern.render(new Coordinate(marker.left, marker.top), 0.8); });

	//draws the active marker after the inactive markers
	for(let [index, marker] of Area.markerList.entries())if(marker){
			if(marker!==Area.markerList[Area.selectedMarker]){
				if(darkMode){
					ctx.strokeStyle="#888888";
				}else{
					ctx.strokeStyle="#999999";
				}
			}else{
				if(darkMode){
					ctx.strokeStyle="#BBBBBB";
					ctx.fillStyle="#BBBBBB";
				}else{
					ctx.strokeStyle="#999999";
					ctx.fillStyle="#999999";
				}
				ctx.lineWidth=1;
				ctx.fillText("Marker "+(index+1),canvasWidth*0.5+1*view.z-((view.x-marker.left)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-6*view.z-((view.y-marker.top)*cellWidth+canvasHeight*0.5)*view.z,(marker.right-marker.left)*scaledCellWidth-1);
			}
			ctx.lineWidth=5*view.z;
		ctx.strokeRect(canvasWidth*0.5-((view.x-marker.left)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-((view.y-marker.top)*cellWidth+canvasHeight*0.5)*view.z,(marker.right-marker.left)*scaledCellWidth-1,(marker.bottom-marker.top)*scaledCellWidth-1);
	}
	//draw a rectangle around the right-selectArea.
	if(selectArea){
		ctx.lineWidth=3*view.z;
		ctx.strokeStyle="#666666";
		ctx.strokeRect(canvasWidth*0.5-((view.x-selectArea.left)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-((view.y-selectArea.top)*cellWidth+canvasHeight*0.5)*view.z,(selectArea.right-selectArea.left)*scaledCellWidth-1,(selectArea.bottom-selectArea.top)*scaledCellWidth-1);
	}
	//draw a rectangle around the pattern to be pasted.
	if(pasteArea!==null){
		ctx.lineWidth=3*view.z;
		ctx.strokeStyle="#666666";
		ctx.strokeRect(canvasWidth*0.5-((view.x-pasteArea.left)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-((view.y-pasteArea.top)*cellWidth+canvasHeight*0.5)*view.z,pasteArea.pattern.width*scaledCellWidth-1,pasteArea.pattern.height*scaledCellWidth-1);
	}

	//draw the border of the finite grids
	if(GRID.type!==0){
		ctx.lineWidth=2*view.z;
		if(darkMode){
			ctx.strokeStyle="#888888";
		}else{
			ctx.strokeStyle="#999999";
		}
		ctx.strokeRect(canvasWidth*0.5-((view.x-GRID.finiteArea.left)*cellWidth+canvasWidth*0.5)*view.z,canvasHeight*0.5-((view.y-GRID.finiteArea.top)*cellWidth+canvasHeight*0.5)*view.z,(GRID.finiteArea.right-GRID.finiteArea.left)*scaledCellWidth-1,(GRID.finiteArea.bottom-GRID.finiteArea.top)*scaledCellWidth-1);
	}

	//draw the view of the other clients
	for(const client in clientList){
		ctx.strokeStyle=`hsla(${clientList[client].color[0]},100%,80%,1)`;
		ctx.lineWidth=4;
		ctx.strokeRect(canvasWidth*0.5-((view.x-clientList[client].xPosition+30/clientList[client].zoom)*cellWidth)*view.z,canvasHeight*0.5-((view.y-clientList[client].yPosition+20/clientList[client].zoom)*cellWidth)*view.z,canvasWidth*view.z/clientList[client].zoom,canvasHeight*view.z/clientList[client].zoom);
		ctx.fillStyle=ctx.strokeStyle;
		ctx.font = "20px Arial";
		ctx.fillText(clientList[client].name.slice(0,100),canvasWidth*0.5-((view.x-clientList[client].xPosition+30/clientList[client].zoom)*cellWidth)*view.z,canvasHeight*0.5-10-((view.y-clientList[client].yPosition+20/clientList[client].zoom)*cellWidth)*view.z);
	}
}

//TODO: replace 600:400 canvas with actual canvas dimensions and variable cell width
function scaleCanvas(){
	windowWidth=window.innerWidth || document.documentElement.clientWidth;
	windowHeight=window.innerHeight || document.documentElement.clientHeight;
	if(windowWidth-20<windowHeight*1.2){
		canvasHeight=(windowWidth-20)/1.5;
		canvasWidth=windowWidth-20;
	}else{
		canvasHeight=windowHeight*0.8;
		canvasWidth=windowHeight*1.2;
	}
	if(windowWidth-canvasWidth>300){
		document.getElementById("top").style.width=`${windowWidth-canvasWidth-30}px`;
	}else{
		document.getElementById("top").style.width="auto";
	}

	canvas.width =canvasWidth;
	canvas.height=canvasHeight;
	cellWidth=canvasHeight/40;
	renderer.call("resizeCanvas", [], canvas.width, canvas.height);
}


function resetClipboard(){
	pasteArea=null;
	if(activeClipboard===0)
		activeClipboard=parseInt(document.getElementById("copyMenu").previousElementSibling.innerText);
}

function submitFormat(self) {
  console.log(self.id);
	[...self.parentElement.children].forEach(element=>{
		if(element!==self)element.checked=false
	});
}

function getFormat(){
	const formats = ["BSG", "gbs", "sbg"];
	for(const format of formats)if(document.getElementById(format).checked)return format;
	throw new Error("no valid format found");
}

function importRLE(rleText){
	simulator.call("importRLE", [], rleText).then((response) => {
		if(response === -1)return Promise.reject();
		if(response.writeDirectly){
			setView(new Area(...response.view));
			setGridState(response);
		}else{
			const importedPattern = new Pattern(response.pattern);
			activeClipboard=0;
			editMode=1;
			pasteArea=new ClipboardSlot(importedPattern,-Math.ceil(importedPattern.width/2),-Math.ceil(importedPattern.height/2));
			simulator.call("setPattern", [], pasteArea, 0);
      render();
			setActionMenu();
		}
		ruleMetadata=response.rule;
		setDrawMenu();
		document.getElementById("rule").value=response.rule.string;
	}).catch((reason) => {
		console.log("Importing pattern from clipboard failed due to ", reason)
	});
}

async function exportRLE(){
	return await simulator.call("getPattern", [], "RLE", selectArea??"Grid", getFormat());
}

function clearRLE(){
	document.getElementById("rle").value="";
}

function copyRLE(){
	document.getElementById("rle").select();
	document.getElementById("rle").setSelectionRange(0, 99999);
	document.execCommand("copy");
}

function updateName(inputElement){
	if(inputElement.value.length===0){
		clientName = clientId.slice(0,5);
		inputElement.value= clientName;
	}else{
		clientName = inputElement.value.slice(0,100);
	}
	socket.emit("updateName", {id:clientId, name:clientName});
}

if(socket)socket.on("addConnection", (id,connectionList) => {
	if(clientList[id]===undefined){
		clientList[id]={name:"",xPosition:view.x,yPosition:view.y,zoom:1,color:[Math.ceil(360*Math.random()),Math.ceil(255*Math.random()),Math.ceil(255*Math.random())]};
	}
	for(let id in clientList){
		if(connectionList.indexOf(id)===-1){
			console.log(`deleted ${id}`);
			delete clientList[id];
		}
	}
	// TODO: replace render() here
});

if(socket)socket.on("initializeConnection", (id, connectionList) => {
	clientId=id;
	clientName = id.slice(0,5);
	document.getElementById("displayName").value = clientName;
	//remove self from list of connections
	connectionList.splice(connectionList.indexOf(socket.id),1);

	//get user information from all other clients
	for(let index of connectionList){
		clientList[index]={name:"",xPosition:view.x,yPosition:view.y,zoom:1,color:[Math.ceil(360*Math.random()),Math.ceil(255*Math.random()),Math.ceil(255*Math.random())]};
		socket.emit("requestInformation", index);
	}

	socket.emit("updateName", {id:clientId, name:clientName});
	console.log(connectionList);
	//request the current state of the grid from a random client
	if(connectionList.length>0)socket.emit("requestGrid", connectionList[Math.floor(Math.random()*connectionList.length)]);
});

if(socket)socket.on("relayRequestInformation", () => {
	socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
	socket.emit("zoom", {id:clientId, zoom:view.z});
	socket.emit("updateName", {id:clientId, name:clientName});
	render();
});

if(socket)socket.on("relayRequestGrid", (id) => {
	console.log("sending grid");
	simulator.call("sendEntireGrid").then((response) => {
		console.log(response);
		socket.emit("sendGridToIndividual",response, id);
	});
	if(socket)socket.emit("rule", ruleMetadata.string);
});

if(socket)socket.on("relaySendGrid", msg => {
	console.log(msg);
	setGridState(msg);
	simulator.call("importPattern", [], msg.data, GRID.type, msg.finiteArea.top, msg.finiteArea.left);
});

if(socket)socket.on("deleteConnection", id => {
	delete clientList[id];
	render();
});

if(socket)socket.on("relayUpdateName", msg => {
	clientList[msg.id].name=msg.name;
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
			simulator.call("writePatternAndSave", [], msg[i].x,msg[i].y,[[msg[i].newState]]);
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
			simulator.call("writePatternAndSave", [], msg[i].x,msg[i].y,[[msg[i].oldState]]);
		}
	}else{
		for(let i=0;i<msg.length;i++){
			writePattern(msg[i].x,msg[i].y,[[msg[i].oldState]],resetEvent);
		}
	}
	// TODO: replace render() here
});

if(socket)socket.on("relayPaste", (time, msg) => {
	console.log(msg);
	if(resetEvent===null){
		simulator.call("writePatternAndSave", [], ...msg);
	}else{
		writePattern(...msg.newPatt, resetEvent);
	}
	// TODO: replace render() here
});

if(socket)socket.on("relayUndoPaste", (time, msg) => {
	console.log(msg);
	if(resetEvent===null){
		simulator.call("writePatternAndSave", [], ...msg);
	}else{
		writePattern(...msg.newPatt, resetEvent);
	}
	// TODO: replace render() here
});

if(socket)socket.on("relayRule", msg => {
	if(msg!==ruleMetadata.string){
		simulator.call("setRule", [], msg).then(setRuleMetaData);
		document.getElementById("rule").value=msg;
		alert("rule changed to: "+msg);
	}
});
