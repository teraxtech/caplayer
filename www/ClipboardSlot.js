import DraggableArea from "./DraggableArea.js";
import Pattern from "./Pattern.js";

export default class ClipboardSlot extends DraggableArea {
	constructor(pattern = new Pattern(), left=0, top=0){
		super({top, right:left+pattern.width, bottom:top+pattern.height, left});
		this.pointerPosition=new Coordinate(0,0);
		this.pattern=pattern;
		this.previewBitmap=pattern.toBitmap();
	}

	attemptDrag(coordinate){
		this.pointerPosition=coordinate.relativeTo(new Coordinate(this.left,this.top));
		return this;
	}

	reset(){};

	drag(coordinate){
		this.bottom+=coordinate.y-this.top-this.pointerPosition.y;
		this.right+=coordinate.x-this.left-this.pointerPosition.x;
		this.top=coordinate.y-this.pointerPosition.y;
		this.left=coordinate.x-this.pointerPosition.x;
	}
}
