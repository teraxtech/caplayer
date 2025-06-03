onmessage = (e) => {
	try{
		const response = self[e.data.type](...e.data.args);
		// transfers response as part of postMessage()
		if(response) postMessage({id:e.data.id, response:response}, [response]);
	}catch(error){
		console.trace(e.data.type, error);
	}
}

let offscreenCanvas;

function resizeCanvas (width, height) {
	offscreenCanvas = new OffscreenCanvas(width,height);
}

function renderCells(visibleArea, view, cellWidth,  ruleMetadata, darkMode, backgroundState, drawGridLines) {
	if(offscreenCanvas===undefined)return;
	const context = offscreenCanvas.getContext("2d");

	context.strokeStyle=darkMode?"#999999":"#000000";

	const dx=Math.ceil(visibleArea.left)-view.x, dy=Math.ceil(visibleArea.top)-view.y, scaledCellWidth=cellWidth*view.z;

	for(let x = 0; x < visibleArea.pattern.width; x++){
		for (let y = 0; y < visibleArea.pattern.height; y++) {
			if(backgroundState!==visibleArea.pattern.cells[x*visibleArea.pattern.height + y]){
				context.fillStyle=ruleMetadata.color[backgroundState][visibleArea.pattern.cells[x*visibleArea.pattern.height + y]];
				context.fillRect((x-30+30/view.z+dx)*scaledCellWidth,(y-20+20/view.z+dy)*scaledCellWidth,scaledCellWidth,view.z*cellWidth);
			}
		}
	}

	let x=view.x%1, y=view.y%1;
	// if the toggle grid variable is true
	if(drawGridLines===true){
		//draw a grid
		if(darkMode){
			context.strokeStyle="#999999";
		}else{
			context.strokeStyle="#000000";
		}
		context.lineWidth=0.5*view.z;
		context.beginPath();
		//draw horizonal lines
		for(let h= -Math.ceil(offscreenCanvas.width*0.5/scaledCellWidth);h<offscreenCanvas.width*0.5/scaledCellWidth+1;h++){
			context.moveTo(offscreenCanvas.width*0.5+(h-x)*scaledCellWidth,0);
			context.lineTo(offscreenCanvas.width*0.5+(h-x)*scaledCellWidth,offscreenCanvas.height);
		}
		//draw virtical lines
		for(let h= -Math.ceil(offscreenCanvas.height*0.5/scaledCellWidth);h<offscreenCanvas.height*0.5/scaledCellWidth+1;h++){
			context.moveTo(0  ,offscreenCanvas.height*0.5+(h-y)*scaledCellWidth);
			context.lineTo(offscreenCanvas.width,offscreenCanvas.height*0.5+(h-y)*scaledCellWidth);
		}
		context.stroke();
	}

	postMessage({type: "returnTransfer", object:visibleArea.pattern.cells}, [visibleArea.pattern.cells.buffer]);
	return offscreenCanvas.transferToImageBitmap();
}

function returnTransfer(transferableObject) {
	transferableObject.close();
}
