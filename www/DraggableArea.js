import Area from "./Area.js";

export default class DraggableArea extends Area {
	constructor(base = {top:0, right:0, bottom:0, left:0, }){
		super(base);
		this.edgeBeingDragged = 0;
	}

	//check if the coordinates allows an edge of an area or the entire area to be dragged, return null otherwise
	attemptDrag(pointerCoordinate){
		// the margin for selecting the edges within the selectArea
		// is 4/view.z wide, but also less than the half the width
		//
		//
		// edgebeingdragged:
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
		// -3 < 0 > +3
		//      v
		//     -1
		//TODO: possibly implement if(!this.isWithinBounds(pointerCoordinate,-4/view.z) to check bounds
		if(pointerCoordinate.x<this.left+4/view.z){
			this.edgeBeingDragged=-3;
		}else if(pointerCoordinate.x>this.right-4/view.z-1){
			this.edgeBeingDragged=3;
		}
		if(pointerCoordinate.y<this.top+4/view.z){
			this.edgeBeingDragged+=1;
		}else if(pointerCoordinate.y>this.bottom-4/view.z-1){
			this.edgeBeingDragged-=1;
		}
		if(this.edgeBeingDragged!==0){
			Area.selectedMarker=null;
			isPlaying=false;
			return this;
		}
		return null;
	}

	//called to update the object if it is being dragged
	drag(pointerCoordinate){
		//drag top edge
		if(mod(this.edgeBeingDragged,3)===2){
      this.bottom=pointerCoordinate.y+1;
			if(pointerCoordinate.y<this.top){
				this.bottom=this.top+1;
				this.edgeBeingDragged+=2;
			}
			if(this.edgeBeingDragged===-1){
				if(pointerCoordinate.x<this.left)this.edgeBeingDragged=-4;
				if(pointerCoordinate.x>this.right)this.edgeBeingDragged=2;
			}
		}
		//drag left edge
		if(this.edgeBeingDragged>=-4&&this.edgeBeingDragged<=-2){
			this.left=pointerCoordinate.x;
			if(pointerCoordinate.x>=this.right-1){
				this.left=this.right-1;
				this.edgeBeingDragged+=6;
			}
			if(this.edgeBeingDragged===-3){
				if(pointerCoordinate.y<this.top)this.edgeBeingDragged=-2;
				if(pointerCoordinate.y>this.bottom)this.edgeBeingDragged=-4;
			}
		}
		//drag top edge
		if(mod(this.edgeBeingDragged,3)===1){
			this.top=pointerCoordinate.y;
			if(pointerCoordinate.y>=this.bottom-1){
				this.top=this.bottom-1;
				this.edgeBeingDragged-=2;
			}
			if(this.edgeBeingDragged===1){
				if(pointerCoordinate.x<this.left)this.edgeBeingDragged=-2;
				if(pointerCoordinate.x>this.right)this.edgeBeingDragged=4;
			}
		}
		//drag right edge
		if(this.edgeBeingDragged>=2&&this.edgeBeingDragged<=4){
			this.right=pointerCoordinate.x+1;
			if(pointerCoordinate.x<this.left+1){
				this.right=this.left+1;
				this.edgeBeingDragged-=6;
			}
			if(this.edgeBeingDragged===3){
				if(pointerCoordinate.y<this.top)this.edgeBeingDragged=4;
				if(pointerCoordinate.y>this.bottom)this.edgeBeingDragged=2;
			}
		}
  }
	
	reset(){ this.edgeBeingDragged = 0; }
}
