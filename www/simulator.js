importScripts("./pkg/caplayer_utils.js");

class EventNode {
	constructor(parent){
		this.parent=parent;
		if(parent!==null)parent.child=this;
		this.child=null;
		this.action="unknown";
		if(arguments.length<=2){
			this.rule=ruleMetadata.string;
			if(GRID.type===0){
				this.head=GRID.head;
			}else{
				this.finiteArea=new Area(...GRID.finiteArea.bounds, GRID.finiteArea.margin, patternToRLE(GRID.finiteArea.pattern, "gbs"));
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
			}
			this.time=arguments[1];
		}
	}
}

class SearchCondition{
	constructor(name, condition){
		this.name=name;
		this.condition=condition;
	}
}

var 
	//copy paste clipboard
	clipboard,
	//total depth of nodes being read from the hashtable
	depthTotal=0,
	//number of depths added to total, used to calculate average
	depthCount=0,
	//state currently being drawn
	drawnState=-1,
	//list of empty nodes with different states for B0.
	emptyNodes=[],
	//state of the grid
	GRID,
	//time elapsed
	genCount=0,
	//finite population
	gridPopulation=0,
	//hashtable for storing node of the quadtree
	hashTable=new Array(999953),
	//use to calculate depth of nodes being read from the hashtable
	hashTableDepths=[],
	//max depth for traversing trees
	maxDepth=20000,
	//metric of the number of nodes in the hashtable
	numberOfNodes=0,
	//point where the simulator resets to
	resetEvent=null,
	//rule stored internally as an n-tree for a n state rule
	rule,
	//number of nodes in the rule, rule family(INT, Generations, History), color of each state, rulestring
	ruleMetadata={size:0, numberOfStates: 2, family:"INT", color:[], string:"B3/S23"},
  //the current search
  searchOptions=[],
  //speed of the simulation 1-100
  simulationSpeed = 100,
	//number of genertions updated
	stepSize=1,
	//current view of the user
	view={x:-30,y:-20,z:1},
	//flag for whether the simulation was reset during the main loop
	wasReset = false;

const {base_n_to_pattern, pattern_to_base_n} = wasm_bindgen;
let Pattern, Area, TreeNode, ClipboardSlot, currentEvent;
function initializeWorker(module){
	Promise.all([
		import("./Pattern.js"),
		import("./Area.js"),
		import("./TreeNode.js"),
		wasm_bindgen.initSync({module})
	]).then(imports => {
		[{default: Pattern}, {default: Area}, {default: TreeNode}, _] = imports; 

		clipboard=Array(3).fill().map(() => new Area());
		GRID = {
			//which kind of grid is being used
			type:0,//0=infinite,1=finite,2=toroidal
			//data for the cells on an infinte grid
			head:null,
			//area representing a finite portion of the grid
			finiteArea:new Pattern(),
			//state of the background(used for B0 rules)
			backgroundState:0
		};

		parseRulestring("B3/S23");
		GRID.head=writeNode(getEmptyNode(8));
		currentEvent=new EventNode(null,"start");
		postMessage({type: "simulatorLoaded"});
	});
}

function mod(num1,num2){
	return (num1%num2+num2)%num2;
}

function distance(num1, num2){
	return Math.sqrt(num1*num1+num2*num2);
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

function computeGeneration(array,top,right,bottom,left){
	const lookupTable1=[1,-1,-1,1,0,-1,1,0,0], lookupTable2=[-1,-1,1,1,-1,0,0,1,0];

	let result=new Pattern(right-left, bottom-top);
	result.iterate((_, x, y) => {
		let node = rule;
		for(let k = 0;k<9;k++){
			node=node[array.getCell(mod(left+x+lookupTable1[k],array.width), mod(top+y+lookupTable2[k],array.height))];
		}
		return node;
	});
	return result;
}

function gen(gridObj){
	//record that a generation was run
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

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[0].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[1].value!==newBackgroundState)toBeExtended=true;


		//right
		temporaryNode=new TreeNode(gridObj.head.distance>>>1);
		temporaryNode.child[0]=gridObj.head.child[1].child[2];
		temporaryNode.child[1]=gridObj.head.child[1].child[3];
		temporaryNode.child[2]=gridObj.head.child[3].child[0];
		temporaryNode.child[3]=gridObj.head.child[3].child[1];

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[1].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[3].value!==newBackgroundState)toBeExtended=true;


		//bottom
		temporaryNode=new TreeNode(gridObj.head.distance>>>1);
		temporaryNode.child[0]=gridObj.head.child[2].child[1];
		temporaryNode.child[1]=gridObj.head.child[3].child[0];
		temporaryNode.child[2]=gridObj.head.child[2].child[3];
		temporaryNode.child[3]=gridObj.head.child[3].child[2];

		temporaryNode=writeNode(temporaryNode);

		if(temporaryNode.result.child[3].value!==newBackgroundState)toBeExtended=true;
		if(temporaryNode.result.child[2].value!==newBackgroundState)toBeExtended=true;


		//left
		temporaryNode=new TreeNode(gridObj.head.distance>>>1);
		temporaryNode.child[0]=gridObj.head.child[0].child[2];
		temporaryNode.child[1]=gridObj.head.child[0].child[3];
		temporaryNode.child[2]=gridObj.head.child[2].child[0];
		temporaryNode.child[3]=gridObj.head.child[2].child[1];

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
			newGen.child[i]=writeNode(newGen.child[i]);
		}

		gridObj.head=writeNode(newGen);
	}else if(gridObj.type>0){
		const pattern = gridObj.finiteArea.pattern, margin=gridObj.finiteArea.margin, area=new Area(margin, pattern.width-margin, pattern.height-margin, margin);
		const newPattern= computeGeneration(pattern, ...area.bounds);
		
		gridPopulation=0;
		pattern.iterate((_, x, y) => {
			let newState = newBackgroundState;
			if(area.isWithinBounds({x,y}))newState = newPattern.getCell(x - margin, y - margin);
			if(newState!==newBackgroundState)gridPopulation++;
			return newState;
		});
		gridObj.backgroundState=newBackgroundState;
	}
	//document.getElementById("numberOfNodes").innerHTML=numberOfNodes;
}

function readSubpattern(pattern,top,right,bottom,left){
	let subpattern=new Pattern(right - left, bottom - top);
	subpattern.iterate((_, x, y) =>  pattern.getCell(x+left, y+top));
	return subpattern;
}

function readPatternFromTree(area, tree){
  if(area.right-area.left<0)throw new Error("trying to read negative width");
  if(area.bottom-area.top<0)throw new Error("trying to read negative height");
	if(isNaN(area.right-area.left))console.trace(area, area.right, area.left, area.bottom, area.top);
  let pattern = new Pattern(area.right-area.left, area.bottom-area.top, tree.backgroundState);
	if(tree.head.value===tree.backgroundState)return pattern;
	let stack = new Array(tree.head.distance.toString(2).length);
	stack[0]={node:tree.head, direction:0, dist: tree.head.distance*0.25, x:-area.left-0.5,y:-area.top-0.5};
	let depth=0;
	for(let i = 0; ; i++){
		if(i === Number.MAX_SAFE_INTEGER){
			console.log(`number of nodes exceeds ${Number.MAX_SAFE_INTEGER}.`);
		}
		// console.log(stack[depth].direction, depth, stack[depth].x, stack[depth].y, stack[depth].node.value);
		if(stack[depth].node.distance===1){
			pattern.setCell(stack[depth].x, stack[depth].y,stack[depth].node.value);
			stack[--depth].direction++;
		}else if(stack[depth].node.value===tree.backgroundState){
			stack[--depth].direction++;
		}else if(stack[depth].direction<4){
			if((stack[depth].y>0||stack[depth].direction>1)
			 &&(stack[depth].x<pattern.width-1||stack[depth].direction%2===0)
			 &&(stack[depth].y<pattern.height-1||stack[depth].direction<=1)
			 &&(stack[depth].x>0||stack[depth].direction%2===1)){
				stack[depth+1]={
					node:stack[depth].node.child[stack[depth].direction], direction:0, dist: stack[depth].dist*0.5,
					x:stack[depth].x-stack[depth].dist*(1-2*(stack[depth].direction%2)),
					y:stack[depth].y-stack[depth].dist*(1-2*(stack[depth].direction>1))};
				depth++;
			}else{
				stack[depth].direction++;
			}
		}else{
			if(depth===0){
				// console.log("done in ", i, " iterations.");
				break;
			}
			stack[--depth].direction++;
		}
	}
	//end
	return pattern;
}

