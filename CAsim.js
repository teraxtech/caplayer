"use strict";
var //canvas element
	canvas=document.getElementById("ourCanvas"),
	//canvas context
	ctx=canvas.getContext("2d"),
	//window and canvas dimensions
	windowHeight=0,windowWidth=0,canvasWidth=0,canvasHeight=0,
	//state of the background(used for B0 rules)
	backgroundState=0,
	//the code for decoding rule strings.
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
    gridLines=true,
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
    dimensions=2,
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
	      u:0,d:0,r:0,l:0};

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
};
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
	scaleGrid();
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
	if(gridLines){
		gridLines=false;
	}else{
		gridLines=true;
	}
	if(isPlaying===0)render();
}
function setDark(){
	if(darkMode){
		darkMode=0;
		if(detailedCanvas===true){
			canvas.style.backgroundColor="#f1f1f1";
		}else{
			canvas.style.backgroundColor="#e4e4e4";
		}
		document.getElementById("LightTheme").disabled =false;
		document.getElementById("DarkTheme").disabled =true;
	}else{
		darkMode=1;
		if(detailedCanvas===true){
			canvas.style.backgroundColor="#222";
		}else{
			canvas.style.backgroundColor="#282828";
		}
		document.getElementById("LightTheme").disabled =true;
		document.getElementById("DarkTheme").disabled =false;
	}
	drawState(drawMode);
	render();
}

//move e frames forward
function next(){
	addMargin();
	if(isPlaying===0)requestAnimationFrame(main);
	isPlaying=-stepSize;
	stepStart=genCount;
}

