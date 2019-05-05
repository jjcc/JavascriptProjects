   var isIE = false;//BrowserDetect.browser == 'Explorer';
    var chartWidth = 600;//860;
    var chartHeight = 480;//580;
    var xscale = d3.scaleLinear().range([0, chartWidth]);
    var yscale = d3.scaleLinear().range([0, chartHeight]);
    var color = function(value) {
		absValue = value>=0?value*1:value*(-1);
		if(absValue >10) absValue = 10;
		 
		hex = Number(((10-absValue)*255/10).toFixed()).toString(16);
		if((10-absValue)*255/10<16) hex = "0"+hex;
		//return value >=0? "#ff"+hex+hex:"#"+hex+"ff"+hex;
		var c = value >=0? "#ff"+hex+hex:"#"+hex+"ff"+hex;
		if(c.search("NaN")>=0)
			console.log("Wrong!");
		return c;
	}
	//var color2 = d3.scaleOrdinal().range(d3.schemeCategory20c);
    var headerHeight = 20;
    var headerColor = "#04a";
    var transitionDuration = 500;
    var root;
    var node;
	var clsHdrClr = "#3f9cff";

    var treemap = d3.treemap()
		//.ratio([1.3])
		.tile(d3.treemapResquarify.ratio(1.8))
        .round(true)
        .size([chartWidth, chartHeight])
        .paddingTop(18);
        //.sticky(true)
        //.value(function(d) {
        //    var adjusted = d.size >=210? d.size/200:1.05
        //    return Math.log(adjusted); 
        //});

    var svg = d3.select("#body")
        .append("svg:svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    var chart = svg.append("svg:g");
    function visualize(dataInput) {
		var defs = svg.append("defs");

		var filter = defs.append("svg:filter")
			.attr("id", "outerDropShadow")
			.attr("x", "-20%")
			.attr("y", "-20%")
			.attr("width", "140%")
			.attr("height", "140%");

		filter.append("svg:feOffset")
			.attr("result", "offOut")
			.attr("in", "SourceGraphic")
			.attr("dx", "1")
			.attr("dy", "1");

		filter.append("svg:feColorMatrix")
			.attr("result", "matrixOut")
			.attr("in", "offOut")
			.attr("type", "matrix")
			.attr("values", "1 0 0 0 0 0 0.1 0 0 0 0 0 0.1 0 0 0 0 0 .5 0");

		filter.append("svg:feGaussianBlur")
			.attr("result", "blurOut")
			.attr("in", "matrixOut")
			.attr("stdDeviation", "3");

		filter.append("svg:feBlend")
			.attr("in", "SourceGraphic")
			.attr("in2", "blurOut")
			.attr("mode", "normal");
		
	 
	/*	color = function(value) {
			absValue = value>=0?value*1:value*(-1);
			if(absValue >10) absValue = 10;
			 
			hex = Number(((10-absValue)*255/10).toFixed()).toString(16);
			if((10-absValue)*255/10<16) hex = "0"+hex;
			return value >=0? "#ff"+hex+hex:"#"+hex+"ff"+hex;
		}
	*/		
		console.log("Before loading data..");

		d3.json(dataInput).then(function(data) {
			console.log("Loading data..");
		//d3.json("flare.json", function(data) {
			node = root = data;


			root = d3.hierarchy(data, (d) => d.children)
				.sum(function(d) {
						var adjusted = d.size >=210? d.size/200:1.05
						var val = Math.log(adjusted);
						if (d.type != "elm")
							val = 0;
						console.log("code:" + d.code + ",value:" +val);
						return val;
					});
			node = root;
			var nodes = treemap(root).descendants();

			var children = nodes.filter(function(d) {
				return !d.children;
			});
			var parents = nodes.filter(function(d) {
				return d.children;
			});

			// create parent cells
			var parentCells = chart.selectAll("g.cell.parent")
				.data(parents, function(d) {
					return "p-" + d.name;
				});
			var parentEnterTransition = parentCells.enter()
				.append("g")
				.attr("class", "cell parent")
				.attr("id",function(d){ return d.data.name;})
				.on("click", function(d) {
					zoom(d,chartWidth,chartHeight);
				})
				.on("mousemove",mo)
				.on("mouseout", function(d) {
					d3.select("#tooltip").classed("hidden", true);
				});
			parentEnterTransition.append("rect")
				.attr("width", function(d) {
				  return Math.max(0.01, (d.x1-d.x0));
				})
				.attr("height", function(d) { return (d.y1-d.y0); })
				.style("fill", function(d){ return d.type == "grp" ?"#04a":clsHdrClr});
			parentEnterTransition.append('foreignObject')
				.attr("class", "foreignObject")
				.append("xhtml:body")
				.attr("class", "labelbody")
				.append("div")
				.attr("class", "label");
			// update transition
			var parentUpdateTransition = parentCells.transition().duration(transitionDuration);
			parentUpdateTransition.select(".cell")
				.attr("transform", function(d) {
					console.log("parentUpdateTransition");
					var tr = "translate(" + (d.x1-d.x0) + "," + d.y0 + ")";
					console.log(tr);
					return tr;
				});
			parentUpdateTransition.select("rect")
				.attr("width", function(d) {
					return Math.max(0.01, (d.x1-d.x0));
				})
				.attr("height", function(d) { return (d.y1-d.y0); })
				.style("fill", function(d){ return d.type=="grp"?"#04a":d.type=="cls"?clsHdrClr:clsHdrClr});
			parentUpdateTransition.select(".foreignObject")
				.attr("width", function(d) {
					//console.log("parentUpdateTransition width called once" + d.name);
					return Math.max(0.01, (d.x1-d.x0));
				})
				.attr("height", function(d) { return (d.y1-d.y0); })
				.select(".labelbody .label")
				.style("font-size","6px");
			// remove transition
			parentCells.exit()
				.remove();

			// create children cells
			var childrenCells = chart.selectAll("g.cell.child")
				.data(children, function(d) {
					return "c-" + d.name;
				});
			// enter transition
			var childEnterTransition = childrenCells.enter()
				.append("g")
				.attr("class", "cell child")
				.on("click", function(d) {
					zoom(node === d.parent ? root : d.parent, chartWidth,chartHeight);
				})
			   .on("mouseover", function(d) {
					this.parentNode.appendChild(this); // workaround for bringing elements to the front (ie z-index)
					d3.select(this)
						.attr("filter", "url(#outerDropShadow)")
						.select(".background")
						.style("stroke", "#000000");
						//highlight the parent id
						chart.select("g.cell.parent#" + d.parent.name).select("rect").style("fill","#40f");
					
				})
				.on("mousemove", mo)
				.on("mouseout", function(d) {
					d3.select("#tooltip").classed("hidden", true);
					d3.select(this)
						.attr("filter", "")
						.select(".background")
						.style("stroke", "#FFFFFF");
					chart.select("g.cell.parent#" + d.parent.name).select("rect").style("fill",function(d){ return d.type=="grp"?"#04a":clsHdrClr});
				});
			childEnterTransition.append("rect")
				.classed("background", true)
				.style("fill", function(d) {
					return d.data.type == "cls"? "#ddd":d.data.type == "grp" ? "#04a" : color(d.data.change.slice(0,-1));
				});
			//var rsz = [],sz = [],dy = [],dx = [];			
			childEnterTransition.append('foreignObject')
				.attr("class", "foreignObject")
				.attr("width", function(d) {
					return Math.max(0.01, (d.x1-d.x0));
				})
				.attr("height", function(d) {
					return Math.max(0.01, (d.y1-d.y0));
				})
				.append("xhtml:body")
				.attr("class", "labelbody")
				.append("div")
				/*.style("font-size",function(d, i) {
					//console.log("name:" + d.name + ",dy:" + (d.y1-d.y0) +",dx:" + (d.x1-d.x0) + ",y:" + d.y + ",x:" + d.x + ",area:" +d.area);
					var size = Math.min(40, 0.25*Math.sqrt(d.area));  
					//var rsize = (size > 7 && (d.y1-d.y0) > 12) ? size + "px":"7px";
					rsize = getFontSize(d.area,(d.y1-d.y0));
					
					//console.log("rsize,i:" + rsize + "," + i);
					rsz.push(rsize);
					sz.push(size);
					dy.push((d.y1-d.y0));
					dx.push((d.x1-d.x0));
					return rsize + "px"})	*/		
				.attr("class", "label");

			if (isIE) {
				childEnterTransition.selectAll(".foreignObject .labelbody .label")
					.style("display", "true");
			} else {
				childEnterTransition.selectAll(".foreignObject")
					.style("display", "true");
			}


			// exit transition
			childrenCells.exit()
				.remove();

			d3.select("select").on("change", function() {
				//console.log("select zoom(node)");
				treemap.value(this.value == "size" ? size : count)
					.nodes(root);
				zoom(node,chartWidth,chartHeight);
			});

			zoom(node,chartWidth,chartHeight);
		});
	};


  var mo = function(d) {
  var xPosition = d3.event.pageX + 25;
  var yPosition = d3.event.pageY + 5;

  if(d.parent === undefined) return;
  //var pName = "#" + d.parent.data.code;
 
  if(d.data.type == "cls" ||d.data.type == "grp"){
	d3.select("#tooltip")
		.style("left", xPosition + "px")
		.style("top", yPosition + "px");
	d3.select("#tooltip #heading")
		.text(d.data.name);
    d3.select("#tooltip #percentage")
        //.html("<p>"+getGroupText(d)+"</p>");
        .html( getGroupText(d));
        //.text(getGroupText(d))
		//.text("place holder for percentage of cls/grp");	
	d3.select("#tooltip #revenue")
		.text("");		
	d3.select("#tooltip").classed("hidden", false);
		return;
 }
	
  var popinfo = "涨跌:" + d.data.change ;	
  d3.select("#tooltip")
    .style("left", xPosition + "px")
    .style("top", yPosition + "px");
	d3.select("#tooltip #heading")
		.text(d.data.name);
	d3.select("#tooltip #percentage")
		.text(popinfo);	
	d3.select("#tooltip #revenue")
		.text("市值:" + d.data.size + "亿");				
/*      .text(d["demographics"]["Type description"] + "\n" + d["percentage"] + "%");
  d3.select("#tooltip #revenue")
    .text("��" + d["revenue"].toFixed(0));*/
  d3.select("#tooltip").classed("hidden", false);
  
  
  
};
   



    //and another one
    function textHeight(d) {
        var ky = chartHeight / (d.y1-d.y0);
        yscale.domain([d.y, d.y + (d.y1-d.y0)]);
        return (ky * (d.y1-d.y0)) / headerHeight;
    }


    function getRGBComponents (color) {
        var r = color.substring(1, 3);
        var g = color.substring(3, 5);
        var b = color.substring(5, 7);
        return {
            R: parseInt(r, 16),
            G: parseInt(g, 16),
            B: parseInt(b, 16)
        };
    }


    function idealTextColor (bgColor) {
        var nThreshold = 105;
        var components = getRGBComponents(bgColor);
        var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);
        return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
    }




    function zoom(d, chartWidth,chartHeight) {
		console.log("zoom once,type:" + d.data.type +",name:" + d.data.name);
		var zoomIn = false;
		if(d.data.type != "root")
			zoomIn = true;
		var upOffset = 18;		
        //this.treemap
            //.padding([headerHeight/(chartHeight/(d.y1-d.y0)), 4, 4, 4])
            //.padding([18, 1, 1, 1])
            //.paddingTop(30);

        // moving the next two lines above treemap layout messes up padding of zoom result
        var kx = chartWidth  / (d.x1 - d.x0);
        var ky = chartHeight / (d.y1 - d.y0);
        var kyParent = ky;
		var level = d;

        xscale.domain([d.x0, d.x1]);
        yscale.domain([d.y0, d.y1]);
		//yscale = d3.scale.linear().domain([d.y, d.y+12, d.y+(d.y1-d.y0)]).range([0,15, chartHeight]);
		yscale0 = d3.scaleLinear().domain([d.y0, d.y1]).range([0,chartHeight]);
		yscale1 = d3.scaleLinear().domain([d.y0, d.y0+14]).range([0,14]);
		yscale2 = d3.scaleLinear().domain([d.y0+15, d.y1-2]).range([20, chartHeight-1]);
		if (zoomIn) {

			var vHeight = (chartHeight - 20) *(d.y1 - d.y0)/((d.y1 - d.y0) - 18);
			kyParent = chartHeight / (d.y1 - d.y0);
			ky = (chartHeight - 20)/((d.y1 - d.y0) - upOffset);
			yscale0 = d3.scaleLinear().domain([d.y0,d.y1]).range([0,chartHeight]);
			yscale2 = d3.scaleLinear().domain([d.y0 + upOffset , d.y1]).range([20, chartHeight]);
			yscale1 = d3.scaleLinear().domain([d.y0, d.y1]).range([-20, chartHeight+60]);
		}
		
        if (node != level) {
            if (isIE) {
                chart.selectAll(".cell.child .foreignObject .labelbody .label")
                    .style("display", "true");
            } else {
                chart.selectAll(".cell.child .foreignObject")
                    .style("display", "true");
            }
        }

        var zoomTransition = chart.selectAll("g.cell").transition().duration(transitionDuration)
            .attr("transform", function(d) {
				var realdy = yscale0(d.y0);
				if(d.data.type == "elm")
                    realdy = (d.y0 - d.parent.y0) < 15? yscale1(d.y0):yscale2(d.y0);
                var tr = "translate(" + xscale(d.x0) + "," + realdy + ")"; 
                console.log(tr);
                return tr;
            })
            .each(function(d, i) {
	            if (!i && (level !== self.root)) {


                    if (isIE) {
                        chart.selectAll(".cell.child")
                            .filter(function(d) {
                                return d.parent === self.node; // only get the children for selected group
                            })
                            .select(".foreignObject .labelbody .label")
                            .style("display", "")
                    } else {
                        chart.selectAll(".cell.child")
                            .filter(function(d) {
                                return d.parent === self.node; // only get the children for selected group
                            })
                            .select(".foreignObject")
                            .style("display", "")
                    }
                }
            });

        zoomTransition.select(".foreignObject")
		//chart.selectAll(".parent").select(".foreignObject")
            .attr("width", function(d) {
                return Math.max(0.01, kx * (d.x1- d.x0));
            })
            .attr("height", function(d) {
                return d.children ? (ky*(d.y1 -d.y0)) : Math.max(0.01, ky * (d.y1 - d.y0));
            })
            .select(".labelbody .label")
            .text(function(d) {
				//console.log("xx,seting text:" + d.name + ",dy:" + (d.y1-d.y0) +",dx:" + (d.x1-d.x0) + ",y:" + d.y + ",x:" + d.x + ",area:" +d.area);
                //console.log("set text:" + d.name);
                var appended = zoomIn? "#z":"";
                return d.data.name + appended;
            });
        if (zoomIn){
            d.big = true;
            zoomTransition.select(".foreignObject")
            .select(".child .labelbody .label")
            .style("font-size", function(d){//"30px");
                var dtype = d.type;
                console.log("zoomIn, return bigger size");
                var area = (d.x1-d.x0)*(d.y1 - d.y0);
                rsize = getFontSize(area,(d.y1-d.y0));
                bigrsize = Math.min(rsize * 1.5,40);

                return bigrsize + "px";    
            });
            console.log("yes zoomIn,append new div");
            d3.selectAll(".child").select(".labelbody")
            .append("div")
            .attr("class","stkatt")
            .html(function(d){
                return getAfterZoomContent(d);
            });
        }

        if (!zoomIn){
            zoomTransition.select(".foreignObject")
            .select(".child .labelbody .label")
            .style("font-size", function(d){//"30px");
                var dtype = d.data.type;
                var dy = d.y1-d.y0;
                var area = (d.x1-d.x0)* dy;
				rsize = getFontSize(area,dy);
                console.log("zoomOut:right size,"+ area.toPrecision(6) + ","+d.name);
                return rsize + "px";    
            });
            d3.selectAll(".stkatt").remove();
        }    
/*		function size(d) {
			return d.size;
		}


		function count(d) {
			return 1;
		}*/
        // update the width/height of the rects
        zoomTransition.select("rect")
            .attr("width", function(d) {
                var newdx = kx *(d.x1-d.x0);
                //console.log("kx,newdx, old dx:" + kx +"," + newdx + "," + (d.x1-d.x0) );
                return Math.max(0.01, kx * (d.x1-d.x0));
            })
            .attr("height", function(d) {
                return d.children ? (ky*(d.y1-d.y0)) : Math.max(0.01, ky * (d.y1-d.y0));
            })
            .style("fill", function(d) {
                //return d.children ? color2(d.name) : d.type == "cls"? "#ddd":d.type == "grp" ? "#04a" : color(d.change.slice(0,-1));
				return  d.data.type =="root"?"#ffffff":d.data.type == "cls"? clsHdrClr:d.data.type == "grp" ? "#04a" : color(d.data.change.slice(0,-1));
			});

        node = d;

        if (d3.event) {
            d3.event.stopPropagation();
        }
        console.log("zoom function end");
    }
	
	function getFontSize(area,dy){
		var size = Math.min(40, 0.25*Math.sqrt(area));  
        var rsize = (size > 7 && dy > 12) ? size : 7;
        //console.log("getFontSize:" + rsize);
		return rsize;
    }
    

    function getGroupText(d){
        var returnString = ""
        //console.log("in group text:" + d.name);
        if(d.data.type == 'cls'){
            var children = d.children;
            d.children.map(function f(i){
                returnString +="<div class='stkname'>" + i.data.name +
                 "</div><div class='stkname'>(" + i.data.code + 
                 ")</div><div class='stkchange'>" + i.data.change + "</div><div style='clear:both'></div>\n"; 
                //console.log(i.name);
                });

        }
        //console.log("combined div string:" + returnString);
        return returnString;//"place holder for g";
    }

    function getAfterZoomContent(d){
            var returnString = "<div style='width:50px;'><a href='http://www.google.com' target='_blank'>" + d.data.name + "</a></div>";
            returnString += "<div style='width:50px;'>(" + d.data.code + ")</div>";
            returnString += "<div style='width:50px;'>H:" + (d.y1-d.y0) + "</div>";
            returnString += "<div style='width:50px;'>w:" + (d.x1-d.x0) + "</div>";
            return returnString;    
    }