function readPattern(area, gridObj = GRID){
	if(gridObj.type===0){
		return readPatternFromTree(area, gridObj);
	}else{
		const pattern=new Pattern(area.right-area.left, area.bottom-area.top, gridObj.backgroundState),
		      top=gridObj.finiteArea.top-area.top-gridObj.finiteArea.margin,
		      left=gridObj.finiteArea.left-area.left-gridObj.finiteArea.margin;
		pattern.iterate((_, x,y) => {
			if(gridObj.finiteArea.isWithinBounds({x:x + area.left,y:y + area.top})){
				return gridObj.finiteArea.pattern.getCell(x-left, y-top);
			}else{
				return gridObj.backgroundState;
			}
		});
		return pattern;
	}
}

function sendEntireGrid(){
	const gridObj = resetEvent===null?GRID:resetEvent;
	const bounds = calculateBounds(gridObj);
	return {type:gridObj.type, finiteArea:bounds, data:readPattern(new Area(...bounds), gridObj)};
}

function expandGridToCell(x,y){
	for(let h=0;;h++){
		if(h>maxDepth){
			console.log(`maxDepth of ${maxDepth} reached.`);
			break;
		}
		if(GRID.head.distance<=Math.abs(4*x)||GRID.head.distance<=Math.abs(4*y)||GRID.head.distance<8){//extends early in some directions
			GRID.head=doubleSize(GRID.head);
		}else{
			break;
		}
	}
}

function drawListOfCells(editList){
	//TODO: fix bug where edits before rule is loaded are not saved before the reset point
	for (cell of editList) cell.oldState = writeCell(cell.x, cell.y, cell.newState);
	//TODO: maybe change this back into a draw event if you can figure out why it's broken
	currentEvent=new EventNode(currentEvent, Date.now()/*, "draw", cellList*/);
	sendVisibleCells();
	return editList;
}

function writeCell(x,y,state){
	let sumX=0, sumY=0;
	let progress=[], visitedNodes=[];
	//if the grid is infinite
	if(GRID.type===0){
		expandGridToCell(x, y);
		let node=GRID.head;
		for(let h=0;; h++){
			if(h>maxDepth){
				console.log(`maxDepth of ${maxDepth} reached.`);
				break;
			}
			if(y*2<sumY){
				if(x*2<sumX){
          progress.push(0)
					visitedNodes.push(node);
					node=node.child[0];
					sumX-=node.distance;
					sumY-=node.distance;
					if(node.distance===1){
						break;
					}
				}else{
          progress.push(1)
					visitedNodes.push(node);
					node=node.child[1];
					sumX+=node.distance;
					sumY-=node.distance;
					if(node.distance===1){
						break;
					}
				}
			}else{
				if(x*2<sumX){
          progress.push(2)
					visitedNodes.push(node);
					node=node.child[2];
					sumX-=node.distance;
					sumY+=node.distance;
					if(node.distance===1){
						break;
					}
				}else{
          progress.push(3)
					visitedNodes.push(node);
					node=node.child[3];
					sumX+=node.distance;
					sumY+=node.distance;
					if(node.distance===1){
						break;
					}
				}
			}
		}
		if(node!==null){
			if(node.value!==state){
				//make a copy of the node with the new state
				let newNode=new TreeNode(1);
				newNode.value=state;

				//go through the edited node and all the parents
				for(let h=progress.length-1;h>=0;h--){
					if(h>maxDepth){
						console.log(`maxDepth of ${maxDepth} reached.`);
						break;
					}
					newNode=writeNode(newNode);
          
					//make a copy of the parent node
					let parentNode=new TreeNode(visitedNodes[h].distance);
					for(let i=0;i<4;i++){
						if(i===progress[h]){
							parentNode.child[i]=newNode;
						}else{
							parentNode.child[i]=visitedNodes[h].child[i];
						}
					}
					newNode=writeNode(parentNode);
				}
        GRID.head=newNode;
			}
		}
		return node.value;
	}else{
		if(x>=GRID.finiteArea.left&&x<GRID.finiteArea.right&&y>=GRID.finiteArea.top&&y<GRID.finiteArea.bottom){
			gridPopulation+=state===0?-1:1;
			GRID.finiteArea.pattern.setCell(x-GRID.finiteArea.left+GRID.finiteArea.margin, y-GRID.finiteArea.top+GRID.finiteArea.margin, state);
		}
	}
}

//position of the pattern is relative to the center of the node
function writePatternToGrid(patternX, patternY, pattern, node){
	//return an unchanged node if it doesn't intersect the pattern
	if(patternX>=node.distance/2) return node;
	if(patternY>=node.distance/2) return node;
	if(patternX+pattern.width<=-node.distance/2) return node;
	if(patternY+pattern.height<=-node.distance/2) return node;
	const changedNode=new TreeNode(node.distance);

	if(node.distance===1){
		//1x1 nodes are located at halfway between grid corrdinates, so they need to be offset by 1/2
		changedNode.value=pattern.getCell(-patternX-0.5, -patternY-0.5);
	}else{
		//direction of the child node relative to its parent based on its index
		const xSign=[-1,1,-1,1];
		const ySign=[-1,-1,1,1];
		for(let i=0; i<4; i++){
			const patternXRelativeToChild = patternX-node.distance/4*xSign[i];
			const patternYRelativeToChild = patternY-node.distance/4*ySign[i];
			changedNode.child[i]=writePatternToGrid(patternXRelativeToChild, patternYRelativeToChild, pattern, node.child[i]);
		}
	}

	return writeNode(changedNode);
}

function getResult(node){
	let result = new TreeNode(node.distance>>>1);

	if(node.distance<4){
		console.log("Error: Cannot find result of node smaller than 4");
	}else if(node.distance===4){
		//the result of nodes 4 cells wide are calculated conventionally
		result=writePatternToGrid(-1,-1,computeGeneration(readPatternFromTree(new Area(-2,2,2,-2), {head:node}),1,3,3,1),getEmptyNode(2));
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

		temporaryNode=writeNode(temporaryNode);

		result.child[0].child[1]=temporaryNode.result.child[2];
		result.child[1].child[0]=temporaryNode.result.child[3];


		//right
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[1].child[2];
		temporaryNode.child[1]=node.child[1].child[3];
		temporaryNode.child[2]=node.child[3].child[0];
		temporaryNode.child[3]=node.child[3].child[1];

		temporaryNode=writeNode(temporaryNode);

		result.child[1].child[3]=temporaryNode.result.child[0];
		result.child[3].child[1]=temporaryNode.result.child[2];


		//bottom
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[2].child[1];
		temporaryNode.child[1]=node.child[3].child[0];
		temporaryNode.child[2]=node.child[2].child[3];
		temporaryNode.child[3]=node.child[3].child[2];

		temporaryNode=writeNode(temporaryNode);

		result.child[3].child[2]=temporaryNode.result.child[1];
		result.child[2].child[3]=temporaryNode.result.child[0];


		//left
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[0].child[2];
		temporaryNode.child[1]=node.child[0].child[3];
		temporaryNode.child[2]=node.child[2].child[0];
		temporaryNode.child[3]=node.child[2].child[1];

		temporaryNode=writeNode(temporaryNode);

		result.child[2].child[0]=temporaryNode.result.child[3];
		result.child[0].child[2]=temporaryNode.result.child[1];


		//center
		temporaryNode=new TreeNode(node.distance>>>1);
		temporaryNode.child[0]=node.child[0].child[3];
		temporaryNode.child[1]=node.child[1].child[2];
		temporaryNode.child[2]=node.child[2].child[1];
		temporaryNode.child[3]=node.child[3].child[0];

		temporaryNode=writeNode(temporaryNode);
		result.child[0].child[3]=temporaryNode.result.child[0];
		result.child[1].child[2]=temporaryNode.result.child[1];
		result.child[2].child[1]=temporaryNode.result.child[2];
		result.child[3].child[0]=temporaryNode.result.child[3];

		//store each child of the result node in the hashtable
		for(let i = 0;i < 4;i++){
			result.child[i]=writeNode(result.child[i]);
		}
	}
	//store the result node in the hashtable
	return writeNode(result);
}

