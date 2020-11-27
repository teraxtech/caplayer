var //canvas element
	myCanvas=document.getElementById("ourCanvas"),
	//canvas context
	ctx=myCanvas.getContext("2d"),
	//window and canvas dimensions
	WH=0,WW=0,CW=0,CH=0,
	base=0,
	//the code for decoding rule strings.
    code=[[0,"-"],[1,"c"],[1,"e"],[2,"a"],[1,"c"],[2,"c"],[2,"a"],[3,"i"],[1,"e"],[2,"k"]//00
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
    clipboard=[];

var //distance between pattern and border
	b={n:0,s:0,e:0,w:0},
	//color of a square
    c=0,
    //variable for canvas scaling
    d,
    //frame variable
    f,
    //grid array
    g=[],
    //for loop variables
    h=0,
    i=0,
    j=0,
    //
    k=[],
    //toggle grid lines
    l=true,
    //mouse and touch inputs
    m={
	    //which button is down
	    d:0,
	    //position of input
	    x:0,y:0,
	    //past position
	    px:0,py:0,
	    //position of 2nd input
	    x2:0,y2:0,
	    //past position
	    px2:0,py2:0},
    //offset for edge wrap(up,down,left,right),offset entire grid
    o={u:0,d:0,l:0,r:0,x:0,y:0},
    //amount of pause between generations
    p=0,
    //rulestring
    r=["B3/S23"],
    //game states
	s={
	   //if active(not all still lifes)
	   a:1,
	   //beginning of the simulation(level on undo stack)
	   b:0,
	   //has something changed(including user actions)
	   c:0,
	   //which border is being dragged
	   d:0,
	   //what state is being drawn in draw mode(-1:auto,0:state 0,etc...)
	   e:-1,
	   //highlighted area(active(0-none,1-selsect,2-paste),area dimensions, copied area dimensions)
	   h:{a:0,x:10,y:10,x2:20,y2:15,cx:0,cy:0,cx2:0,cy2:0},
	   //interval between generations
	   i:0,
	   //is any key pressed
	   k:[0,0],
	   //which mode the sim is in(draw,move,select)
	   m:0,
	   //LCMs of periods discarded while searching for oscillators
	   o:[],
	   //Play(1) or Pause(0) the simulation
	   p:0,
	   //rule of the cellular autimata
	   r:[],
	   //current cell state being written
	   s:-1,
	   //time of last update in milliseconds
	   t:0,
	   //undo stack index(-1=none)
	   u:-1},
	//time elapsed
	t=0,
	//undo stack
	u=[],
	//width of each cell
	w=20,
	//view variables(x/y offset,zoom)and past values respectively
	//and scale amounts
	v={x:-0,y:0,z:1,px:0,py:0,pz:1,
	   u:0,d:0,r:0,l:0};

//setup grid
for(h=0;h<Math.floor(600/w);h++){
	g.push([]);
	
	for(i=0;i<Math.floor(400/w);i++){
		//# of neighbors,touched,state,future state
		g[h].push({n:0,t:0,s:0,f:0});
	}
}
rule("23/3");
drawState(-1);
done();

//mouse input
myCanvas.onmousedown = function(event){
	m.d = event.buttons;
	s.d=0;
	getInput(event);
	inputReset();
	//reset toggle vars
	for(h=0;h<g.length;h++){
		for(i=0;i<g[0].length;i++){
			g[h][i].t=0;
		}
	}
	s.s=-1;
};
myCanvas.onmousemove = function(event){
	m.d = event.buttons;
	getInput(event);
};

myCanvas.onwheel = function(event){
	event.preventDefault();
}
myCanvas.onmouseup = function(event){
	m.d=  0;
	s.d=0;
	getInput(event);
	inputReset();
	if(s.c!==0){
		done();
	}
};

myCanvas.onkeydown = function(event){
	k[event.keyCode]=true;
	if(s.k[0]===false)next();
	s.k[0]=true;
	event.preventDefault()
}

window.onkeyup = function(event){
	k[event.keyCode]=false;
	s.k[0]=false;
	for(h in k){
		if(k[h]===true)s.k[0]=true;
	}
	s.k[1]=false;
}

window.onresize = function(event){
	next();
}

//touch inputs
myCanvas.ontouchstart = function(event){
	s.d=  0;
	getInput(event);
	inputReset();
	//reset toggle vars
	for(h=0;h<g.length;h++){
		for(i=0;i<g[0].length;i++){
			g[h][i].t=0;
		}
	}
	s.s= -1;
	if(event.cancelable)event.preventDefault();
}

myCanvas.ontouchend = function(event){
	s.d=  0;
	getInput(event);
	inputReset();
	if(s.c!==0){
		done();
	}
};

myCanvas.ontouchmove = function(event){
	getInput(event);
};

//update the randomize density slider
document.getElementById("density").oninput = function() {
	document.getElementById("percent").innerHTML = this.value+"%";
}

//resets various values at the start and end of inputs
function inputReset(){
	m.px=m.x;
	m.py=m.y;
	m.px2=m.x2;
	m.py2=m.y2;
	v.px=v.x;
	v.py=v.y;
	v.pz=v.z;
	if(s.h.a===2){
		s.h.cx=s.h.x;
		s.h.cy=s.h.y;
		s.h.cx2=s.h.x2;
		s.h.cy2=s.h.y2;
	}
	scaleGrid();
}

function getInput(e){
	if(e.touches&&e.touches.length>0){
		m.x=(e.touches[0].clientX-myCanvas.getBoundingClientRect().left)/CH*400;
		m.y=(e.touches[0].clientY-myCanvas.getBoundingClientRect().top)/CH*400;
		if(e.touches.length>1){
			m.x2=(e.touches[1].clientX-myCanvas.getBoundingClientRect().left)/CH*400;
			m.y2=(e.touches[1].clientY-myCanvas.getBoundingClientRect().top)/CH*400;
		}else{
			m.x2=0;
			m.y2=0;
		}
	}else{
		if(m.d>0){
			m.x=(e.clientX-myCanvas.getBoundingClientRect().left)/CH*400;
			m.y=(e.clientY-myCanvas.getBoundingClientRect().top)/CH*400;
		}else{
			m={x:0,y:0};
		}
	}
	next();
}

function key(){
	//i and o for zoom
	if(k[73])v.z*=1.05;
	if(k[79])v.z/=1.05;
	//arrow keys for move
	if(k[37])v.x-=0.5/v.z;
	if(k[38])v.y-=0.5/v.z;
	if(k[39])v.x+=0.5/v.z;
	if(k[40])v.y+=0.5/v.z;
	//actions to only be tanken once
	if(s.k[1]===false){
		//ctrl-x,ctrl-c and ctrl-v for cut,copy and paste
		if(k[17]&&k[88]){
			cut();
			s.k[1]=true;
		}
		if(k[17]&&k[67]){
			copy();
			s.k[1]=true;
		}
		if(k[17]&&k[86]){
			paste();
			s.k[1]=true;
		}
		//d,m and s for switching modes
		if(k[68]){
			draw();
			s.k[1]=true;
		}
		if(k[77]){
			move();
			s.k[1]=true;
		}
		if(k[83]){
			select();
			s.k[1]=true;
		}
		//space to start and stop
		if(k[32]){
			start(0);
			s.k[1]=true;
		}
		//n for next gen
		if(k[78]){
			next(1);
			s.k[1]=true;
		}
		//delete to clear
		if(k[46]){
			wipe();
			s.k[1]=true;
		}
	}
}

//toggle updating the simulation
function start(n){
	if(s.p===0){
		s.p=1;
		if(n!==0)requestAnimationFrame(main);
	}else{
		s.p=0;
	}
}

//move e frames forward
function next(n){
	if(s.p===0)requestAnimationFrame(main);
	if(n||n===0)s.p=-1*n;
}

//toggle drawing the grid
function grid(){
	if(l){
		l=false
	}else{
		l=true;
	}
	next(0);
}

function color(n){
	if(n===0){
		return "#f1f1f1";
	}else if(n===1){
		return "#000";
	}else{
		c=240/s.r[2]*(n-1);
		return "rgb("+c+","+c+","+c+")";
	}
}

//switch to draw mode
function draw(){
	s.m=0;
	for(h=0;h<4;h++)document.getElementById("b"+h.toString()).style.outline="none";
	document.getElementById("b0").style.outline="1px solid";
}

//switch to move mode
function move(){
	s.m=1;
	for(h=0;h<4;h++)document.getElementById("b"+h.toString()).style.outline="none";
	document.getElementById("b1").style.outline="1px solid";
}

//swith to select mode
function select(){
	s.m=2;
	if(s.h.a!==0)s.h.a=0;
	for(h=0;h<4;h++)document.getElementById("b"+h.toString()).style.outline="none";
	document.getElementById("b2").style.outline="1px solid";
	next(0);
}

//save and action to the undo stack
function done(){
	s.u++;
	while(s.u<u.length)u.pop();
	u.push({a:s.a,b:s.b,g:[],o:{x:o.x,y:o.y},t:t});
	for(h=0;h<g.length;h++){
		u[s.u].g.push([]);
		for(i=0;i<g[0].length;i++){
			u[s.u].g[h].push(g[h][i].s);
		}
	}
	s.c=0;
}

//pull information from the undostack
function readStack(){
	//return viewing window to it's previous position
	v.x+=u[s.u].o.x-o.x;
	v.y+=u[s.u].o.y-o.y;
	//return highlighted area to it's previos position
	s.h.x+=u[s.u].o.x-o.x;
	s.h.x2+=u[s.u].o.x-o.x;
	s.h.y+=u[s.u].o.y-o.y;
	s.h.y2+=u[s.u].o.y-o.y;
	//return highlighted area to it's previous position
	s.h.cx+=u[s.u].o.x-o.x;
	s.h.cx2+=u[s.u].o.x-o.x;
	s.h.cy+=u[s.u].o.y-o.y;
	s.h.cy2+=u[s.u].o.y-o.y;
	//return highlighted copy area to it's previous position
	o.x=u[s.u].o.x;
	o.y=u[s.u].o.y;
	v.r=u[s.u].g.length-g.length;
	v.d=u[s.u].g[0].length-g[0].length;
	s.b=u[s.u].b;
	scaleGrid();
	if(t!==u[s.u].t){
		t=u[s.u].t;
		document.getElementById("gens").innerHTML="Generation "+t+".";
	}
	for(h=0;h<g.length;h++){
		for(i=0;i<g[0].length;i++){
			g[h][i].s=u[s.u].g[h][i];
		}
	}
}

function undo(){
	if(s.u>0){
		s.u--;
		readStack();
		next(0);
	}
}

function redo(){
	if(u.length>=s.u+2){
		s.u++;
		readStack();
		next(0);
	}
}

//go to before the simulation started
function restart(){
	if(s.b!==0){
		s.u=s.b;
		s.b=0;
		readStack();
		if(arguments.length===0)next(0);
	}
}

function round(num){
	return Math.round(num*1000)/1000;
}

//function for reading the grid
function G(first,second){
	if(g[Math.floor(round(mod(first+v.x+(300-300/v.z)/w,g.length)))]
	 &&g[Math.floor(round(mod(first+v.x+(300-300/v.z)/w,g.length)))]
	    [Math.floor(round(mod(second+v.y+(200-200/v.z)/w,g[0].length)))]){
		return g[Math.floor(round(mod(first+v.x+(300-300/v.z)/w,g.length)))]
				[Math.floor(round(mod(second+v.y+(200-200/v.z)/w,g[0].length)))];
	}else{
		return {s:0};
		console.log(first+" "+second);
	}
}

function stretch(){
	if(!document.getElementById("xloop").checked){
		if(s.h.x<0)v.l=s.h.x;
		if(s.h.x2>g.length)v.r=s.h.x2+1-g.length;
	}
	if(!document.getElementById("yloop").checked){
		if(s.h.y<0)v.u=s.h.y;
		if(s.h.y2>g[0].length)v.d=s.h.y2+1-g[0].length;
	}
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

function drawState(n){
	s.e=n;
	//document.getElementById("dropdown-content").style.display="none";
	if(n===-1){
		document.getElementById("dropbtn").innerHTML="Auto";
		document.getElementById("dropbtn").style.color="#000";
		document.getElementById("dropbtn").style.backgroundColor="#eee";
		document.getElementById("dropdown-content").innerHTML="";
	}else{
		document.getElementById("dropbtn").innerHTML=n.toString();
		if(n>s.r[2]*0.8||n===0){
			document.getElementById("dropbtn").style.color="#000";
		}else{
			document.getElementById("dropbtn").style.color="#fff";
		}
		document.getElementById("dropbtn").style.backgroundColor=color(n);
		document.getElementById("dropdown-content").innerHTML="<div id=\"auto\" onclick=\"drawState(-1)\">Auto</div>";
	}
	for(let h=0;h<s.r[2];h++){
		if(h!==n){
			document.getElementById("dropdown-content").innerHTML+="<div id=\"s"+h+"\" onclick=\"drawState("+h+")\">"+h+"</div>";
			document.getElementById("s"+h).style.backgroundColor=color(h);
			if(h>s.r[2]*0.8||h===0){
				document.getElementById("s"+h).style.color="#000";
			}else{
				document.getElementById("s"+h).style.color="#fff";
			}
		}
	}
}

//set default view
function view(){
	v.x=(g.length-30)/2;
	v.y=(g[0].length-20)/2;
	v.px=0;
	v.py=0;
	v.z=Math.min(600/w/g.length,400/w/g[0].length);
	v.pz=Math.min(600/w/g.length,400/w/g[0].length);
	next();
}

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

//clear the grid
function wipe(){
	s.a=0;
	for(h=s.h.a===1?s.h.x:0;h<(s.h.a===1?s.h.x2:g.length);h++){
		for(i=s.h.a===1?s.h.y:0;i<(s.h.a===1?s.h.y2:g[0].length);i++){
			if(g[h]&&g[h][i]&&g[h][i].s!==0){
				g[h][i].s=0;
				s.a=1;
			}
		}
	}
	t=0;
	base=0;
	document.getElementById("gens").innerHTML="Generation 0.";
	if(s.a===1&&arguments.length===0)done();
	s.h.a=0;
	next(0);
}

function copy(){
	clipboard=[];
	if(s.h.a===2)s.h.a=0;
	s.h.cx=s.h.a===1?s.h.x:0;
	s.h.cy=s.h.a===1?s.h.y:0;
	s.h.cx2=s.h.a===1?s.h.x2:g.length;
	s.h.cy2=s.h.a===1?s.h.y2:g[0].length;
	for(h=s.h.cx;h<s.h.cx2;h++){
		if(g[h]){
			clipboard.push([]);
			for(i=s.h.cy;i<s.h.cy2;i++){
				if(g[h][i])clipboard[clipboard.length-1].push(g[h][i].s);
			}
		}
	}
	if(arguments.length===0)s.h.a=0;
	next(0);
}

function cut(){
	copy(0);
	wipe();
}

function paste(){
	if(clipboard.length>0){
		move();
		if(s.h.a!==2){
			s.h.a=2;
		}else{
			stretch();
			scaleGrid();
			for(var h=0;h<clipboard.length;h++){
				if(g[h+s.h.cx])for(var i=0;i<clipboard[0].length;i++){
					if(g[h+s.h.cx][i+s.h.cy])g[h+s.h.cx][i+s.h.cy].s=clipboard[h][i];
				}
			}
		}
		
		s.h.x=s.h.cx;
		s.h.y=s.h.cy;
		s.h.x2=s.h.cx2;
		s.h.y2=s.h.cy2;
		
		done();
		next(0);
	}
}

//mainain a 1 cell thick margin around the pattern
function addMargin(){
	if(s.d===0){
		if(!document.getElementById("xloop").checked){
			size();
			if(b.w!==0||b.e!==0){
				v.l=b.e-1;
				v.r=b.w-g.length+1;
			}
			scaleGrid();
		}
		if(!document.getElementById("yloop").checked){
			size();
			if(b.s!==0||b.n!==0){
				v.u=b.n-1;
				v.d=b.s-g[0].length+1;
			}
			scaleGrid();
		}
	}
}

//import several settings
function save(){
	document.getElementById("error").innerHTML="";
	rule(1);
	if(document.getElementById("pause").value){
		if(isNaN(document.getElementById("pause").value)){
			document.getElementById("error").innerHTML="Interval must be a number";
		}else{
			s.i=parseInt(document.getElementById("pause").value,10);
		}
	}
	if(document.getElementById("zoom").value){
		if(isNaN(document.getElementById("zoom").value)){
			document.getElementById("error").innerHTML="Zoom must be a decimal";
		}else{
			let buffer=document.getElementById("zoom").value.split(".");
			v.z=parseInt(buffer[0],10)+parseInt(buffer[1],10)/Math.pow(10,buffer[1].split("").length);
		}
	}
	if(document.getElementById("period").value){
		s.o=document.getElementById("period").value.split(",");
	}else{
		s.o=[];
	}
	for(h=0;h<s.o.length;h++){
		s.o[h]=parseInt(s.o[h]);
	}
	next(0);
}

//fill the grid with random cell states
function rand(){
	let top,bottom,left,right;
	if(s.h.a===1){
		stretch();
		scaleGrid();
		left=s.h.x;
		right=s.h.x2;
		top=s.h.y;
		bottom=s.h.y2;
	}else{
		if(document.getElementById("xloop").checked){
			left=0;
			right=g.length;
		}else{
			left=1;
			right=g.length-1;
		}
		if(document.getElementById("yloop").checked){
			top=0;
			bottom=g[0].length;
		}else{
			top=1;
			bottom=g[0].length-1;
		}
	}
	for(h=left;h<right;h++){
		for(i=top;i<bottom;i++){
			if(g[h]&&g[h][i]){
				if(Math.random()<document.getElementById("density").value/100){
					g[h][i].s=1;
				}else{
					g[h][i].s=0;
				}
			}
		}
	}
	//D_4+ symmetry
	if(document.getElementById("d4").checked){
		for(h=0;h<g.length;h++){
			for(i=0;i<g[0].length;i++){
				if(h<Math.ceil(g.length/2)){
					if(i>Math.floor(g[0].length/2)-1)g[h][i].s=g[h][g[0].length-i-1].s;
				}else{
					g[h][i].s=g[g.length-h-1][i].s;
				}
			}
		}
	}
	t=0;
	document.getElementById("gens").innerHTML="Generation 0.";
	done();
	if(arguments.length===0)next();
}

function size(){
	//find distance between pattern and border
	b={n:0,s:0,e:0,w:0};
	for(var i=0;i<g[0].length;i++){
		for(var h=0;h<g.length;h++){
			if(g[h][i].s!==base){
				b.n=i;
				h=g.length
				i=g[0].length;
			}
		}
	}
	for(var i=g[0].length-1;i>=0;i--){
		for(var h=0;h<g.length;h++){
			if(g[h][i].s!==base){
				b.s=i+1;
				h=g.length;
				i=-1;
			}
		}
	}
	for(var h=0;h<g.length;h++){
		for(var i=0;i<g[0].length;i++){
			if(g[h][i].s!==base){
				b.e=h;
				h=g.length;
				i=g[0].length;
			}
		}
	}
	for(var h=g.length-1;h>=0;h--){
		for(var i=0;i<g[0].length;i++){
			if(g[h][i].s!==base){
				b.w=h+1;
				h=-1;
				i=g[0].length;
			}
		}
	}
}

//function for scaling the grid
function scaleGrid(){
	//move left edge
	if(v.l<g.length)while(v.l!==0){
		if(v.l>0){
			v.l--;
			v.x--;
			v.px--;
			s.h.x--;
			s.h.x2--;
			s.h.cx--;
			s.h.cx2--;
			o.x--;
			g.shift();
		}else{
			v.l++;
			v.x++;
			v.px++;
			s.h.x++;
			s.h.x2++;
			s.h.cx++;
			s.h.cx2++;
			o.x++;
			g.unshift([]);
			for(i=0;i<g[1].length;i++){
				g[0].push({n:0,t:0,s:base,f:0});
			}
		}
		s.c=1;
	}
	//move right edge
	if(-v.r<g.length)while(v.r!==0){
		if(v.r>0){
			v.r--;
			g.push([]);
			for(i=0;i<g[0].length;i++){
				g[g.length-1].push({n:0,t:0,s:base,f:0});
			}
		}else{
			v.r++;
			g.pop();
		}
		s.c=2;
	}
	//move upper edge
	if(v.u<g[0].length)while(v.u!==0){
		if(v.u>0){
			v.u--;
			v.y--;
			v.py--;
			s.h.y--;
			s.h.y2--;
			s.h.cy--;
			s.h.cy2--;
			o.y--;
			for(i=0;i<g.length;i++){
				g[i].shift();
			}
		}else{
			v.u++;
			v.y++;
			v.py++;
			s.h.y++;
			s.h.y2++;
			s.h.cy++;
			s.h.cy2++;
			o.y++;
			for(i=0;i<g.length;i++){
				g[i].unshift({n:0,t:0,s:base,f:0});
			}
		}
		s.c=3;
	}
	//move lower edge
	if(-v.d<g[0].length)while(v.d!==0){
		if(v.d>0){
			v.d--;
			for(i=0;i<g.length;i++){
				g[i].push({n:0,t:0,s:base,f:0});
			}
		}else{
			v.d++;
			for(i=0;i<g.length;i++){
				g[i].pop();
			}
		}
		s.c=4;
	}
}

function update(){
	//if a finger touches the canvas
	if(m.x&&m.px){
		x=Math.floor(((m.x-300)/v.z+300)/w+v.x);
		y=Math.floor(((m.y-200)/v.z+200)/w+v.y);
		//if in write mode
		if(s.m===0){
			//stretch the grid to include any new cells
			if(!document.getElementById("xloop").checked){
				if(x<0)v.l=x;
				if(x>=g.length)v.r=x+1-g.length;
				scaleGrid();
				x=Math.floor(((m.x-300)/v.z+300)/w+v.x);
			}
			if(!document.getElementById("yloop").checked){
				if(y<0)v.u=y;
				if(y>=g[0].length)v.d=y+1-g[0].length;
				scaleGrid();
				y=Math.floor(((m.y-200)/v.z+200)/w+v.y);
			}
			if(s.e===-1){
				//if the finger is down
				if(s.s=== -1){
					s.p=0;
					s.c=5;
					if(g[mod(x,g.length)][mod(y,g[0].length)].s===0){
						//set cell state to live(highest state)
						s.s=1;
					}else{
						//otherwise set cell state to zero
						s.s=0;
					}
				}
			}else{
				s.s=s.e;
				s.p=0;
				s.c=5;
			}
			//actually set the cell state
			g[mod(x,g.length)][mod(y,g[0].length)].s=s.s;
		//if in move mode
		}else if(s.m===1){
			//if 2 fingers are touching the canvas
			if(m.x2&&m.px2){
				//otherwise scale the grid
				v.z=v.pz*Math.sqrt((m.x2-m.x)*(m.x2-m.x)
				                  +(m.y2-m.y)*(m.y2-m.y))/
				         Math.sqrt((m.px2-m.px)*(m.px2-m.px)
				                  +(m.py2-m.py)*(m.py2-m.py));
			}else{
				switch(s.d){
					case 0:
						if(x>=s.h.x&&x<s.h.x2&&y>=s.h.y&&y<s.h.y2){
							s.d=5;
							s.h.x=s.h.cx;
							s.h.y=s.h.cy;
							s.h.x2=s.h.cx2;
							s.h.y2=s.h.cy2;
							m.px=m.x;
							m.py=m.y;
						}else{
							//select the grid edges if necessary
							if(document.getElementById("xloop").checked&&x>=0&&x<g.length&&y>=0&&y<g[0].length){
								if(x=== 0){
									s.d=1;
									s.p=0;
								}else if(x===g.length-1){
									s.d=2;
									s.p=0;
								}
							}
							if(document.getElementById("yloop").checked&&x>=0&&x<g.length&&y>=0&&y<g[0].length){
								if(y=== 0){
									s.d=3;
									s.p=0;
								}else if(y===g[0].length-1){
									s.d=4;
									s.p=0;
								}
							}
						}
						//translate the grid
						v.x=v.px+(m.px-m.x)/w/v.z;
						v.y=v.py+(m.py-m.y)/w/v.z;
					break;
					//drag left edge
					case 1:
						v.l=Math.floor(((m.x-300)/v.z+300)/w+v.x);
						ctx.fillRect(300-((v.x-v.l)*w+300)*v.z,200-(v.y*w+200)*v.z,w*v.z,(g[0].length)*v.z*w);
					break;
					//drag right edge
					case 2:
						v.r=Math.floor(((m.x-300)/v.z-300)/w+v.x+(600/w-g.length+1));
						ctx.fillRect(300-((v.x-v.r)*w-300+(600-(g.length-1)*w))*v.z,200-(v.y*w+200)*v.z,w*v.z,(g[0].length)*v.z*w);
					break;
					//drag upper edge
					case 3:
						v.u=Math.floor(((m.y-200)/v.z+200)/w+v.y);
						ctx.fillRect(300-(v.x*w+300)*v.z,200-((v.y-v.u)*w+200)*v.z,(g.length)*v.z*w,w*v.z);
					break;
					//drag downward edge
					case 4:
						v.d=Math.floor(((m.y-200)/v.z-200)/w+v.y+(400/w-g[0].length+1));
						ctx.fillRect(300-(v.x*w+300)*v.z,200-((v.y-v.d)*w-200+(400-(g[0].length-1)*w))*v.z,(g.length)*v.z*w,w*v.z);
					break;
					case 5:
						s.h.x=s.h.cx+Math.floor((m.x-m.px)/v.z/w);
						s.h.y=s.h.cy+Math.floor((m.y-m.py)/v.z/w);
						s.h.x2=s.h.cx2+Math.floor((m.x-m.px)/v.z/w);
						s.h.y2=s.h.cy2+Math.floor((m.y-m.py)/v.z/w);
					break;
				}
			}
		//if in select mode
		}else if(s.m===2){
			//if there is no highlighted area make one
			if(s.h.a===0){
				s.h.a=1;
				s.h.x=x-5;
				s.h.y=y-5;
				s.h.x2=x+5;
				s.h.y2=y+5;
			}else{
				switch(s.d){
					case 0:
						//select the highlighted area if necessary
						if(x>=s.h.x&&x<s.h.x2&&y>=s.h.y&&y<s.h.y2){
							if(x=== s.h.x){
								s.d=1;
								s.p=0;
							}else if(x===s.h.x2-1){
								s.d=2;
								s.p=0;
							}
						}
						if(x>=s.h.x&&x<s.h.x2&&y>=s.h.y&&y<s.h.y2){
							if(y=== s.h.y){
								s.d=3;
								s.p=0;
							}else if(y===s.h.y2-1){
								s.d=4;
								s.p=0;
							}
						}
					break;
					//drag left edge
					case 1:
						s.h.x=Math.min(x,s.h.x2);
					break;
					//drag right edge
					case 2:
						s.h.x2=Math.max(x+1,s.h.x);
					break;
					//drag upper edge
					case 3:
						s.h.y=Math.min(y,s.h.y2);
					break;
					//drag downward edge
					case 4:
						s.h.y2=Math.max(y+1,s.h.y);
					break;
				}
			}
		}
	}else{
		//if the highlighted area has no thickness turn it off
		if(s.h.x===s.h.x2||s.h.y===s.h.y2){
			s.h.a=0;
		}
	}
	addMargin();
	if(s.p!==0){
		done();
		//record that a generation was run
		if(s.p<0)s.p++;
	}
}

function gen(){
	s.t=Date.now();
	s.a=0;
	if(s.b===0)s.b=s.u;
	//handles B0 rules
	if(base===0){
		if(s.r[1][0]===1)base=1;
	}else{
		if(s.r[0][255]===0)base=0;
	}
	//update cell state
	for(h=0;h<g.length;h++){
		for(i=0;i<g[0].length;i++){
			//reqset the number of living neighbors a cell has
			g[h][i].n=0;
			
			//increment the number of living neighbors for each neighbor
			if(h===0)o.l=g.length;
			if(h===g.length-1)o.r=-g.length;
			if(i===0)o.u=g[0].length;
			if(i===g[0].length-1)o.d=-g[0].length;
			
			
			if(g[h+1+o.r][i+1+o.d].s===1)g[h][i].n+=1;
			if(g[h      ][i+1+o.d].s===1)g[h][i].n+=2;
			if(g[h-1+o.l][i+1+o.d].s===1)g[h][i].n+=4;
			if(g[h-1+o.l][i      ].s===1)g[h][i].n+=8;
			if(g[h-1+o.l][i-1+o.u].s===1)g[h][i].n+=16;
			if(g[h      ][i-1+o.u].s===1)g[h][i].n+=32;
			if(g[h+1+o.r][i-1+o.u].s===1)g[h][i].n+=64;
			if(g[h+1+o.r][i      ].s===1)g[h][i].n+=128;
			o={r:0,l:0,u:0,d:0,x:o.x,y:o.y};
			
			//turn a dead cell into a live one if conditions are met
			if(g[h][i].s===0){
				g[h][i].f=0;
				if(s.r[1][g[h][i].n]===1){
					g[h][i].f=1;
					s.a=1;
				}
			//turn a live cell into a dying one if conditions are met
			}else if(g[h][i].s===1){
				if(s.r[2]===2){
					g[h][i].f=0;
				}else{
					g[h][i].f=2;
				}
				for(j=0;j<s.r[0].length;j++){
					if(s.r[0][g[h][i].n]===1){
						g[h][i].f=1;
					}
				}
				if(g[h][i].f!==1)s.a=1;
			}else{
				if(g[h][i].s>=s.r[2]-1){
					g[h][i].f=0;
				}else{
					//brings a dying cell closer to death
					g[h][i].f=g[h][i].s+1;
				}
				s.a=1;
			}
		}
	}
	
	//turns all the cells into their next state
	for(h=0;h<g.length;h++){
		for(i=0;i<g[0].length;i++){
				g[h][i].s=g[h][i].f;
		}
	}		
	//increment the generation counter or pause if necessary
	if(s.a===0&&s.r[1][0]===0){
		if(s.o.length===0)s.p=0;
	}else{
		t++;
		document.getElementById("gens").innerHTML="Generation "+t+".";
	}

	//done();
}

function search(){
	for(h=0;h<s.o.length;h++){
		if(s.o[h]<t
		&&   g.length===u[s.u-s.o[h]].g.length
		&&g[0].length===u[s.u-s.o[h]].g[0].length){
			for(i=0;i<g.length;i++){
				for(j=0;j<g[0].length;j++){
					if(u[s.u-s.o[h]].g[i][j]!==g[i][j].s)break;
				}
				if(j<g[0].length)break;
			}
			if(i>=g.length&&j>=g[0].length){
				s.a=0;
				break;
			}
		}
	}
	if(s.a===0){
		restart(0);
		s.p=1;
		rand(0);
		console.log(s.u);
	}
}
//function which renders graphics to the canvas
function render(){
	//grid line offsets
	var x=mod(v.x,1), y=mod(v.y,1);
	
	//clear screen
	ctx.clearRect(0,0,600,400);
	//set line width
	ctx.lineWidth=1;
	ctx.fillStyle="#000";
	ctx.font = "15px Arial";
	/*ctx.fillText(round(v.x),10,15);
	ctx.fillText(round(v.y),10,30);
	ctx.fillText(s.b+" "+s.u+" "+u[s.u].g.length,10,45);*/
	
	//draw selected area
	if(s.h.a>0){
		if(s.m===2&&s.d!==0){
			ctx.fillStyle="#999";
		}else{
			ctx.fillStyle="#ccc";
		}
		ctx.fillRect(300-((v.x-s.h.x)*w+300)*v.z,200-((v.y-s.h.y)*w+200)*v.z,(s.h.x2-s.h.x)*v.z*w-1,(s.h.y2-s.h.y)*v.z*w-1);
	}
	
	//for each cell
	for(h=0;h<600/w/v.z+1;h++){
		for(i=0;i<400/w/v.z+1;i++){
			//draw a square if the cell's state is not 0 and within the sim area
			if(G(h,i).s!==0&&(document.getElementById("xloop").checked||h+v.x+(300-300/v.z)/w>=0&&h+v.x+(300-300/v.z)/w<g.length)
			               &&(document.getElementById("yloop").checked||i+v.y+(200-200/v.z)/w>=0&&i+v.y+(200-200/v.z)/w<g[0].length)){
				//find the cell's color depending on the state
				if(G(h,i).s===1){
					c=0;
				}else{
					c=255/s.r[2]*(G(h,i).s-1);
				}
				//set the color
				ctx.fillStyle="rgb("+c+","+c+","+c+")";
				ctx.fillRect((300/v.z-v.x*w+Math.floor(round(v.x-300/w/v.z))*w)*v.z+h*w*v.z,(200/v.z-v.y*w+Math.floor(round(v.y-200/w/v.z))*w)*v.z+i*w*v.z,w*v.z,w*v.z);
			}
		}
	}

	if(s.h.a===2){
		for(var h=0;h<clipboard.length;h++){
			for(var i=0;i<clipboard[0].length;i++){
				if(clipboard[h][i]>0){
					//find the cell's color depending on the state
					if(clipboard[h][i]===1){
						c=0;
					}else{
						c=255/s.r[2]*(clipboard[h][i]-1);
					}
					//set the color
					ctx.fillStyle="rgb("+c+","+c+","+c+")";
					ctx.fillRect(300-(300+v.x*w)*v.z+(s.h.x+h)*w*v.z,200-(200+v.y*w)*v.z+(s.h.y+i)*w*v.z,w*v.z,w*v.z);
				}
			}
		}
	}
	if(s.m===1)switch(s.d){
		//drag left edge
		case 1:
		ctx.fillRect(300-((v.x-v.l)*w+300)*v.z,200-(v.y*w+200)*v.z,w*v.z,(g[0].length)*v.z*w);
		break;
		//drag right edge
		case 2:
		ctx.fillRect(300-((v.x-v.r)*w-300+(600-(g.length-1)*w))*v.z,200-(v.y*w+200)*v.z,w*v.z,(g[0].length)*v.z*w);
		break;
		//drag upper edge
		case 3:
		ctx.fillRect(300-(v.x*w+300)*v.z,200-((v.y-v.u)*w+200)*v.z,(g.length)*v.z*w,w*v.z);
		break;
		//drag downward edge
		case 4:
		ctx.fillRect(300-(v.x*w+300)*v.z,200-((v.y-v.d)*w-200+(400-(g[0].length-1)*w))*v.z,(g.length)*v.z*w,w*v.z);
		break;
	}
	//if the toggle grid variable is true
	if(l){
		//draw a grid
		ctx.lineWidth=0.5*v.z;
		ctx.strokeStyle="#000";
		ctx.beginPath();
		//draw horizonal lines
		for(h= -Math.floor(300/w/v.z);h<300/w/v.z+1;h++){
			ctx.moveTo(300+(h-x)*v.z*w,0);
			ctx.lineTo(300+(h-x)*v.z*w,400);
		}
		//draw virtical lines
		for(h= -Math.floor(200/w/v.z);h<200/w/v.z+1;h++){
			ctx.moveTo(0  ,200+(h-y)*w*v.z);
			ctx.lineTo(600,200+(h-y)*w*v.z);
		}
		ctx.stroke();
		ctx.lineWidth=3*v.z;
		ctx.strokeRect(300-(v.x*w+300)*v.z,200-(v.y*w+200)*v.z,g.length*v.z*w-1,g[0].length*v.z*w-1);
	}
	//draw a rectangle around the pattern to be pasted.
	if(s.h.a>0){
		ctx.lineWidth=3*v.z;
		ctx.strokeStyle="#666";
		ctx.strokeRect(300-((v.x-s.h.x)*w+300)*v.z,200-((v.y-s.h.y)*w+200)*v.z,(s.h.x2-s.h.x)*v.z*w-1,(s.h.y2-s.h.y)*v.z*w-1);
	}
}

function scaleCanvas(){
	WW=document.documentElement.clientWidth;
	WH=window.innerHeight;
	d=Math.min(WW,WH*1.5)/100;
	document.getElementById("content").style.padding=3*d+"px";
	document.getElementById("content").style.border=d+"px solid #d3d3d3";
	if(WW<WH*1.5){
		CH=(WW-d*8)/3*2;
		CW=WW-d*8;
	}else{
		CH=WH-d*8;
		CW=(WH-d*8)*1.5;
	}
	myCanvas.width =CW;
	myCanvas.height=CH;
	ctx.scale(CH/400,CH/400);
	if(WW-CW-d*8>300){
		document.getElementById("top").style.width="300px";
	}else{
		document.getElementById("top").style.width=CW+"px";
	}
}

function rle(mode){
	var text;
	switch(mode){
	case 0://read the rle
		text=document.getElementById("rle").value.split("");
		var n=1;
		var pattern=[];
		for(var h=0;h<text.length;h++){
			if(n!==0){
				//find and ignore comments
				if(text[h]==="#")n=0;
				//transcribe objects dimensions
				if(text[h]==="x")n=-1;
				if(text[h]==="y")n=-2;
			}
			//comment ends when line ends
			if(text[h]==="/n")n=1;
			
			if(n<0){
				if(isNaN(text[h])||text[h]===" "||text[h]==="\n"){
					if(n<-2){
						pattern=parseInt(pattern.join(""),10);
						if(n===-3){
							n=1;
							v.r=pattern-g.length;
							scaleGrid();
							pattern=[];
						}
						if(n===-4){
							n=h;
							v.d=pattern-g[0].length;
							scaleGrid();
							break;
						}
					}
				}else{
					if(n>-3)n-=2;
					pattern[pattern.length]=text[h];
				}
			}
		}
		//transcribe rule
		pattern=[];
		for(var h=n;h<text.length;h++){
			if(text[h]==="\n"||text[h]===":"){
				n=h;
				break;
			}else{
				if(n===-1&&text[h]!==" ")pattern.push(text[h]);
			}
			if(text[h]==="="){
				n=-1;
			}
		}
		document.getElementById("rule").value=pattern.join("");
		rule(pattern.join(""));
		if(text[n]===":"&&text[n+1]==="T"){
			pattern=[];
			if(text[n+2]==="0"){
				document.getElementById("xloop").checked=false;
				n+=4;
			}else{
				document.getElementById("xloop").checked=true;
				for(var h=n+2;h<text.length;h++){
					if(isNaN(text[h])){
						v.r=parseInt(pattern.join(""))-g.length;
						scaleGrid();
						pattern=[];
						n=h+1;
						break;
					}else{
						pattern.push(text[h]);
					}
				}
			}
			if(text[n]==="0"){
				document.getElementById("yloop").checked=false;
				n++;
			}else{
				document.getElementById("yloop").checked=true;
				for(var h=n;h<text.length;h++){
					if(isNaN(text[h])){
						v.d=parseInt(pattern.join(""))-g[0].length;
						scaleGrid();i
						pattern=[];
						n=h-2;
						break;
					}else{
						pattern.push(text[h]);
					}
				}
			}
		}
		//transcribe pattern
		wipe(1);
		var repeat=[];
		var xloc=0;
		var yloc=0;
		for(var h=n;h<text.length;h++){
			if(text[h]==="!")break;
			if(isNaN(text[h])||text[h]===" "){
				var repeat=parseInt(repeat.join(""),10);
				
				if(isNaN(repeat)){
					repeat=1;
				}
				
				for(var i=0;i<repeat;i++){
					//dead cell if conditions are met
					if((text[h]==="b"&&s.r[2]===2)||text[h]==="."){
						g[xloc][yloc].s=0;
						xloc++;
					//newline if conditions met	
					}else if(text[h]==="$"){
						xloc=0;
						yloc++;
					//else live cell
					}else{
						if(s.r[2]===2){
							g[xloc][yloc].s=1;
						}else if(text[h].charCodeAt(0)>64&&text[h].charCodeAt(0)<91){
							g[xloc][yloc].s=text[h].charCodeAt(0)-64;
						}
						xloc++;
					}
				}
				repeat=[];
			}else{
				repeat.push(text[h]);
			}
		}
		s.p=0;
		s.b=0;
		addMargin();
		view();
		done();
	break;
	case 1://write the rle
		//find distance between pattern and border
		size();
		//unparse data into the rle header
		text="x = "+(b.w-b.e)+", y = "+(b.s-b.n)+", rule = "+r[0];
		
		if(document.getElementById("xloop").checked||document.getElementById("yloop").checked){
			var torus=[":T","0",",","0"];
			if(document.getElementById("xloop").checked)torus[1]=g.length;
			if(document.getElementById("yloop").checked)torus[3]=g[0].length;
			text+=torus.join("");
		}
		
		var pattern=[];
		var length=0;
		for(var i=b.n;i<b.s;i++){
			var n=1;
			for(var h=b.e;h<b.w;h++){
				//count n same cells, jump n back, push n, jump forward n
				if(g[h+1]&&g[h+1][i].s===g[h][i].s){
					n++;  
					
				}else{
					if(n!==1){
						pattern.push(n);
						n=1;
					}
					if(s.r[2]===2){
						if(g[h][i].s===0){
							pattern.push("b");
						}else{
							pattern.push("o");
						}
					}else{
						if(g[h][i].s===0){
							pattern.push(".");
						}else{
							pattern.push(String.fromCharCode(g[h][i].s+64));
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
		pattern=pattern.join("").split("");
		for(var h=0;h<pattern.length;h++){
			if(h%70===0){
				i=0;
				while(i<70&&!isNaN(pattern[h-i-1]))i++;
				pattern.splice(h-i,0,"\n");
			}
		}
		text+=pattern.join("");
		document.getElementById("rle").value=text;
	break;
	case 2:
		document.getElementById("rle").value="";
	break;
	case 3:
		document.getElementById("rle").select();
		document.getElementById("rle").setSelectionRange(0, 99999);
		document.execCommand("copy");
	break;
	}
}

//input rules
function rule(ruleText){
	if(ruleText===1)ruleText=document.getElementById("rule").value;
	if(!ruleText)ruleText="B3/S23";
	if(ruleText){
		if(ruleText.split("/").length>=2){
			r=[ruleText.split("/")[0].split("")
			  ,ruleText.split("/")[1].split("")];
				
			if(isNaN(r[0][0])){
				if(r[0][0]==="B"||r[0][0]==="b"){
					r=[r[1],r[0]];
				}
				r[0].shift();
			}
			if(isNaN(r[1][0]))r[1].shift();
			
			if(ruleText.split("/")[2]){
				r.push(ruleText.split("/")[2].split(""),10);
				for(h=0;h<r[2].length;h++){
					if(isNaN(r[2][h])){
						r[2].splice(h,1);
						h--;
					}
				}
			}
		}else{
			ruleText=ruleText.split("");
			r=[[],[]];
			for(h=0;h<ruleText.length;h++){
				if(ruleText[h]==="s"||ruleText[h]==="S"){
					while(!isNaN(ruleText[h+1])&&h+1<ruleText.length){
						h++;
						r[0].push(ruleText[h]);
					}
				}
				if(ruleText[h]==="b"||ruleText[h]==="B"){
					while(!isNaN(ruleText[h+1])&&h+1<ruleText.length){
						h++;
						r[1].push(ruleText[h]);
					}
				}
				if(ruleText[h]==="g"||ruleText[h]==="G"){
					r.push([]);
					while(!isNaN(ruleText[h+1])&&h+1<ruleText.length){
						h++;
						r[2].push(ruleText[h]);
					}
				}
			}
		}
		if(r.length===2){
			r.push(2);
		}else{
			r[2]=parseInt(r[2].join(""),10);
		}
		for(h=0;h<r[0].length;h++)if(!isNaN(r[0][h]))r[0][h]=parseInt(r[0][h],10);
		for(h=0;h<r[1].length;h++)if(!isNaN(r[1][h]))r[1][h]=parseInt(r[1][h],10);
		
			//empty arrays which will set how the cell states update
		s.r=[[],[],r[2]];
		
		drawState(s.e);
		
		//for all 255 possible states of the 8 neighbors
		for(h=0;h<256;h++){
			//for both birth and survival states
			for(i=0;i<2;i++){
				//assume that the cell will be dead
				s.r[i].push(0);
				let abc=[-1,-1];
				//for each character in the rulestring
				for(j=0;j<r[i].length;j++){
					if(abc[0]===-1){
						if(r[i][j]===code[h][0]){
							abc[0]=r[i][j];
							s.r[i][h]=1;
						}
					}else{
						if(isNaN(r[i][j])){
							if(abc[1]===-1){
								if(r[i][j]==="-"){
									abc[1]=0;
									j++;
								}else{
									abc[1]=1;
									s.r[i][h]=0;
								}
							}
							if(r[i][j]===code[h][1]){
								if(abc[1]===1){
									s.r[i][h]=1;
								}else{
									s.r[i][h]=0;
								}
							}
						}else{
							break;
						}
					}
				}
			}
		}
		r=[ruleText];
	}
}

function main(){
	scaleCanvas();
	if(s.p!==0)gen();
	key();
	update();
	if(s.o.length>0)search();
	render();
	if(s.p===1||s.k[0])requestAnimationFrame(main);
}
requestAnimationFrame(main);