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
		this.action="unknown";
		if(arguments.length<=2){
			this.rule=rulestring;
			if(GRID.type===0){
				this.head=GRID.head; }else{
				this.finiteArea={left:GRID.finiteArea.left, top:GRID.finiteArea.top, margin:GRID.finiteArea.margin};
				this.finiteArray=patternToRLE(GRID.finiteArray);
			}
			this.type=GRID.type;
			this.backgroundState=GRID.backgroundState;
			this.generation=genCount;
			this.resetEvent=resetEvent;
			this.time=Date.now();
			//save the name of the action if provided as the 2nd argument
			if(arguments[1])this.action=arguments[1];
		}else{
			for(let i=2;i<arguments.length;i+=2){
				const name=arguments[i],data=arguments[i+1];
				if(name.indexOf("draw")!==-1){
					this.draw=data;
				}
				if(name.indexOf("paste")!==-1){
					this.paste=data;
				}
				this.action=name;
				console.log(name);
			}
			this.time=arguments[1];
		}
	}
}

var 
	//collect changest to be saved as a single event
	accumulateChanges=new ListNode(null),
	//copy paste clipboard
	clipboard=Array(3).fill().map(() => ({pattern:[],shipInfo:{dx:null,dy:null,shipOffset:null,phases:[],period:0},previewBitmap:null})),
	//number of accumulated changes
	changeCount=0,
	//total depth of nodes being read from the hashtable
	depthTotal=0,
	//number of depths added to total, used to calculate average
	depthCount=0,
	//state currently being drawn
	drawnState=-1,
	//list of empty nodes with different states for B0.
	emptyNodes=[],
	//state of the grid
	GRID={
		//which kind of grid is being used
		type:0,//0=infinite,1=finite,2=toroidal
		//data for the cells on an infinte grid
		head:null,
		//data for the cells on a finite grid
		finiteArray:[],
		//area representing a finite portion of the grid
		finiteArea:{margin:0,top:0,right:0,bottom:0,left:0,newTop:0,newRight:0,newBottom:0,newLeft:0},
		//state of the background(used for B0 rules)
		backgroundState:0
	},
	//time elapsed
	genCount=0,
	//hashtable for storing node of the quadtree
	hashTable=new Array(999953),
	//use to calculate depth of nodes being read from the hashtable
	hashTableDepths=[],
	//max depth for traversing trees
	maxDepth=20000,
	//metric of the number of nodes in the hashtable
	numberOfNodes=0,
	pasteArea={isActive:false,top:0,left:0,pointerRelativeX:0,pointerRelativeY:0},
	//point where the simulator resets to
	resetEvent=null,
	//rule stored internally as an n-tree for a n state rule
	rule,
	//number of nodes in the rule, rule family(INT, Generations, History), color
	ruleMetadata={size:0,family:"INT",color:[]},
	//rulestring
	rulestring="B3/S23",
	//number of genertions updated
	stepSize=1,
	//current view of the user
	view={x:-30,y:-20,z:1};

let currentEvent=new EventNode(null,"start");
parseRulestring("B3/S23");
GRID.head=writeNode(getEmptyNode(16));

sendVisibleCells();

function mod(num1,num2){
	return (num1%num2+num2)%num2;
}

function distance(num1, num2){
	return Math.sqrt(num1*num1+num2*num2);
}

function new2dArray(width, height, fill=0){
	return new Array(width).fill(null).map(()=>Array(height).fill(fill));
}

function calculateKey(node){
	//sets key to the nodes value if it has one
	if(node.distance===1){
		node.key=node.value;
		node.population=node.value===1?1:0;
		//otherwise sets the key based of the children's keys
	}else{
		node.key=rule.length;
		node.population=0;
		const primes=[7,1217,7919,104729];
		for(let h=0;h<4;h++) if(node.child[h]!==null){
			if(node.child[h].key===null){
				calculateKey(node.child[h]);
			}
			node.key=(node.key^(node.child[h].key*primes[h]));
			node.population+=node.child[h].population;
		}
	}
}

function getEmptyNode(distance){
	if(emptyNodes[GRID.backgroundState]&&emptyNodes[GRID.backgroundState].distance===distance)return emptyNodes[GRID.backgroundState];
	let node=new TreeNode(distance);
	node.value=GRID.backgroundState;
	if(distance===1)return writeNode(node);
	node.child[0]=getEmptyNode(distance>>>1);
	node.child[1]=node.child[0];
	node.child[2]=node.child[1];
	node.child[3]=node.child[2];
	return writeNode(node);
}

