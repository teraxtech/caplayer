export default class TreeNode {
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

	calculateKey(){
		//sets key to the nodes value if it has one
		if(this.distance===1){
			this.key=this.value;
			this.population=this.value===1?1:0;
			//otherwise sets the key based of the children's keys
		}else{
			this.key=rule.length;
			this.population=0;
			const primes=[7,1217,7919,104729];
			for(let h=0;h<4;h++) if(this.child[h]!==null){
				if(this.child[h].key===null){
					this.child[h].calculateKey();
				}
				this.key=(this.key^(this.child[h].key*primes[h]));
				this.population+=this.child[h].population;
			}
		}
	}

	getTopBorder(){
		const ySign=[-1,-1,1,1];
		if(this.distance===1)return this.value!==0?0:null;
		
		let currentMin=null, cache;
		for(let i=0;i<4;i++){
			cache=this.child[i].getTopBorder();
			if(cache!==null&&(currentMin===null||currentMin>(this.distance>>1)*ySign[i]+cache)){
				currentMin=(this.distance>>1)*ySign[i]+cache;
			}
		}
		return currentMin;
	}

	getRightBorder(){
		const xSign=[-1,1,-1,1];
		if(this.distance===1)return this.value!==0?0:null;
		
		let currentMax=null, cache;
		for(let i=0;i<4;i++){
			cache=this.child[i].getRightBorder();
			if(cache!==null&&(currentMax===null||currentMax<(this.distance>>1)*xSign[i]+cache)){
				currentMax=(this.distance>>1)*xSign[i]+cache;
			}
		}
		return currentMax;
	}

	getBottomBorder(){
		const ySign=[-1,-1,1,1];
		if(this.distance===1)return this.value!==0?0:null;
		
		let currentMax=null, cache;
		for(let i=0;i<4;i++){
			cache=this.child[i].getBottomBorder();
			if(cache!==null&&(currentMax===null||currentMax<(this.distance>>1)*ySign[i]+cache)){
				currentMax=(this.distance>>1)*ySign[i]+cache;
			}
		}
		return currentMax;
	}

	getLeftBorder(){
		const xSign=[-1,1,-1,1];
		if(this.distance===1)return this.value!==0?0:null;
		
		let currentMin=null, cache;
		for(let i=0;i<4;i++){
			cache=this.child[i].getLeftBorder();
			if(cache!==null&&(currentMin===null||currentMin>(this.distance>>1)*xSign[i]+cache)){
				currentMin=(this.distance>>1)*xSign[i]+cache;
			}
		}
		return currentMin;
	}

	isEqual(tree2){
		if(this===tree2){
			return true;
		}else if(this&&tree2){
			if(this.distance===1&&tree2.distance===1){
				if(this.value===tree2.value){
					return true;
				}
			}else if(this.distance===tree2.distance){
				for(let h = 0;h<4;h++){
					if(this.child[h].isEqual(tree2.child[h])===false)return false;
				}
				return true;
			}
		}
		return false;
	}

	getValue(){
		if(this.distance===1){
			return this.value;
		}else if(this.child[0].value!==null&&
						this.child[0].value===this.child[1].value&&
						this.child[1].value===this.child[2].value&&
						this.child[2].value===this.child[3].value){
			return this.child[0].value;
		}else{
			return null;
		}
	}
}
