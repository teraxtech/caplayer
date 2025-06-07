import Pattern from "./Pattern.js";

export default class Area {
  constructor(top=0, right=0, bottom=0, left=0, margin, pattern){
		if(arguments.length===1){
			this.top=arguments[0].top;
			this.right=arguments[0].right;
			this.bottom=arguments[0].bottom;
			this.left=arguments[0].left;
			this.margin = arguments[0].margin;
			this.pattern=arguments[0].pattern?arguments[0].pattern:new Pattern();
		}else{
			this.top=top;
			this.right=right;
			this.bottom=bottom;
			this.left=left;
			this.margin = margin;
			this.pattern=pattern??new Pattern();
		}
	}
	static markerList = [];
	static selectedMarker = null;
	
	get bounds () { return [this.top, this.right, this.bottom, this.left]};
  
  setLocation(coordinate){
    this.bottom+=coordinate.y-this.top;
    this.right+=coordinate.x-this.left;
    this.top=coordinate.y;
    this.left=coordinate.x;
  }

	//test if the coordinate is within the area + plus a margin
	isWithinBounds(coordinate, margin=0){
		if(coordinate.x< this.left  -margin)return false;
		if(coordinate.x>=this.right +margin)return false;
		if(coordinate.y< this.top   -margin)return false;
		if(coordinate.y>=this.bottom+margin)return false;
		return true;
	}
}