function iteratePattern(array,top,right,bottom,left){
	const lookupTable1=[1,-1,-1,1,0,-1,1,0,0], lookupTable2=[-1,-1,1,1,-1,0,0,1,0];

	let result=new Array(right-left);
	for(let i = left; i < right; i++){
		result[i-left]=new Array(bottom-top);
		for(let j = top; j < bottom; j++){
			let node = rule;
			for(let k = 0;k<9;k++){
				node=node[array[mod(i+lookupTable1[k],array.length)][mod(j+lookupTable2[k],array[0].length)]];
			}
			result[i-left][j-top]=node;
		}
	}
	return result;
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

function gen(gridObj){
	//record that a generation was run
	//TODO: reimplement this

	genCount++;

	let newBackgroundState;

	//the newBackgroundState variable is necessary because doubleSize() uses emptyNode(gridObj.backgroundState)
	if(gridObj.backgroundState===0&&rule[0][0][0][0][0][0][0][0][0]===1){
		newBackgroundState=1;
	}else if(gridObj.backgroundState===1){
		newBackgroundState=rule[1][1][1][1][1][1][1][1][1];
	}else if(gridObj.backgroundState===rule.length-1){
		newBackgroundState=0;
	}else if(gridObj.backgroundState>1){
		newBackgroundState=gridObj.backgroundState+1;
	}else{
		newBackgroundState=gridObj.backgroundState;
	}

	let toBeExtended = false;
	if(gridObj.type===0){
		for(let i = 0;i < 4;i++){
			for(let j = 0;j < 4;j++){
				if(i!==3-j&&gridObj.head.child[i].result.child[j].value!==newBackgroundState){
					toBeExtended=true;
					break;
				}
			}
			if(toBeExtended===true)break;
		}

		//top
		let temporaryNode=new TreeNode(gridObj.head.distance>>>1);
		temporaryNode.child[0]=gridObj.head.child[0].child[1];
		temporaryNode.child[1]=gridObj.head.child[1].child[0];
		temporaryNode.child[2]=gridObj.head.child[0].child[3];
		temporaryNode.child[3]=gridObj.head.child[1].child[2];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[0].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[1].value!==newBackgroundState)toBeExtended=true;


		//right
		temporaryNode=new TreeNode(gridObj.head.distance>>>1);
		temporaryNode.child[0]=gridObj.head.child[1].child[2];
		temporaryNode.child[1]=gridObj.head.child[1].child[3];
		temporaryNode.child[2]=gridObj.head.child[3].child[0];
		temporaryNode.child[3]=gridObj.head.child[3].child[1];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[1].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[3].value!==newBackgroundState)toBeExtended=true;


		//bottom
		temporaryNode=new TreeNode(gridObj.head.distance>>>1);
		temporaryNode.child[0]=gridObj.head.child[2].child[1];
		temporaryNode.child[1]=gridObj.head.child[3].child[0];
		temporaryNode.child[2]=gridObj.head.child[2].child[3];
		temporaryNode.child[3]=gridObj.head.child[3].child[2];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[3].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[2].value!==newBackgroundState)toBeExtended=true;


		//left
		temporaryNode=new TreeNode(gridObj.head.distance>>>1);
		temporaryNode.child[0]=gridObj.head.child[0].child[2];
		temporaryNode.child[1]=gridObj.head.child[0].child[3];
		temporaryNode.child[2]=gridObj.head.child[2].child[0];
		temporaryNode.child[3]=gridObj.head.child[2].child[1];
		temporaryNode.value=getValue(temporaryNode);

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[2].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[0].value!==newBackgroundState)toBeExtended=true;

		if(toBeExtended===true)gridObj.head=doubleSize(gridObj.head);
		gridObj.backgroundState=newBackgroundState;

		let newGen=new TreeNode(gridObj.head.distance);

		if(!emptyNodes[gridObj.backgroundState]){
			emptyNodes[gridObj.backgroundState]=getEmptyNode(gridObj.head.distance>>2);
		}

		for(let i = 0;i < 4;i++){
			newGen.child[i]=new TreeNode(gridObj.head.distance>>>1);

			for(let j = 0;j < 4;j++){
				if(i === 3 - j){
					newGen.child[i].child[j]=gridObj.head.result.child[i];
				}else{
					newGen.child[i].child[j]=emptyNodes[gridObj.backgroundState];
				}
			}
			newGen.child[i].value=getValue(newGen.child[i]);
			newGen.child[i]=writeNode(newGen.child[i]);
		}

		newGen.value=getValue(newGen);
		gridObj.head=writeNode(newGen);
	}else if(gridObj.type>0){
		const margin=gridObj.type===1?1:0;
		const nextGeneration=
			iteratePattern(gridObj.finiteArray,margin,
				gridObj.finiteArray.length-margin,
				gridObj.finiteArray[0].length-margin,margin);
		
		gridPopulation=0;
		for (let i = 0; i < gridObj.finiteArray.length; i++) {
			for (let j = 0; j < gridObj.finiteArray[0].length; j++) {
				if(j>=gridObj.finiteArea.margin&&i<gridObj.finiteArray.length-gridObj.finiteArea.margin&&j<gridObj.finiteArray[0].length-gridObj.finiteArea.margin&&i>=gridObj.finiteArea.margin){
					gridObj.finiteArray[i][j]=nextGeneration[i-gridObj.finiteArea.margin][j-gridObj.finiteArea.margin];
				}else{
					gridObj.finiteArray[i][j]=newBackgroundState;
				}
				if(gridObj.finiteArray[i][j]!==newBackgroundState)gridPopulation++;
			}
		}
		gridObj.backgroundState=newBackgroundState;
	}
	//document.getElementById("numberOfNodes").innerHTML=numberOfNodes;
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
					pattern[i][j]=GRID.backgroundState;
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
					pattern[i][j]=arguments[4]?0:GRID.backgroundState;
				}
			}
		}
	}
	return pattern;
}

