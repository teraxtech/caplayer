//2d array with custom constructor and additional getter methods
export default class Pattern{
	constructor(width=0, height=0, fill=0){
		if(arguments.length===1){//if a pattern object is passed in, clone it
			this.cells = new Int32Array(arguments[0].cells);
			this.width = arguments[0].width;
			this.height = arguments[0].height;
		}else if(typeof(arguments[2]) === "object"){//if a width, height, and base array are passed in, convert to a pattern
			this.cells = new Int32Array(arguments[2]);
			this.width = width;
			this.height = height;
		}else{//if 0, 2, or 3 arguments are passed in, make a new, empty pattern
			this.cells = new Int32Array(width*height);
			if(typeof(fill) === "number"&&fill!==0)this.fill(arguments(0));
			this.width = width;
			this.height = height;
		}
	}
	width = 0;
	height = 0;

	get isEmpty() { return this.width===0||this.height===0}
	getCell(x, y) { return this.cells[x*this.height + y]; }
	setCell(x, y, state) { this.cells[x*this.height + y] = state; }

	toBitmap(){
		if(this.isEmpty)return null;
		const cellWidth = 200/(this.width);
		const canvasWidth=200, canvasHeight=Math.ceil(cellWidth*(this.height));
		const offscreenCanvas = new OffscreenCanvas(canvasWidth,canvasHeight);
		const context = offscreenCanvas.getContext("2d");

		context.strokeStyle=darkMode?"#999999":"#000000";

		this.iterate((value, x, y) => {
			context.fillStyle=getColor(value);
			context.fillRect(x*cellWidth,y*cellWidth,1*cellWidth,1*cellWidth);
		});
		context.lineWidth=1;
		context.beginPath();
		for(let i=0;i<=this.width;i++){
			context.moveTo(i*cellWidth,0);
			context.lineTo(i*cellWidth,this.height*cellWidth);
		}
		for(let i=0;i<=this.height;i++){
			context.moveTo(0,i*cellWidth);
			context.lineTo(this.width*cellWidth,i*cellWidth);
		}
		context.stroke();

		return offscreenCanvas.transferToImageBitmap();
	}

	render(coordinate, opacity = 1){
		const dx=Math.ceil(coordinate.x)-view.x, dy=Math.ceil(coordinate.y)-view.y, scaledCellWidth=cellWidth*view.z;

		ctx.globalAlpha=opacity;
		this.iterate((value, x, y) => { if(GRID.backgroundState!==value){
			ctx.fillStyle=getColor(value);
			ctx.fillRect((x-30+30/view.z+dx)*scaledCellWidth,(y-20+20/view.z+dy)*scaledCellWidth,scaledCellWidth,view.z*cellWidth);
		}});
		ctx.globalAlpha=1;
	}

	//iterate over all the cells
	iterate(callback) {
		for(let i = 0; i < this.width; i++){
			for (let j = 0; j < this.height; j++) {
				const newValue = callback(this.cells[i*this.height + j], i, j);
				if(newValue!==undefined)this.cells[i*this.height + j] = newValue;
			}
		}
	}
}