function writeNode(node){
	node.value=node.getValue();
	node.calculateKey();
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
		}else if(hashedList.isEqual(node)){
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
		temporaryNode.child[i]=writeNode(temporaryNode.child[i]);
	}
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

//go to before the simulation started
function reset(triggerSearchAction=false){
	//remove mark branch of salvo inactive if the result has occurred before
	if(resetEvent!==null){
		setEvent(resetEvent);
		resetEvent=null;
		GRID.backgroundState=0;
	}
	wasReset=true;
	if(triggerSearchAction){
		runSearch();
	}

	sendVisibleCells();
	return {finiteArea:GRID.finiteArea, type:GRID.type};
}

function writePatternFromClipboard(x, y, clipboardIndex){
	writePatternAndSave(x,y,clipboard[clipboardIndex].pattern);
}

function writePatternToStartEvent(x, y, pattern){
	if(resetEvent===null){
			writePattern(x, y, new Pattern(pattern), GRID);
	}else{
			writePattern(x, y, new Pattern(pattern), resetEvent);
	}
	sendVisibleCells();
}

//TODO: combine writePatterns
function writePatternAndSave(xPosition,yPosition,pattern){
	if(!pattern||pattern.length===0)return;
	pattern = new Pattern(pattern);
	const previousPattern=readPattern(new Area(yPosition,xPosition+pattern.width,yPosition+pattern.height,xPosition),GRID);
	
	//if a grid other than the "main" grid is passed as a 4th argument
	writePattern(xPosition, yPosition, pattern, GRID);
	sendVisibleCells();
	currentEvent = new EventNode(currentEvent, Date.now(), "paste", {newPatt:[xPosition,yPosition,pattern], oldPatt:[xPosition,yPosition,previousPattern]});
}

function writePattern(xPosition,yPosition,pattern,objectWithGrid){
	console.log(...arguments);
	//if the grid is infinite
	if(objectWithGrid.type!==0){
		//write to the finite grid
		pattern.iterate((value, x, y) => {
			if(objectWithGrid.finiteArea.isWithinBounds({x:x+xPosition, y:y+yPosition}))
				objectWithGrid.finiteArea.pattern.setCell(x+xPosition - objectWithGrid.finiteArea.left+objectWithGrid.finiteArea.margin, y+yPosition - objectWithGrid.finiteArea.top + objectWithGrid.finiteArea.margin, value);
		});
	}else{
		//write to the infinte grid
		objectWithGrid.head=widenTree({top:yPosition,right:xPosition+pattern.width,bottom:yPosition+pattern.height,left:xPosition},objectWithGrid.head);
		objectWithGrid.head=writePatternToGrid(xPosition,yPosition, pattern, objectWithGrid.head);
	}
}

function setView(viewX, viewY, viewZ){
	view.x = viewX;
	view.y = viewY;
	view.z = viewZ;
	if(!runningSimulation)sendVisibleCells();
}

function resizeFiniteArea(area){
	//TODO: incorperate undo/redo functionality
	const margin=GRID.finiteArea.margin;
	const newArea = new Area(area.top-margin, area.right+margin, area.bottom+margin, area.left-margin);
	const pattern = readPattern(area);
	importPattern(pattern, GRID.type, area.top, area.left, area.right-area.left , area.bottom-area.top);
	return {type:GRID.type, finiteArea:new Area(area).bounds, data:pattern};
}