function writeCell(x,y,state){
	let node=GRID.head;
	let sumX=0, sumY=0;
	let progress= new ListNode(null);
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
			if(state===-1){
				//if the cursor begins to draw set the state
				if(drawnState=== -1){
					isPlaying=0;
					if(node.value===rule.length-1){
						//set cell state to live(highest state)
						drawnState=0;
					}else{
						//otherwise set cell state to zero
						drawnState=node.value+1;
					}
				}
			}else{
				//if the cursor begins to draw set the state
				if(drawnState=== -1){
					isPlaying=0;
					if(node.value===state){
						//set cell state to live(highest state)
						drawnState=0;
					}else{
						//otherwise set cell state to zero
						drawnState=state;
					}
				}
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
				sendVisibleCells();
			}
		}
	}else{
		if(x>=GRID.finiteArea.left&&x<GRID.finiteArea.right&&y>=GRID.finiteArea.top&&y<GRID.finiteArea.bottom){
			if(state===-1){
				//if the cursor begins to draw set the state
				if(drawnState=== -1){
					isPlaying=0;
					if(GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]===rule.length-1){
						//set cell state to live(highest state)
						drawnState=0;
					}else{
						//otherwise set cell state to zero
						drawnState=GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]+1;
					}
				}
			}else{
				//if the cursor begins to draw set the state
				if(drawnState=== -1){
					isPlaying=0;
					if(GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]===state){
						//set cell state to live(highest state)
						drawnState=0;
					}else{
						//otherwise set cell state to zero
						drawnState=state;
					}
				}
				isPlaying=0;
			}
			gridPopulation+=drawnState===1?1:-1;
			accumulateChanges.value={x:x,y:y,newState:drawnState,oldState:GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]};
			accumulateChanges=accumulateChanges.child=new ListNode(accumulateChanges);
			changeCount++;
			GRID.finiteArray[x-GRID.finiteArea.left+GRID.finiteArea.margin][y-GRID.finiteArea.top+GRID.finiteArea.margin]=drawnState;
		}
	}
}

