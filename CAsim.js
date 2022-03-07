var //canvas element
  canvas=document.getElementById("ourCanvas"),
  //canvas context
  ctx=canvas.getContext("2d"),
  //window and canvas dimensions
  windowHeight=0,windowWidth=0,canvasWidth=0,canvasHeight=0,
  //state of the  background(used for B0 rules)
  backgroundState=0,
  //the weights for decoding rule strings.
  // 16 32  64
  //  8     128
  //  4  2  1
    ruleMap=[[0,"-"],[1,"c"],[1,"e"],[2,"a"],[1,"c"],[2,"c"],[2,"a"],[3,"i"],[1,"e"],[2,"k"],//00
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
             [6,"c"],[7,"c"],[6,"a"],[7,"e"],[7,"c"],[8,"-"]],
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
    //keeps track of whether the sim is using grid[0]  or grid [1]
    gridIndex=0,
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
  maxDepth=20000,
  maxSize=10000,
  hashTable=new Array(99907),
  written=false,
  
  numberOfNodes=0;


const xSign=[-1,1,-1,1];
const ySign=[-1,-1,1,1];
const primes=[7,13,11,17];

class TreeNode {
  constructor(distance){
    this.distance=distance;
    this.value=null;
    this.key=null;
    this.child = [null,null,null,null];
    this.result = null;
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

class HashNode {
  constructor(){
    this.value = null;
    this.child = null;
  }
}

function calculateKey(node){
  //sets key to the nodes value if it has one
  if(node.distance===1){
    node.key=node.value;
    //otherwise sets the key based of the children's keys
  }else{
    node.key=node.distance;
    for(let h=0;h<4;h++) if(node.child[h]!==null){
      if(node.child[h].key===null){
        calculateKey(node.child[h]);
      }
      node.key+=(node.child[h].key*(h+23));
    }
  }
}

function extendChild(number,oldNode){
  let newNode=new TreeNode(oldNode.distance);
  for(let i=0;i<4;i++){
    if(i===number){
      if(oldNode.child[i]===null){
        newNode.child[i]=new TreeNode(1);
      }else{
        newNode.child[i]=new TreeNode(2*oldNode.child[i].distance);
        if(oldNode.child[i].value!==null||oldNode.child[i].child[0]!==null||oldNode.child[i].child[1]!==null||oldNode.child[i].child[2]!==null||oldNode.child[i].child[3]!==null)newNode.child[i].child[3-i]=oldNode.child[i];
      }
    }else{
      newNode.child[i]=oldNode.child[i];
    }
  }
  return newNode;
}

function getResult(node){
  let result = new TreeNode(node.distance>>>1);
  if(node.distance<=4){
    //error
  }else if(node.distance>=8){
	for(let i = 0;i < 4;i++){
	  result.child[i]=new TreeNode(node.distance>>>2);
	  
	  result.child[i].child[i]=node.child[i].result.child[3-i];
	}
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
	
	
	for(let i = 0;i < 4;i++){
	  result.child[i].value=getValue(result.child[i]);
	  result.child[i]=writeNode(result.child[i]);
	}
  }
  result.value=getValue(result);
  return writeNode(result);
}

function writeNode(node){
  calculateKey(node);
  if(!hashTable[node.key%hashTable.length]){
    hashTable[node.key%hashTable.length]=new HashNode();
  }
  let hashedList=hashTable[node.key%hashTable.length];
  //search through the linked list stored at the hash value
  for(let i=0;;i++){
	if(i>maxDepth){
		console.log("maxDepth of "+maxDepth+"reached.");
		break;
	}
    if(hashedList.value===null){
      hashedList.value=node;
      
      if(hashedList.value.distance===4&&hashedList.value.result===null){
		  hashedList.value.result = new TreeNode(2);
		  const lookupTable1=[[3,2,2,0,0,0,1,1],[3,3,2,0,0,1,1,1],[3,2,2,2,0,0,1,3],[3,3,2,2,0,1,1,3]],
		        lookupTable2=[[0,1,0,2,0,1,0,2],[1,0,1,3,1,0,1,3],[2,3,2,0,2,3,2,0],[3,2,3,1,3,2,3,1]];
		  for(let i = 0; i < 4; i++){
		      let total = 0;
		      for(let j = 0;j<8;j++){
		        if(hashedList.value.child[lookupTable1[i][j]].child[lookupTable2[i][j]].value===1)total+=1<<j;
		      }
		      
		      hashedList.value.result.child[i]=new TreeNode(1);
		      if(hashedList.value.child[i].child[3-i].value===0||hashedList.value.child[i].child[3-i].value===1){
		        hashedList.value.result.child[i].value=ruleArray[hashedList.value.child[i].child[3-i].value][total];
		      }else if(hashedList.value.child[i].child[3-i].value===ruleArray[2]-1){
		        hashedList.value.result.child[i].value=0;
		      }else{
		        hashedList.value.result.child[i].value=hashedList.value.child[i].child[3-i].value+1;
		      }
		      hashedList.value.result.child[i]=writeNode(hashedList.value.result.child[i]);
	      }
	      if(hashedList.value.result.child[0].value!==null&&
	         hashedList.value.result.child[0].value===hashedList.value.result.child[1].value&&
	         hashedList.value.result.child[1].value===hashedList.value.result.child[2].value&&
	         hashedList.value.result.child[2].value===hashedList.value.result.child[3].value)hashedList.value.result.value=hashedList.value.result.child[0].value;
	      hashedList.value.result=writeNode(hashedList.value.result);
      }else if(hashedList.value.distance>4&&hashedList.value.result===null){
	      hashedList.value.result = getResult(hashedList.value);
      }
      
      numberOfNodes++;
      break;
    }else if(isEqual(hashedList.value,node)){
      break;
    }
    if(hashedList.child===null)hashedList.child=new HashNode();
    hashedList=hashedList.child;
  }
  return hashedList.value;
}

function isEqual(tree1, tree2){
  //
  if(tree1===tree2){
    return true;
  }else if(tree1&&tree2&&tree1.value===tree2.value){
    if(tree1.distance===1&&tree2.distance===1){
      return true;
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
	}else if(node.child[0].value!==null
	       &&node.child[0].value===node.child[1].value
	       &&node.child[1].value===node.child[2].value
	       &&node.child[2].value===node.child[3].value){
	  return node.child[0].value;
	}else{
	  return null;
	}
}

function doubleSize(node){
  let temporaryNode=new TreeNode(node.distance<<1);
  for(let i = 0;i < 4;i++){
	temporaryNode.child[i]=new TreeNode(node.distance);
	temporaryNode.child[i].child[3-i]=node.child[i];
	  
    for(let j = 0;j < 4;j++){
      if(j!==3-i){
        temporaryNode.child[i].child[j]=getEmptyNode(node.distance>>>1);
      }
	}
	temporaryNode.child[i].value=getValue(temporaryNode.child[i]);
	temporaryNode.child[i]=writeNode(temporaryNode.child[i]);
  }
  temporaryNode.value=getValue(temporaryNode);
  return writeNode(temporaryNode);
}



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
let head=writeNode(getEmptyNode(8));
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
  for(let h in key){
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

function updateDropdownMenu(){
  if(document.getElementById("dropbtn2").getBoundingClientRect().top<240||
     document.getElementById("dropbtn2").getBoundingClientRect().bottom<window.innerHeight-240){
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
  if(head.value!==0){
    selectArea.a=1;
    selectArea.top=getTopBorder();
    selectArea.right=getRightBorder();
    selectArea.bottom=getBottomBorder();
    selectArea.left=getLeftBorder();
    render();
  }
}

function copy(){

}

function cut(){

}

function paste(){

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
  }else if(!isNaN(document.getElementById("markerNumber").value)&&
           ""!==document.getElementById("markerNumber").value&&
           markers[parseInt(document.getElementById("markerNumber").value,10)-1]&&
           markers[parseInt(document.getElementById("markerNumber").value,10)-1].active>0){
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
}

function redo(){
}

//go to before the simulation started
function reset(){
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
  //console.log(actionStack[currentIndex].o.x+" "+view.shiftX);
  hasChanged=0;
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

function getCell(startNode,xPos,yPos){
  let node=startNode,relativeX=xPos,relativeY=yPos;
  for(let h=0;;h++){
    if(h>maxDepth){
      console.log("maxDepth of "+maxDepth+"reached.");
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
		    return relativeX;
	    }
	  }
	}
  }
}

function readPatternFromGrid(topBorder,rightBorder,bottomBorder,leftBorder){
  let pattern=new Array(rightBorder-leftBorder);
  for(let i=0;i<pattern.length;i++){
    pattern[i]=new Array(bottomBorder-topBorder);
    for(let j=0;j<pattern.length;j++){
      let cell=getCell(head,leftBorder+i,topBorder+j);
      if(cell!==null){
        pattern[i][j]=cell.value;
      }else{
        pattern[i][j]=0;
      }
    }
  }
}

function getTopBorder(){
  for(let i=-(head.distance>>>1);i<head.distance>>>1;i++){
    for(let j=-(head.distance>>>1);j<head.distance>>>1;j++){
      if(getCell(head,j,i).value!==0)return i>>>1;
    }
  }
  return null;
}

function getRightBorder(){
  for(let i=(head.distance>>>1)-1;i>=-(head.distance>>>1);i--){
    for(let j=-(head.distance>>>1);j<head.distance>>>1;j++){
      if(getCell(head,i,j).value!==0)return (i>>>1)+1;
    }
  }
  return null;
}

function getBottomBorder(){
  for(let i=(head.distance>>>1)-1;i>=-(head.distance>>>1);i--){
    for(let j=-(head.distance>>>1);j<head.distance>>>1;j++){
      if(getCell(head,j,i).value!==0)return (i>>>1)+1;
    }
  }
  return null;
}

function getLeftBorder(){
  for(let i=-(head.distance>>>1);i<head.distance>>>1;i++){
    for(let j=-(head.distance>>>1);j<head.distance>>>1;j++){
      if(getCell(head,i,j).value!==0)return i>>>1;
    }
  }
  return null;
}

function gridToRLE(pattern){
  
}

function update(){
  //coordinates of the touched cell
  let x=Math.floor(((mouse.x-300)/view.z+300)/cellWidth+view.x);
  let y=Math.floor(((mouse.y-200)/view.z+200)/cellWidth+view.y);
  let node=head;
  let sumX=0, sumY=0;
  let progress= new ListNode(null);
  //if in write mode
  if(editMode===0){
	for(let h=0;;h++){
	  if(h>maxDepth){
	    console.log("maxDepth of "+maxDepth+"reached.");
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
        console.log("maxDepth of "+maxDepth+"reached.");
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
          hasChanged=5;
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
        hasChanged=5;
      }
      if(node.value!==drawnState){
        //tree.value=drawnState;
        //make a copy of the node with the new state
        let newNode=new TreeNode(1);
        newNode.value=drawnState;

        //go through the edited node and all the parents
        for(let h=0;;h++){
          if(h>maxDepth){
            console.log("maxDepth of "+maxDepth+"reached.");
            break;
          }

          //end if parent doesn't exist
          if(progress.parent===null){
            head=newNode;
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
          newNode=writeNode(parentNode);
        }
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

function getEmptyNode(distance){
	let node=new TreeNode(distance);
	node.value=0;
	if(distance===1)return writeNode(node);
	node.child[0]=getEmptyNode(distance>>>1);
	node.child[1]=node.child[0];
	node.child[2]=node.child[1];
	node.child[3]=node.child[2];
    return writeNode(node);
}

function gen(){
  timeSinceUpdate=Date.now();
  isActive=0;
  //
  let newgrid=1-gridIndex;

  gridIndex=newgrid;

  genCount++;
  document.getElementById("gens").innerHTML="Generation "+genCount+".";
  if(startIndex===0)startIndex=currentIndex;
  if(algorithm===2)done();
  if(document.getElementById("log").checked===true){
    log.amount++;
    if(selectArea.left>0&&selectArea.top>0&&grid[gridIndex][selectArea.left][selectArea.top]===1){
      document.getElementById("rle").value+=log.amount+",";
      log.amount=0;
    }
  }
  //record that a generation was run
  let toBeExtended = false;
  
  if(true){
	for(let i = 0;i < 4;i++){
	  for(let j = 0;j < 4;j++){
	    if(i!==3-j&&head.child[i].result.child[j].value!==0){
	      toBeExtended=true;
	      break;
	    }
	  }
	  if(toBeExtended===true)break;
	}
  }
  
  //top
  let temporaryNode=new TreeNode(head.distance>>>1);
  temporaryNode.child[0]=head.child[0].child[1];
  temporaryNode.child[1]=head.child[1].child[0];
  temporaryNode.child[2]=head.child[0].child[3];
  temporaryNode.child[3]=head.child[1].child[2];
  temporaryNode.value=getValue(temporaryNode);
  
  temporaryNode=writeNode(temporaryNode);
  
  if(temporaryNode.result.child[0].value!==0)toBeExtended=true;
  if(temporaryNode.result.child[1].value!==0)toBeExtended=true;
  
  
  //right
  temporaryNode=new TreeNode(head.distance>>>1);
  temporaryNode.child[0]=head.child[1].child[2];
  temporaryNode.child[1]=head.child[1].child[3];
  temporaryNode.child[2]=head.child[3].child[0];
  temporaryNode.child[3]=head.child[3].child[1];
  temporaryNode.value=getValue(temporaryNode);
  
  temporaryNode=writeNode(temporaryNode);
  
  if(temporaryNode.result.child[1].value!==0)toBeExtended=true;
  if(temporaryNode.result.child[3].value!==0)toBeExtended=true;
  
  
  //bottom
  temporaryNode=new TreeNode(head.distance>>>1);
  temporaryNode.child[0]=head.child[2].child[1];
  temporaryNode.child[1]=head.child[3].child[0];
  temporaryNode.child[2]=head.child[2].child[3];
  temporaryNode.child[3]=head.child[3].child[2];
  temporaryNode.value=getValue(temporaryNode);
  
  temporaryNode=writeNode(temporaryNode);
  
  if(temporaryNode.result.child[3].value!==0)toBeExtended=true;
  if(temporaryNode.result.child[2].value!==0)toBeExtended=true;
  
  
  //left
  temporaryNode=new TreeNode(head.distance>>>1);
  temporaryNode.child[0]=head.child[0].child[2];
  temporaryNode.child[1]=head.child[0].child[3];
  temporaryNode.child[2]=head.child[2].child[0];
  temporaryNode.child[3]=head.child[2].child[1];
  temporaryNode.value=getValue(temporaryNode);
  
  temporaryNode=writeNode(temporaryNode);
  
  if(temporaryNode.result.child[2].value!==0)toBeExtended=true;
  if(temporaryNode.result.child[0].value!==0)toBeExtended=true;
  
  if(toBeExtended===true)head=doubleSize(head);
  
  
  newGen=new TreeNode(head.distance);
  
  for(let i = 0;i < 4;i++){
	newGen.child[i]=new TreeNode(head.distance>>>1);
	
	for(let j = 0;j < 4;j++){
	  if(i === 3 - j){
	    newGen.child[i].child[j]=head.result.child[i];
	  }else{
		newGen.child[i].child[j]=head.child[i].child[j];
	  }
	}
	newGen.child[i].value=getValue(newGen.child[i]);
	newGen.child[i]=writeNode(newGen.child[i]);
  }
  
  newGen.value=getValue(newGen);
  head=writeNode(newGen);
  
  document.getElementById("numberOfNodes").innerHTML=numberOfNodes;
  
  if(isPlaying<0)isPlaying++;
}

//function which recursively draws squares within the quadtree
function drawSquare(node,xPos,yPos){
	if(node.distance!==1){
		for(let i = 0;i < 4;i++){
		  //check if the node is empty or has a null child
		  if(node.value!==0&&node.child[i]!==null){
				drawSquare(node.child[i],xPos+node.child[i].distance*xSign[i],yPos+node.child[i].distance*ySign[i]);
		        if(debugVisuals===true){
		          ctx.strokeStyle="rgba(240,240,240,0.7)";
		          ctx.beginPath();
		          ctx.moveTo(300-((view.x-(xPos)/2)*cellWidth+300)*view.z,200-((view.y-(yPos)/2)*cellWidth+200)*view.z,view.z*cellWidth,view.z*cellWidth);
		          ctx.lineTo(300-((view.x-(xPos+xSign[i]*node.child[i].distance)/2)*cellWidth+300)*view.z,200-((view.y-(yPos+ySign[i]*node.child[i].distance)/2)*cellWidth+200)*view.z,view.z*cellWidth,view.z*cellWidth);
		          ctx.lineWidth=view.z;
		          ctx.stroke();
		        }
			}
		}
	}else{
        if(node.value>0){
          if(node.value===1){
            if(darkMode){
              color=240;
            }else{
              color=0;
            }
          }else{
            if(darkMode){
              color=208/ruleArray[2]*(ruleArray[2]-node.value)+32;
            }else{
              color=255/ruleArray[2]*(node.value-1);
            }
          }
          ctx.fillStyle="rgba("+color+","+color+","+color+",1)";
          ctx.fillRect(300-((view.x-(xPos-1)/2)*cellWidth+300)*view.z,200-((view.y-(yPos-1)/2)*cellWidth+200)*view.z,view.z*cellWidth,view.z*cellWidth);
        }
	}
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
        ctx.fillStyle="#d999";
      }
      ctx.fillRect(300-((view.x-markers[h].left)*cellWidth+300)*view.z,200-((view.y-markers[h].top)*cellWidth+200)*view.z,(markers[h].right-markers[h].left)*view.z*cellWidth-1,(markers[h].bottom-markers[h].top)*view.z*cellWidth-1);
    }
  }*/
  
  
  if(debugVisuals===true)for(let h=0;h<hashTable.length;h++){
    if(hashTable[h]){
      let hashedList=hashTable[h];
      for(let i=0;;i++){
        if(i>maxDepth){
          console.log("maxDepth of "+maxDepth+"reached.");
        break;
        }
        if(hashedList===null){
          ctx.fillRect(3+h,10,0.5,2*i);
          break;
        }else{
          hashedList=hashedList.child;
        }
      }
    }
  }
  
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
  
  drawSquare(head,0,0);
  
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
            ctx.fillStyle="#999";
          }
            ctx.lineWidth=1;
          ctx.fillText((i+1),300+1*view.z-((view.x-markers[i].left)*cellWidth+300)*view.z,200-6*view.z-((view.y-markers[i].top)*cellWidth+200)*view.z,(markers[i].right-markers[i].left)*view.z*cellWidth-1);
        }
        ctx.lineWidth=5*view.z;
        if((h===0&&markers[i].active===1)||
           (h===1&&markers[i].active===2))ctx.strokeRect(300-((view.x-markers[i].left)*cellWidth+300)*view.z,200-((view.y-markers[i].top)*cellWidth+200)*view.z,(markers[i].right-markers[i].left)*view.z*cellWidth-1,(markers[i].bottom-markers[i].top)*view.z*cellWidth-1);
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
  windowWidth=window.innerWidth || document.documentElement.clientWidth;
  windowHeight=window.innerHeight || document.documentElement.clientHeight;
  let unit=Math.min(windowWidth,windowHeight*1.2)/100;
  if(windowWidth<windowHeight*1.2){
    canvasHeight=(windowWidth-20)/1.5;
    canvasWidth=windowWidth-20;
  }else{
    canvasHeight=windowHeight*0.8;
    canvasWidth=windowHeight*1.2;
  }
  canvas.width =canvasWidth;
  canvas.height=canvasHeight;
  ctx.scale(canvasHeight/400,canvasHeight/400);
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

function importRLE(){
}

function exportRLE(){
  return "none";
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
  let readMode=1,transitionNumber=-1,isBirthDone=false;
  rulestring=[[],[],[]];

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
console.log("rule");
  //for all 255 possible states of the 8 neighbors
  for(let h=0;h<256;h++){
    //for both birth and survival states
    for(let i=0;i<2;i++){
      //assume that the cell will be dead
      ruleArray[i].push(0);
      let transitionNumber=-1;
      //for each character in the rulestring
      for(let j=0;j<rulestring[i].length;j++){
        if(transitionNumber===-1){
          if(rulestring[i][j]==ruleMap[h][0]){
            transitionNumber=rulestring[i][j];
            if(rulestring[i][j+1]&&isNaN(rulestring[i][j+1])){
              ruleArray[i][h]=0;
            }else{
              ruleArray[i][h]=1;
            }
          }
        }else{
          if(isNaN(rulestring[i][j])){
            if(rulestring[i][j]==="-"){
              j++;
              ruleArray[i][h]=1;
            }
            if(rulestring[i][j]===ruleMap[h][1]){
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
  rulestring=clean(ruleText);
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
  if(windowWidth!==(window.innerWidth || document.documentElement.clientWidth)||
    (windowHeight<(window.innerHeight || document.documentElement.clientHeight))||
    (windowHeight>(window.innerHeight || document.documentElement.clientHeight)+40))scaleCanvas();
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