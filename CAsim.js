"use strict";
var //canvas element
	canvas=document.getElementById("ourCanvas"),
	//canvas context
	ctx=canvas.getContext("2d"),
	//window and canvas dimensions
	windowHeight=0,windowWidth=0,canvasWidth=0,canvasHeight=0,
	//state of the background(used for B0 rules)
	backgroundState=0,
	//the weights for decoding rule strings.
	// 16 32  64
	//  8     128
	//  4  2  1
    ruleMap=[[0,"-"],[1,"c"],[1,"e"],[2,"a"],[1,"c"],[2,"c"],[2,"a"],[3,"i"],[1,"e"],[2,"k"]//00
            ,[2,"e"],[3,"j"],[2,"a"],[3,"n"],[3,"a"],[4,"a"],[1,"c"],[2,"n"],[2,"k"],[3,"q"]//10
            ,[2,"c"],[3,"c"],[3,"n"],[4,"n"],[2,"a"],[3,"q"],[3,"j"],[4,"w"],[3,"i"],[4,"n"]//20
            ,[4,"a"],[5,"a"],[1,"e"],[2,"k"],[2,"i"],[3,"r"],[2,"k"],[3,"y"],[3,"r"],[4,"t"]//30
            ,[2,"e"],[3,"k"],[3,"e"],[4,"j"],[3,"j"],[4,"k"],[4,"r"],[5,"n"],[2,"a"],[3,"q"]//40
            ,[3,"r"],[4,"z"],[3,"n"],[4,"y"],[4,"i"],[5,"r"],[3,"a"],[4,"q"],[4,"r"],[5,"q"]//50
            ,[4,"a"],[5,"j"],[5,"i"],[6,"a"],[1,"c"],[2,"c"],[2,"k"],[3,"n"],[2,"n"],[3,"c"]//60
            ,[3,"q"],[4,"n"],[2,"k"],[3,"y"],[3,"k"],[4,"k"],[3,"q"],[4,"y"],[4,"q"],[5,"j"]//70
            ,[2,"c"],[3,"c"],[3,"y"],[4,"y"],[3,"c"],[4,"c"],[4,"y"],[5,"e"],[3,"n"],[4,"y"]//80
            ,[4,"k"],[5,"k"],[4,"n"],[5,"e"],[5,"j"],[6,"e"],[2,"a"],[3,"n"],[3,"r"],[4,"i"]//90
            ,[3,"q"],[4,"y"],[4,"z"],[5,"r"],[3,"j"],[4,"k"],[4,"j"],[5,"y"],[4,"w"],[5,"k"]//100
            ,[5,"q"],[6,"k"],[3,"i"],[4,"n"],[4,"t"],[5,"r"],[4,"n"],[5,"e"],[5,"r"],[6,"i"]//110
            ,[4,"a"],[5,"j"],[5,"n"],[6,"k"],[5,"a"],[6,"e"],[6,"a"],[7,"e"],[1,"e"],[2,"a"]//120
            ,[2,"e"],[3,"a"],[2,"k"],[3,"n"],[3,"j"],[4,"a"],[2,"i"],[3,"r"],[3,"e"],[4,"r"]//130
            ,[3,"r"],[4,"i"],[4,"r"],[5,"i"],[2,"k"],[3,"q"],[3,"k"],[4,"q"],[3,"y"],[4,"y"]//140
            ,[4,"k"],[5,"j"],[3,"r"],[4,"z"],[4,"j"],[5,"q"],[4,"t"],[5,"r"],[5,"n"],[6,"a"]//150
            ,[2,"e"],[3,"j"],[3,"e"],[4,"r"],[3,"k"],[4,"k"],[4,"j"],[5,"n"],[3,"e"],[4,"j"]//160
            ,[4,"e"],[5,"c"],[4,"j"],[5,"y"],[5,"c"],[6,"c"],[3,"j"],[4,"w"],[4,"j"],[5,"q"]//170
            ,[4,"k"],[5,"k"],[5,"y"],[6,"k"],[4,"r"],[5,"q"],[5,"c"],[6,"n"],[5,"n"],[6,"k"]//180
            ,[6,"c"],[7,"c"],[2,"a"],[3,"i"],[3,"j"],[4,"a"],[3,"q"],[4,"n"],[4,"w"],[5,"a"]//190
            ,[3,"r"],[4,"t"],[4,"j"],[5,"n"],[4,"z"],[5,"r"],[5,"q"],[6,"a"],[3,"n"],[4,"n"]//200
            ,[4,"k"],[5,"j"],[4,"y"],[5,"e"],[5,"k"],[6,"e"],[4,"i"],[5,"r"],[5,"y"],[6,"k"]//210
            ,[5,"r"],[6,"i"],[6,"k"],[7,"e"],[3,"a"],[4,"a"],[4,"r"],[5,"i"],[4,"q"],[5,"j"]//220
            ,[5,"q"],[6,"a"],[4,"r"],[5,"n"],[5,"c"],[6,"c"],[5,"q"],[6,"k"],[6,"n"],[7,"c"]//230
            ,[4,"a"],[5,"a"],[5,"n"],[6,"a"],[5,"j"],[6,"e"],[6,"k"],[7,"e"],[5,"i"],[6,"a"]//240
            ,[6,"c"],[7,"c"],[6,"a"],[7,"e"],[7,"c"],[8,"-"]],
		//copy paste clipboard
    clipboard=[],
    gridWidth=30,
    gridHeight=20,
		//0 area is inactive, 1 area is active select, 2 area is active paste
    selectArea={a:0,top:0,right:0,bottom:0,left:0,pastLeft:0,pastTop:0,pastRight:0,pastBottom:0},
    copyArea={top:0,right:0,bottom:0,left:0},
		//these are the 6 markers which can be placed on the grid
		markers=[{active:0,top:0,right:0,bottom:0,left:0},
		         {active:0,top:0,right:0,bottom:0,left:0},
		         {active:0,top:0,right:0,bottom:0,left:0},
		         {active:0,top:0,right:0,bottom:0,left:0},
	           {active:0,top:0,right:0,bottom:0,left:0},
			       {active:0,top:0,right:0,bottom:0,left:0}],
		//index of the marker being selected and interacted with
		selectedMarker=-1,
		//this determines whether the simulation is in draw, move, or select mode
    editMode=0,
		//this determines if the UI is using the dark theme.
    darkMode=1,
		//these are variables which are used to search for escaping spaceships.
		ship=[{stage:0,activeWidth:0,width:0,rle:"",Ypos:0,period:0,multiplier:1,reset:2,nextCheck:0},
          {stage:0,activeWidth:0,width:0,rle:"",Ypos:0,period:0,multiplier:1,reset:2,nextCheck:0},
          {stage:0,activeWidth:0,width:0,rle:"",Ypos:0,period:0,multiplier:1,reset:2,nextCheck:0},
          {stage:0,activeWidth:0,width:0,rle:"",Ypos:0,period:0,multiplier:1,reset:2,nextCheck:0}],

    //distance between pattern and border
		margin={top:0,bottom:0,right:0,left:0},
    //canvas fill color(0-dark,1-light)
    detailedCanvas=true,
    //grid array
    grid=[[],[]],
    //bitwise grid
    bitwiseGrid=[[[0,0]],[[0,0]]],
    //keeps track of whether the sim is using grid[0] or grid [1]
    gridIndex=0,
    //for loop variables
    h=0,
    i=0,
    j=0,
    //array of key states
    key=[],
    //flags for interfreting key presses
    keyFlag=[false,false],
    //toggle grid lines
    gridLines,
    //toggle debug visuals
    debugVisuals,
    //mouse and touch inputs
    mouse={
	    //which button is down
	    clickType:0,
	    //position of input
	    x:0,y:0,
	    //past position
	    pastX:0,pastY:0,
	    //position of 2nd input
	    x2:0,y2:0,
	    //past position
	    pastX2:0,pastY2:0},
    //amount of pause between generations
    //interval=0,
    //point of time where the update cycle starts
    //intervalStart=0,
    //number of genertions updated
    stepSize=1,
    //genertion where the update cycle starts
    stepStart=0,
    //rulestring
    rulestring="B3/S23",
    //2D or 1D ca
    algorithm=2,
    //rule transition array
    ruleArray=[],
    //is the grid active(not all still life)
    isActive=0,
    //has the user edited the simulation
    hasChanged=0,
    //ID of the thing being dragged(0=nothing,-4 to -1 and 4 to 4 for each corner)
    dragID=0,
    //thickness of the space around the pattern
    gridMargin=3,
    //whether the cursor draws a specific state or changes automatically;-1=auto, other #s =state
    drawMode=-1,
    //data used for finding periodic soups
    oscSearch=[[1],[1]],
    //whether or not the sim is playing
    isPlaying=0,
    //state currently being drawn by the cursor, -1=none
    drawnState=-1,
    //
    timeSinceUpdate=0,
	//time elapsed
	genCount=0,
	//list of actions for undo and redo
	actionStack=[],
	currentIndex=-1,
	startIndex=0,
	//width of each cell
	cellWidth=20,
	//current cell logged and amount
	log={cell:0,amount:0},
	      //position of the current view(x/y position,zoom)
	view={x:-0,y:0,z:1,
	      //position of the view for when a pointer clicks or touches
	      touchX:0,touchY:0,touchZ:1,
	      //amount that the grid shifts, which is used to undo patterns which moved
	      shiftX:0,shiftY:0,
	      //position of the view during a copy, so the pattern is pasted in the same place relative to the screen.
	      copyX:0,copyY:0,
	      //how much the grid edge is moved
	      u:0,d:0,r:0,l:0},
	maxDepth=20,
	maxSize=10000,
	written=false;



class Node {
	constructor(parent, x, y){
		this.parent = parent;
		this.x=x;
		this.y=y;
		this.child = [null,null,null,null];
		this.isActive=false;
		this.gen=0;
	}
	addNode(int, node){
		if(node!==null){
			this.child[int] = node;
			node.parent = this;
		}
	}
	extend(int){
		if(this.child[int]!==null){
			let buffer = this.child[int];
			this.child[int]=new Node(this,2*buffer.x-this.x,2*buffer.y-this.y);
			if(buffer.gen>genCount-2)this.child[int].addNode(3-int,buffer);
		}else{
			this.child[int]=new Leaf(this,this.x+(int%2===0?-1:1),this.y+(int<2?-1:1));
		}
	}
}