function setEvent(gridEvent){
	if(!("type" in gridEvent)){
		setEvent(gridEvent.parent);
    try {
      if("draw" in gridEvent){
        for(let i=0;i<gridEvent.draw.length;i++){
          writePattern(gridEvent.draw[i].x,gridEvent.draw[i].y,[[gridEvent.draw[i].newState]], GRID);
        }
        //TODO: rewrite
        // if(socket&&resetEvent===null)socket.emit("draw",Date.now(),gridEvent.draw);
      }else if("paste" in gridEvent){
        writePattern(...gridEvent.paste.newPatt, GRID);
        //TODO: rewrite
        // if(socket&&resetEvent===null)socket.emit("paste",Date.now(),gridEvent.paste);
      }
    } catch (error) {
      console.log("Warning: Invalid Event Data within: ", gridEvent);
      throw error;
    }
	}else{
		if("generation" in gridEvent){
			genCount=gridEvent.generation;
			//TODO: check if necessary
			// document.getElementById("gens").innerHTML="Generation "+genCount;
		}
		if("backgroundState" in gridEvent)GRID.backgroundState=gridEvent.backgroundState;

		if("resetEvent" in gridEvent)resetEvent=gridEvent.resetEvent;

		//redundant, remove at some point if "type" is still used for events storing the entire grid
		if("type" in gridEvent){
			GRID.type=gridEvent.type;
			// setMenu("gridMenu",GRID.type);
			
			emptyNodes=emptyNodes.map(()=>null);
			if(GRID.type===0){
				GRID.head=gridEvent.head;
				//TODO: check if necessary
				// document.getElementById("population").innerHTML="Population "+GRID.head.population;
			}else{
				GRID.finiteArea = gridEvent.finiteArea;
				if(typeof(gridEvent.finiteArea.pattern)==="string"){
					GRID.finiteArea.pattern=parseRLE(gridEvent.finiteArea.pattern).pattern;
				}else{
					GRID.finiteArea.pattern=gridEvent.finiteArea.pattern;
				}
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
      //TODO: rewrite
    	// if(socket&&resetEvent===null)socket.emit("undoDraw",Date.now(),currentEvent.draw);
    	currentEvent=currentEvent.parent;
    }else if("paste" in currentEvent){
    	writePattern(...currentEvent.paste.oldPatt, GRID);

      //TODO: rewrite
    	// if(socket&&resetEvent===null)socket.emit("undoPaste",Date.now(),currentEvent.paste);
    	currentEvent=currentEvent.parent;
    }else{
			setEvent(currentEvent.parent);
		}
		//compare parents because the reset event may be a different event with identical values
		if(resetEvent!==null&&resetEvent.parent===currentEvent.parent)resetEvent=null;
	}
	isPlaying=0;
	sendVisibleCells();
	return {finiteArea:GRID.finiteArea, type:GRID.type};
}

function redo(){
	if(currentEvent.child!==null){
		if("draw" in currentEvent.child){
			currentEvent=currentEvent.child;
			for(let i=0;i<currentEvent.draw.length;i++){
				writePattern(currentEvent.draw[i].x,currentEvent.draw[i].y,[[currentEvent.draw[i].newState]], GRID);
			}
      //TODO: rewrite
			// if(socket&&resetEvent===null)socket.emit("draw",Date.now(),currentEvent.draw);
		}else if("paste" in currentEvent.child){
			currentEvent=currentEvent.child;
			writePattern(...currentEvent.paste.newPatt, GRID);

			//TODO: fix
			// if(socket&&resetEvent===null)socket.emit("paste",Date.now(),currentEvent.paste);
		}else{
			setEvent(currentEvent.child);
		}
	}
	isPlaying=0;
	sendVisibleCells();
	return {finiteArea:GRID.finiteArea, type:GRID.type};
}

function randomize(area, drawMode, _, randomFillPercent){
	let randomArray=new Pattern(area.right-area.left, area.bottom-area.top);
	randomArray.iterate(() => Math.random()<randomFillPercent?drawMode:0);

	writePatternAndSave(area.left,area.top, randomArray);
	return {modifiedArea:randomArray};
}

function copy(area, _, clipboardSlot){
	let pattern=readPattern(new Area(area));
	clipboard[clipboardSlot]=new Area(area);
	clipboard[clipboardSlot].pattern = pattern;
	console.log(clipboard);
	return {pattern};
}

function cut(area, drawMode, clipboardSlot) {
	return {
		pattern:copy(area, drawMode, clipboardSlot).pattern,
		modifiedArea: clear(area, drawMode, clipboardSlot).modifiedArea
	};
}

function clear(area) {
	let clearedArray = new Pattern(area.right-area.left, area.bottom-area.top);
	writePatternAndSave(area.left,area.top,clearedArray);
	return {modifiedArea:clearedArray};
}

function invert(area, drawMode) {
	let invertedArea=readPattern(new Area(area.top,area.right,area.bottom,area.left));
	invertedArea.iterate((value) => value===0?drawMode:0);

	writePatternAndSave(area.left,area.top, invertedArea);
	return {modifiedArea: invertedArea}
}

function increment(area) {
	const pattern = readPattern(new Area(area.top-1,area.right+1,area.bottom+1,area.left-1), GRID);
	const incrementedArea = computeGeneration(pattern,1,pattern.width-1,pattern.height-1,1);
	writePatternAndSave(area.left,area.top, incrementedArea);
	return {modifiedArea: incrementedArea};
}

function identify(area){
	const startTime=Date.now();
  area = area??new Area(...calculateBounds(GRID));
	let patternInfo=findShip(readPattern(area),area);
	if(patternInfo.period===0){
		postMessage({type: "alert", value:"couldn't recognize periodic pattern"});
		return null;
	}
  patternInfo.timeElapsed=Date.now()-startTime;
	patternInfo.area = area;
  return patternInfo;
}

function findPattern(area,pattern){
	let distinctCells = new Array(ruleMetadata.numberOfStates).fill(null).map(() => {return {x:-1,y:-1}});
	// get the position of sample cells for each state within the pattern
	pattern.iterate((value, x, y) => {
		if(distinctCells[value].x===-1) distinctCells[value]={x,y};
	});
	for(let i=0;i<area.width-pattern.width+1;i++){
		for(let j=0;j<area.height-pattern.height+1;j++){
			//if the samples dont match, skip checking the entire pattern
			//TODO: extend samples to all states
			if(distinctCells[0].x!==-1&&distinctCells[0].y!==-1&&area.getCell(i+distinctCells[0].x, j+distinctCells[0].y)!==0)continue;
			if(distinctCells[1].x!==-1&&distinctCells[1].y!==-1&&area.getCell(i+distinctCells[1].x, j+distinctCells[1].y)!==1)continue;
			let foundDifference=false;
			for(let k=0;k<pattern.width;k++){
				for(let l=0;l<pattern.height;l++){
					if(pattern.getCell(k, l)!==area.getCell(i+k, j+l)){
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

function getTopPatternMargin(pattern,rangeStart=0,rangeEnd=pattern.width){
	for(let j=0; j<pattern.height; j++){
		for(let i=rangeStart; i<rangeEnd; i++){
			if(pattern.getCell(i, j)!==0){
				return j;
			}
		}
	}
	return -1;
}

function getRightPatternMargin(pattern,rangeStart=0,rangeEnd=pattern.height){
	for(let i=pattern.width-1; i>=0; i--){
		for(let j=rangeStart; j<rangeEnd; j++){
			if(pattern.getCell(i, j)!==0){
				return i+1;
			}
		}
	}
	return -1;
}

function getBottomPatternMargin(pattern,rangeStart=0,rangeEnd=pattern.width){
	for(let j=pattern.height-1; j>=0; j--){
		for(let i=rangeStart; i<rangeEnd; i++){
			if(pattern.getCell(i, j)!==0){
				return j+1;
			}
		}
	}
	return -1;
}

function getLeftPatternMargin(pattern,rangeStart=0,rangeEnd=pattern.height){
	for(let i=0; i<pattern.width; i++){
		for(let j=rangeStart; j<rangeEnd; j++){
			if(pattern.getCell(i, j)!==0){
				return i;
			}
		}
	}
	return -1;
}

function getSpaceshipEnvelope(ship,grid,area){
	const maxPeriod=300, initialGrid=grid.head, initialEvent=new EventNode(null);
	const startLocation=findPattern(readPattern(area,grid),ship);
	if(-1===startLocation.x){
		console.log("can't find ship");
		return {dx:null, dy:null, period:0};
	}

	const initialShipPosition=[
		startLocation.y+area.top,
		startLocation.x+area.left+ship.width,
		startLocation.y+area.top +ship.height,
		startLocation.x+area.left];
	let searchArea = new Area(0,0,0,0), spaceshipEnvelope=[...initialShipPosition];

	let speedOfLight=1;//0.5;
	//if(ruleHasLightSpeedShips)speedOfLight=1;

	for(let period=1;period<maxPeriod;period++){
		gen(grid);
		searchArea.top=initialShipPosition[0]-Math.floor(period*speedOfLight);
		searchArea.right=initialShipPosition[1]+Math.ceil( period*speedOfLight);
		searchArea.bottom=initialShipPosition[2]+Math.ceil( period*speedOfLight);
		searchArea.left=initialShipPosition[3]-Math.floor(period*speedOfLight);

		const search=readPatternFromTree(searchArea,grid);
		let location=findPattern(readPatternFromTree(searchArea,grid),ship);
		spaceshipEnvelope[0]=Math.min(searchArea.top+getTopPatternMargin(search)   ,spaceshipEnvelope[0]);
		spaceshipEnvelope[1]=Math.max(searchArea.left+getRightPatternMargin(search) ,spaceshipEnvelope[1]);
		spaceshipEnvelope[2]=Math.max(searchArea.top+getBottomPatternMargin(search),spaceshipEnvelope[2]);
		spaceshipEnvelope[3]=Math.min(searchArea.left+getLeftPatternMargin(search)  ,spaceshipEnvelope[3]);

		if(location.x!==-1){
			setEvent(initialEvent);
			let shipPattern=new Array(period);
			//find pattern
			for(let j=0;j<period;j++){
				shipPattern[j]=readPatternFromTree(new Area(...spaceshipEnvelope), grid);
				gen(grid);
			}
      //TODO: rewrite
			setEvent(initialEvent);
			return {
				dx:(location.x+searchArea.left)-(startLocation.x+area.left),
				dy:(location.y+searchArea.top)-(startLocation.y+area.top),
				shipOffset:{x:spaceshipEnvelope.left-area.left,y:spaceshipEnvelope.top-area.top},
				period:period,
				phases:shipPattern
			};
		}
	}
  //TODO: rewrite
	setEvent(initialEvent);
	return {dx:null, dy:null, shipOffset:{x:null,y:null},period:0,phases:[]};
}

function findShip(ship,areaBounds){
	if(-1===findPattern(readPattern(areaBounds),ship).x){
		let size=8;
		while(size<ship.length*2){
			size*=2;
			if(size>maxDepth){
				console.log("pattern too large");
				return {dx:null, dy:null, shipOffset:{x:null,y:null}, period:0, phases:[]};
			}
		}
		let sandbox={
			head:getEmptyNode(size),
			backgroundState:0,
			type:0};
		sandbox.head=writePatternToGrid(-size/4,-size/4,ship,sandbox.head);

		return getSpaceshipEnvelope(ship,sandbox,{top:-size/4, right:size/4, bottom:size/4, left:-size/4});
	}else{
		return getSpaceshipEnvelope(ship,GRID,areaBounds);
	}
}

function incrementSearch(searchData){
	if(searchData.progress.slice(-1)[0].delay.slice(-1)[0]===0){
		searchData.progress.push({delay:[0,searchData.repeatTime],repeatedResult:false,result:null});
		searchData.minIncrement=1;
		searchData.minAppend=1;
	}else{
		if(searchData.repeatTime<=searchData.progress[searchData.minIncrement].delay.slice(-1)[0]-searchData.progress[searchData.minAppend].delay.slice(-1)[0]){
			searchData.progress.push({delay:[...searchData.progress[searchData.minAppend].delay,searchData.progress[searchData.minAppend].delay.slice(-1)[0]+searchData.repeatTime],repeatedResult:true,result:null});
			searchData.minAppend++;
		}else{
			searchData.progress.push({delay:[...searchData.progress[searchData.minIncrement].delay],repeatedResult:false,result:null});
			searchData.progress.slice(-1)[0].delay[searchData.progress.slice(-1)[0].delay.length-1]++;
			searchData.minIncrement++;
		}
	}
}

//TODO: add comments to this function
function integerDomainToArray(string){
	if(string.length===0)return [];
	let values=string.split(",");
	for(let i=0;i<values.length;i++){
		if(values[i].split("").includes("-")){
			const endPoints=values[i].split("-").map(num => parseInt(num));
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

//TODO: make this independent of the UI thread
function setSalvoIteration(area, salvoInfo){
	salvoInfo.iteration++;

	if(salvoInfo.shipInfo.dx===0&&salvoInfo.shipInfo.dy===0){
		postMessage({type: "alert", value:"Still Life/Oscillator Dectected. I can only use patterns which move to make a salvo."});
		return -1;
	}else{
		if(salvoInfo.iteration+1<salvoInfo.progress.length){
			salvoInfo.progress=[{delay:[0],repeatedResult:false,result:null}];
			salvoInfo.minIncrement=0;
			salvoInfo.minAppend=0;
		}
		for(let i = salvoInfo.progress.length; i < salvoInfo.iteration+1; i++){
			incrementSearch(salvoInfo);
		}

		let salvoArea={top:0,right:0,bottom:0,left:0};
		let lastShipPosition=-Math.ceil(salvoInfo.progress.slice(-1)[0].delay.slice(-1)[0]/salvoInfo.shipInfo.period);
		salvoArea.top=area.top+Math.min(0,lastShipPosition*salvoInfo.shipInfo.dy);
		salvoArea.right=area.left+Math.max(0,lastShipPosition*salvoInfo.shipInfo.dx)+salvoInfo.shipInfo.phases.width;
		salvoArea.bottom=area.top+Math.max(0,lastShipPosition*salvoInfo.shipInfo.dy)+salvoInfo.shipInfo.phases[0].height;
		salvoArea.left=area.left +Math.min(0,lastShipPosition*salvoInfo.shipInfo.dx);
		GRID.head=widenTree(salvoArea);
		let clearedArray = new Pattern(salvoArea.right-salvoArea.left, salvoArea.bottom-salvoArea.top);
		const previousPattern=readPattern(salvoArea);
		GRID.head=writePatternToGrid(salvoArea.left,salvoArea.top, clearedArray, GRID.head);

		for(let i=0;i<salvoInfo.progress.slice(-1)[0].delay.length;i++){
			let LeftPosition=salvoInfo.progress.slice(-1)[0].delay[i]/salvoInfo.shipInfo.period;
			let TopPosition=salvoInfo.progress.slice(-1)[0].delay[i]/salvoInfo.shipInfo.period;
			const xPosition=(area.left-Math.ceil(LeftPosition)*salvoInfo.shipInfo.dx+0*Math.min(0,salvoInfo.shipInfo.dx));
			const yPosition=(area.top-Math.ceil(TopPosition)*salvoInfo.shipInfo.dy+0*Math.min(0,salvoInfo.shipInfo.dy));
			const pattern=salvoInfo.shipInfo.phases[mod(-salvoInfo.progress.slice(-1)[0].delay[i],salvoInfo.shipInfo.period)];
			GRID.head=writePatternToGrid(xPosition,yPosition, pattern, GRID.head);
		}
		
		// if(socket)socket.emit("paste", Date.now(), {newPatt:[salvoArea.left,salvoArea.top,readPattern(salvoArea)], oldPatt:[salvoArea.left,salvoArea.top,previousPattern]});
		currentEvent=new EventNode(currentEvent,"generate salvo");
	}
}

class searchAction {
	constructor(action, initialState=null){
		this.state = initialState;
		this.action = action;//a callback to a function of the current state
		this.conditions = [];
	}

	runIfConditionsAreMet(){
		if(this.conditions.every(condition => condition()===true)){
			return this.action(this.state);
		}
	}
}

function resetSearchOptions(){
	searchOptions=[];
	return 1;
}

function updateSearchOption(optionIndex, conditionIndices, parsedArgs){
	const actions={
		"Reset": () => new searchAction(() => reset(false)),
		"Shift": (element, rightShift, downShift) => new searchAction(() => {
			if(typeof element==="string"||rightShift===""||downShift==="")return;
			clipboard[element.index].top+=parseInt(downShift);
			clipboard[element.index].right+=parseInt(rightShift);
			clipboard[element.index].bottom+=parseInt(downShift);
			clipboard[element.index].left+=parseInt(rightShift);
			postMessage({type:"shift", args:[element.name, clipboard[element.index].left, clipboard[element.index].top]});
			writePatternFromClipboard(clipboard[element.index].left,clipboard[element.index].top,element.index);
		}),
		"Randomize": (area) => new searchAction(() => {
			if(area==="")return;
			randomize(area, 0.5);
		}),
		"Save Pattern": () => new searchAction(() => {
			// console.log(genCount);
			return postMessage({type:"savePattern", args:getPattern("RLE", "Grid", "BSG")});
		}),
		"Generate Salvo": (repeatTime, patternSource, iteration	) => new searchAction((salvoInfo) => {
			if(repeatTime===""||patternSource===""||iteration==="")return;
			let spaceshipArea; //can acutally be any drifter with enough space
			// if(sourcePattern.name==="Paste Area"){
			spaceshipArea = patternSource;
			spaceshipArea.pattern = patternSource.pattern || clipboard[patternSource.index].pattern;
			if(salvoInfo.shipInfo==null){
				salvoInfo.shipInfo=findShip(spaceshipArea.pattern,spaceshipArea);
				if(salvoInfo.shipInfo.period===0){
					postMessage({type: "alert", value:"Couldn't find ship. I need an area that contains only the spaceship."});
					return -1;
				}else{
					postMessage({type: "alert", value:`Found (${[Math.abs(salvoInfo.shipInfo.dx),Math.abs(salvoInfo.shipInfo.dy)]})c/${salvoInfo.shipInfo.period}`});
				}
			}
			//location of ship within the paste area
			areaLeft=spaceshipArea.left+salvoInfo.shipInfo.shipOffset.x;
			areaTop=spaceshipArea.top+salvoInfo.shipInfo.shipOffset.y;

			setSalvoIteration(spaceshipArea, salvoInfo);
			return postMessage({type: "modifySearchOption", optionIndex, elementIndex:3, newValue:salvoInfo.iteration});
		}, {shipInfo:null, iteration, repeatTime,minIncrement:0,minAppend:0,progress:[{delay:[0],repeatedResult:false,result:null}]}),
		"Increment Area": (area) => new searchAction(() => {
			if(area==="")return;
			increment(area);
		})
	};

	const conditions = {
		"Reset":(acceptanceState) =>() => acceptanceState===wasReset,
		"Pattern Stablizes":(acceptanceState, inputString) => {
			let excludedPeriods=integerDomainToArray(inputString);
			return () => {
				let indexedEvent=currentEvent.parent;
				for(let i=1;i<100;i++){
					if(!indexedEvent)break;
					if(GRID.head===indexedEvent.head){
						if(!excludedPeriods.includes(i))return acceptanceState;
						break;
					}
					indexedEvent=indexedEvent.parent;
				}
				return !acceptanceState;
			}
		},
		"Generation":(acceptanceState, threshold) => () => {
			if(threshold==="")return false;
			return acceptanceState===genCount>=parseInt(threshold);
		},
		"Population":(acceptanceState, threshold) => () => {
			if(threshold==="")return false;
			let populationCounts=integerDomainToArray(threshold);
			if(GRID.type===0){
				return acceptanceState===populationCounts.includes(GRID.head.population);
			}else{
				return acceptanceState===populationCounts.includes(gridPopulation);
			}
		},
		"Pattern Contains":(acceptanceState, patternSource, area) => () => {
			if(area===""||patternSource==="")return false;

			const searchArea = readPattern(new Area(...area.bounds));
			let result = findPattern(searchArea, patternSource.pattern || clipboard[patternSource.index].pattern).x
			return acceptanceState===(-1!==result);
		}
	};

	searchOptions[optionIndex]=actions[parsedArgs[0]](...parsedArgs.slice(1));
	searchOptions[optionIndex].conditions=new Array(conditionIndices.lenghth);
	for (let i = 0; i < conditionIndices.length; i++) {
		const index = conditionIndices[i];
		searchOptions[optionIndex].conditions[i]=conditions[parsedArgs[index]](parsedArgs[index-1]==="When",...parsedArgs.slice(index+1));
	}
	console.log(searchOptions);
}

async function runSearch(){
	for(let i=0;i<searchOptions.length;i++){
		await searchOptions[i].runIfConditionsAreMet();
	}
}

function setPattern(area, clipboardIndex){
	clipboard[clipboardIndex]=new Area(area);
	return true;
}

function importLZ77(area, inputPattern, outputFormat){
	const margin = outputFormat===1?1:0;  //shift by margin for v0.4 backwards compatability
	const width = area.right - area.left + 2*margin;
	const height = area.bottom - area.top + 2*margin;
	const cellArray = (!inputPattern)?[]:base_n_to_pattern(ruleMetadata.numberOfStates, (52).toString(ruleMetadata.numberOfStates).length-1, width, height, LZ77ToBaseN(inputPattern));
	const decodedPattern = new Pattern(width, height, cellArray);
	if(typeof(outputFormat)==="string" && outputFormat.startsWith("clipboard")){
		newArea = new Area(area);
		newArea.pattern = decodedPattern;
		clipboard[parseInt(outputFormat.substring(9))]=newArea;
		return decodedPattern;
	}else if(!Number.isNaN(outputFormat)){
		//read pattern from the passed in area
		return importPattern(decodedPattern,outputFormat,area.top - margin,area.left - margin,area.right-area.left, area.bottom-area.top);
	}else throw("not a valid input pattern");
}

function getPattern(outputFormat,  inputPattern, ruleFormat){
	let pattern=[[]];
	switch(inputPattern){
		case "Grid":
			pattern = readPattern(new Area(...calculateBounds(GRID)));
			break;
		default: // "clipboard#"
			console.log(inputPattern);
			if(typeof(inputPattern)==="string" && inputPattern.startsWith("clipboard")){
				pattern=clipboard[parseInt(inputPattern.substring(9))-1].pattern;
			}else if(inputPattern.top||inputPattern.bottom){
				//read pattern from the passed in area
				pattern=readPattern(inputPattern);
			}else if(pattern.width){
				//use pattern passedi in by value
				pattern = inputPattern
			}else throw("not a valid input pattern");
	}
	switch(outputFormat){
		case "RLE":
			return patternToRLE(pattern, ruleFormat);
		case "LZ77":
			return baseNToLZ77(pattern_to_base_n(ruleMetadata.numberOfStates, (52).toString(ruleMetadata.numberOfStates).length-1, pattern.width, pattern.cells));
	}
}

//TODO: have function return pattern to be added to paste area
function importRLE(rleText){
	console.time("import RLE");
	if(rleText.length===0){
		console.log("RLE box empty");
		return -1;
	}

	const parsedRLE = parseRLE(rleText);

	console.log(parsedRLE);
	if(rleText&&parsedRLE.pattern){
		if(ruleMetadata.string!==parsedRLE.rule)setRule(parsedRLE.rule);

		parsedRLE.pattern.iterate((value) => value>rule.length?value%2:value);

		if(parsedRLE.type===-1)return -1;
		let left=-Math.ceil((parsedRLE.xWrap|parsedRLE.width|parsedRLE.pattern.width)/2),
				top=-Math.ceil((parsedRLE.yWrap|parsedRLE.height|parsedRLE.pattern.height)/2);
		console.log(left, top, parsedRLE.width, parsedRLE.hight, parsedRLE.pattern.width, parsedRLE.pattern.height);

		const writeDirectlyToGRID = GRID.head.value===0&GRID.type===0;
		if(writeDirectlyToGRID){
			let previousPattern=new Pattern(parsedRLE.pattern.width, parsedRLE.pattern.height);

			//TODO: rewrite
			// if(socket)socket.emit("paste", Date.now(), {newPatt:[-Math.ceil(parsedRLE.pattern.width/2),-Math.ceil(parsedRLE.pattern.height/2),parsedRLE.pattern], oldPatt:[-Math.ceil(parsedRLE.pattern.width/2),-Math.ceil(parsedRLE.pattern.height/2),previousPattern]});
			console.log(parsedRLE.pattern, top, left);
			importPattern(parsedRLE.pattern,parsedRLE.type,top,left,parsedRLE.xWrap,parsedRLE.yWrap);

			currentEvent=new EventNode(currentEvent, "import RLE");
			//TODO: send state of grid to other clients
		}
		return {pattern:parsedRLE.pattern, rule:ruleMetadata, finiteArea:GRID.finiteArea, type:GRID.type, writeDirectly:writeDirectlyToGRID, view:[top, left + parsedRLE.width, top+parsedRLE.height, left]};
	}
	console.timeEnd("import RLE"); 
	//TODO: replace render here
}

function parseRLE(input){
	const regex = /x = (?<width>\d+), y = (?<height>\d+)(?:, rule = (?<rule>[\w\/\-]+)(?::(?<type>[TP])(?<xWrap>\d+\*?(?:\+\d+)?),(?<yWrap>\d+\*?(?:\+\d+)?))?)?\r?\n(?<pattern>(?:.|\r?\n)*!)/;
	const rle = input.match(regex);
	if(!rle){
		console.log("Error, RLE not found in text: ", input);
		return {width:0,height:0,rule:"",type:"",xWrap:0,yWrap:0,pattern:[[]]};
	}

	let parsedRLE = rle.groups;
	console.log(parsedRLE, parsedRLE.width, parsedRLE.height);
	parsedRLE.pattern=rleToPattern(parsedRLE.pattern,parseInt(parsedRLE.width),parseInt(parsedRLE.height));
	parsedRLE.width=parseInt(parsedRLE.width)||parsedRLE.pattern.width;
	parsedRLE.height=parseInt(parsedRLE.height)||parsedRLE.pattern.height;
	parsedRLE.xWrap=parseInt(parsedRLE.xWrap);
	parsedRLE.yWrap=parseInt(parsedRLE.yWrap);
	if(parsedRLE.type===undefined)parsedRLE.type="";

	return parsedRLE;
}

function rleToPattern(input,width,height){
	//Array which will contain the pattern
	let array = new Pattern(width, height);

	////check for any invalid chars in rle
	//let rle = input.match(/^.*(?=!)/g)
	//
	//console.log(rle);
	//let unsupportedChars = rle.match(/(?![0-9A-Z\.bo\$])/g);
	//if(unsupportedChars!==null){
	//   postMessage({type: "alert", value:"Unsupported Character In RLE: "+unsupportedChars});
	//	return array;
	//}

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
			if(character!=="$"&&array.width==xCoord)array.push(Array(yCoord+1).fill(0));
			if(character!=="$"&&array.height==yCoord)array.forEach(e => e.push(0));

			//write cell state or move to newline based on the character
			switch(character){
				case "o":
					array.setCell(xCoord, yCoord, 1); break;
				case "b": case ".":
					array.setCell(xCoord, yCoord, 0); break;
				case "$":
					yCoord++;
					xCoord=0;
					break;
				default:
					if(/[A-Z]/.test(character))array.setCell(xCoord, yCoord, character.charCodeAt(0)-64); break;
			}
			if(/[A-Z\.bo]/.test(character)) xCoord++;
		}
	}

	return array;
}

function patternToRLE(pattern, ruleFormat){
	if(pattern.length===0)return `x = 0, y = 0, rule = ${exportRulestring(ruleFormat)}\n!`;
	let RLE=`x = ${pattern.width}, y = ${pattern.height}, rule = ${exportRulestring(ruleFormat)}`, numberOfAdjacentLetters=0;
	if(GRID.type===1)RLE+=`:P${pattern.width},${pattern.height}`;
	if(GRID.type===2)RLE+=`:T${pattern.width},${pattern.height}`;
	RLE+="\n";
	for(let j=0;j<pattern.height;j++){
		let endOfLine=0;
		for(let i=pattern.width-1;i>=0;i--){
			if(pattern.getCell(i, j)!==0){
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
				if(i===endOfLine-1||pattern.getCell(i, j)!==pattern.getCell(i+1, j)){
					if(numberOfAdjacentLetters>1){
						RLE+=numberOfAdjacentLetters;
					}
					if(rule.length===2&&!/.+(Super)|(History)$/g.test(ruleMetadata.string)){
						if(pattern.getCell(i, j)===0){
							RLE+="b";
						}else{
							RLE+="o";
						}
					}else{
						if(pattern.getCell(i, j)===0){
							RLE+=".";
						}else{
							RLE+=String.fromCharCode(64+pattern.getCell(i, j));
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

function patternToBaseN(pattern){
	const g=rule.length                 //(g) is the number of states in the rule
	const lookupTable="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	//each block contains the largest number of cells with <=64 total states(eg. 3 cells in g4b2s345)
	const blockSize=(52).toString(g).length-1;
	if(pattern.isEmpty)return result;
	const result = new Array(Math.ceil(pattern.height/blockSize)).fill(0);
	return result.map( (_, col) =>
		pattern.map(row => lookupTable[row.slice(col*blockSize, (col+1)*blockSize)
		.reduce((acc, val, index) => acc + val*(g**index))]) .join("")).join("");
}

function baseNToPattern(width,height,compressedString){
	//(pattern) is an empty (width) by (height) 2d array which will store the uncompressed pattern
	//(g) is the number of states in the rule
	//(stack) is a base (g) number, which holds information about a vertical "block" of cells
	//each block contains the largest number of cells with <=64 total states(eg. 3 cells in g4b2s345)
	//
	let pattern=new Pattern(width, height), stack=0, g=rule.length, strIndex=0;
	const blockSize=(52).toString(g).length-1;
	for(let i=0;i<height;i+=blockSize){
		for(let j=0;j<width;j++){
			if(strIndex>=compressedString.length){
				console.log("baseN parseing error: string too long for dimensions");
				return pattern;
			}
			stack="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(compressedString[strIndex]);
			strIndex++;
			for(let k=0;k<blockSize&&i+k<height;k++){
				pattern.setCell(j, i+k, stack%g);
				stack=Math.floor(stack/g);
			}
		}
	}
	return pattern;
}

function LZ77ToBaseN(string){
	let result="",number=0,offset=0;
	for(let i=0;i<string.length&&i<maxDepth;i++){
		//write any letters directly to the result
		if(isNaN(string[i])){
			if(string[i]!=="~")result+=string[i];
		}else{
			//add digits to the number buffer
			number=10*number+parseInt(string[i]);
			//if the number is finished
			if(isNaN(string[i+1])){
				//use the number as the offset if there is a hyphen
				if(string[i+1]==="~"){
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

function baseNToLZ77(string){
	let result="";
	for(let i=0;i<string.length;i++){
		let offset=0,repeat=1;
		for(let j=0;j<i+1;j++){
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
		if(repeat>1&&offset===0||repeat>repeat.toString().length+offset.toString().length+1){
			if(offset!==0)
				result+=`${offset}~`;
			result+=`${repeat}`;
			i+=repeat;
		}
	}
	return result;
}

function exportPattern(){
	switch(GRID.type){
	case 0:
		return {xOffset:(GRID.head.getLeftBorder()??0)/2-0.5,
			yOffset:(GRID.head.getTopBorder()??0)/2-0.5,
			pattern:readPattern(new Area((GRID.head.getTopBorder()??0)/2-0.5,(GRID.head.getRightBorder()??0)/2+0.5,(GRID.head.getBottomBorder()??0)/2+0.5,(GRID.head.getLeftBorder()??0)/2-0.5))};
	case 1:{
		let pattern=new Pattern(GRID.finiteArea.pattern.width-2, GRID.finiteArea.pattern.height-2);
		for(let i=0; i<pattern.width;i++){
			for(let j=0; j<pattern.height;j++){
				if(i<GRID.finiteArea.pattern.width-1&&j<GRID.finiteArea.pattern.height-1){
					pattern.setCell(i, j, GRID.finiteArea.pattern.getCell(i+1, j+1));
				}else{
					pattern.setCell(i, j, GRID.backgroundState);
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
			pattern:GRID.finiteArea.pattern};
	default:
		throw new Error("exporting unknown grid type");
	}
}

//TODO: replace setEvent() logic with importPattern
//TODO: send new state(finiteArea, type, etc to main thread for updateing UI and collab clients
//places a pattern and moves the grid down and to the right by some offset
function importPattern(pattern,type,top,left,width = pattern.width ,height = pattern.height){
	console.log(pattern,type,top,left,width,height);
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
			}
	}
	if(GRID.type===1||GRID.type===2){
		//shift by margin for v0.4 backwards compatability
		const margin= GRID.finiteArea.margin;
		GRID.finiteArea = new Area(top, left + width, top + height, left);
		GRID.finiteArea.margin = margin;
		// GRID.finiteArea.pattern = new Pattern(width+GRID.finiteArea.margin*2, height+GRID.finiteArea.margin*2);
		GRID.finiteArea.pattern = new Pattern(width+GRID.finiteArea.margin*2, height+GRID.finiteArea.margin*2);
	}
	writePattern(left, top, new Pattern(pattern), GRID);
	sendVisibleCells();
	console.log("done", pattern, left, top, GRID);
	return { type:GRID.type, finiteArea:GRID.finiteArea, left, top, width, height, backgroundState:GRID.backgroundState, population:GRID.head.Population||gridPopulation};
}

function setGridType(gridNumber, width=null, height=null){
	let results=exportPattern();
	if(GRID.type!==gridNumber){
		importPattern(results.pattern,gridNumber,results.yOffset,results.xOffset,width=width||results.pattern.width,height=height||results.pattern.height);
		console.log(results, GRID.finiteArea);
		currentEvent=new EventNode(currentEvent,"changeGrid");
	}
	return GRID.finiteArea;
}

function calculateBounds(gridObj=GRID){
  if(gridObj.type===0){
    return [
      gridObj.head.getTopBorder()/2-0.5,
      gridObj.head.getRightBorder()/2+0.5,
      gridObj.head.getBottomBorder()/2+0.5,
      gridObj.head.getLeftBorder()/2-0.5];
  }else{
		console.log(gridObj, gridObj.finiteArea.bounds);
    return gridObj.finiteArea.bounds;
  }
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
	let newRuleData;
	if(alias[ruleText]){
    ruleMetadata.string=ruleText;
		newRuleData = parseRulestring(alias[ruleMetadata.string]);
	}else{
    ruleMetadata.string=clean(ruleText);
		newRuleData = parseRulestring(ruleMetadata.string);
	}
	resetHashtable();
	return newRuleData;
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
		}else if(i>1&&ruleMetadata.forceDeath[i]===false&&i!==3&&(ruleMetadata.family==="Super"||ruleMetadata.family==="History")){
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
  console.log(ruleText);
	ruleMetadata.size=0;
	ruleMetadata.numberOfStates=2;
	if(ruleText.split("/").length===3)ruleMetadata.numberOfStates=parseInt(ruleText.split("/")[2].slice(1));

	if(/.+(History)$/g.test(ruleText)){
		ruleMetadata.family="History";
		ruleMetadata.color=[["#303030","#00FF00","#0000A0","#FFD8FF","#FF0000","#FFFF00","#606060"]];
		ruleMetadata.aliveState=[1,1,1,3,3,5,6];
		ruleMetadata.deadState=[0,2,2,4,4,4,6];
		ruleMetadata.forceDeath=[false,false,false,false,false,false,true];
		ruleMetadata.forceLife=[false,false,false,false,false,false,false];
		ruleMetadata.numberOfStates=7;
	}else if(/.+(Super)$/g.test(ruleText)){
		ruleMetadata.family="Super";
		ruleMetadata.color=[["#303030","#00FF00","#0000A0","#FFD8FF","#FF0000","#FFFF00","#606060"]];
		ruleMetadata.aliveState=[1,1,1,3,3,5,6,7,8];
		ruleMetadata.deadState=[0,2,2,4,4,4,6,7,8];
		ruleMetadata.forceDeath=[false,false,false,false,false,false,true];
		ruleMetadata.forceLife=[false,false,false,false,false,false,false];
		ruleMetadata.numberOfStates=7;
	}else if(ruleMetadata.numberOfStates>2){
		ruleMetadata.family="Generations";
		ruleMetadata.color=[[]];
		ruleMetadata.aliveState=[1,1];
		ruleMetadata.deadState=[0,2];
		ruleMetadata.forceDeath=[false,false];
		ruleMetadata.forceLife=[false,false];
	}else{
		ruleMetadata.family="INT";
		ruleMetadata.color=[[]];
		ruleMetadata.aliveState=[1,1];
		ruleMetadata.deadState=[0,0];
		ruleMetadata.forceDeath=[false,false];
		ruleMetadata.forceLife=[false,false];
	}

	rule=generateTree([],0,ruleMetadata.numberOfStates,ruleText.replace(/(Super)|(History)$/g,"").split("/").map(substring => substring.split("")));
	
	postMessage({type:"setDrawMenu"});
	return ruleMetadata;
}

function exportRulestring(format){
  const hasTwoStates = ruleMetadata.numberOfStates===2;
  const regex = /B([0-8aceijknqrtwyz-]*)\/S([0-8aceijknqrtwyz-]*)(?:\/G([0-9]*))?/g;
  switch(format){
    case "BSG": return ruleMetadata.string.replace(regex, hasTwoStates?"B$1/S$2":"B$1/S$2/G$3");
    case "gbs": return ruleMetadata.string.replace(regex, hasTwoStates?"b$1s$2":"g$3b$1s$2");
    case "sbg": return ruleMetadata.string.replace(regex, hasTwoStates?"$2/$1":"$2/$1/$3");
  }
	throw new Error("invalid format");
}

function clean(dirtyString){
	let testString = dirtyString;
	testString.replace(/(Super)|(History)$/,"");
	if(["Life","HighLife"].includes(testString)){
		return dirtyString;
	}
	let unsupportedChars = testString.match(/(?![BSGbsg\/\-0-8aceijknqrtwyz])./)|[];
	if(unsupportedChars.length==1){
    postMessage({type: "alert", value:"Unsupported Character In Rule: "+unsupportedChars});
		return dirtyString;
	}else if(unsupportedChars.length>=2){
    postMessage({type: "alert", value:"Unsupported Characters In Rule: "+unsupportedChars});
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
	const suffix=dirtyString.match(/(Super)|(History)$/g);
  try{
    let ruleSections=dirtyString
      .replace(/(Super)|(History)$/g,"")// B/S/GHistory -> B/S/G
      .replace(/[bsg]/g,match => match.toUpperCase())// b/s/g -> B/S/G
      .split(/\/|(?=[BSG])/);// #/#/# -> [#,#,#], B/S/G -> [B,S,G], or GBS -> [G,B,S]

    if(ruleSections.length===1){
      ruleSections[1]=ruleSections[0][0]==="B"?"S":"B";// [B] -> [B,S], or [S] -> [S,B]
    }
    //check if either rule section starts with a number
    if(/[0123456789]/g.test(ruleSections[0][0]+ruleSections[1][0])){
      //Prepend a "B", "S", or "G" to each section
      ruleSections=ruleSections.map((element,index) => "SBG"[index]+element);// [#,#,#] -> [B#,S#,G#]
    }else if(ruleSections[2]&&ruleSections[2][0]!=="G"){
      //Prepend a G to section 2 if it is missing
      ruleSections[2]="G"+ruleSections[2];// [B,S,#]] -> [B,S,G#]
      postMessage({type: "alert", value:"Warning: a \"G\" was inserted into the rulestring to convert it into B/S/G form."});
    }
    ruleSections=ruleSections.sort((a,b) => "BSG".indexOf(a[0])-"BSG".indexOf(b[0]));// [G,B,S] -> [B,S,G]
    if(ruleSections[1][0]==="G"){
      if(ruleSections[0][0]==="B"){
        ruleSections.splice(1, 0, "S");
        postMessage({type: "alert", value:"Warning: an \"S\" was inserted into the rulestring to convert it into B/S/G form."});
      }
      if(ruleSections[0][0]==="S"){
        ruleSections.splice(0, 0, "B");
        postMessage({type: "alert", value:"Warning: a \"B\" was inserted into the rulestring to convert it into B/S/G form."});
      }
    }

    //sort, shorten, and filter the transitions into INT format
    for(let i=0;i<ruleSections.length||i<2;i++){
      console.log(ruleSections);
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
  }catch (error){
    postMessage({type: "alert", value:"Unable to parse rule \"" + dirtyString + "\". \nThis program supports rulestrings in B/S, S/B, #/#, B#/S#/G#, or #/#/# format with an optional \"History\" suffix. \nMaybe there's a missing character?"});
    return "B3/S23";
  }
}

var runningSimulation = false;
var rendering = false;
onmessage = (e) => {
	if(e.data.type!=="requestFrames")console.log(e.data);
	try{
		const response = self[e.data.type](...e.data.args);
		if(response) postMessage({id:e.data.id, response:response});
	}catch(error){
		console.trace(e.data.type, error);
	}
}

function setSpeed(speed){
	simulationSpeed = speed;
}

function setStepSize(size){
	stepSize = size;
}

function start(){
	runningSimulation = true;
	suspended=false;
	loop();
	permittedFrames=32;
}

function stop() {
	runningSimulation = false;
}

function stepSimulation(){
	wasReset=false;
	if(resetEvent===null){
		//creates an EventNode with all neccessary information representing gen 0, and saves a referece to it
		resetEvent=new EventNode(currentEvent.parent, "reset point");
		if("paste" in currentEvent)resetEvent.paste=currentEvent.paste;
		if("draw" in currentEvent)resetEvent.draw=currentEvent.draw;
		currentEvent=resetEvent;
		resetEvent.child=currentEvent.child;
		if(GRID.type!==0&&typeof(resetEvent.finiteArea.pattern)==="string")resetEvent.finiteArea.pattern=parseRLE(resetEvent.finiteArea.pattern).pattern;
	}
	for(let i=0;i<stepSize;i++) gen(GRID);
	currentEvent=new EventNode(currentEvent, "gen");
	runSearch().then(() =>  sendVisibleCells());
}

let suspended = false;
//generate up to 32 extra frames to limit JS event loop memory usage
let permittedFrames = 32;

function requestFrames(){
	permittedFrames++;
	if(suspended===true){
		suspended=false;
		loop();
	}
}

let time = performance.now(), updatesPerSecond = 60;
function loop(){

	if(runningSimulation){
		wasReset=false;
		if(permittedFrames>0){
			setTimeout(loop, Math.max(15,0.1*(100-simulationSpeed)*(100-simulationSpeed)));
			stepSimulation();
			permittedFrames--;
		}else suspended = true;
	}

	updatesPerSecond = updatesPerSecond * 0.9 + 1000/(performance.now()-time) * 0.1;
	time = performance.now();
}

//TODO: rewrite to use transferrable objects
function sendVisibleCells(){
	if(GRID.type === 0){
		const  top = Math.ceil(Math.max(view.y+20-20/view.z-1, -GRID.head.distance/4)),
		       right = Math.ceil(Math.min(view.x+30+30/view.z+1, GRID.head.distance/4)),
		       bottom = Math.ceil(Math.min(view.y+20+20/view.z+1, GRID.head.distance/4)),
		       left = Math.ceil(Math.max(view.x+30-30/view.z-1, -GRID.head.distance/4));
		const pattern = readPatternFromTree(new Area(top, right, bottom, left), GRID);
		postMessage({type:"render", top, right, bottom, left, pattern:pattern, population:GRID.head.population, generation:genCount, backgroundState:GRID.backgroundState}, [pattern.cells.buffer]);
	}else{
		postMessage({
			type:"render",
			UPS:updatesPerSecond,
			top:GRID.finiteArea.top - GRID.finiteArea.margin,
			right:GRID.finiteArea.right + GRID.finiteArea.margin,
			bottom:GRID.finiteArea.bottom + GRID.finiteArea.margin,
			left:GRID.finiteArea.left - GRID.finiteArea.margin,
			pattern:GRID.finiteArea.pattern,
			population:gridPopulation,
			generation:genCount,
			backgroundState:GRID.backgroundState});
	}
}