function writePatternToGrid(xPos, yPos, pattern, node){
	const xSign=[-1,1,-1,1];
	const ySign=[-1,-1,1,1];
	if(node.distance===1){
		if(xPos<=0&&xPos+0.5>-pattern.length&&yPos<=0&&yPos+0.5>-pattern[0].length){
			let temporaryNode = new TreeNode(node.distance);
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
	let maxDepthReached=0;
	//search through the linked list stored at the hash value
	for(let h=0;;h++){
		if(h>maxDepth){
			console.log(`maxDepth of ${maxDepth} reached.`);
			break;
		}
		if(!hashedList){
			//uses a weighted average of the max depth read within the hashtable 
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

		maxDepthReached++;
		previousNode=hashedList;
		hashedList=hashedList.nextHashedNode;
	}

	depthTotal+=maxDepthReached;
	depthCount++;
	if(!hashTableDepths[maxDepthReached])hashTableDepths[maxDepthReached]=0;
	hashTableDepths[maxDepthReached]++;
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

		emptyNodes[GRID.backgroundState]=getEmptyNode(node.distance>>>1);
		for(let j = 0;j < 4;j++){
			if(j!==3-i){
				temporaryNode.child[i].child[j]=emptyNodes[GRID.backgroundState];
			}
		}
		temporaryNode.child[i].value=getValue(temporaryNode.child[i]);
		temporaryNode.child[i]=writeNode(temporaryNode.child[i]);
	}
	temporaryNode.value=getValue(temporaryNode);
	return writeNode(temporaryNode);
}

//TODO: move to worker

function widenTree(area,tree=GRID.head){
	let newTree=tree;
	for(let h=0;;h++){
		if(h>maxDepth){
			console.log(`maxDepth of ${maxDepth} reached.`);
			break;
		}
		if(-newTree.distance>4*area.top||newTree.distance<=4*area.right||
			newTree.distance<=4*area.bottom||-newTree.distance>4*area.left){
			newTree=doubleSize(newTree);
		}else{
			break;
		}
	}
	return newTree;
}

function fitView(top, right, bottom, left){
	if(top===undefined){
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
	}
	if(top||top===0){
		view.x=(right+left-canvasWidth/cellWidth)/2;
		view.y=(bottom+top-canvasHeight/cellWidth)/2;
		view.touchX=0;
		view.touchY=0;
		view.z=Math.min(canvasWidth/cellWidth/(right-left+2),canvasHeight/cellWidth/(bottom-top+2));
		view.touchZ=view.z;
		updateLines();
		if(socket&&resetEvent===null){
			socket.emit("pan", {id:clientId, xPosition:view.x, yPosition:view.y});
			socket.emit("zoom", {id:clientId, zoom:view.z});
		}
		if(isPlaying===0)render();
	}
}

//go to before the simulation started
function reset(pause=true){
	//remove mark branch of salvo inactive if the result has occurred before
	//TODO: rewrite
	// const searchElements=document.getElementById("searchOptions").children;
	// for(let i=0;i<searchElements.length;i++){
	// 	const resetCondition=Array.from(searchElements[i].getElementsByClassName("condition")).findIndex(x => x.children[0].innerHTML==="Reset");
	// 	if(resetCondition!==-1&&searchElements[i].info){
	// 		searchElements[i].info.progress.slice(-1)[0].result=GRID.head;
	// 		for(let j=0;j <searchElements[i].info.progress.length-2;j++){
	// 			if(GRID.head===searchElements[i].info.progress[j].result){
	// 				searchElements[i].info.progress.slice(-1)[0].repeatedResult=true;
	// 				break;
	// 			}
	// 		}
	// 		break;
	// 	}
	// }

	if(resetEvent!==null){
		setEvent(resetEvent);
		resetEvent=null;
		GRID.backgroundState=0;
	}
	wasReset=true;
	if(pause)isPlaying=0;
	// TODO: replace render() here
}

function importRLE(rleText){
	if(rleText.length===0){
		console.log("RLE box empty");
		return -1;
	}

	const parsedRLE = parseRLE(rleText);

	if(rulestring!==parsedRLE.rule)setRule(parsedRLE.rule);
	// document.getElementById("rule").value=parsedRLE.rule;

	if(rule.length===2){
		for (let i = 0; i < parsedRLE.pattern.length; i++) {
			for (let j = 0; j < parsedRLE.pattern[i].length; j++) {
				parsedRLE.pattern[i][j]=parsedRLE.pattern[i][j]%2===1?1:0;
			}
		}
	}

	if(parsedRLE.type===-1)return -1;
	let top=-Math.ceil((parsedRLE.xWrap|parsedRLE.width|parsedRLE.pattern.length)/2),
	    left=-Math.ceil((parsedRLE.yWrap|parsedRLE.height|parsedRLE.pattern[0].length)/2);

	if(rleText&&parsedRLE.pattern){
		console.log("one");
		if(GRID.head.value===0&GRID.type===0){
			console.log("two");
			let previousPattern=new Array(parsedRLE.pattern.length);
			for(let i=0;i<previousPattern.length;i++){
				previousPattern[i]=new Array(parsedRLE.pattern[0].length).fill(0);
			}

			//TODO: rewrite
			// if(socket)socket.emit("paste", Date.now(), {newPatt:[-Math.ceil(parsedRLE.pattern.length/2),-Math.ceil(parsedRLE.pattern[0].length/2),parsedRLE.pattern], oldPatt:[-Math.ceil(parsedRLE.pattern.length/2),-Math.ceil(parsedRLE.pattern[0].length/2),previousPattern]});
			if(/[PT]/.test(parsedRLE.type)){
				importPattern(parsedRLE.pattern,parsedRLE.type,left,top,parsedRLE.xWrap,parsedRLE.yWrap);
				// fitView();
			}else{
				console.log("three");
				importPattern(parsedRLE.pattern,parsedRLE.type,left,top);
				// fitView(top, left+parsedRLE.width, top+parsedRLE.height, left);
			}

		}else{
			console.log("four");
			activeClipboard=0;
			clipboard[activeClipboard].pattern=parsedRLE.pattern;
			editMode=1;
			pasteArea.isActive=true;
			pasteArea.left=-Math.ceil(parsedRLE.pattern.length/2);
			pasteArea.top=-Math.ceil(parsedRLE.pattern[0].length/2);
			//TODO: rewrite
			// setActionMenu();
		}
	}
	//TODO: replace render here

	currentEvent=new EventNode(currentEvent, "import RLE");
}

function parseRLE(input){
	const regex = /x = (?<width>\d+), y = (?<height>\d+)(?:, rule = (?<rule>[\w\/\-]+)(?::(?<type>[TP])(?<xWrap>\d+\*?(?:\+\d+)?),(?<yWrap>\d+\*?(?:\+\d+)?))?)?\r?\n(?<pattern>(?:.|\r?\n)+!)/;
	const rle = input.match(regex);
	if(!rle){
		console.log(input);
		alert("RLE not found");
		return {width:0,height:0,rule:"",type:"",xWrap:0,yWrap:0,pattern:[[]]};
	}

	let parsedRLE = rle.groups;
	parsedRLE.pattern=rleToPattern(parsedRLE.pattern,parseInt(parsedRLE.width),parseInt(parsedRLE.height));
	parsedRLE.width=parseInt(parsedRLE.width)||parsedRLE.pattern.length;
	parsedRLE.height=parseInt(parsedRLE.height)||parsedRLE.pattern[0].length;
	parsedRLE.xWrap=parseInt(parsedRLE.xWrap);
	parsedRLE.yWrap=parseInt(parsedRLE.yWrap);
	console.log(parsedRLE);

	return parsedRLE;
}

function rleToPattern(input,width,height){
	//check for any invalid chars in rle
	let unsupportedChars = input.match(/(?![0-9A-Z\.bo\$!])./g);
	if(unsupportedChars!==null){
		alert("Unsupported Character In Rule: "+unsupportedChars);
		return array;
	}

	//Array which will contain the pattern
	let array = new2dArray(width, height);
	//Coordinates of the cell currently being read from the rle
	let xCoord=0, yCoord=0;
	//Split the input into parts eg. ["2b", "o", "2$", ...]
	input=input.split(/(?<=[A-Z\.bo\$])/g);
	for (let i = 0; i < input.length; i++) {
		//Isolate the run length from the char, defaulting to 1
		let character = input[i].slice(-1),number=parseInt(input[i].match(/[0-9]+/)||1);
		if(/!/.test(input[i]))break;

		//Write to the array based on the character and current cell being written
		for (let j = 0; j < number; j++) {
			//expand the pattern if RLE extends past the dimensions in the header
			if(character!=="$"&&array.length==xCoord)array.push(Array(yCoord+1).fill(0));
			if(character!=="$"&&array[xCoord].length==yCoord)array.forEach(e => e.push(0));

			//write cell state or move to newline based on the character
			switch(character){
				case "o":
					array[xCoord][yCoord]=1; break;
				case "b": case ".":
					array[xCoord][yCoord]=0; break;
				case "$":
					yCoord++;
					xCoord=0;
					break;
				default:
					if(/[A-Z]/.test(character))array[xCoord][yCoord]=character.charCodeAt(0)-64; break;
			}
			if(/[A-Z\.bo]/.test(character)) xCoord++;
		}
	}

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
					pattern[i][j]=GRID.backgroundState;
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
function importPattern(pattern,type,left,top,width=pattern.length,height=pattern[0].length){
	console.log(top+" "+left);
	console.log(pattern);
	switch(type){
		case "P": case 1:
			GRID.type = 1;
			GRID.finiteArea.margin=1;
			console.log("set P");
			break;
		case "T": case 2:
			GRID.type = 2;
			GRID.finiteArea.margin=0;
			console.log("set T");
			break;
		default:
			if(/[KCS]/.test(type)){
				throw new Error("unsupported finite grid type");
				return;
			}else{
				GRID.type = 0;
				GRID.head=getEmptyNode(8);
				GRID.head=widenTree({top:top, right:left+width, bottom:top+height, left:left});
				console.log(top+" "+left);
				GRID.head=writePatternToGrid(left, top, pattern, GRID.head);
			}
	}
	if(GRID.type===1||GRID.type===2){
		GRID.finiteArea.top =top;
		GRID.finiteArea.right =left + width;
		GRID.finiteArea.bottom =top + height;
		GRID.finiteArea.left =left;

		GRID.finiteArray = new2dArray(width+GRID.finiteArea.margin*2, height+GRID.finiteArea.margin*2);
		console.log("write Pattern");
		writePattern(left, top, pattern, GRID);
	}
		console.log("done");
	GRID.finiteArea.newTop=GRID.finiteArea.top;
	GRID.finiteArea.newRight=GRID.finiteArea.right;
	GRID.finiteArea.newBottom=GRID.finiteArea.bottom;
	GRID.finiteArea.newLeft=GRID.finiteArea.left;
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
function setRule(ruleText){
	const alias={
		Life:"B3/S23",
		LifeHistory:"B3/S23History",
		HighLife:"B36/S23",
		HighLifeHistory:"B36/S23History"};
	rulestring=ruleText;
	if(alias[rulestring]){
		parseRulestring(alias[rulestring]);
	}else{
		parseRulestring(rulestring);
	}
	resetHashtable();
}

function generateTree(stateArray,depth,stateCount,ruleText){
	let node=new Array(stateCount);

	for(let i=0;i<stateCount;i++){
		ruleMetadata.size++;
		if(depth===8){
			node[i]=getTransition([...stateArray,i],stateCount,ruleText);
		//speeds up parsing generations rules, circumvents treating odd states as live
		}else if(ruleMetadata.family==="Generations"&&i>2){
			node[i]=node[0];
		}else if(ruleMetadata.family==="History"&&i>1&&ruleMetadata.forceDeath[i]===false&&i!==3){
			node[i]=node[i-2];
		}else{
			node[i]=generateTree([...stateArray,i],depth+1,stateCount,ruleText);
		}
	}
	return node;
}

function getTransition(stateArray,stateCount,ruleText){
	//the weights for decoding rule strings.
	//  2 16  1
	// 32     64
	//  4 128 8
	const intTransitions=[
		[0,"-"],[1,"c"],[1,"c"],[2,"c"],[1,"c"],[2,"n"],[2,"c"],[3,"c"],[1,"c"],[2,"c"],//  0
		[2,"n"],[3,"c"],[2,"c"],[3,"c"],[3,"c"],[4,"c"],[1,"e"],[2,"a"],[2,"a"],[3,"i"],// 10
		[2,"k"],[3,"q"],[3,"n"],[4,"n"],[2,"k"],[3,"n"],[3,"q"],[4,"n"],[3,"y"],[4,"y"],// 20
		[4,"y"],[5,"e"],[1,"e"],[2,"k"],[2,"a"],[3,"n"],[2,"a"],[3,"q"],[3,"i"],[4,"n"],// 30
		[2,"k"],[3,"y"],[3,"q"],[4,"y"],[3,"n"],[4,"y"],[4,"n"],[5,"e"],[2,"e"],[3,"j"],// 40
		[3,"a"],[4,"a"],[3,"j"],[4,"w"],[4,"a"],[5,"a"],[3,"k"],[4,"k"],[4,"q"],[5,"j"],// 50
		[4,"k"],[5,"k"],[5,"j"],[6,"e"],[1,"e"],[2,"a"],[2,"k"],[3,"n"],[2,"k"],[3,"q"],// 60
		[3,"y"],[4,"y"],[2,"a"],[3,"i"],[3,"q"],[4,"n"],[3,"n"],[4,"n"],[4,"y"],[5,"e"],// 70
		[2,"e"],[3,"a"],[3,"j"],[4,"a"],[3,"k"],[4,"q"],[4,"k"],[5,"j"],[3,"j"],[4,"a"],// 80
		[4,"w"],[5,"a"],[4,"k"],[5,"j"],[5,"k"],[6,"e"],[2,"i"],[3,"r"],[3,"r"],[4,"i"],// 90
		[3,"r"],[4,"z"],[4,"t"],[5,"r"],[3,"r"],[4,"t"],[4,"z"],[5,"r"],[4,"i"],[5,"r"],//100
		[5,"r"],[6,"i"],[3,"e"],[4,"r"],[4,"r"],[5,"i"],[4,"j"],[5,"q"],[5,"n"],[6,"a"],//110
		[4,"j"],[5,"n"],[5,"q"],[6,"a"],[5,"y"],[6,"k"],[6,"k"],[7,"e"],[1,"e"],[2,"k"],//120
		[2,"k"],[3,"y"],[2,"a"],[3,"q"],[3,"n"],[4,"y"],[2,"a"],[3,"n"],[3,"q"],[4,"y"],//130
		[3,"i"],[4,"n"],[4,"n"],[5,"e"],[2,"i"],[3,"r"],[3,"r"],[4,"t"],[3,"r"],[4,"z"],//140
		[4,"i"],[5,"r"],[3,"r"],[4,"i"],[4,"z"],[5,"r"],[4,"t"],[5,"r"],[5,"r"],[6,"i"],//150
		[2,"e"],[3,"k"],[3,"j"],[4,"k"],[3,"a"],[4,"q"],[4,"a"],[5,"j"],[3,"j"],[4,"k"],//160
		[4,"w"],[5,"k"],[4,"a"],[5,"j"],[5,"a"],[6,"e"],[3,"e"],[4,"j"],[4,"r"],[5,"n"],//170
		[4,"r"],[5,"q"],[5,"i"],[6,"a"],[4,"j"],[5,"y"],[5,"q"],[6,"k"],[5,"n"],[6,"k"],//180
		[6,"a"],[7,"e"],[2,"e"],[3,"j"],[3,"k"],[4,"k"],[3,"j"],[4,"w"],[4,"k"],[5,"k"],//190
		[3,"a"],[4,"a"],[4,"q"],[5,"j"],[4,"a"],[5,"a"],[5,"j"],[6,"e"],[3,"e"],[4,"r"],//200
		[4,"j"],[5,"n"],[4,"j"],[5,"q"],[5,"y"],[6,"k"],[4,"r"],[5,"i"],[5,"q"],[6,"a"],//210
		[5,"n"],[6,"a"],[6,"k"],[7,"e"],[3,"e"],[4,"j"],[4,"j"],[5,"y"],[4,"r"],[5,"q"],//220
		[5,"n"],[6,"k"],[4,"r"],[5,"n"],[5,"q"],[6,"k"],[5,"i"],[6,"a"],[6,"a"],[7,"e"],//230
		[4,"e"],[5,"c"],[5,"c"],[6,"c"],[5,"c"],[6,"n"],[6,"c"],[7,"c"],[5,"c"],[6,"c"],//240
		[6,"n"],[7,"c"],[6,"c"],[7,"c"],[7,"c"],[8,"-"]];                               //250

	const splitString=ruleText;
	let number=0,thisState=stateArray[8];
	if(ruleMetadata.family==="Generations"&&thisState>1)return (thisState+1)%stateCount;
	
	for(let i=0;i<stateArray.length-1;i++){
		if(stateArray[i]%2===1)number+=Math.pow(2,i);
		if(ruleMetadata.forceDeath[stateArray[i]]&&thisState%2===1)return ruleMetadata.deadState[thisState];
	}

	let indexOfNumber=splitString[thisState%2].indexOf(`${intTransitions[number][0]}`);
	if(indexOfNumber===-1)return ruleMetadata.deadState[thisState];

	let transitionPresent=true;
	if("aceijknqrtwyz".includes(splitString[thisState%2][indexOfNumber+1])){
		transitionPresent=false;
	}

	for(let i=indexOfNumber+1;i<splitString[thisState%2].length&&isNaN(splitString[thisState%2][i]);i++){
		if(splitString[thisState%2][i]===intTransitions[number][1]){
			transitionPresent^=true;
			break;
		}
	}

	if(transitionPresent){
		return ruleMetadata.aliveState[thisState];
	}else{
		return ruleMetadata.deadState[thisState];
	}
}

//parse Isotropic Non-Totalistic Generations rules
function parseRulestring(ruleText){

	if(!ruleText)ruleText="B3/S23";

	//convert rulestring to "B#/S#" or "B#/S#/G#" format
	ruleText=clean(ruleText);

	ruleMetadata.size=0;
	ruleMetadata.numberOfStates=2;
	if(ruleText.split("/").length===3)ruleMetadata.numberOfStates=parseInt(ruleText.split("/")[2].slice(1));

	if(/.+(History)$/g.test(ruleText)){
		ruleMetadata.family="History";
		ruleMetadata.color=["#303030","#00FF00","#0000A0","#FFD8FF","#FF0000","#FFFF00","#606060"];
		ruleMetadata.aliveState=[1,1,1,3,3,5,6];
		ruleMetadata.deadState=[0,2,2,4,4,4,6];
		ruleMetadata.forceDeath=[false,false,false,false,false,false,true];
		ruleMetadata.forceLife=[false,false,false,false,false,false,false];
		ruleMetadata.numberOfStates=7;
	}else if(/.+(Super)$/g.test(ruleText)){
		ruleMetadata.family="Super";
		ruleMetadata.color=["#303030","#00FF00","#0000A0","#FFD8FF","#FF0000","#FFFF00","#606060"];
		ruleMetadata.aliveState=[1,1,1,3,3,5,6];
		ruleMetadata.deadState=[0,2,2,4,4,4,6];
		ruleMetadata.forceDeath=[false,false,false,false,false,false,true];
		ruleMetadata.forceLife=[false,false,false,false,false,false,false];
		ruleMetadata.numberOfStates=20;
	}else if(ruleMetadata.numberOfStates>2){
		ruleMetadata.family="Generations";
		ruleMetadata.color=[];
		ruleMetadata.aliveState=[1,1];
		ruleMetadata.deadState=[0,2];
		ruleMetadata.forceDeath=[false,false];
		ruleMetadata.forceLife=[false,false];
	}else{
		ruleMetadata.family="INT";
		ruleMetadata.color=[];
		ruleMetadata.aliveState=[1,1];
		ruleMetadata.deadState=[0,0];
		ruleMetadata.forceDeath=[false,false];
		ruleMetadata.forceLife=[false,false];
	}

	//if(ruleMetadata.color[0])canvas.style.backgroundColor=ruleMetadata.color[0];
	console.log(ruleMetadata.numberOfStates);
	rule=generateTree([],0,ruleMetadata.numberOfStates,ruleText.replace(/(Super)|(History)$/g,"").split("/").map(substring => substring.split("")));
	//worker.postMessage({type:"generateTree",args:[[],0,ruleMetadata.numberOfStates,ruleText.replace(/(Super)|(History)$/g,"").split("/").map(substring => substring.split(""))]});
	
	//setDrawMenu();
	postMessage({type:"setDrawMenu"});
}

function clean(dirtyString){
	console.log(dirtyString);
	let testString = dirtyString;
	testString.replace(/History$/,"");
	if(["Life","HighLife"].includes(testString)){
		return dirtyString;
	}
	let unsupportedChars = testString.match(/(?![BSGbsg\/\-0-8aceijknqrtwyz])./)|[];
	if(unsupportedChars.length==1){
		alert("Unsupported Character In Rule: "+unsupportedChars);
		return dirtyString;
	}else if(unsupportedChars.length>=2){
		alert("Unsupported Characters In Rule: "+unsupportedChars);
		return dirtyString;
	}
	const table=[["-"],
	             ["-","c","e"],
	             ["-","a","c","e","i","k","n"],
	             ["-","a","c","e","i","j","k","n","q","r","y"],
	             ["-","a","c","e","i","j","k","n","q","r","t","w","y","z"],
	             ["-","a","c","e","i","j","k","n","q","r","y"],
	             ["-","a","c","e","i","k","n"],
	             ["-","c","e"],
	             ["-"]];
	//transcribe the rulestring into B#/S# or B#/S#/G# format
	const suffix=dirtyString.match(/(History)$/g);
	let ruleSections=dirtyString
		.replace(/(History)$/g,"")//B/S/GHistory -> B/S/G
		.replace(/[bsg]/g,match => match.toUpperCase())//b/s/g -> B/S/G
		.split(/\/|(?=[BSG])/);//#/#/# -> [#,#,#], B/S/G -> [B,S,G], or GBS -> [G,B,S]

	if(ruleSections.length===1){
		ruleSections[1]=ruleSections[0][0]==="B"?"S":"B";//[B] -> [B,S], or [S] -> [S,B]
	}
	//check if either rule section starts with a number
	if(/[0123456789]/g.test(ruleSections[0][0]+ruleSections[1][0])){
		//Prepend a "B", "S", or "G" to each section
		ruleSections=ruleSections.map((element,index) => "SBG"[index]+element);//[#,#,#] -> [B#,S#,G#]
	}else if(ruleSections[2]&&ruleSections[2][0]!=="G")
		//Prepend a G to section 2 if it is missing
		ruleSections[2]="G"+ruleSections[2];//[B,S,#] -> [B,S,G#]
	console.log(ruleSections);
	ruleSections=ruleSections.sort((a,b) => ["B","S","G"].indexOf(a[0])-["B","S","G"].indexOf(b[0]));//[G,B,S] -> [B,S,G]

	//sort, shorten, and filter the transitions into INT format
	for(let i=0;i<ruleSections.length||i<2;i++){
		ruleSections[i]=ruleSections[i].split(/(?=[0-8])|(?<=\/)/g).map(element => {
			if(/[BSG]/g.test(element)||/4[aceijknqrtwyz]{7}(?=[0-8]|\/|$)/g.test(element))
				return element.split("").sort().join("");
			const n=parseInt(element[0]);
			const transitions=[...new Set(element.slice(1).split(""))];
			return n+table[n].filter(letter => (transitions.indexOf(letter)===-1)===(transitions.length>=table[n].length/2)).join("");//n+stack.join("");
		});
		ruleSections[i]=ruleSections[i].join("").replace(/-(?=[0-8]|\/|$)/g,"");
	}
	return ruleSections.join("/")+(suffix??"");
}

var runningSimulation = false;
onmessage = (e) => {
	switch(e.data.type){
		case "generateTree":
			generateTree(...e.data.args);
			break;
		case "writeCell":
			writeCell(...e.data.args);
			postMessage({type:"startWrite",args:[getCell(GRID.head, e.data.args[0], e.data.args[1])]});
			break;
		case "next":
			loop();
			sendVisibleCells();
			break;
		case "move":
			view.x=e.data.args[0];
			view.y=e.data.args[1];
			view.z=e.data.args[2];
			sendVisibleCells();
			break;
		case "stepSize":
			stepSize = e.data.args[0];
			break;
		case "start":
			runningSimulation = true;
			loop();
			break;
		case "stop":
			runningSimulation = false;
			break;
		case "import":
			importRLE(e.data.args);
			sendVisibleCells();
			break;
	}
}

function loop(){

	for(let i=0;i<stepSize;i++){
		gen(GRID);
	}
	sendVisibleCells();

	if(runningSimulation)requestAnimationFrame(loop);
}

function sendVisibleCells(){
	let pattern = readPattern(Math.ceil(view.y+20-20/view.z), Math.ceil(view.x+30+30/view.z), Math.floor(view.y+20+20/view.z), Math.ceil(view.x+30-30/view.z));
	console.log(genCount);
	postMessage({type:"render",args:[pattern,GRID.head.population, genCount]});
}