class Leaf {
	constructor(parent, x, y){
		this.parent = parent;
		this.x=x;
		this.y=y;
		this.data = [new Array(32), new Array(32)];
		for(let h = 0;h <32;h++){
			this.data[0][h]=0;
			this.data[1][h]=0;
		}
		this.adjacentNodes = [new Array(3), new Array(3), new Array(3)];
		for(let h = 0;h<3;h++){
			for(let i = 0;i<3;i++){
				this.adjacentNodes[h][i] = null;
			}
		}
		this.updateAdjacentNodes();
		if(this.adjacentNodes[0][0])this.adjacentNodes[0][0].adjacentNodes[2][2] = this;
		if(this.adjacentNodes[0][1])this.adjacentNodes[0][1].adjacentNodes[2][1] = this;
		if(this.adjacentNodes[0][2])this.adjacentNodes[0][2].adjacentNodes[2][0] = this;
		if(this.adjacentNodes[1][0])this.adjacentNodes[1][0].adjacentNodes[1][2] = this;
		if(this.adjacentNodes[1][2])this.adjacentNodes[1][2].adjacentNodes[1][0] = this;
		if(this.adjacentNodes[2][0])this.adjacentNodes[2][0].adjacentNodes[0][2] = this;
		if(this.adjacentNodes[2][1])this.adjacentNodes[2][1].adjacentNodes[0][1] = this;
		if(this.adjacentNodes[2][2])this.adjacentNodes[2][2].adjacentNodes[0][0] = this;
		this.isActive=false;
		this.gen=0;
	}
	updateAdjacentNodes(){
		this.adjacentNodes[0][0]= getNode(this.x*15+30,this.y*15+30);
		this.adjacentNodes[0][1]= getNode(this.x*15+30,this.y*15   );
		this.adjacentNodes[0][2]= getNode(this.x*15+30,this.y*15-30);
		this.adjacentNodes[1][0]= getNode(this.x*15   ,this.y*15+30);
		this.adjacentNodes[1][1]= this;
		this.adjacentNodes[1][2]= getNode(this.x*15   ,this.y*15-30);
		this.adjacentNodes[2][0]= getNode(this.x*15-30,this.y*15+30);
		this.adjacentNodes[2][1]= getNode(this.x*15-30,this.y*15   );
		this.adjacentNodes[2][2]= getNode(this.x*15-30,this.y*15-30);
	}
}
var head = new Node(null, 0, 0);
head.addNode(2,new Leaf(head,-1, 1));
head.addNode(3,new Leaf(head, 1, 1));
head.addNode(0,new Leaf(head,-1,-1));
head.addNode(1,new Leaf(head, 1,-1));
//console.log("this "+head.child[3].adjacentNodes[0][3-h]);
/*
head.addNode(0,new Leaf(head,-1,-1));
head.addNode(1,new Leaf(head, 1,-1));
head.addNode(2,new Leaf(head,-1, 1));
head.addNode(3,new Leaf(head, 1, 1));

head.extend(2);
console.log(head.child[2].child);
head.child[2].extend(3);*/
//head.child[0].child[0].child[0].extend(0);
//head.child[0].child[0].child[0].child[0].extend(0);
//head.child[0].child[0].child[0].child[0].child[0].extend(0);

/*head.child[3].data[0][1]=2;
head.child[3].data[0][2]=4;
head.child[3].data[0][3]=8;
head.child[3].data[0][4]=16;
head.child[3].data[0][5]=32;
head.child[3].data[0][6]=64;*/

//console.log(head.child[0].data[0]);

//setup grid
for(let h=0;h<Math.floor(600/cellWidth);h++){
	grid[0].push([]);
	grid[1].push([]);
	for(let i=0;i<Math.floor(400/cellWidth);i++){
		//# of neighbors,touched,state,future state
		grid[0][h].push(0);
		grid[1][h].push(0);
	}
}
//set the rule to Conway's Game of Life
rule("B3/S23");
//set the state of the grid lines and debug view
toggleLines();
toggleDebug();
//rule("W30");
updateDropdownMenu();
//automatically chooses the state being written
drawState(-1);
//save the empty grid
done();

//mouse input
canvas.onmousedown = function(event){
	mouse.clickType = event.buttons;
	if(event.target.nodeName==="CANVAS")canvas.focus();
	dragID=0;
	getInput(event);
	inputReset();
	drawnState=-1;
	event.preventDefault();
};
canvas.onmousemove = function(event){
	mouse.clickType = event.buttons;
	getInput(event);
};

canvas.onmouseup = function(event){
	mouse.clickType=  0;
	dragID=0;
	getInput(event);
	inputReset();
	if(hasChanged!==0){
		done();
	}
};

window.onkeydown = function(event){
if(event.ctrlKey===false&&event.keyCode!==9&&event.keyCode!==32&&(event.keyCode<37||event.keyCode>40)&&event.target.nodeName!=="TEXTAREA"&&(event.target.nodeName!=="INPUT"||event.target.type!="text")){
		key[event.keyCode]=true;
	  if(keyFlag[0]===false&&isPlaying===0)requestAnimationFrame(main);
	  keyFlag[0]=true;
	  event.preventDefault();
	}
};

window.onkeyup = function(event){
	key[event.keyCode]=false;
	keyFlag[0]=false;
	for(h in key){
		if(key[h]===true)keyFlag[0]=true;
	}
	keyFlag[1]=false;
};

window.onresize = function(event){
	if(isPlaying===0)requestAnimationFrame(main);
	updateDropdownMenu();
};

window.onscroll = function(event){
	updateDropdownMenu();
}

//touch inputs
canvas.ontouchstart = function(event){
	dragID=  0;
	getInput(event);
	inputReset();
	drawnState= -1;
	if(event.cancelable)event.preventDefault();
};

canvas.ontouchend = function(event){
	dragID=  0;
	getInput(event);
	inputReset();
	if(hasChanged!==0){
		done();
	}
};

canvas.ontouchmove = function(event){
	getInput(event);
};

//update the randomize density slider
document.getElementById("density").oninput = function() {
	document.getElementById("percent").innerHTML = this.value+"%";
};