//toggle updating the simulation
function start(newFrame){
	addMargin();
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

	if(dimensions===1){
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
	if(currentIndex-startIndex<300){
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
	xsides(0,gridHeight);
	ysides(0,gridWidth);
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
	scaleGrid();
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

//function for reading the grid
function G(first,second){
	if(grid[gridIndex][Math.floor(round(mod(first+view.x+(300-300/view.z)/cellWidth,gridWidth)))]
	 &&!isNaN(grid[gridIndex][Math.floor(round(mod(first+view.x+(300-300/view.z)/cellWidth,gridWidth)))]
	                 [Math.floor(round(mod(second+view.y+(200-200/view.z)/cellWidth,gridHeight)))])){
		return grid[gridIndex][Math.floor(round(mod(first+view.x+(300-300/view.z)/cellWidth,gridWidth)))]
				      [Math.floor(round(mod(second+view.y+(200-200/view.z)/cellWidth,gridHeight)))];
	}else{
		//console.log(first+" "+second);
		return 2.3;
	}
}

function stretch(){
	if(selectArea.a>0){
		if(!document.getElementById("xloop").checked){
			if(selectArea.left<3)view.l=selectArea.left-3;
			if(selectArea.right>gridWidth-3)view.r=selectArea.right-gridWidth+3;
		}
		if(!document.getElementById("yloop").checked){
			if(selectArea.top<3)view.u=selectArea.top-3;
			if(selectArea.bottom>gridHeight-3)view.d=selectArea.bottom-gridHeight+3;
		}
	}/*else if(selectArea.a===2
	       &&!isNaN(document.getElementById("markerNumber").value
	       &&""!==document.getElementById("markerNumber").value
				 &&markers[parseInt(document.getElementById("markerNumber").value,10)-1]
				 &&markers[parseInt(document.getElementById("markerNumber").value,10)-1].active>0){

		if(!document.getElementById("xloop").checked){
			if(selectArea.left<0)view.l=selectArea.left;
			if(selectArea.right>gridWidth)view.r=selectArea.right-gridWidth;
		}
		if(!document.getElementById("yloop").checked){
			if(selectArea.top<0)view.u=selectArea.top;
			if(selectArea.bottom>gridHeight)view.d=selectArea.bottom-gridHeight;
		}
	}*/
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
		if(actionStack[currentIndex-h].grid===actionStack[currentIndex].grid){
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
		randomize();
	}
}

function isMatching(){
	if(clipboard.length>0&&selectArea.a===2){
		for(let h=0;h<clipboard.length;h++){for(let i=0;i<clipboard[0].length;i++){
				if(grid[gridIndex][h+selectArea.left]&&!isNaN(grid[gridIndex][h+selectArea.left][i+selectArea.top])&&grid[gridIndex][h+selectArea.left][i+selectArea.top]!==clipboard[h][i])return false;
			}
		}
	}
	return true;
}

/*function isMarkerActive(){
	if(isNaN(document.getElementById("markerNumber").value)
	  ||""===document.getElementById("markerNumber").value)return true;
	let index=parseInt(document.getElementById("markerNumber").value,10)-1;
	if(markers[index]&&markers[index].active>0){
		for(let h=markers[index].left;h<markers[index].right;h++){
			for(let i=markers[index].top; i<markers[index].bottom;i++){
				if(grid[0][h]&&grid[0][h][i]&&grid[0][h][i]!==grid[1][h][i]&&isActive)return true;
			}
		}
	}
	return false;
}*/

//this search can only search as far as the action stack goes
function catchShips(){
	//stage of identifying ships(stored in ____Ship.stage variable):
	//0-no ship
	//1-ship like edge movement detected
	//2-ship's width is measured
	//3-ship's pattern is stored
	//4-ship's pattern is repeated
	//5-ships's width is verified
	//6-ships pattern is verified
	for(let h=0;h<4;h++){
		let i,totalMovement=0,emptyLines=0,maxI=[];
		xsides(0,gridHeight);
		if(ship[h].period===0){
			i=1;
		}else{
			i=ship[h].period;
		}
		//checks all periods up to 150
		while(i<150&&i*2<currentIndex){
			let j=0;
			totalMovement=0;
			//checks if this period has patterns in movment and breaks the loop if the pattern breaks
			for(;j<300&&j<currentIndex-1;j++){
				if(h===0){
					let change = actionStack[currentIndex-j].o.y-actionStack[currentIndex-j-1].o.y;
					if(j>=i&&change!==actionStack[currentIndex-j+i].o.y-actionStack[currentIndex-j-1+i].o.y){
						break;
					}
					if(j<i)totalMovement+=change;
				}else if(h===1){
					let change = actionStack[currentIndex-j-1].o.x-actionStack[currentIndex-j-1].w-(actionStack[currentIndex-j].o.x-actionStack[currentIndex-j].w);
					if(j>=i&&change!==actionStack[currentIndex-j-1+i].o.x-actionStack[currentIndex-j-1+i].w-(actionStack[currentIndex-j+i].o.x-actionStack[currentIndex-j+i].w)){
						break;
					}
					if(j<i)totalMovement+=change;
				}else if(h===2){
					let change = actionStack[currentIndex-j-1].o.y-actionStack[currentIndex-j-1].h-(actionStack[currentIndex-j].o.y-actionStack[currentIndex-j].h);
					if(j>=i&&change!==actionStack[currentIndex-j-1+i].o.y-actionStack[currentIndex-j-1+i].h-(actionStack[currentIndex-j+i].o.y-actionStack[currentIndex-j+i].h)){
						break;
					}
					if(j<i)totalMovement+=change;
				}else if(h===3){
					if(j>=i&&actionStack[currentIndex-j].o.x-actionStack[currentIndex-j-1].o.x!==actionStack[currentIndex-j+i].o.x-actionStack[currentIndex-j-1+i].o.x){
						break;
					}
					if(j<i)totalMovement+=actionStack[currentIndex-j].o.x-actionStack[currentIndex-j-1].o.x;
				}
			}
			if(totalMovement>0&&j>10&&j>=i*2){
				ship[h].period=i;
				if(ship[h].stage===0)ship[h].stage=1;
				break;
			}else{
				ship[h].period=0;
				ship[h].stage=0;
				ship[h].Ypos=0;
				ship[h].rle="";
				ship[h].nextCheck=0;
				ship[h].multiplier=1;
				ship[h].width=0;
				ship[h].reset=2;
			}
			i++;
		}
		switch(h){
			case 0:
				if(ship[0].stage===1||ship[0].stage===4){
					for(let j=Math.min(gridHeight-1,Math.max(0,margin.top+ship[0].width));j<gridHeight;j++){
						emptyLines++;
						for(let i=0;i<gridWidth;i++){
							if(grid[gridIndex][i][j]!==backgroundState){
								emptyLines=0;
								break;
							}
						}
						let newWidth=(j>margin.bottom)?margin.bottom-margin.top:j-margin.top-emptyLines+1;
						if(emptyLines>=2||j>=margin.bottom-1){
							if(ship[0].width>=newWidth){
								if(genCount>=ship[0].nextCheck){
									if(ship[0].stage===1)ship[0].stage=2;
									if(ship[0].stage===4)ship[0].stage=5;
									ship[0].reset=2;
								}
							}else if(ship[0].stage===1&&ship[0].width>ship[0].reset){
								ship[0].reset*=16;
								ship[0].width=0;
							}else{
								ship[0].width=newWidth;
								ship[0].stage=1;
							}
							break;
						}
					}
					if(genCount>=ship[0].nextCheck)ship[0].nextCheck=genCount+ship[0].period;
				}

				if(ship[0].stage===2||ship[0].stage===5||ship[0].nextCheck===genCount){
					xsides(margin.top,margin.top+ship[0].width);
					if(ship[0].stage===2)ship[0].stage=3;
					if(ship[0].stage===5){
						ship[0].stage=6;
						ship[0].Ypos=margin.left-view.shiftX;
						ship[0].nextCheck=genCount+ship[0].period;
						ship[0].rle=readPattern(margin.top,margin.right,margin.top+ship[0].width,margin.left);
						ship[0].multiplier=1;
					}
					if(ship[0].nextCheck===genCount){
						if(ship[0].rle===readPattern(margin.top,margin.right,margin.top+ship[0].width,margin.left)){
							if(ship[0].stage===3){
								ship[0].stage=4;
							}else{
								document.getElementById("rle").value+="\nfound ("+totalMovement*ship[0].multiplier+","+(Math.abs(margin.left-view.shiftX-ship[0].Ypos)*ship[0].multiplier)+")c/"+ship[0].period*ship[0].multiplier+" "+ship[0].rle;
								clearGrid(margin.top,margin.right,margin.top+ship[0].width,margin.left);
							}
							ship[0].nextCheck=genCount+ship[0].period*ship[0].reset;
						}else{
							if(ship[0].multiplier>=ship[0].reset){
								ship[0].reset*=2;
								ship[0].multiplier=1;
								ship[0].rle=readPattern(margin.top,margin.right,margin.top+ship[0].width,margin.left);
							}else{
								ship[0].multiplier++;
							}
							ship[0].nextCheck=genCount+ship[0].period;
						}
					}
				}
			break;
			case 1:
				if(ship[1].stage===1||ship[1].stage===4){
					for(let i=Math.min(gridWidth-1,Math.max(0,margin.right-ship[1].width));i>=0;i--){
						emptyLines++;
						for(let j=0;j<gridHeight;j++){
							if(grid[gridIndex][i][j]!==backgroundState){
								emptyLines=0;
								break;
							}
						}
						let newWidth=(i<margin.left)?margin.right-margin.left-1:margin.right-i-emptyLines;
						if(emptyLines>=2||i<=margin.left){
							if(ship[1].width>=newWidth){
								if(genCount>=ship[1].nextCheck){
									if(ship[1].stage===1)ship[1].stage=2;
									if(ship[1].stage===4)ship[1].stage=5;
									ship[1].reset=2;
								}
							}else if(ship[1].stage===1&&ship[1].width>ship[1].reset){
								ship[1].reset*=16;
								ship[1].width=0;
							}else{
								ship[1].width=newWidth;
								ship[1].stage=1;
							}
							break;
						}
					}
					if(genCount>=ship[1].nextCheck)ship[1].nextCheck=genCount+ship[1].period;
				}


				if(ship[1].stage===2||ship[1].stage===5||ship[1].nextCheck===genCount){
					ysides(margin.right-ship[1].width,margin.right);
					if(ship[1].stage===2)ship[1].stage=3;
					if(ship[1].stage===5){
						ship[1].stage=6;
						ship[1].Ypos=margin.top-view.shiftY;
						ship[1].nextCheck=genCount+ship[1].period;
						ship[1].rle=readPattern(margin.top,margin.right,margin.bottom,margin.right-ship[1].width);
						ship[1].multiplier=1;
					}
					if(ship[1].nextCheck===genCount){
						if(ship[1].rle===readPattern(margin.top,margin.right,margin.bottom,margin.right-ship[1].width)){
							if(ship[1].stage===3){
								ship[1].stage=4;
							}else{
								document.getElementById("rle").value+="\nfound ("+totalMovement*ship[1].multiplier+","+(Math.abs(margin.top-view.shiftY-ship[1].Ypos)*ship[1].multiplier)+")c/"+ship[1].period*ship[1].multiplier+" "+ship[1].rle;
								clearGrid(margin.top,margin.right,margin.bottom,margin.right-ship[1].width);
							}
							ship[1].nextCheck=genCount+ship[1].period*ship[1].reset;
						}else{
							if(ship[1].multiplier>=ship[1].reset){
								ship[1].reset*=2;
								ship[1].multiplier=1;
								ship[1].rle=readPattern(margin.top,margin.right,margin.bottom,margin.right-ship[1].width);
							}else{
								ship[1].multiplier++;
							}
							ship[1].nextCheck=genCount+ship[1].period;
						}
					}
				}
			break;
			case 2:
				if(ship[2].stage===1||ship[2].stage===4){
					for(let j=Math.min(gridHeight-1,Math.max(0,margin.bottom-ship[2].width));j>=0;j--){
						emptyLines++;
						for(let i=0;i<gridWidth;i++){
							if(grid[gridIndex][i][j]!==backgroundState){
								emptyLines=0;
								break;
							}
						}
						let newWidth=(j<margin.top)?margin.bottom-margin.top-1:margin.bottom-j-emptyLines;
						if(emptyLines>=2||j<=margin.top){
							if(ship[2].width>=newWidth){
								if(genCount>=ship[2].nextCheck){
									if(ship[2].stage===1)ship[2].stage=2;
									if(ship[2].stage===4)ship[2].stage=5;
									ship[2].reset=2;
								}
							}else if(ship[2].stage===1&&ship[2].width>ship[2].reset){
								ship[2].reset*=16;
								ship[2].width=0;
							}else{
								ship[2].width=newWidth;
								ship[2].stage=1;
							}
							break;
						}
					}
					if(genCount>=ship[2].nextCheck)ship[2].nextCheck=genCount+ship[2].period;
				}

				if(ship[2].stage===2||ship[2].stage===5||ship[2].nextCheck===genCount){
					xsides(margin.bottom-ship[2].width,margin.bottom);
					if(ship[2].stage===2)ship[2].stage=3;
					if(ship[2].stage===5){
						ship[2].stage=6;
						ship[2].Ypos=margin.left-view.shiftX;
						ship[2].nextCheck=genCount+ship[2].period;
						ship[2].rle=readPattern(margin.bottom-ship[2].width,margin.right,margin.bottom,margin.left);
						ship[2].multiplier=1;
					}
					if(ship[2].nextCheck===genCount){
						if(ship[2].rle===readPattern(margin.bottom-ship[2].width,margin.right,margin.bottom,margin.left)){
							if(ship[2].stage===3){
								ship[2].stage=4;
							}else{
								document.getElementById("rle").value+="\nfound ("+totalMovement*ship[2].multiplier+","+(Math.abs(margin.left-view.shiftX-ship[2].Ypos)*ship[2].multiplier)+")c/"+ship[2].period*ship[2].multiplier+" "+ship[2].rle;
								clearGrid(margin.bottom-ship[2].width,margin.right,margin.bottom,margin.left);
							}
							ship[2].nextCheck=genCount+ship[2].period*ship[2].reset;
						}else{
							if(ship[2].multiplier>=ship[2].reset){
								ship[2].reset*=2;
								ship[2].multiplier=1;
								ship[2].rle=readPattern(margin.bottom-ship[2].width,margin.right,margin.bottom,margin.left);
							}else{
								ship[2].multiplier++;
							}
							ship[2].nextCheck=genCount+ship[2].period;
						}
					}
				}
			break;
			case 3:
				if(ship[3].stage===1||ship[3].stage===4){
					for(let i=Math.min(gridWidth-1,Math.max(0,margin.left+ship[3].width));i<gridWidth;i++){
						emptyLines++;
						for(let j=0;j<gridHeight;j++){
							if(grid[gridIndex][i][j]!==backgroundState){
								emptyLines=0;
								break;
							}
						}
						let newWidth=(i>margin.right)?margin.right-margin.left:i-margin.left-emptyLines+1;
						if(emptyLines>=2||i>=margin.right-1){
							if(ship[3].width>=newWidth){
								if(genCount>=ship[3].nextCheck){
									if(ship[3].stage===1)ship[3].stage=2;
									if(ship[3].stage===4)ship[3].stage=5;
									ship[3].reset=2;
								}
							}else if(ship[3].stage===1&&ship[3].width>ship[3].reset){
								ship[3].reset*=16;
								ship[3].width=0;
							}else{
								ship[3].width=newWidth;
								ship[3].stage=1;
							}
							break;
						}
					}
					if(genCount>=ship[3].nextCheck)ship[3].nextCheck=genCount+ship[3].period;
				}


				if(ship[3].stage===2||ship[3].stage===5||ship[3].nextCheck===genCount){
					ysides(margin.left,margin.left+ship[3].width);
					if(ship[3].stage===2)ship[3].stage=3;
					if(ship[3].stage===5){
						ship[3].stage=6;
						ship[3].Ypos=margin.top-view.shiftY;
						ship[3].nextCheck=genCount+ship[3].period;
						ship[3].rle=readPattern(margin.top,margin.left+ship[3].width,margin.bottom,margin.left);
						ship[3].multiplier=1;
					}
					if(ship[3].nextCheck===genCount){
						if(ship[3].rle===readPattern(margin.top,margin.left+ship[3].width,margin.bottom,margin.left)){
							if(ship[3].stage===3){
								ship[3].stage=4;
							}else{
								document.getElementById("rle").value+="\nfound ("+totalMovement*ship[3].multiplier+","+(Math.abs(margin.top-view.shiftY-ship[3].Ypos)*ship[3].multiplier)+")c/"+ship[3].period*ship[3].multiplier+" "+ship[3].rle;
								clearGrid(margin.top,margin.left+ship[3].width,margin.bottom,margin.left);
							}
							ship[3].nextCheck=genCount+ship[3].period*ship[3].reset;
						}else{
							if(ship[3].multiplier>=ship[3].reset){
								ship[3].reset*=2;
								ship[3].multiplier=1;
								ship[3].rle=readPattern(margin.top,margin.left+ship[3].width,margin.bottom,margin.left);
							}else{
								ship[3].multiplier++;
							}
							ship[3].nextCheck=genCount+ship[3].period;
						}
					}
				}
			break;
		}
	}
}

//mainain a 1 cell thick margin around the pattern
function addMargin(){
	if(dragID===0&&dimensions===2){
		if(!document.getElementById("xloop").checked){
			xsides(0,gridHeight);
			if(margin.left!==0||margin.right!==0){
				view.l=margin.left-3;
				view.r=margin.right-gridWidth+3;
			}
			scaleGrid();
		}
		if(!document.getElementById("yloop").checked){
			ysides(0,gridWidth);
			if(margin.bottom!==0||margin.top!==0){
				view.u=margin.top-3;
				view.d=margin.bottom-gridHeight+3;
			}
			scaleGrid();
		}
	}
}

function xsides(top,bottom){
	margin.left=1;
	margin.right=0;
	if(dimensions===2){
		for(let h=0;h<gridWidth;h++){
			for(let i=top;i<bottom;i++){
				if(grid[gridIndex][h][i]!==backgroundState){
					margin.left=h;
					h=gridWidth;
					i=bottom;
				}
			}
		}
		for(let h=gridWidth-1;h>=0;h--){
			for(let i=top;i<bottom;i++){
				if(grid[gridIndex][h][i]!==backgroundState){
					margin.right=h+1;
					h=-1;
					i=bottom;
				}
			}
		}
	}
}

function ysides(left,right){
	margin.top=0;
	margin.bottom=0;
	for(let i=0;i<gridHeight;i++){
		for(let h=left;h<right;h++){
			if(grid[gridIndex][h][i]!==backgroundState){
				margin.top=i;
				h=right;
				i=gridHeight;
			}
		}
	}
	for(let i=gridHeight-1;i>=0;i--){
		for(let h=left;h<right;h++){
			if(grid[gridIndex][h][i]!==backgroundState){
				margin.bottom=i+1;
				h=right;
				i=-1;
			}
		}
	}
}

//function for scaling the grid
function scaleGrid(){
	if(view.r!==0||view.l!==0||view.u!==0||view.d!==0)hasChanged=1;
	//clear the part of the array being added to the grid
	for(let h=0;h<gridWidth+view.r&&h<grid[gridIndex].length;h++){
		for(let i=gridHeight;i<gridHeight+view.d&&i<grid[gridIndex][0].length;i++){
			grid[gridIndex][h][i]=backgroundState;
		}
	}
	for(let h=gridWidth;h<gridWidth+view.r&&h<grid[gridIndex].length;h++){
		for(let i=0;i<gridHeight&&i<grid[gridIndex][0].length;i++){
			grid[gridIndex][h][i]=backgroundState;
		}
	}
	//Externd left edge if the pattern reaches it
	if(view.l<grid[gridIndex].length)while(view.l!==0){
		if(view.l>0){
			gridWidth--;
			view.l--;
			view.x--;
			view.touchX--;
			selectArea.left--;
			selectArea.right--;
			selectArea.pastLeft--;
			selectArea.pastRight--;
			for(let h=0;h<markers.length;h++){
				markers[h].left--;
				markers[h].right--;
			}
			view.shiftX--;
			grid[0].shift();
			grid[1].shift();
		}else{
			gridWidth++;
			view.l++;
			view.x++;
			view.touchX++;
			selectArea.left++;
			selectArea.right++;
			selectArea.pastLeft++;
			selectArea.pastRight++;
			for(let h=0;h<markers.length;h++){
				markers[h].left++;
				markers[h].right++;
			}
			view.shiftX++;
			grid[0].unshift([]);
			grid[1].unshift([]);
			for(let i=0;i<grid[0][1].length;i++){
				grid[0][0].push(backgroundState);
				grid[1][0].push(backgroundState);
			}
		}
	}
	//Extend the right edge if the pattern reaches it
	if(-view.r<grid[gridIndex].length){
		gridWidth+=view.r;
		view.r=0;
		while(gridWidth>grid[1].length){
			grid[0].push([]);
			grid[1].push([]);
			for(let i=0;i<grid[0][0].length;i++){
				grid[0][grid[0].length-1].push(backgroundState);
				grid[1][grid[1].length-1].push(backgroundState);
			}
		}
	}
	//Extend the upper edge if the pattrn reaches it
	if(view.u<grid[gridIndex][0].length)while(view.u!==0){
		if(view.u>0){
			gridHeight--;
			view.u--;
			view.y--;
			view.touchY--;
			selectArea.top--;
			selectArea.bottom--;
			selectArea.pastTop--;
			selectArea.pastBottom--;
			for(let h=0;h<markers.length;h++){
				markers[h].top--;
				markers[h].bottom--;
			}
			view.shiftY--;
			for(let i=0;i<grid[0].length;i++){
				grid[0][i].shift();
				grid[1][i].shift();
			}
		}else{
			gridHeight++;
			view.u++;
			view.y++;
			view.touchY++;
			selectArea.top++;
			selectArea.bottom++;
			selectArea.pastTop++;
			selectArea.pastBottom++;
			for(let h=0;h<markers.length;h++){
				markers[h].top++;
				markers[h].bottom++;
			}
			view.shiftY++;
			for(let i=0;i<grid[0].length;i++){
				grid[0][i].unshift(backgroundState);
				grid[1][i].unshift(backgroundState);
			}
		}
	}
	//Extend the lower edge if the pattern reaches it.
	if(-view.d<grid[gridIndex][0].length){
		gridHeight+=view.d;
		view.d=0;
		while(gridHeight>grid[1][0].length){
			for(let i=0;i<grid[1].length;i++){
				grid[0][i].push(backgroundState);
				grid[1][i].push(backgroundState);
			}
			hasChanged=4;
		}
	}
}

function update(){
	//coordinates of the touched cell
	let x=Math.floor(((mouse.x-300)/view.z+300)/cellWidth+view.x);
	let y=Math.floor(((mouse.y-200)/view.z+200)/cellWidth+view.y);
	//if in write mode
	if(editMode===0){
		if(dimensions===2){
			if(drawnState!==0){
				//stretch the grid to include any new cells
				if(!document.getElementById("xloop").checked){
					xsides(0,gridHeight);
					if(x<gridMargin)view.l=x-gridMargin;
					if(x>=gridWidth-gridMargin)view.r=x+gridMargin+1-gridWidth;
					scaleGrid();
					x=Math.floor(((mouse.x-300)/view.z+300)/cellWidth+view.x);
				}
				if(!document.getElementById("yloop").checked){
					ysides(0,gridWidth);
					if(y<gridMargin)view.u=y-gridMargin;
					if(y>=gridHeight-gridMargin)view.d=y+gridMargin+1-gridHeight;
					scaleGrid();
					y=Math.floor(((mouse.y-200)/view.z+200)/cellWidth+view.y);
				}
			}
			if(drawMode===-1){
				//if the finger is down
				if(drawnState=== -1){
					isPlaying=0;
					hasChanged=5;
					if(grid[gridIndex][mod(x,gridWidth)][mod(y,gridHeight)]===0){
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
				hasChanged=5;
			}
			if((document.getElementById("xloop").checked||x>=0&&x<gridWidth)
			 &&(document.getElementById("yloop").checked||y>=0&&y<gridHeight)){
				//actually set the cell state
				grid[gridIndex][mod(x,gridWidth)][mod(y,gridHeight)]=drawnState;
			}
			if(isPlaying===0)addMargin();
		}else if(dimensions===1){
			//console.log(Math.floor(x/30));
			if(Math.floor(x/30)>=0){
				genCount=0;
				if(true||drawMode===-1){
					//if the finger is down
					if(drawnState=== -1){
						isPlaying=0;
						hasChanged=5;
						if((bitwiseGrid[gridIndex][Math.floor(x/30)][0]&Math.pow(2,mod(x,30)))!==0){
							//set cell state to live(highest state)
							drawnState=0;
						}else{
							//otherwise set cell state to zero
							drawnState=8589934591;
						}

					}
				}else{
					drawnState=drawMode;
					isPlaying=0;
					hasChanged=5;
				}
				bitwiseGrid[0][Math.floor(x/30)][0]^=(bitwiseGrid[0][Math.floor(x/30)][0]^drawnState)&Math.pow(2,mod(x,30));
				bitwiseGrid[1][Math.floor(x/30)][0]^=(bitwiseGrid[1][Math.floor(x/30)][0]^drawnState)&Math.pow(2,mod(x,30));
			}
		}
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
		if(dimensions===1&&(200-200/view.z)/cellWidth+view.y<0){
			view.y=(200/view.z-200)/cellWidth;
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

// dec 5= bin 10100000000...
function block(x,y){
	if(x>0&&x<bitwiseGrid[0].length-1){
		return (bitwiseGrid[gridIndex][x][y]&2147483646)|((bitwiseGrid[gridIndex][x-1][y]&1073741824)?1:0)|((bitwiseGrid[gridIndex][x+1][y]&2)?2147483648:0);
	}else if(x<bitwiseGrid[0].length-1){
		return (bitwiseGrid[gridIndex][x][y]&2147483646)|((bitwiseGrid[gridIndex][x+1][y]&2)?2147483648:0);
	}else if(x>0){
		return (bitwiseGrid[gridIndex][x][y]&2147483646)|((bitwiseGrid[gridIndex][x-1][y]&1073741824)?1:0);
	}else{
		return bitwiseGrid[gridIndex][x][y];
	}
}

function gen(){
	timeSinceUpdate=Date.now();
	isActive=0;
	//
	let newgrid=1-gridIndex;

	if(dimensions===2){
		if(document.getElementById("xloop").checked){
			margin.left=3;
			margin.right=gridWidth-3;
		}else{
			xsides(0,gridHeight);
			if(margin.right===0){
				margin.left=3;
				margin.right=gridWidth-3;
			}
		}
		if(document.getElementById("yloop").checked){
			margin.top=3;
			margin.bottom=gridHeight-3;
		}else{
			ysides(0,gridWidth);
			if(margin.bottom===0){
				margin.top=3;
				margin.bottom=gridHeight-3;
				isPlaying=0;
			}
		}
		//handles B0 rules
		if(backgroundState<=0){
			if(ruleArray[1][0]===1)backgroundState=1;
		}else if(backgroundState===1){
			if(ruleArray[0][255]===0){
				if(ruleArray[2]===2){
					backgroundState=0;
				}else{
					backgroundState=2;
				}
			}
		}else{
			backgroundState++;
			if(backgroundState>ruleArray[2]-1)backgroundState=0;
		}
		//update cell state
		for(let h=margin.left-3;h<margin.left-3+gridWidth;h++){
			for(let i=margin.top-3;i<margin.top-3+gridHeight;i++){
				if(h>=0&&i>=0&&h<gridWidth&&i<gridHeight){
					//reset the number of living neighbors a cell has
					let n=0,shift=[-1,1,-1,1];

					//increment the number of living neighbors for each neighbor
					if(h===0)           shift[0]=-1+gridWidth;
					if(h===gridWidth-1) shift[1]= 1-gridWidth;
					if(i===0)           shift[2]=-1+gridHeight;
					if(i===gridHeight-1)shift[3]= 1-gridHeight;


					if(grid[gridIndex][h+shift[1]][i+shift[3]]===1)n+=1;
					if(grid[gridIndex][h         ][i+shift[3]]===1)n+=2;
					if(grid[gridIndex][h+shift[0]][i+shift[3]]===1)n+=4;
					if(grid[gridIndex][h+shift[0]][i         ]===1)n+=8;
					if(grid[gridIndex][h+shift[0]][i+shift[2]]===1)n+=16;
					if(grid[gridIndex][h         ][i+shift[2]]===1)n+=32;
					if(grid[gridIndex][h+shift[1]][i+shift[2]]===1)n+=64;
					if(grid[gridIndex][h+shift[1]][i         ]===1)n+=128;
					//turn a dead cell into a live one if conditions are me
					if(grid[gridIndex][h][i]===0){
						if(ruleArray[1][n]===1){
							grid[newgrid][h+3-margin.left][i+3-margin.top]=1;
							isActive=1;
						}else{
							grid[newgrid][h+3-margin.left][i+3-margin.top]=0;
						}
					//turn a live cell into a dying one if conditions are met
					}else if(grid[gridIndex][h][i]===1){
						if(ruleArray[2]===2){
							grid[newgrid][h+3-margin.left][i+3-margin.top]=0;
						}else{
							grid[newgrid][h+3-margin.left][i+3-margin.top]=2;
						}
						if(ruleArray[0][n]===1){
							grid[newgrid][h+3-margin.left][i+3-margin.top]=1;
						}
						if(grid[newgrid][h+3-margin.left][i+3-margin.top]!==1)isActive=1;
					}else{
						if(grid[gridIndex][h][i]>=ruleArray[2]-1){
							grid[newgrid][h+3-margin.left][i+3-margin.top]=0;
						}else{
							//brings a dying cell closer to death
							grid[newgrid][h+3-margin.left][i+3-margin.top]=grid[gridIndex][h][i]+1;
						}
						isActive=1;
					}
				}else{
					grid[newgrid][h+3-margin.left][i+3-margin.top]=backgroundState;
				}
			}
		}
		if(isActive===1){
			gridIndex=newgrid;
			//move grid according to how the cells were offset
			view.x+=3-margin.left;
			view.y+=3-margin.top;
			view.touchX+=3-margin.left;
			view.touchY+=3-margin.top;
			view.shiftX+=3-margin.left;
			view.shiftY+=3-margin.top;
			selectArea.left+=3-margin.left;
			selectArea.top+=3-margin.top;
			selectArea.right+=3-margin.left;
			selectArea.bottom+=3-margin.top;
			selectArea.pastLeft+=3-margin.left;
			selectArea.pastTop+=3-margin.top;
			selectArea.pastRight+=3-margin.left;
			selectArea.pastBottom+=3-margin.top;
			for(let h=0;h<markers.length;h++){
				markers[h].left+=3-margin.left;
				markers[h].right+=3-margin.left;
				markers[h].top+=3-margin.top;
				markers[h].bottom+=3-margin.top;
			}

			//adjust right and bottom edges
			view.r=margin.right-gridWidth-margin.left+6;
			view.d=margin.bottom-gridHeight-margin.top+6;

			scaleGrid();


			genCount++;
			document.getElementById("gens").innerHTML="Generation "+genCount+".";
			if(startIndex===0)startIndex=currentIndex;
			done();
		}else{
			//pause if the grid is inactive
			if(oscSearch.length===0)isPlaying=0;
		}
	}else if(dimensions===1){
		for(let h=0;h<bitwiseGrid[0].length;h++){
			//console.log(h+1-margin.left)
			if(bitwiseGrid[gridIndex][h].length-2<genCount){
				bitwiseGrid[gridIndex][h].push(0);
				bitwiseGrid[newgrid][h].push(0);
			}
			bitwiseGrid[gridIndex][h][genCount+1]=0;
			for(let i=0;i<ruleArray[0].length;i++){
				bitwiseGrid[gridIndex][h][genCount+1]=bitwiseGrid[gridIndex][h][genCount+1]|
																						((block(h,genCount)^(ruleArray[0][i][0]?0:4294967295))<<1
																					 & (block(h,genCount)^(ruleArray[0][i][1]?0:4294967295))
																					 & (block(h,genCount)^(ruleArray[0][i][2]?0:4294967295))>>>1);
			}
			bitwiseGrid[newgrid][h][genCount+1]=bitwiseGrid[gridIndex][h][genCount+1];
			console.log(margin.left+" "+bitwiseGrid[gridIndex].length+" "+bitwiseGrid[gridIndex][h]);
		}
		if((bitwiseGrid[gridIndex][bitwiseGrid[gridIndex].length-1][genCount]&3758096384)!==0){
			bitwiseGrid[0].push(new Array(bitwiseGrid[gridIndex][0].length));
			bitwiseGrid[1].push(new Array(bitwiseGrid[gridIndex][0].length));
		}
		if((bitwiseGrid[gridIndex][0][genCount]&7)!==0){
			console.log(1-margin.left+" "+gridIndex+" "+newgrid);
			bitwiseGrid[0].push(new Array(bitwiseGrid[gridIndex][0].length));
			bitwiseGrid[1].push(new Array(bitwiseGrid[gridIndex][0].length));
			for(let h=0;h<bitwiseGrid[gridIndex].length-1;h++){
				for(let i=0;i<genCount+2;i++){
					bitwiseGrid[newgrid][h+1][i]=bitwiseGrid[gridIndex][h][i];
				}
			}
			for(let h=0;h<bitwiseGrid[gridIndex].length;h++){
				for(let i=0;i<genCount+2;i++){
					bitwiseGrid[gridIndex][h][i]=bitwiseGrid[newgrid][h][i];
				}
			}
			for(let i=0;i<bitwiseGrid[newgrid][0].length;i++){
				bitwiseGrid[newgrid][0][i]=0;
				bitwiseGrid[gridIndex][0][i]=0;
			}
			view.x+=30;
		}
		gridIndex=newgrid;

		/*for(let h=0;h<bitwiseGrid[0].length;h++){
			for(let i=1;i<bitwiseGrid[0][0].length;i++){
				bitwiseGrid[gridIndex][h][i]=bitwiseGrid[newgrid][h][i];
			}
		}*/
		//bitwiseGrid[gridIndex]=bitwiseGrid[newgrid];

		genCount++;
		document.getElementById("gens").innerHTML="Generation "+genCount+".";
		if(startIndex===0)startIndex=currentIndex;
		if(dimensions===2)done();
		xsides();
	}
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
	//grid line offsets
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
	if(dimensions===2){
		//for each cell
		for(let h=0;h<600/cellWidth/view.z+1;h++){
			for(let i=0;i<400/cellWidth/view.z+1;i++){
				//draw a square if the cell's state is not 0 and within the sim area
				if(G(h,i)!==0&&(document.getElementById("xloop").checked||h+view.x+(300-300/view.z)/cellWidth>=0&&h+view.x+(300-300/view.z)/cellWidth<gridWidth)
				               &&(document.getElementById("yloop").checked||i+view.y+(200-200/view.z)/cellWidth>=0&&i+view.y+(200-200/view.z)/cellWidth<gridHeight)){
					//find the cell's color depending on the state
					if(G(h,i)===1){
						if(darkMode){
							color=240;
						}else{
							color=0;
						}
					}else{
						if(darkMode){
							color=208/ruleArray[2]*(ruleArray[2]-G(h,i)+1)+32;
						}else{
							color=255/ruleArray[2]*(G(h,i)-1);
						}
					}
					ctx.fillStyle="rgb("+color+","+color+","+color+")";
					//set the color
					ctx.fillRect((300/view.z-view.x*cellWidth+Math.floor(round(view.x-300/cellWidth/view.z))*cellWidth)*view.z+h*cellWidth*view.z,(200/view.z-view.y*cellWidth+Math.floor(round(view.y-200/cellWidth/view.z))*cellWidth)*view.z+i*cellWidth*view.z,cellWidth*view.z,cellWidth*view.z);
				}
			}
		}
	}else if(dimensions===1){
		for(let h=Math.max(0,Math.floor(((300-(300/view.z))/cellWidth+view.x-view.shiftX)/30));h<Math.min(bitwiseGrid[gridIndex].length,Math.floor(((300+(300/view.z))/cellWidth+view.x-view.shiftX)/30+1));h++){
			for(let i=Math.max(0,Math.floor((200-(200/view.z))/cellWidth+view.y-view.shiftY));i<Math.min(bitwiseGrid[gridIndex][h].length,Math.floor((200+(200/view.z))/cellWidth+view.y-view.shiftY+1));i++){
				let buffer=Math.floor(bitwiseGrid[gridIndex][h][i]);
				for(let j=0;j<32;j++){
					if(buffer%2===1){
						ctx.fillStyle="#bbb";
						ctx.fillRect(300+(cellWidth*(j+30*h-view.x+view.shiftX)-300)*view.z,200+(cellWidth*(i-view.y+view.shiftY)-200)*view.z,cellWidth*view.z,cellWidth*view.z);
						buffer--;
					}
					buffer=buffer>>>1;
				}
			}
		}
	}

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
		if(dimensions===2)ctx.strokeRect(300-(view.x*cellWidth+300)*view.z,200-(view.y*cellWidth+200)*view.z,gridWidth*view.z*cellWidth-1,gridHeight*view.z*cellWidth-1);
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
	let repeat=[],xStartPosition=xPosition;
	for(let h=startPoint;h<rle.length;h++){
		if(rle[h]==="!")break;
		if(isNaN(rle[h])||rle[h]===" "){
			repeat=parseInt(repeat.join(""),10);

			if(isNaN(repeat)){
				repeat=1;
			}

			for(let i=0;i<repeat;i++){
				//dead cell if conditions are met
				if(yPosition===3)console.log(repeat);
				if(rle[h]==="b"||rle[h]==="."){
					grid[gridIndex][xPosition][yPosition]=0;
					xPosition++;
				//newline if conditions met
				}else if(rle[h]==="$"){
					xPosition=xStartPosition;
					yPosition++;
				//else live cell
				}else{
					if(ruleArray[2]===2||rle[h]==="o"){
						grid[gridIndex][xPosition][yPosition]=1;
					}else if(rle[h].charCodeAt(0)>64&&rle[h].charCodeAt(0)<91){
						grid[gridIndex][xPosition][yPosition]=rle[h].charCodeAt(0)-64;
					}
					xPosition++;
				}
			}
			repeat=[];
		}else{
			repeat.push(rle[h]);
		}
	}
}

function findHeader(rle){
	let h=0, step=0, char="x", startIndex=0, number=[];
	for(;h<rle.length;h++){
		if(rle[h]===char){
			step++
			if(step===8)break;
		}else{
			if((char!==""&&rle[h]!==" ")||(char===""&&isNaN(rle[h]))){
				step=0;
				h=startIndex++;
			}
			if(char===""&&!isNaN(rle[h])){
				number.push(rle[h]);
				if(isNaN(rle[h+1])){
					number=parseInt(number.join(""),10);
					console.log(number);
					if(step===2){
						view.r=number+6-gridWidth;
					}
					if(step===6){
						view.d=number+6-gridHeight;
					}
					number=[];
					step++;
				}
			}
		}
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
	scaleGrid();
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
	let pattern=[];
	for(let i=top;i<bottom;i++){
		let repeat=1;
		for(let h=left;h<right;h++){
			//count n same cells, jump n back, push n, jump forward n
			if(grid[gridIndex][h+1]&&grid[gridIndex][h+1][i]===grid[gridIndex][h][i]){
				repeat++;

			}else{
				if(repeat!==1){
					pattern.push(repeat);
					repeat=1;
				}
				if(ruleArray[2]===2){
					if(grid[gridIndex][h][i]===0){
						pattern.push("b");
					}else{
						pattern.push("o");
					}
				}else{
					if(grid[gridIndex][h][i]===0){
						pattern.push(".");
					}else{
						pattern.push(String.fromCharCode(grid[gridIndex][h][i]+64));
					}
				}
			}
		}
		if(pattern[pattern.length-1]==="$"){
			if(isNaN(pattern[pattern.length-2])){
				pattern[pattern.length-1]=2;
				pattern.push("$");
			}else{
				pattern[pattern.length-2]=pattern[pattern.length-2]+1;
			}
		}else{
			pattern.push("$");
		}
	}
	pattern[pattern.length-1]="!";
	return pattern.join("");
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
	dimensions=2;

	for(let h=0;h<ruleText.length;h++){
		if(ruleText[h]==="W"){
			dimensions=1;
			readMode=0;
			transitionNumber=1;
		}else if(ruleText[h]==="s"||ruleText[h]==="S"){
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

	if(dimensions===2){
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
	}else if(dimensions===1){
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
			console.log(ruleNumber);
			for(let h=0;h<8;h++){
				if(ruleNumber%2===1){
					ruleArray[0].push([...set[h]]);
				}
				ruleNumber=ruleNumber>>>1;
			}
			console.log(ruleArray[0]);
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
	}
	//draw the simulation
	if(isPlaying===0||(genCount-stepStart)%stepSize===0)render();
	if(isPlaying!==0||keyFlag[0])requestAnimationFrame(main);
}
requestAnimationFrame(main);
