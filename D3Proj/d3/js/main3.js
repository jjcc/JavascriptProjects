   var isIE = false;//BrowserDetect.browser == 'Explorer';
    var chartWidth = 600;//860;
    var chartHeight = 480;//580;
    var xscale = d3.scale.linear().range([0, chartWidth]);
    var yscale = d3.scale.linear().range([0, chartHeight]);
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
	var color2 = d3.scale.category20c();
    var headerHeight = 20;
    var headerColor = "#04a";
    var transitionDuration = 500;
    var root;
    var node;
	var clsHdrClr = "#3f9cff";

    var treemap = d3.layout.treemap()
		.ratio([1.3])
        .round(true)
        .size([chartWidth, chartHeight])
        .sticky(true)
        .value(function(d) {
            var adjusted = d.size >=210? d.size/200:1.05
            return Math.log(adjusted); 
        });

    var svg = d3.select("#body")
        .append("svg:svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    var chart = svg.append("svg:g");

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
	
var mo = function(d) {
  var xPosition = d3.event.pageX + 25;
  var yPosition = d3.event.pageY + 5;

  if(d.parent === undefined) return;
  var pName = "#" + d.parent.code;
 
  if(d.type == "cls" ||d.type == "grp"){
	d3.select("#tooltip")
		.style("left", xPosition + "px")
		.style("top", yPosition + "px");
	d3.select("#tooltip #heading")
		.text(d.name);
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
	
  var popinfo = "涨跌:" + d.change ;	
  d3.select("#tooltip")
    .style("left", xPosition + "px")
    .style("top", yPosition + "px");
	d3.select("#tooltip #heading")
		.text(d.name);
	d3.select("#tooltip #percentage")
		.text(popinfo);	
	d3.select("#tooltip #revenue")
		.text("市值:" + d.size + "亿");				
/*      .text(d["demographics"]["Type description"] + "\n" + d["percentage"] + "%");
  d3.select("#tooltip #revenue")
    .text("��" + d["revenue"].toFixed(0));*/
  d3.select("#tooltip").classed("hidden", false);
  
  
  
};
    
/*	color = function(value) {
		absValue = value>=0?value*1:value*(-1);
		if(absValue >10) absValue = 10;
		 
		hex = Number(((10-absValue)*255/10).toFixed()).toString(16);
		if((10-absValue)*255/10<16) hex = "0"+hex;
		return value >=0? "#ff"+hex+hex:"#"+hex+"ff"+hex;
	}
*/		


    d3.json("data/datareal3Simple.json", function(data) {
	//d3.json("flare.json", function(data) {
        node = root = data;
        var nodes = treemap.padding([18, 1, 1, 1]).nodes(root);

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
			.attr("id",function(d){ return d.name;})
            .on("click", function(d) {
                zoom(d);
            })
            .on("mousemove",mo)
            .on("mouseout", function(d) {
                d3.select("#tooltip").classed("hidden", true);
            });
        parentEnterTransition.append("rect")
            .attr("width", function(d) {
              return Math.max(0.01, d.dx);
            })
            .attr("height", function(d) { return d.dy; })
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
                return "translate(" + d.dx + "," + d.y + ")";
            });
        parentUpdateTransition.select("rect")
            .attr("width", function(d) {
                return Math.max(0.01, d.dx);
            })
            .attr("height", function(d) { return d.dy; })
            .style("fill", function(d){ return d.type=="grp"?"#04a":d.type=="cls"?clsHdrClr:clsHdrClr});
        parentUpdateTransition.select(".foreignObject")
            .attr("width", function(d) {
				//console.log("parentUpdateTransition width called once" + d.name);
                return Math.max(0.01, d.dx);
            })
            .attr("height", function(d) { return d.dy; })
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
                //zoom(node === d.parent ? root : d.parent);
                var chooseRoot = (node === d.parent) || d.big;
                if (d.big)
                    d.big = false;
                zoom(chooseRoot ? root : d);
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
                return d.type == "cls"? "#ddd":d.type == "grp" ? "#04a" : color(d.change.slice(0,-1));
            });
		//var rsz = [],sz = [],dy = [],dx = [];			
        childEnterTransition.append('foreignObject')
            .attr("class", "foreignObject")
            .attr("width", function(d) {
                return Math.max(0.01, d.dx);
            })
            .attr("height", function(d) {
                return Math.max(0.01, d.dy);
            })
            .append("xhtml:body")
            .attr("class", "labelbody")
            .append("div")
			/*.style("font-size",function(d, i) {
				//console.log("name:" + d.name + ",dy:" + d.dy +",dx:" + d.dx + ",y:" + d.y + ",x:" + d.x + ",area:" +d.area);
				var size = Math.min(40, 0.25*Math.sqrt(d.area));  
				//var rsize = (size > 7 && d.dy > 12) ? size + "px":"7px";
				rsize = getFontSize(d.area,d.dy);
				
				//console.log("rsize,i:" + rsize + "," + i);
				rsz.push(rsize);
				sz.push(size);
				dy.push(d.dy);
				dx.push(d.dx);
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

        zoom(node);
    });


 



    //and another one
    function textHeight(d) {
        var ky = chartHeight / d.dy;
        yscale.domain([d.y, d.y + d.dy]);
        return (ky * d.dy) / headerHeight;
    }






    function zoom(d) {
		console.log("zoom once,type:" + d.type +",name:" + d.name);
		var zoomIn = false;
		if(d.type != "root")
			zoomIn = true;
			
        //this.treemap
            //.padding([headerHeight/(chartHeight/d.dy), 4, 4, 4])
			//.padding([18, 1, 1, 1])

        // moving the next two lines above treemap layout messes up padding of zoom result
        var kx = chartWidth  / d.dx;
        var ky = chartHeight / d.dy;
        var level = d;

        xscale.domain([d.x, d.x + d.dx]);
        yscale.domain([d.y, d.y + d.dy]);
		//yscale = d3.scale.linear().domain([d.y, d.y+12, d.y+d.dy]).range([0,15, chartHeight]);
		yscale0 = d3.scale.linear().domain([d.y,d.y+d.dy]).range([0,chartHeight]);
		yscale1 = d3.scale.linear().domain([d.y, d.y+14]).range([0,14]);
		//yscale2 = d3.scale.linear().domain([d.y+15, d.y+d.dy-2]).range([20, chartHeight-1]);
		yscale2 = d3.scale.linear().domain([d.y, d.y+d.dy-2]).range([0, chartHeight-1]);
		
		
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
				var realdy = yscale0(d.y);
				if(d.type == "elm")
					realdy = (d.y - d.parent.y) < 15? yscale1(d.y):yscale2(d.y);
                return "translate(" + xscale(d.x) + "," + realdy + ")";
            })
            .each("end", function(d, i) {
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
                return Math.max(0.01, kx * d.dx);
            })
            .attr("height", function(d) {
                return d.children ? (ky*d.dy) : Math.max(0.01, ky * d.dy);
            })
            .select(".labelbody .label")
            .text(function(d) {
				//console.log("xx,seting text:" + d.name + ",dy:" + d.dy +",dx:" + d.dx + ",y:" + d.y + ",x:" + d.x + ",area:" +d.area);
                //console.log("set text:" + d.name);
                var appended = zoomIn? "#z":"";
                return d.name + appended;
            });
        if (zoomIn){
            d.big = true;
            zoomTransition.select(".foreignObject")
            .select(".child .labelbody .label")
            .style("font-size", function(d){//"30px");
                var dtype = d.type;
                console.log("zoomIn, return bigger size");
                rsize = getFontSize(d.area,d.dy);
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
                var dtype = d.type;
				rsize = getFontSize(d.area,d.dy);
                console.log("zoomOut:right size,"+d.area.toPrecision(6) + ","+d.name);
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
                var newdx = kx *d.dx;
                //console.log("kx,newdx, old dx:" + kx +"," + newdx + "," + d.dx );
                return Math.max(0.01, kx * d.dx);
            })
            .attr("height", function(d) {
                return d.children ? (ky*d.dy) : Math.max(0.01, ky * d.dy);
            })
            .style("fill", function(d) {
                //return d.children ? color2(d.name) : d.type == "cls"? "#ddd":d.type == "grp" ? "#04a" : color(d.change.slice(0,-1));
				return  d.type =="root"?"#ffffff":d.type == "cls"? clsHdrClr:d.type == "grp" ? "#04a" : color(d.change.slice(0,-1));
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
        if(d.type == 'cls'){
            var children = d.children;
            d.children.map(function f(i){
                returnString +="<div class='stkname'>" + i.name +
                 "</div><div class='stkname'>(" + i.code + 
                 ")</div><div class='stkchange'>" + i.change + "</div><div style='clear:both'></div>\n"; 
                //console.log(i.name);
                });

        }
        //console.log("combined div string:" + returnString);
        return returnString;//"place holder for g";
    }

    function getAfterZoomContent(d){
            var returnString = "<div style='width:50px;'><a href='http://www.google.com' target='_blank'>" + d.name + "</a></div>";
            returnString += "<div style='width:50px;'>(" + d.code + ")</div>";
            returnString += "<div style='width:50px;'>H:" + d.dy + "</div>";
            returnString += "<div style='width:50px;'>w:" + d.dx + "</div>";
            return returnString;    
    }