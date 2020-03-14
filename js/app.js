$(document).ready(function(){
	// globals
	
	const el = document.getElementById("graphdiv")


	function downV3(event, g, context) {
	  context.initializeMouseDown(event, g, context);
	  if (event.altKey || event.shiftKey) {
	    Dygraph.startZoom(event, g, context);
	  } else {
	    Dygraph.startPan(event, g, context);
	  }
	}

	function moveV3(event, g, context) {
	  if (context.isPanning) {
	    Dygraph.movePan(event, g, context);
	  } else if (context.isZooming) {
	    Dygraph.moveZoom(event, g, context);
	  }
	}

	function upV3(event, g, context) {
	  if (context.isPanning) {
	    Dygraph.endPan(event, g, context);
	  } else if (context.isZooming) {
	    Dygraph.endZoom(event, g, context);
	  }
	}

	function restorePositioning(g) {
	  g.updateOptions({
	    dateWindow: null,
	    valueRange: null
	  });
	}

	function dblClickV4(event, g, context) {
	  restorePositioning(g);
	}


	const opts = {
		drawPoints: true,
		labels:["Date","Susceptible","Infected","Recovered"],
		"width":800,
		series:{
			"Infected":{axis:"y2"}
		},
		interactionModel:{
			'mousedown' : downV3,
            'mousemove' : moveV3,
            'mouseup' : upV3,
              'dblclick' : dblClickV4,
		},
		colors:["blue","red","green"],
		labelsDiv:document.getElementById("legend"),
		hideOverlayOnMouseOut:false,
		labelsSeparateLines:true,
		xlabel:"Date",
		ylabel:"Susceptible & Recovered",
		y2label:"Infected",
		axes:{
			x:{
				valueFormatter: function(ms){
					let dt = new Date(ms).toISOString().split("T")[0]

					return "Date: "+dt
				}
			},
			y:{
				valueFormatter:function(y){
					// Susceptible & recovered
					return numberWithCommas(Math.round(y))
				},
				axisLabelFormatter: function(y) {
                  return numberWithCommas(Math.round(y))
                },
                axisLabelWidth:100
			},
			y2:{
				// Infected
				valueFormatter:function(y){
					return numberWithCommas(Math.round(y))
				},
				axisLabelFormatter: function(y) {
                  return numberWithCommas(Math.round(y))
                },
				axisLabelWidth:100
			}
		}
	}

	// init
	loadFromLocalStorage()
	runSim()
	

	// Calc
	function calcX(){
		const L = parseFloat($("#L").val())
		const beta = parseFloat($("#beta").val())
		const gamma = parseFloat($("#gamma").val())

		const S0 = parseFloat($("#S0").val())
		const I0 = parseFloat($("#I0").val())
		const R0 = parseFloat($("#R0").val())

		
		let X = []
		X.push({"t":0,"S":S0,"I":I0,"R":R0})
		for(let n=1;n<L;++n){
			X.push({
				"t":n,
				"S":X[n-1].S-(X[n-1].S/S0)*beta*X[n-1].I,
				"I":X[n-1].I+(X[n-1].S/S0)*beta*X[n-1].I-X[n-1].I*gamma,
				"R":X[n-1].R+X[n-1].I*gamma
			})
		}

		return X
	}

	function transformData(X){
		let tX = []
		var t = new Date()
		for(var i=0;i<X.length;++i){
			let dt = new Date(t.getTime()+i*1000*60*60*24)
			tX.push(
				[
				dt,
				X[i].S,
				X[i].I,
				X[i].R
				]
			)
		}
		return tX
	}

	// Handlers
	$("#run").click(function(){
		runSim()
	})

	$("#reset").click(function(){
		localStorage.setItem("inputs",null)
		location.reload()
	})

	$("input").keypress(function(e){
		if( e.which === 13 ){
			runSim()
		}
	})

	$("input").blur(function(e){
		persistToLocalStorage()
	})

	function runSim(){
		let X = calcX()
		let tX = transformData(X)
		const g = new Dygraph(document.getElementById("graphdiv"),tX,opts)
	}

	// util
	function persistToLocalStorage(){
		const L = parseFloat($("#L").val())
		const beta = parseFloat($("#beta").val())
		const gamma = parseFloat($("#gamma").val())

		const S0 = parseFloat($("#S0").val())
		const I0 = parseFloat($("#I0").val())
		const R0 = parseFloat($("#R0").val())

		var inputs = {
			L,beta,gamma,S0,I0,R0
		}
		localStorage.setItem("inputs",JSON.stringify(inputs))
	}

	function loadFromLocalStorage(){
		const inputsStr = localStorage.getItem("inputs")
		if( inputsStr && JSON.parse(inputsStr)){
			const inputs = JSON.parse(inputsStr)
			$("#L").val(inputs.L)
			$("#beta").val(inputs.beta)
			$("#gamma").val(inputs.gamma)
			$("#S0").val(inputs.S0)
			$("#I0").val(inputs.I0)
			$("#R0").val(inputs.R0)
		}
	}

	function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	}

	function offsetToPercentage(g, offsetX, offsetY) {
	  // This is calculating the pixel offset of the leftmost date.
	  var xOffset = g.toDomCoords(g.xAxisRange()[0], null)[0];
	  var yar0 = g.yAxisRange(0);

	  // This is calculating the pixel of the higest value. (Top pixel)
	  var yOffset = g.toDomCoords(null, yar0[1])[1];

	  // x y w and h are relative to the corner of the drawing area,
	  // so that the upper corner of the drawing area is (0, 0).
	  var x = offsetX - xOffset;
	  var y = offsetY - yOffset;

	  // This is computing the rightmost pixel, effectively defining the
	  // width.
	  var w = g.toDomCoords(g.xAxisRange()[1], null)[0] - xOffset;

	  // This is computing the lowest pixel, effectively defining the height.
	  var h = g.toDomCoords(null, yar0[0])[1] - yOffset;

	  // Percentage from the left.
	  var xPct = w === 0 ? 0 : (x / w);
	  // Percentage from the top.
	  var yPct = h === 0 ? 0 : (y / h);

	  // The (1-) part below changes it from "% distance down from the top"
	  // to "% distance up from the bottom".
	  return [xPct, (1-yPct)];
	}

	
})