function updateDropdownMenu(){
	if(document.getElementById("dropbtn2").getBoundingClientRect().top<240
	 ||document.getElementById("dropbtn2").getBoundingClientRect().bottom<window.innerHeight-240){
		document.getElementById("dropdown-content2").style.bottom="unset";
	}else{
		document.getElementById("dropdown-content2").style.bottom="30px";
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
	//reset the selected area variables
	if(selectArea.a>0){
		selectArea.pastLeft=selectArea.left;
		selectArea.pastTop=selectArea.top;
		selectArea.pastRight=selectArea.right;
		selectArea.pastBottom=selectArea.bottom;
	}
	//reset the markers
	selectedMarker=-1;
	if(selectArea.left===selectArea.right||selectArea.top===selectArea.bottom)selectArea.a=0;
}

//gets mouse and touch inputs
function getInput(e){
	if(e.touches&&e.touches.length>0){
		mouse.x=(e.touches[0].clientX-canvas.getBoundingClientRect().left)/canvasHeight*400;
		mouse.y=(e.touches[0].clientY-canvas.getBoundingClientRect().top)/canvasHeight*400;
		if(e.touches.length>1){
			mouse.x2=(e.touches[1].clientX-canvas.getBoundingClientRect().left)/canvasHeight*400;
			mouse.y2=(e.touches[1].clientY-canvas.getBoundingClientRect().top)/canvasHeight*400;
		}else{
			mouse.x2=0;
			mouse.y2=0;
		}
	}else{
		if(mouse.clickType>0){
			mouse.x=(e.clientX-canvas.getBoundingClientRect().left)/canvasHeight*400;
			mouse.y=(e.clientY-canvas.getBoundingClientRect().top)/canvasHeight*400;
		}else{
			mouse={x:0,y:0};
		}
	}
	if(isPlaying===0&&keyFlag[0]===false)requestAnimationFrame(main);
}

//gets key inputs
function keyInput(){
	//- and = for zoom
	if(key[187])view.z*=1.05;
	if(key[189])view.z/=1.05;
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

	//arrow keys for move
	if(key[65])view.x-=0.5/view.z;
	if(key[87])view.y-=0.5/view.z;
	if(key[68])view.x+=0.5/view.z;
	if(key[83])view.y+=0.5/view.z;
	//actions to only be tamoveken once
	if(keyFlag[1]===false){
		//1,2 and 3 for switching modes
		if(key[49]){
			draw();
			keyFlag[1]=true;
		}
		if(key[50]){
			move();
			keyFlag[1]=true;
		}
		if(key[51]){
			select();
			keyFlag[1]=true;
		}
		//x,c and v for cut,copy and paste
		if(key[88]){
			cut();
			keyFlag[1]=true;
		}
		if(key[67]){
			copy();
			keyFlag[1]=true;
		}
		if(key[86]){
			paste();
			keyFlag[1]=true;
		}
		//enter to start and stop
		if(key[13]){
			start(0);
			keyFlag[1]=true;
		}
		//n for next gen
		if(key[78]){
			next();
			keyFlag[1]=true;
		}
		//r to randomize
		if(key[82]){
			randomize();
			keyFlag[1]=true;
		}
		//delete to clear
		if(key[75]){
			clearGrid();
			keyFlag[1]=true;
		}
		//l to fill with drawn state
		if(key[76]){
			fillGrid();
			keyFlag[1]=true;
		}
		//i to return to initial state
		if(key[73]){
			invert();
			keyFlag[1]=true;
		}
		//f to fit view
		if(key[70]){
			fitView();
			keyFlag[1]=true;
		}
		//m to set a marker
		if(key[77]){
			setMark();
			keyFlag[1]=true;
		}
		// z for undo and shift z for redo
		if(key[90]){
			if(key[16]){
				redo();
			}else{
				undo();
			}
			keyFlag[1]=true;
		}
		//i to return to initial state
		if(key[84]){
			reset();
			keyFlag[1]=true;
		}
	}
}

function setError(message){
	document.getElementById("error").innerHTML=message;
}

function getColor(cellState){
	if(darkMode){
		if(cellState===0){
			return "#222";
		}else if(cellState===1){
			return "#f1f1f1";
		}else{
			let color=240/ruleArray[2]*(ruleArray[2]-cellState);
			return "rgb("+color+","+color+","+color+")";
		}
	}else{
		if(cellState===0){
			return "#f1f1f1";
		}else if(cellState===1){
			return "#000";
		}else{
			let color=240/ruleArray[2]*(cellState-1);
			return "rgb("+color+","+color+","+color+")";
		}
	}
}

//switch to draw mode
function draw(){
	if(selectArea.a===2)selectArea.a=0;
	editMode=0;
	//for(let h=0;h<3;h++)if(h!==0)document.getElementById("Button"+h.toString()).style.outlineStyle="none";
	//document.getElementById("Button0").style.outlineStyle="solid";
	if(isPlaying===0)render();
}

function drawState(n){
	drawMode=n;
	//document.getElementById("dropdown-content").style.display="none";
	if(n===-1){
		document.getElementById("dropbtn1").innerHTML="Auto";
		document.getElementById("dropdown-content1").innerHTML="";
	}else{
		document.getElementById("dropbtn1").innerHTML=n.toString();
		if(n>ruleArray[2]*0.8||n===0){
			if(darkMode){
				document.getElementById("dropbtn1").style.color="#bbb";
			}else{
				document.getElementById("dropbtn1").style.color="#000";
			}
		}else{
			if(darkMode){
				document.getElementById("dropbtn1").style.color="#000";
			}else{
				document.getElementById("dropbtn1").style.color="#bbb";
			}
		}
		document.getElementById("dropbtn1").style.backgroundColor=getColor(n);
		document.getElementById("dropdown-content1").innerHTML="<div id=\"auto\" onclick=\"drawState(-1)\">Auto</div>";
	}
	for(let h=0;h<ruleArray[2];h++){
		if(h!==n){
			document.getElementById("dropdown-content1").innerHTML+="<div id=\"s"+h+"\" onclick=\"drawState("+h+")\">"+h+"</div>";
			document.getElementById("s"+h).style.backgroundColor=getColor(h);
			if(h>ruleArray[2]*0.8||h===0){
				if(darkMode){
					document.getElementById("s"+h).style.color="#bbb";
					document.getElementById("s"+h).style.borderColor="#bbb";
				}else{
					document.getElementById("s"+h).style.color="#000";
					document.getElementById("s"+h).style.borderColor="#000";
				}
			}else{
				if(darkMode){
					document.getElementById("s"+h).style.color="#000";
					document.getElementById("s"+h).style.borderColor="#bbb";
				}else{
					document.getElementById("s"+h).style.color="#bbb";
					document.getElementById("s"+h).style.borderColor="#000";
				}
			}
		}
	}
}

//switch to move mode
function move(){
	editMode=1;
	//for(let h=0;h<3;h++)if(h!==1)document.getElementById("Button"+h.toString()).style.outlineStyle="none";
	//document.getElementById("Button1").style.outlineStyle="solid";
}

//swith to select mode
function select(){
	if(selectArea.a===2||selectArea.a===1&&editMode===2)selectArea.a=0;
	editMode=2;
	//for(let h=0;h<3;h++)if(h!==2)document.getElementById("Button"+h.toString()).style.outlineStyle="none";
	//document.getElementById("Button2").style.outlineStyle="solid";
	if(isPlaying===0)render();
}

function selectAll(){
	xsides(0,gridHeight);
	ysides(0,gridWidth);
	selectArea.a=1;
	selectArea.top=margin.top;
	selectArea.right=margin.right;
	selectArea.bottom=margin.bottom;
	selectArea.left=margin.left;
	console.log(selectArea);
	if(isPlaying===0)render();
}

function copy(){
	clipboard=[];
	if(selectArea.a===2)selectArea.a=0;
	copyArea.left=selectArea.a===1?selectArea.left:0;
	copyArea.top=selectArea.a===1?selectArea.top:0;
	copyArea.right=selectArea.a===1?selectArea.right:gridWidth;
	copyArea.bottom=selectArea.a===1?selectArea.bottom:gridHeight;

	view.copyX=view.x;
	view.copyY=view.y;

	for(let h=copyArea.left;h<copyArea.right;h++){
		clipboard.push([]);
		for(let i=copyArea.top;i<copyArea.bottom;i++){
			if(h>=0&&h<gridWidth&&i>=0&&i<gridHeight){
				clipboard[clipboard.length-1].push(grid[gridIndex][h][i]);
			}else{
				clipboard[clipboard.length-1].push(backgroundState);
			}
		}
	}
	if(arguments.length===0)selectArea.a=0;
	isPlaying=0;
	render();
}

function cut(){
	copy(0);
	clearGrid();
}

function paste(){
	if(clipboard.length>0){
		//enter move mode
		move();
		//first press of paste shows the pattern
		if(selectArea.a!==2){
			selectArea.a=2;
			selectArea.left= Math.round(view.x-view.copyX)+copyArea.left;
			selectArea.top= Math.round(view.y-view.copyY)+copyArea.top;
			selectArea.right=Math.round(view.x-view.copyX)+copyArea.right;
			selectArea.bottom=Math.round(view.y-view.copyY)+copyArea.bottom;
		//the next press places it on the grid
		}else{
			stretch();
			scaleGrid();
			for(let h=0;h<clipboard.length;h++){
				if(h+selectArea.left<gridWidth)for(let i=0;i<clipboard[0].length;i++){
					if(i+selectArea.top<gridHeight)grid[gridIndex][h+selectArea.left][i+selectArea.top]=clipboard[h][i];
				}
			}
		}

		isPlaying=0;
		addMargin();
		done();
		render();
	}
}

//fill the grid with random cell states
function randomize(){
	//if(selectArea.a===2)selectArea.a=0;
	let top,bottom,left,right;
	if(selectArea.a===1){
		stretch();
		scaleGrid();
		left=selectArea.left;
		right=selectArea.right;
		top=selectArea.top;
		bottom=selectArea.bottom;
	}else if(!isNaN(document.getElementById("markerNumber").value)
	         &&""!==document.getElementById("markerNumber").value
				   &&markers[parseInt(document.getElementById("markerNumber").value,10)-1]
					 &&markers[parseInt(document.getElementById("markerNumber").value,10)-1].active>0){
		let index=parseInt(document.getElementById("markerNumber").value,10)-1;
		left=markers[index].left;
		right=markers[index].right;
		top=markers[index].top;
		bottom=markers[index].bottom;
	}else{
		top=0;
		right=gridWidth;
		bottom=gridHeight;
		left=0;
	}
	for(let h=left;h<right;h++){
		for(let i=top;i<bottom;i++){
			if(grid[gridIndex][h]){
				if(Math.random()<document.getElementById("density").value/100){
					grid[gridIndex][h][i]=1;
				}else{
					grid[gridIndex][h][i]=0;
				}
			}
		}
	}
	//D_4+ symmetry
	if(!document.getElementById("c1").checked){
		if(document.getElementById("d2h").checked||document.getElementById("d4").checked){
			for(let h=left;h<right;h++){
				for(let i=top;i<bottom;i++){
					if(i>Math.floor(top+((bottom-top)/2))-1){
					 if(document.getElementById("inverse").checked){
		         grid[gridIndex][h][i]=1-grid[gridIndex][h][top+bottom-i-1];
					 }else{
						 grid[gridIndex][h][i]=grid[gridIndex][h][top+bottom-i-1];
					 }
					}
				}
			}
		}
		if(document.getElementById("d2v").checked||document.getElementById("d4").checked){
			for(let h=left;h<right;h++){
				for(let i=top;i<bottom;i++){
					if(h<Math.ceil(left+(right-left)/2)){
					 	if(document.getElementById("inverse").checked){
						  grid[gridIndex][h][i]=1-grid[gridIndex][left+right-h-1][i];
					  }else{
							grid[gridIndex][h][i]=grid[gridIndex][left+right-h-1][i];
						}
					}
				}
			}
		}
	}
	genCount=0;
	document.getElementById("gens").innerHTML="Generation 0.";
	//addMargin();
	done();
	if(isPlaying===0)render();
}

//clear the grid
function clearGrid(){
	let top,right,bottom,left;
	if(arguments.length===4){
		top=arguments[0];
		right=arguments[1];
		bottom=arguments[2];
		left=arguments[3];

		for(let h=left;h<right;h++){
			for(let i=top;i<bottom;i++){
				grid[gridIndex][h][i]=0;
			}
		}
	}else{
		let AMarkerWasDeleted=false;
		for(let h = 0;h<markers.length;h++){
			if(markers[h].active===2){
				markers[h].active=0;
				AMarkerWasDeleted=true;
			}
			if(AMarkerWasDeleted){
				if(h<markers.length-1){
					markers[h]=markers[h+1];
				}else{
					markers[h]={active:0,top:0,right:0,bottom:0,left:0};
				}
			}
		}
		if(AMarkerWasDeleted)console.log(markers);
		if(!AMarkerWasDeleted){

			if(selectArea.a===2){
				selectArea.a=0;
			}else{
				if(selectArea.a===1){
					stretch();
					scaleGrid();
					left=selectArea.left;
					right=selectArea.right;
					top=selectArea.top;
					bottom=selectArea.bottom;
				}else{
					top=0;
					right=gridWidth;
					bottom=gridHeight;
					left=0;
				}
				isActive=0;
				if(right){
					for(let h=left;h<right;h++){
						for(let i=top;i<bottom;i++){
							if(grid[gridIndex][h][i]!==0){
								grid[gridIndex][h][i]=0;
								isActive=1;
							}
						}
					}
				}
				backgroundState=0;
				if(isActive===1&&arguments.length===0)done();
			}
			isPlaying=0;
		}
		render();
	}
}


function fillGrid(){
	let top,right,bottom,left;
	if(arguments.length===4){
		top=arguments[0];
		right=arguments[1];
		bottom=arguments[2];
		left=arguments[3];

		for(let h=left;h<right;h++){
			for(let i=top;i<bottom;i++){
				if(drawMode===-1){
					grid[gridIndex][h][i]=1;
				}else{
					grid[gridIndex][h][i]=drawMode;
				}
			}
		}
	}else{
		if(selectArea.a===2){
			selectArea.a=0;
		}else{
			if(selectArea.a===1){
					stretch();
					scaleGrid();
					left=selectArea.left;
					right=selectArea.right;
					top=selectArea.top;
					bottom=selectArea.bottom;
				}else{
					top=0;
					right=gridWidth;
					bottom=gridHeight;
					left=0;
				}
			isActive=0;
			if(right){
				for(let h=left;h<right;h++){
					for(let i=top;i<bottom;i++){
						if(drawMode===-1){
							if(grid[gridIndex][h][i]!==1){
								grid[gridIndex][h][i]=1;
								isActive=1;
							}
						}else{
							if(grid[gridIndex][h][i]!==drawMode){
								grid[gridIndex][h][i]=drawMode;
								isActive=1;
							}
						}
					}
				}
			}
			if(isActive===1&&arguments.length===0)done();
		}
		isPlaying=0;
		render();
	}
}

//set default view
function fitView(){
	view.x=(gridWidth-30)/2;
	view.y=(gridHeight-20)/2;
	view.touchX=0;
	view.touchY=0;
	view.z=Math.min(600/cellWidth/gridWidth,400/cellWidth/gridHeight);
	view.touchZ=Math.min(600/cellWidth/gridWidth,400/cellWidth/gridHeight);
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
	if(isPlaying===0)render();
}

function setMark(){
	if(selectArea.a===1){
		for(let h=0;h<markers.length;h++){
			if(markers[h].active===0){
				selectArea.a=0;
				markers[h].active=1;
				markers[h].top=selectArea.top;
				markers[h].right=selectArea.right;
				markers[h].bottom=selectArea.bottom;
				markers[h].left=selectArea.left;
				break;
			}
		}
	}
	if(isPlaying===0)render();
}

//fill the grid with the opposite cell state, states 2+ are unchanged
function invert(){
	if(selectArea.a===2)selectArea.a=0;
	let top,bottom,left,right;
	if(selectArea.a===1){
		stretch();
		scaleGrid();
		left=selectArea.left;
		right=selectArea.right;
		top=selectArea.top;
		bottom=selectArea.bottom;
	}else{
		top=0;
		right=gridWidth;
		bottom=gridHeight;
		left=0;
	}
	for(let h=left;h<right;h++){
		for(let i=top;i<bottom;i++){
			if(grid[gridIndex][h]){
				if(grid[gridIndex][h][i]===0){
					grid[gridIndex][h][i]=1;
				}else if(grid[gridIndex][h][i]===1){
					grid[gridIndex][h][i]=0;
				}
			}
		}
	}
	//addMargin();
	done();
	if(isPlaying===0)render();
}

//toggle drawing the grid
function toggleLines(){
	if(document.getElementById("gridLines").checked){
		gridLines=true;
	}else{
		gridLines=false;
	}
	if(isPlaying===0)render();
}

//toggle debug visuals and node diagrams
function toggleDebug(){
	if(document.getElementById("debugVisuals").checked){
		debugVisuals=true;
	}else{
		debugVisuals=false;
	}
	if(isPlaying===0)render();
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
	drawState(drawMode);
	render();
}

//move e frames forward
function next(){
	if(isPlaying===0)requestAnimationFrame(main);
	isPlaying=-stepSize;
	stepStart=genCount;
}

//toggle updating the simulation
function start(newFrame){
	if(isPlaying===0){
		isPlaying=1;
		stepStart=genCount;
		if(newFrame!==0)requestAnimationFrame(main);
	}else{
		isPlaying=0;
	}
}

function undo(){
	if(currentIndex>0){
		currentIndex--;
		readStack();
		isPlaying=0;
		render();
	}
}

function redo(){
	if(actionStack.length>=currentIndex+2){
		currentIndex++;
		readStack();
		isPlaying=0;
		render();
	}
}

//go to before the simulation started
function reset(){
	if(startIndex!==0){
		currentIndex=startIndex;
		startIndex=0;
		backgroundState=0;
		readStack();
		if(arguments.length===0){
			isPlaying=0;
			render();
		}
	}

	let rightShift = parseInt(document.getElementById("rightShift").value,10),
			downShift  = parseInt(document.getElementById("downShift").value,10);
	if((rightShift!=0||downShift!=0)&&selectArea.a===2){
		selectArea.left+=rightShift;
		selectArea.right+=rightShift;
		selectArea.top+=downShift;
		selectArea.bottom+=downShift;
		paste();
	}

	if(algorithm===1){
		genCount=0;
		for(let h=0;h<bitwiseGrid[0].length;h++){
			for(let i=1;i<bitwiseGrid[0][h].length;i++){
				bitwiseGrid[0][h][i]=0;
				bitwiseGrid[1][h][i]=0;
			}
		}
	}
}

//save and action to the undo stack
function done(){
	if(currentIndex-startIndex<600){
		currentIndex++;
		while(currentIndex<actionStack.length)actionStack.pop();
		actionStack.push({a:isActive,b:startIndex,grid:"",w:gridWidth,h:gridHeight,margin:{t:0,b:0,r:0,l:0},o:{x:view.shiftX,y:view.shiftY},baseState: backgroundState,time:genCount});
	}else{
		for(let h=startIndex;h<currentIndex;h++){
			//prevents the startIndex from being overwritten unless at 0
			if(h===startIndex&&h>0)h++;
			actionStack[h]=actionStack[h+1];
		}
		actionStack[currentIndex]={a:isActive,b:startIndex,grid:"",w:gridWidth,h:gridHeight,margin:{t:0,b:0,r:0,l:0},o:{x:view.shiftX,y:view.shiftY},baseState: backgroundState,time:genCount};
	}
	actionStack[currentIndex].grid=readPattern(margin.top,margin.right,margin.bottom,margin.left);
	actionStack[currentIndex].margin={t:margin.top,b:margin.bottom,r:margin.right,l:margin.left};
	//console.log(actionStack[currentIndex].o.x+" "+view.shiftX);
	hasChanged=0;
}

//pull information from the undostack
function readStack(){
	let xOffset=actionStack[currentIndex].o.x-view.shiftX,
	    yOffset=actionStack[currentIndex].o.y-view.shiftY;
	//return viewing window to it's previous position
	view.x+=xOffset;
	view.y+=yOffset;
	//return highlighted area to it's previous position
	selectArea.left+=xOffset;
	selectArea.right+=xOffset;
	selectArea.top+=yOffset;
	selectArea.bottom+=yOffset;
	//return highlighted area to it's previous position
	selectArea.pastLeft+=xOffset;
	selectArea.pastRight+=xOffset;
	selectArea.pastTop+=yOffset;
	selectArea.pastBottom+=yOffset;
	//return markers to their previous position
	for(let h=0;h<markers.length;h++){
		markers[h].top+=yOffset;
		markers[h].right+=xOffset;
		markers[h].bottom+=yOffset;
			markers[h].left+=xOffset;
	}
	//console.log(actionStack[currentIndex].o.x+" "+view.shiftX);
	//return highlighted copy area to it's previous position
	view.r=actionStack[currentIndex].w-gridWidth;
	view.d=actionStack[currentIndex].h-gridHeight;
	view.shiftX=actionStack[currentIndex].o.x;
	view.shiftY=actionStack[currentIndex].o.y;
	//set startIndex to zero when actions are undone past the start
	startIndex=actionStack[currentIndex].b;
	backgroundState=actionStack[currentIndex].baseState;
	//scaleGrid();
	if(genCount!==actionStack[currentIndex].time){
		genCount=actionStack[currentIndex].time;
		document.getElementById("gens").innerHTML="Generation "+genCount+".";
	}
	for(let h=0;h<actionStack[currentIndex].margin.l;h++){
		for(let i=0;i<actionStack[currentIndex].h;i++){
			grid[gridIndex][h][i]=backgroundState;
		}
	}
	for(let i=0;i<actionStack[currentIndex].margin.t;i++){
		for(let h=0;h<actionStack[currentIndex].w;h++){
			grid[gridIndex][h][i]=backgroundState;
		}
	}
	for(let h=actionStack[currentIndex].w-actionStack[currentIndex].margin.r;h<actionStack[currentIndex].w;h++){
		for(let i=0;i<actionStack[currentIndex].h;i++){
			grid[gridIndex][h][i]=backgroundState;
		}
	}
	for(let i=actionStack[currentIndex].h-actionStack[currentIndex].margin.b;i<actionStack[currentIndex].h;i++){
		for(let h=0;h<actionStack[currentIndex].w;h++){
			grid[gridIndex][h][i]=backgroundState;
		}
	}
	gridWidth=actionStack[currentIndex].w;
	gridHeight=actionStack[currentIndex].h;
	if(""===actionStack[currentIndex].grid){
		for(let h=0;h<gridWidth;h++){
			for(let i=0;i<gridHeight;i++){
				grid[gridIndex][h][i]=backgroundState;
			}
		}
	}else{
		drawPattern(0,actionStack[currentIndex].grid.split(""),actionStack[currentIndex].margin.l,actionStack[currentIndex].margin.t);
	}
}

function round(num){
	return Math.round(num*1000)/1000;
}

function menu(n){
	if(document.getElementById("menu"+n.toString()).style.display==="block"){
		document.getElementById("arrow"+n.toString()).innerHTML="&#x27A1";
		document.getElementById("menu"+n.toString()).style.display="none";
	}else{
		document.getElementById("arrow"+n.toString()).innerHTML="&#x2B07";
		document.getElementById("menu"+n.toString()).style.display="block";
	}
}

/*function addSaveCondition(){
			document.getElementById("saveConditions").appendChild(document.createTextNode("la"));
}*/

//modulous function
function mod(first,second){
	while(first<0){
		first+=second;
	}
	while(first>=second){
		first-=second;
	}
	return first;
}

//import several settings
function save(){
	document.getElementById("error").innerHTML="";
	//save zoom
	if(document.getElementById("zoom").value){
		if(isNaN(document.getElementById("zoom").value)){
			setError("Zoom must be a decimal");
		}else{
			let buffer=document.getElementById("zoom").value.split(".");
			if(buffer.length>1){
				if(!buffer[0])buffer[0]=0;
				//do thus if the input has a decimal point
				view.z=parseInt(buffer[0],10)+parseInt(buffer[1],10)/Math.pow(10,buffer[1].split("").length);
			}else{
				if(!buffer[0])buffer[0]=1;
				//do this if the input is an intinger
				view.z=parseInt(buffer[0],10);
			}
		}
	}
	//save the rule
	rule(1);
	//set any invalid cell states to 0
	for(let h=0;h<gridWidth;h++){
		for(let i=0;i<gridHeight;i++){
			if(grid[gridIndex][h][i]>=ruleArray[2])grid[gridIndex][h][i]=0;
		}
	}
	//save interval between generations
	/*if(document.getElementById("interval").value){
		if(isNaN(document.getElementById("interval").value)){
			document.getElementById("error").innerHTML="Interval must be a number";
		}else{
			interval=parseInt(document.getElementById("interval").value,10);
		}
	}*/
	//save step size
	if(document.getElementById("step").value){
		if(isNaN(document.getElementById("step").value)){
			document.getElementById("error").innerHTML="Genertions Per Update must be a number";
		}else{
			stepSize=parseInt(document.getElementById("step").value,10);
		}
	}
	//save oscillator search settings
	if(document.getElementById("restart").value){
		oscSearch[0]=document.getElementById("restart").value.split(",");
	}else{
		oscSearch=[[1],[1]];
	}
	/*if(document.getElementById("export").value){
		oscSearch[0].push(...document.getElementById("export").value.split(","));
		oscSearch[1]=document.getElementById("export").value.split(",");
	}*/
	for(let h=0;h<oscSearch[0].length;h++){
		oscSearch[0][h]=parseInt(oscSearch[0][h]);
	}
	for(let h=0;h<oscSearch[1].length;h++){
		oscSearch[1][h]=parseInt(oscSearch[1][h]);
	}
	isPlaying=0;
	render();
}

function search(){
	//search for patterns
	let period=0,h=0;
	for(h=1;h*5<genCount&&h<currentIndex;h++){
		if(actionStack[currentIndex-h].grid===actionStack[currentIndex].grid
		 &&actionStack[currentIndex-h].o.x===actionStack[currentIndex].o.x
	   &&actionStack[currentIndex-h].o.y===actionStack[currentIndex].o.y){
			isActive=0;
			if(oscSearch[0].indexOf(h)===-1&&(period>h||period===0)){
				period=h;
			}
			break;
		}
	}
	if(isActive===0){
		let toBeLogged=isMatching()===false;
		if(document.getElementById("log").checked===false)toBeLogged=true;
		reset(0);
		if(period!==0&&document.getElementById("export").checked&&toBeLogged){
			document.getElementById("rle").value+=exportRLE(period);
		}
		isPlaying=1;
		if(document.getElementById("randomize").checked)randomize();
	}
}

function setNode(x,y){
	let currentNode = head,
		currentDepth = 0;

	for(h = 0;true;h++){
		if(h>maxSize){
			console.log("too far error");
			break;
		}
		//if(h>0)console.log("node at"+currentNode.x);
		if(currentNode.data){
			return currentNode;
		}else{
			let direction = 0;
			if(x>=currentNode.x*15)direction++;
			if(y>=currentNode.y*15)direction += 2;
			//console.log(direction)
			if(currentNode.child[direction]===null){
				currentNode.extend(direction);
				currentDepth++;
				//if(currentDepth>maxDepth)maxDepth=currentDepth+1;
				console.log("extend2");
			}else{
				//check if the mouse is within the area of the current node
				if(30*Math.abs(currentNode.x-currentNode.child[direction].x)<=Math.abs(15*currentNode.x-x)
				 ||30*Math.abs(currentNode.y-currentNode.child[direction].y)<=Math.abs(15*currentNode.y-y)){
					currentNode.extend(direction);
					console.log("extend1 "+(30*Math.abs(currentNode.y-currentNode.child[direction].y))+" "+(15*currentNode.y)+" "+(y));
				}else{
					currentNode=currentNode.child[direction];
					currentDepth++;
					//console.log("switch");
				}
			}
		}
	}
}

function getNode(x,y){
	let currentNode = head,
		currentDepth = 0;

	for(h = 0;true;h++){
		if(h>maxSize){
			console.log("too far error");
			break;
		}
		if(currentNode===null||currentNode.data){
			return currentNode;
		}else{
			let direction = 0;
			if(x>=currentNode.x*15)direction++;
			if(y>=currentNode.y*15)direction += 2;

			if(currentNode.child[direction]!==null
			 &&30*Math.abs(currentNode.x-currentNode.child[direction].x)>=Math.abs(15*currentNode.x-x)
			 &&30*Math.abs(currentNode.y-currentNode.child[direction].y)>=Math.abs(15*currentNode.y-y)){
				currentNode=currentNode.child[direction];
			}else{
				currentNode=null;
				//console.log(x+" "+y+" Node DNE");
			}
			//console.log(direction);
		}
	}
}

function setCell(x,y,newState){
	let node=getNode(x,y), nodeXoffset=0, nodeYoffset=0;
	newState*=8589934591;
	node.data[gridIndex][mod(y,30)+1]^=(node.data[gridIndex][mod(y,30)+1]^newState)&(1<<mod(x,30)+1);
	if(mod(x,30)===0){
		nodeXoffset= 1;
	}else if(mod(x,30)===29){
		nodeXoffset=-1;
	}
	if(mod(y,30)===0){
		nodeYoffset= 1;
	}else if(mod(y,30)===29){
		nodeYoffset=-1;
	}
	if(nodeXoffset!==0||nodeYoffset!==0){
		node=node.adjacentNodes[1+nodeXoffset][1+nodeYoffset];
		console.log(x+" "+y+" "+nodeXoffset+" "+(mod(x,30)+1+nodeXoffset));
		node.data[gridIndex][mod(y,30)+1+nodeYoffset*30]^=(node.data[gridIndex][mod(y,30)+1+nodeYoffset*30]^newState)&(1<<(mod(x,30)+1+nodeXoffset*30));
	}
	
}

function activateNodes(node){
	for(let h=0;h<3;h++){
		for(let i=0;i<3;i++){
			if(node.adjacentNodes[h][i]===null&&(h!==1||i!==1))node.adjacentNodes[h][i]= setNode(node.x*15+30-30*h,node.y*15+30-30*i);
			let tempNode=node.adjacentNodes[h][i];
			for(let h=0;h<maxDepth;h++){
				tempNode.gen=genCount;
				if(tempNode.parent!==null){
					tempNode=tempNode.parent;
				}else{
					break;
				}
			}
			
		}
	}
}

function update(){
	//coordinates of the touched cell
	let x=Math.floor(((mouse.x-300)/view.z+300)/cellWidth+view.x);
	let y=Math.floor(((mouse.y-200)/view.z+200)/cellWidth+view.y);
	//if in write mode
	if(editMode===0){
		x-=15*gridIndex;
		y-=15*gridIndex;
		let node=setNode(x,y);
		genCount=0;
		if(true||drawMode===-1){
			//if the finger is down
			if(drawnState=== -1){
				isPlaying=0;
				hasChanged=5;
				if((node.data[gridIndex][mod(y,30)+1]&Math.pow(2,mod(x,30)+1))!==0){
					//set cell state to dead(zero)
					drawnState=0;
				}else{
					//set cell state to live
					drawnState=1;
				}

			}
		}else{
			drawnState=drawMode;
			isPlaying=0;
			hasChanged=5;
		}
		/*for(let h=0;h<maxDepth;h++){
			node.isActive=true;
			if(node.parent!==null){
				node=node.parent;
			}else{
				break;
			}
		}*/
		activateNodes(node);
		//console.log(node +"_"+ node.x+"_"+node.y+"_"+node.adjacentNodes);
		/*if(!node.adjacentNodes[0][0])node.adjacentNodes[0][0]= setNode(node.x*15+30,node.y*15+30);
		if(!node.adjacentNodes[0][1])node.adjacentNodes[0][1]= setNode(node.x*15+30,node.y*15   );
		if(!node.adjacentNodes[0][2])node.adjacentNodes[0][2]= setNode(node.x*15+30,node.y*15-30);
		if(!node.adjacentNodes[1][0])node.adjacentNodes[1][0]= setNode(node.x*15   ,node.y*15+30);
		if(!node.adjacentNodes[1][2])node.adjacentNodes[1][2]= setNode(node.x*15   ,node.y*15-30);
		if(!node.adjacentNodes[2][0])node.adjacentNodes[2][0]= setNode(node.x*15-30,node.y*15+30);
		if(!node.adjacentNodes[2][1])node.adjacentNodes[2][1]= setNode(node.x*15-30,node.y*15   );
		if(!node.adjacentNodes[2][2])node.adjacentNodes[2][2]= setNode(node.x*15-30,node.y*15-30);*/
		//if(currentNode.isActive)currentNode.parent.isActive=true;
		setCell(x,y,drawnState);
	//if in move mode
	}else if(editMode===1){
		//if 2 fingers are touching the canvas
		if(mouse.x2&&mouse.pastX2){
			//scale the grid
			view.z=view.touchZ*Math.sqrt((mouse.x2-mouse.x)*(mouse.x2-mouse.x)
			                  +(mouse.y2-mouse.y)*(mouse.y2-mouse.y))/
			         Math.sqrt((mouse.pastX2-mouse.pastX)*(mouse.pastX2-mouse.pastX)
			                  +(mouse.pastY2-mouse.pastY)*(mouse.pastY2-mouse.pastY));
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
					if(selectArea.a==2&&x>=selectArea.left&&x<selectArea.right&&y>=selectArea.top&&y<selectArea.bottom){
						dragID=5;
						selectArea.left=selectArea.pastLeft;
						selectArea.top=selectArea.pastTop;
						selectArea.right=selectArea.pastRight;
						selectArea.bottom=selectArea.pastBottom;
						mouse.pastX=mouse.x;
						mouse.pastY=mouse.y;
					}else{
						//select the grid edges if necessary
						if(document.getElementById("xloop").checked&&x>=0&&x<gridWidth&&y>=0&&y<gridHeight){
							if(x<1+1/view.z){
								dragID=1;
								isPlaying=0;
							}else if(x>gridWidth-1-1/view.z){
								dragID=2;
								isPlaying=0;
							}
						}
						if(document.getElementById("yloop").checked&&x>=0&&x<gridWidth&&y>=0&&y<gridHeight){
							if(y<1+1/view.z){
								dragID=3;
								isPlaying=0;
							}else if(y>gridHeight-1-1/view.z){
								dragID=4;
								isPlaying=0;
							}
						}
						view.l=0;
						view.r=0;
						view.u=0;
						view.d=0;
					}
					//translate the grid
					view.x=view.touchX+(mouse.pastX-mouse.x)/cellWidth/view.z;
					view.y=view.touchY+(mouse.pastY-mouse.y)/cellWidth/view.z;
				break;
				//drag left edge
				case 1:
					view.l=Math.floor(((mouse.x-300)/view.z+300)/cellWidth+view.x);
					ctx.fillRect(300-((view.x-view.l)*cellWidth+300)*view.z,200-(view.y*cellWidth+200)*view.z,cellWidth*view.z,(gridHeight)*view.z*cellWidth);
				break;
				//drag right edge
				case 2:
					view.r=Math.floor(((mouse.x-300)/view.z-300)/cellWidth+view.x+(600/cellWidth-gridWidth+1));
					ctx.fillRect(300-((view.x-view.r)*cellWidth-300+(600-(gridWidth-1)*cellWidth))*view.z,200-(view.y*cellWidth+200)*view.z,cellWidth*view.z,(gridHeight)*view.z*cellWidth);
				break;
				//drag upper edge
				case 3:
					view.u=Math.floor(((mouse.y-200)/view.z+200)/cellWidth+view.y);
					ctx.fillRect(300-(view.x*cellWidth+300)*view.z,200-((view.y-view.u)*cellWidth+200)*view.z,(gridWidth)*view.z*cellWidth,cellWidth*view.z);
				break;
				//drag downward edge
				case 4:
					view.d=Math.floor(((mouse.y-200)/view.z-200)/cellWidth+view.y+(400/cellWidth-gridHeight+1));
					ctx.fillRect(300-(view.x*cellWidth+300)*view.z,200-((view.y-view.d)*cellWidth-200+(400-(gridHeight-1)*cellWidth))*view.z,(gridWidth)*view.z*cellWidth,cellWidth*view.z);
				break;
				case 5:
					selectArea.left=selectArea.pastLeft+Math.floor((mouse.x-mouse.pastX)/view.z/cellWidth);
					selectArea.top=selectArea.pastTop+Math.floor((mouse.y-mouse.pastY)/view.z/cellWidth);
					selectArea.right=selectArea.pastRight+Math.floor((mouse.x-mouse.pastX)/view.z/cellWidth);
					selectArea.bottom=selectArea.pastBottom+Math.floor((mouse.y-mouse.pastY)/view.z/cellWidth);
				break;
			}
		}
		if(algorithm===1&&(200-200/view.z)/cellWidth+view.y<0){
			//view.y=(200/view.z-200)/cellWidth;
		}
	//if in select mode
	}else if(editMode===2){
		// Select an edge of the selectArea if the cursor is within the area
		// The marigin for selecting is increased on the left and right if
		// the area is narrower than 4/view.z, and likewise for the
		// top and bottom.
		if(selectArea.a===1&&dragID===0&&x>=selectArea.left-1-Math.max(0,4/view.z+selectArea.left-selectArea.right)&&x<selectArea.right+1+Math.max(0,4/view.z+selectArea.left-selectArea.right)&&y>=selectArea.top-1-Math.max(0,4/view.z+selectArea.top-selectArea.bottom)&&y<selectArea.bottom+1+Math.max(0,4/view.z+selectArea.top-selectArea.bottom)){
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
					if(markers[h].active===2)markers[h].active=1;
				}
		}else if(selectArea.a===1&dragID!==0){
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
			//marker[#].active:
			//0 = inactive,non visible,
			//1 = active, visible
			//2 = active, selected and outlined
			//selectedMarker:
			//-1 = no marker is selected
			//0  = marker[0] is selected
			//>0 = marker[#] is selected
			if(selectedMarker===-1){
				for(let h=0;h<markers.length;h++){
					if(markers[h].active===2){
						//if the loop reached a selected marker, deselect it
						//and select the most recent indexed marker within
						//the click area
						markers[h].active=1;
						if(selectedMarker>=0)markers[selectedMarker].active=2;
						if(selectedMarker!==-1){
							selectedMarker=-2;
							break;
						}
					}else if(markers[h].active===1&&x>=markers[h].left&&x<markers[h].right&&y>=markers[h].top&&y<markers[h].bottom){
						// if the current marker is active, unselected, and
						// being clicked, then mark it for being selected
						// later
						/*if(markers[h].active===2){
							markers[h].active=1;
							break;
						}*/
						selectedMarker=h;
					}
				}
			}
			// if all markers have been looped through without being selected
			// select the last indexed marker
			if(selectedMarker!==-1){
				if(selectedMarker>=0)markers[selectedMarker].active=2;
				console.log(markers[0].active+" "+markers[1].active+" "+markers[2].active+" "+markers[3].active);
			}else if(selectArea.a===0){
				// make a selectArea if there are no selectable markers
				// this happens when the cursor clicks in an empty area.
				selectArea.a=1;
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

function gen(){
	timeSinceUpdate=Date.now();
	isActive=0;
	//
	let newgrid=1-gridIndex;
	let progress = new Array(maxDepth),
	    depth=0,
		currentNode = head;

	for(let h = 0;h < progress.length;h++)progress[h]=0;

	//traverse the tree
	for(let j=0;progress[0]<4;j++){
		if(j>maxSize){
			console.log("too much2");
			break;
		}
		if(progress[depth]>=4){
			//if the current node has no unvisited children, go to the parent
			currentNode=currentNode.parent;
			progress[depth]=0;
			depth--;
			progress[depth]++;
		}else{
			//if the current node has  unvisited children, go to the next child
			if(currentNode.child[progress[depth]]!==null){//&&currentNode.child[progress[depth]].gen>genCount-2){
				//width=Math.abs(currentNode.x-currentNode.child[progress[depth]].x);
				if(!currentNode.child[progress[depth]])console.log(currentNode.child+" "+progress+" "+depth);
				currentNode=currentNode.child[progress[depth]];
				depth++;
				//ctx.fillRect(300+(cellWidth*(15*currentNode.x-view.x+view.shiftX-15)-300)*view.z,200+(cellWidth*(15*currentNode.y-view.y+view.shiftY-15)-200)*view.z,cellWidth*(30)*view.z,cellWidth*(30)*view.z);
				//if(progress[depth]===0)console.log(depth);
				if(currentNode.data){
					//if the child node is a leaf
					for(let h=0;h<30;h++){
						if(h<17){
							if(currentNode.adjacentNodes[2-gridIndex][2-gridIndex]!==null)currentNode.adjacentNodes[2-gridIndex][2-gridIndex].data[newgrid][h+16] ^= (currentNode.adjacentNodes[2-gridIndex][2-gridIndex].data[newgrid][h+16] ^ currentNode.data[gridIndex][h+1]<<15)  & 4294901760;
							if(currentNode.adjacentNodes[1-gridIndex][2-gridIndex]!==null)currentNode.adjacentNodes[1-gridIndex][2-gridIndex].data[newgrid][h+16] ^= (currentNode.adjacentNodes[1-gridIndex][2-gridIndex].data[newgrid][h+16] ^ currentNode.data[gridIndex][h+1]>>>15) & 65535;
						}
						if(h>13){
							if(currentNode.adjacentNodes[2-gridIndex][1-gridIndex]!==null)currentNode.adjacentNodes[2-gridIndex][1-gridIndex].data[newgrid][h-14] ^= (currentNode.adjacentNodes[2-gridIndex][1-gridIndex].data[newgrid][h-14] ^ currentNode.data[gridIndex][h+1]<<15) & 4294901760;
							if(currentNode.adjacentNodes[1-gridIndex][1-gridIndex]!==null)currentNode.adjacentNodes[1-gridIndex][1-gridIndex].data[newgrid][h-14] ^= (currentNode.adjacentNodes[1-gridIndex][1-gridIndex].data[newgrid][h-14] ^ currentNode.data[gridIndex][h+1]>>>15) & 65535;
						}
						for(let i=0;i<30;i++){
							let count=0;

							if((currentNode.data[gridIndex][h+2]>>>(i+2))&1===1)count+=1;
							if((currentNode.data[gridIndex][h+2]>>>(i+1))&1===1)count+=2;
							if((currentNode.data[gridIndex][h+2]>>>(i))&1===1)count+=4;
							if((currentNode.data[gridIndex][h+1]>>>(i))&1===1)count+=8;
							if((currentNode.data[gridIndex][h]>>>(i))&1===1)count+=16;
							if((currentNode.data[gridIndex][h]>>>(i+1))&1===1)count+=32;
							if((currentNode.data[gridIndex][h]>>>(i+2))&1===1)count+=64;
							if((currentNode.data[gridIndex][h+1]>>>(i+2))&1===1)count+=128;
							let currentState=(currentNode.data[gridIndex][h+1]>>>(i+1))&1;
							if(ruleArray[1-currentState][count]!==currentState){
								//if(h===(10+gridIndex*15))console.log(i+" with "+count);
								//currentNode.data[newgrid][h+1]=currentNode.data[newgrid][h+1] ^ Math.pow(2,i+1);
								//if(currentState===0)currentNode.isActive=true;
								if(i<16&&h<16&&currentNode.adjacentNodes[2-gridIndex][2-gridIndex]!==null){
									currentNode.adjacentNodes[2-gridIndex][2-gridIndex].data[newgrid][h+16] ^= Math.pow(2,i+16);
								}
								if(i>13&&h<16&&currentNode.adjacentNodes[1-gridIndex][2-gridIndex]!==null){

									currentNode.adjacentNodes[1-gridIndex][2-gridIndex].data[newgrid][h+16] ^= Math.pow(2,i-14);

								}
								//console.log(h+" ajx"+i);
								if(i<16&&h>13&&currentNode.adjacentNodes[2-gridIndex][1-gridIndex]!==null){
									currentNode.adjacentNodes[2-gridIndex][1-gridIndex].data[newgrid][h-14] ^= Math.pow(2,i+16);

								}
								if(i>13&&h>13&&currentNode.adjacentNodes[1-gridIndex][1-gridIndex]!==null){
									currentNode.adjacentNodes[1-gridIndex][1-gridIndex].data[newgrid][h-14] ^= Math.pow(2,i-14);
								}
								if(currentNode.gen<genCount)activateNodes(currentNode);
							}
						}
					}
					progress[depth]=0;
					depth--;
					currentNode=currentNode.parent;
					progress[depth]++;
				}
			}else{
				progress[depth]++;
			}
		}
	}
	written=true;
	gridIndex=newgrid;

	genCount++;
	document.getElementById("gens").innerHTML="Generation "+genCount+".";
	if(startIndex===0)startIndex=currentIndex;
	if(algorithm===2)done();
	if(document.getElementById("log").checked===true){
		log.amount++
		if(selectArea.left>0&&selectArea.top>0&&grid[gridIndex][selectArea.left][selectArea.top]===1){
			document.getElementById("rle").value+=log.amount+",";
			log.amount=0;
		}
	}
	//record that a generation was run
	if(isPlaying<0)isPlaying++;
}

//function which renders graphics to the canvas
function render(){
	//grid line offsets+depth/10
	let x=mod(view.x,1), y=mod(view.y,1), color=0;

	//clear screen
	ctx.clearRect(0,0,600,400);
	//set line width
	//ctx.lineWidth=1;
	if(darkMode){
		ctx.fillStyle="#fff";
	}else{
		ctx.fillStyle="#000";
	}

	ctx.font = "20px Arial";
	//ctx.fillText(isMatching(),10,30);

	//draw the marked areas
	/*for(let h=0;h<markers.length;h++){
		if(markers[h].active===1){
			if(darkMode){
				ctx.fillStyle="#282828";
			}else{
				ctx.fillStyle="#999";
			}
			ctx.fillRect(300-((view.x-markers[h].left)*cellWidth+300)*view.z,200-((view.y-markers[h].top)*cellWidth+200)*view.z,(markers[h].right-markers[h].left)*view.z*cellWidth-1,(markers[h].bottom-markers[h].top)*view.z*cellWidth-1);
		}else if(markers[h].active===2){
			if(darkMode){
				ctx.fillStyle="#444";
			}else{
				ctx.fillStyle="#999";
			}
			ctx.fillRect(300-((view.x-markers[h].left)*cellWidth+300)*view.z,200-((view.y-markers[h].top)*cellWidth+200)*view.z,(markers[h].right-markers[h].left)*view.z*cellWidth-1,(markers[h].bottom-markers[h].top)*view.z*cellWidth-1);
		}
	}*/
	//draw selected area
	if(selectArea.a>0){
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
		ctx.fillRect(300-((view.x-selectArea.left)*cellWidth+300)*view.z,200-((view.y-selectArea.top)*cellWidth+200)*view.z,(selectArea.right-selectArea.left)*view.z*cellWidth-1,(selectArea.bottom-selectArea.top)*view.z*cellWidth-1);
	}
		let progress = new Array(maxDepth),
		    depth=0,
			currentNode = head;

		for(let h = 0;h < progress.length;h++)progress[h]=0;

		//traverse the tree
		for(let j=0;progress[0]<4;j++){
			if(j>maxSize){
				console.log("too much2");
				break;
			}
			if(progress[depth]>=4){
				//if the current node has no unvisited children, go to the parent
				currentNode=currentNode.parent;
				progress[depth]=0;
				depth--;
				progress[depth]++;
			}else{
				//if the current node has  unvisited children, go to the next child
				if(currentNode.child[progress[depth]]!==null){
					//width=Math.abs(currentNode.x-currentNode.child[progress[depth]].x);
					if(!currentNode.child[progress[depth]])console.log(currentNode.child+" "+currentNode.child[2].x+" "+progress+" "+depth);
					currentNode=currentNode.child[progress[depth]];
					depth++;
					if(debugVisuals){
						ctx.strokeStyle="#bbb";
						ctx.beginPath();
						ctx.moveTo(300+(cellWidth*(15*currentNode.x-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(15*currentNode.y-view.y+view.shiftY)-200)*view.z);
						ctx.lineTo(300+(cellWidth*(15*currentNode.parent.x-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(15*currentNode.parent.y-view.y+view.shiftY)-200)*view.z);
						ctx.stroke();
						if(currentNode.data)ctx.fillText(currentNode.gen+" "+currentNode.isActive,300+(cellWidth*(15*currentNode.x-13+15*(genCount%2)-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(15*currentNode.y-13+15*(genCount%2)-view.y+view.shiftY)-200)*view.z);
						for(let h=0;h<3;h++){
							for(let i=0;i<3;i++){
								if(currentNode.adjacentNodes)if(currentNode.adjacentNodes[h][i]!==null){
									ctx.strokeStyle="#006600";
									ctx.beginPath();
									ctx.moveTo(300+(cellWidth*(15*currentNode.x-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(15*currentNode.y-view.y+view.shiftY)-200)*view.z);
									ctx.lineTo(300+(cellWidth*(15*currentNode.x-view.x+view.shiftX-10*(h-1))-300)*view.z,200+(cellWidth*(15*currentNode.y-view.y+view.shiftY-10*(i-1))-200)*view.z);
									ctx.stroke();
								}else{
									ctx.strokeStyle="#660000";
									ctx.beginPath();
									ctx.moveTo(300+(cellWidth*(15*currentNode.x-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(15*currentNode.y-view.y+view.shiftY)-200)*view.z);
									ctx.lineTo(300+(cellWidth*(15*currentNode.x-view.x+view.shiftX-10*(h-1))-300)*view.z,200+(cellWidth*(15*currentNode.y-view.y+view.shiftY-10*(i-1))-200)*view.z);
									ctx.stroke();
								}
							}
						}
						if(true){
						
						}else{
						
						}
						if(currentNode.data)ctx.strokeRect(300+(cellWidth*(15*currentNode.x-15+15*(genCount%2)-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(15*currentNode.y-15+15*(genCount%2)-view.y+view.shiftY)-200)*view.z,30*cellWidth*view.z,30*cellWidth*view.z);
					}
					//ctx.fillRect(300+(cellWidth*(15*currentNode.x-view.x+view.shiftX-15)-300)*view.z,200+(cellWidth*(15*currentNode.y-view.y+view.shiftY-15)-200)*view.z,cellWidth*(30)*view.z,cellWidth*(30)*view.z);
					//if(progress[depth]===0)console.log(depth);
					if(currentNode.data){
						//if the child node is a leaf
						for(let h=0;h<32;h++){
							let buffer=currentNode.data[gridIndex][h];
							for(let i=0;i<30;i++){
								buffer=buffer>>>1;
								if(buffer%2===1){
									ctx.fillStyle="#bbb";
									ctx.fillRect(300+(cellWidth*(i+15*(currentNode.x-1+gridIndex)-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(h-1+15*(currentNode.y-1+gridIndex)-view.y+view.shiftY)-200)*view.z,cellWidth*view.z,cellWidth*view.z);
									buffer--;
								}
							}
						}
						progress[depth]=0;
						depth--;
						currentNode=currentNode.parent;
						progress[depth]++;
					}
				}else{
					progress[depth]++;
				}
			}
		}
		written=true;

	if(selectArea.a===2){
		for(let h=0;h<clipboard.length;h++){
			for(let i=0;i<clipboard[0].length;i++){
				if(clipboard[h][i]>0){
					//find the cell's color depending on the state
					if(clipboard[h][i]===1){
						if(darkMode){
							color=240;
						}else{
							color=0;
						}
					}else{
						if(darkMode){
							color=208/ruleArray[2]*(ruleArray[2]-clipboard[h][i]+1)+32;
						}else{
							color=255/ruleArray[2]*(clipboard[h][i]-1);
						}
					}
					//set the color
					ctx.fillStyle="rgba("+color+","+color+","+color+",0.8)";
					ctx.fillRect(300-(300+view.x*cellWidth)*view.z+(selectArea.left+h)*cellWidth*view.z,200-(200+view.y*cellWidth)*view.z+(selectArea.top+i)*cellWidth*view.z,cellWidth*view.z,cellWidth*view.z);
				}
			}
		}
	}
	ctx.fillStyle="rgba(0,0,0,0.5)";
	if(editMode===1)switch(dragID){
		//draw left edge
		case 1:
		ctx.fillRect(300-((view.x-view.l)*cellWidth+300)*view.z,200-(view.y*cellWidth+200)*view.z,cellWidth*view.z,(gridHeight)*view.z*cellWidth);
		break;
		//draw right edge
		case 2:
		ctx.fillRect(300-((view.x-view.r)*cellWidth-300+(600-(gridWidth-1)*cellWidth))*view.z,200-(view.y*cellWidth+200)*view.z,cellWidth*view.z,(gridHeight)*view.z*cellWidth);
		break;
		//draw upper edge
		case 3:
		ctx.fillRect(300-(view.x*cellWidth+300)*view.z,200-((view.y-view.u)*cellWidth+200)*view.z,(gridWidth)*view.z*cellWidth,cellWidth*view.z);
		break;
		//draw downward edge
		case 4:
		ctx.fillRect(300-(view.x*cellWidth+300)*view.z,200-((view.y-view.d)*cellWidth-200+(400-(gridHeight-1)*cellWidth))*view.z,(gridWidth)*view.z*cellWidth,cellWidth*view.z);
		break;
	}
	//if the toggle grid variable is true
	if(gridLines){
		if(darkMode){
		ctx.strokeStyle="#333";
		}else{
		ctx.strokeStyle="#bbb";
		}
		ctx.strokeRect(300-(view.x*cellWidth+300)*view.z,200-(view.y*cellWidth+200)*view.z,grid[0].length*view.z*cellWidth-1,grid[0][0].length*view.z*cellWidth-1);
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
			for(let h= -Math.floor(300/cellWidth/view.z);h<300/cellWidth/view.z+1;h++){
				ctx.moveTo(300+(h-x)*view.z*cellWidth,0);
				ctx.lineTo(300+(h-x)*view.z*cellWidth,400);
			}
			//draw virtical lines
			for(let h= -Math.floor(200/cellWidth/view.z);h<200/cellWidth/view.z+1;h++){
				ctx.moveTo(0  ,200+(h-y)*cellWidth*view.z);
				ctx.lineTo(600,200+(h-y)*cellWidth*view.z);
			}
			ctx.stroke();
		}
		ctx.lineWidth=3*view.z;
		if(algorithm===2)ctx.strokeRect(300-(view.x*cellWidth+300)*view.z,200-(view.y*cellWidth+200)*view.z,gridWidth*view.z*cellWidth-1,gridHeight*view.z*cellWidth-1);
	}
	//draw a rectangle around each marker
	for(let h=0;h<2;h++){
		for(let i=0;i<markers.length;i++){
			if(markers[i].active!==0){
				if(markers[i].active===1){
					if(darkMode){
						ctx.strokeStyle="#888";
					}else{
						ctx.strokeStyle="#999";
					}
				}else if(markers[i].active===2){
					if(darkMode){
						ctx.strokeStyle="#bbb";
						ctx.fillStyle="#bbb";
					}else{
						ctx.strokeStyle="#999";
						ctx.fillStyle="#99";
					}
						ctx.lineWidth=1;
					ctx.fillText((i+1),300+1*view.z-((view.x-markers[i].left)*cellWidth+300)*view.z,200-6*view.z-((view.y-markers[i].top)*cellWidth+200)*view.z,(markers[i].right-markers[i].left)*view.z*cellWidth-1);
				}
				ctx.lineWidth=5*view.z;
				if((h===0&&markers[i].active===1)
				 ||(h===1&&markers[i].active===2))ctx.strokeRect(300-((view.x-markers[i].left)*cellWidth+300)*view.z,200-((view.y-markers[i].top)*cellWidth+200)*view.z,(markers[i].right-markers[i].left)*view.z*cellWidth-1,(markers[i].bottom-markers[i].top)*view.z*cellWidth-1);
			}
		}
	}
	//draw a rectangle around the pattern to be pasted.
	if(selectArea.a>0){
		ctx.lineWidth=3*view.z;
		ctx.strokeStyle="#666";
		ctx.strokeRect(300-((view.x-selectArea.left)*cellWidth+300)*view.z,200-((view.y-selectArea.top)*cellWidth+200)*view.z,(selectArea.right-selectArea.left)*view.z*cellWidth-1,(selectArea.bottom-selectArea.top)*view.z*cellWidth-1);
	}
}


function scaleCanvas(){
	windowWidth=document.documentElement.clientWidth;
	windowHeight=window.innerHeight;
	let unit=Math.min(windowWidth,windowHeight*0.75*1.5)/100;
	document.getElementById("content").style.padding=3*unit+"px";
	if(windowWidth<windowHeight*0.75*1.5){
		canvasHeight=(windowWidth-unit*6)/1.5;
		canvasWidth=windowWidth-unit*6;
	}else{
		canvasHeight=windowHeight*0.75-unit*6;
		canvasWidth=(windowHeight*0.75-unit*6)*1.5;
	}
	canvas.width =canvasWidth;
	canvas.height=canvasHeight;
	ctx.scale(canvasHeight/400,canvasHeight/400);
	if(true||windowWidth-canvasWidth-unit*6>300){
		//document.getElementById("top").style.width="300px";
	}else{
		//document.getElementById("top").style.width=(windowWidth-10)+"px";
	}
}

function drawPattern(startPoint,rle,xPosition,yPosition){
}

function findHeader(rle){
	let h=0, step=0, char="x", startIndex=0, number=[];
	for(;h<rle.length;h++){
		switch(step){
			case 0:char="x";break;
			case 1:char="=";break;
			case 2:char="";break;
			case 3:char=",";break;
			case 4:char="y";break;
			case 5:char="=";break;
			case 6:char="";break;
			case 7:char=",";break;
		}
	}
	return h;
}

function readHeader(rle){
	let textIndex=findHeader(rle),number=[],pattern=[];
	//transcribe rule
	if(rle[textIndex+1]==="r"||rle[textIndex+2]==="r"){
		pattern=[];
		for(let h=textIndex;h<rle.length;h++){
			if(rle[h]==="\n"||rle[h]===":"){
				textIndex=h;
				break;
			}else{
				if(textIndex===-1){
					if(rle[h]===" "){
						if(pattern.length>0){
							textIndex=h;
							break;
						}
					}else{
						pattern.push(rle[h]);
					}
				}
			}
			if(rle[h]==="="){
				textIndex=-1;
			}
		}
		document.getElementById("rule").value=pattern.join("");
		rule(pattern.join(""));
	}else{
		document.getElementById("rule").value="b3/s23";
		rule("b3/s23");
	}
	//transcribe info for a toroidal grid
	if(rle[textIndex]===":"&&rle[textIndex+1]==="T"){
		pattern=[];
		if(rle[textIndex+2]==="0"){
			document.getElementById("xloop").checked=false;
			textIndex+=4;
		}else{
			document.getElementById("xloop").checked=true;
			for(let h=textIndex+2;h<rle.length;h++){
				if(isNaN(rle[h])){
					view.r=parseInt(pattern.join(""))-gridWidth;
					pattern=[];
					textIndex=h+1;
					break;
				}else{
					pattern.push(rle[h]);
				}
			}
		}
		if(rle[textIndex]==="0"){
			document.getElementById("yloop").checked=false;
			textIndex++;
		}else{
			document.getElementById("yloop").checked=true;
			for(let h=textIndex;h<rle.length;h++){
				if(isNaN(rle[h])){
					view.d=parseInt(pattern.join(""))-gridHeight;
					pattern=[];
					textIndex=h-2;
					break;
				}else{
					pattern.push(rle[h]);
				}
			}
		}
	}
	return textIndex;
}

//import data from the RLE(dimensions, toroidal grids, pattern, etc...)
function importRLE(){
	let text=document.getElementById("rle").value.split(""),
	    textIndex=0,
	    number=[],
	    pattern=[],
	    importHeader=true;
	if(arguments.length>0){
		importHeader=false;
		text=arguments[0];
	}else{
		textIndex=readHeader(text);
		//console.log("f"+textIndex);
	}
	scaleGrid();
	//transcribe pattern
	backgroundState=0;
	clearGrid(0,gridWidth,gridHeight,0);
	let xloc=document.getElementById("xloop").checked?0:3;
	let yloc=document.getElementById("yloop").checked?0:3;
	drawPattern(textIndex,text,xloc,yloc);
	isPlaying=0;
	startIndex=0;
	if(importHeader){
		addMargin();
		fitView();
		done();
	}
	genCount=0;
	document.getElementById("gens").innerHTML="Generation 0.";
}

function readPattern(top,right,bottom,left){
	return "";
}

function exportRLE(){
	let exportAsOneLine=false,text="";
	if(arguments.length>0){
		exportAsOneLine=true;
		if(document.getElementById("rle").value!=="")text+="\n";
		text+="#pattern has a period of "+arguments[0]+"\n";
	}else{
		document.getElementById("rle").value="";
	}
	//find distance between pattern and border
	xsides(0,gridHeight);
	ysides(0,gridWidth);
	let torus=[];
	if(document.getElementById("xloop").checked||document.getElementById("yloop").checked){
		torus=[":T","0",",","0"];
		if(document.getElementById("xloop").checked){
			torus[1]=gridWidth;
			margin.left=0;
			margin.right=gridWidth;
		}
		if(document.getElementById("yloop").checked){
			torus[3]=gridHeight;
			margin.top=0;
			margin.bottom=gridHeight;
		}
	}
	//unparse data into the rle header
	text+="x = "+(margin.right-margin.left)+", y = "+(margin.bottom-margin.top)+", rule = "+rulestring;

	text+=torus.join("");

	let pattern=readPattern(margin.top,margin.right,margin.bottom,margin.left).split("");
	if(exportAsOneLine===false){
		for(let h=0;h<pattern.length;h++){
			if(h%70===0){
				i=0;
				while(i<70&&!isNaN(pattern[h-i-1]))i++;
				pattern.splice(h-i,0,"\n");
			}
		}
	}else{
		text+="\n";
	}
	text+=pattern.join("");
	return text;
}

function clearRLE(){
	document.getElementById("rle").value="";
}

function copyRLE(){
	document.getElementById("rle").select();
	document.getElementById("rle").setSelectionRange(0, 99999);
	document.execCommand("copy");
}

//input rules
function rule(ruleText){
	if(ruleText===1)ruleText=document.getElementById("rule").value;
	if(!ruleText)ruleText=["B","3","/","S","2","3"];

	ruleText=ruleText.split("");
	let readMode=0,transitionNumber=-1,isBirthDone=false,isSurvivalDone=false;
	rulestring=[[],[],[]];
	algorithm=1;

	for(let h=0;h<ruleText.length;h++){
		/*if(ruleText[h]==="W"){
			algorithm=1;
			readMode=0;
			transitionNumber=1;
		}else*/if(ruleText[h]==="s"||ruleText[h]==="S"){
			readMode=0;
			transitionNumber=-1;
			isSurvivalDone=true;
		}else if(ruleText[h]==="b"||ruleText[h]==="B"){
			readMode=1;
			transitionNumber=-1;
			isBirthDone=true;
		}else if(ruleText[h]==="g"||ruleText[h]==="G"||ruleText[h]==="C"){
			readMode=2;
			transitionNumber=-1;
		}else if(ruleText[h]==="/"||ruleText[h]==="_"){
			if(isBirthDone===false){
				isSurvivalDone===true
			}
			readMode++;
			if(isBirthDone===true&&isSurvivalDone===true)readMode=2;
			transitionNumber=-1;
		}else{
			if(isNaN(ruleText[h])){
				if(transitionNumber===-1){
					//error
				}else{
					rulestring[readMode].push(ruleText[h]);
				}
			}else{
				transitionNumber=parseInt(ruleText[h],10);
				rulestring[readMode].push(ruleText[h]);
			}
		}
	}

	if(rulestring[2].length===0){
		rulestring[2]=2;
	}else{
		rulestring[2]=parseInt(rulestring[2].join(""),10);
	}

	//empty arrays which will set how the cell states update
	ruleArray=[[],[],rulestring[2]];

	drawState(drawMode);

	if(true||algorithm===2){
		//for all 255 possible states of the 8 neighbors
		for(let h=0;h<256;h++){
			//for both birth and survival states
			for(let i=0;i<2;i++){
				//assume that the cell will be dead
				ruleArray[i].push(0);
				//flag for
				let abc=[-1,-1];
				//for each character in the rulestring
				for(let j=0;j<rulestring[i].length;j++){
					if(abc[0]===-1){
						if(rulestring[i][j]==ruleMap[h][0]){
							abc[0]=rulestring[i][j];
							ruleArray[i][h]=1;
						}
					}else{
						if(isNaN(rulestring[i][j])){
							if(abc[1]===-1){
								if(rulestring[i][j]==="-"){
									abc[1]=0;
									j++;
								}else{
									abc[1]=1;
									ruleArray[i][h]=0;
								}
							}
							//is the transition from the map present in the rulestring
							if(rulestring[i][j]===ruleMap[h][1]){
								if(abc[1]===1){
									ruleArray[i][h]=1;
								}else{
									ruleArray[i][h]=0;
								}
							}
						}else{
							break;
						}
					}
				}
			}
		}
		rulestring=clean(ruleText);
	}else if(algorithm===1){
		let ruleNumber=0,set=[[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]];
		for(let h=0;h<rulestring[0].length;h++){
			if(isNaN(rulestring[0][h])){
				if(h>0)break;
			}else{
				ruleNumber=ruleNumber*10+parseInt(rulestring[0][h],10);
			}
		}
		if(ruleNumber%2===1){
			setError("Wolfram rule must have an even number");
		}else{
			for(let h=0;h<8;h++){
				if(ruleNumber%2===1){
					ruleArray[0].push([...set[h]]);
				}
				ruleNumber=ruleNumber>>>1;
			}
		}
	}
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
						//console.log(newString);
						cleanString.splice(numIndex+1,transitionLength,...newString);
						searchIndex+=newString.length-transitionLength;
					}
					//console.log(cleanString);
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
							//console.log(newString);
						}
					}
					cleanString.splice(numIndex+1,transitionLength,...newString);
					//console.log(cleanString);
					searchIndex+=newString.length-transitionLength;
				}
			}
			if(searchIndex<cleanString.length)number=parseInt(cleanString[searchIndex],10);
			//console.log(searchIndex+"number"+number);
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
	if(windowWidth!==document.documentElement.clientWidth
	 ||windowHeight<=window.innerHeight
	 &&windowHeight>=window.innerHeight+40)scaleCanvas();
	//register key inputs
	keyInput();
	//register mouse and touch inputs
	if(mouse.x&&mouse.pastX)update();
	//run a generation of the simulation
	if(isPlaying!==0){
		gen();
		//restarts the simulation with a random soup once the grid is periodic
		if(document.getElementById("search").checked)search();
		if(document.getElementById("catch").checked)catchShips();
		if(genCount>parseInt(document.getElementById("limitValue").value,10)){
			reset(0);
			isPlaying=1;
		}
	}
	//draw the simulation
	if(isPlaying===0||(genCount-stepStart)%stepSize===0)render();
	if(isPlaying!==0||keyFlag[0])requestAnimationFrame(main);
}
requestAnimationFrame(main);