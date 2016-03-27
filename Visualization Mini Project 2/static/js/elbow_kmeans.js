
function hist(number)
{	
    if(number %2 == 0)
    {  
        d3.csv("./static/data/K_Sum.csv",filterColumns,
                function(error, rows) {
                   console.log(rows);
                plot(rows,number);
            });
            function filterColumns(d){
                return {
                    k : +d.K,
                    sum : Math.round(+d.Sum*100)/100,
                };
            }
    }
    else
    {
        d3.csv("./static/data/K_Percentage.csv",filterColumns,
                function(error, rows) {
                   console.log(rows);
                plot(rows,number);
            });
        function filterColumns(d){
                return {
                    k : +d.K,
                    sum : Math.round(+d.Percentage*100)/100,
            };
    }
    }
}

function plot(csvdata,number)
{
    var zero = d3.format("02d");
    var maxbin = 50
    var minbin = 1
    var numbins = 50

    var yLabel = "";
    if(number %2 == 0)
        yLabel = "Average intra-cluster sum of squares";
    else
        yLabel = "Percentage of variance explained";

    var margin = {top: 20, right: 30, bottom: 30, left: 50},
    w = 960 - margin.left - margin.right,
    h = 500 - margin.top - margin.bottom;

    d3.select("svg").remove();
    d3.select(".chart").remove() 

    var binsize = (maxbin - minbin) / numbins;
    console.log("bin size",binsize);
    
    // whitespace on either side of the bars
    binmargin = parseFloat(binsize/numbins); 
    // Set the limits of the x axis
    var xmin = minbin - 1;
    var xmax = maxbin + 1;

    var x = d3.scale.linear()
	  .domain([0, (xmax - xmin)])
	  .range([0, w - 2*margin.right -margin.left - 100]);

    // Scale for the placement of the bars
    var x2 = d3.scale.linear()
	  .domain([xmin, xmax])
	  .range([0, w - 2*margin.right -margin.left - 100 ]);
	
    var y = d3.scale.linear()
	  .domain([0, d3.max(csvdata, function(d) { 
						return d.sum; 
						})])
	  .range([h - margin.bottom, 0]);

    var xAxis = d3.svg.axis()
	  .scale(x2)
//	  .ticks(Math.floor(numbins*1.5))
	  .orient("bottom");
    var yAxis = d3.svg.axis()
	  .scale(y)
	  .ticks(10)
	  .orient("left");
    
    
    svg = d3.select("body")
		.append("svg")
		.attr("width",w + margin.left + margin.right)
		.attr("height",h + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + 2*margin.left + "," + margin.top*3 + ")");

    svg.append("text")
    .attr("x", (w / 2))             
    .attr("y", 0 - margin.top)
    .attr("text-anchor", "middle")  
    .style("fill", '#0099cc')
    .style("font-size", "16px") 
    .style("text-decoration", "underline")  
    .text("Number of Clusters - K-value");
    
    plotBars();
	   
    function plotBars(){

    	var bar = svg.append("g")
    	.attr("class","bars")
    	.selectAll(".bar")
       .data(csvdata)
       .enter()
       .append("g")
       .attr("class","bar");
    	
    	bar.append("rect")
    	.attr("x", function(d,i){
    		return x(i*binsize + binmargin);
    	})
        .style("fill",function(d,i){
            if (i == 7)
                return "orange"; 
            else
                return "#99ffcc";
        })
    	.attr("y",function(d){
    		return  y(d.sum);
    	} )
    	.attr("width", x(binsize - 2 * binmargin))
    	.attr("height", function(d){
    		return h - margin.bottom - y(d.sum);
    	});
    		
    	bar.on("mouseover",function(d){
    		   var bar  = d3.select(this);
    		   console.log(bar);
    		   highlightBar(svg,bar,d);
    	   })
    	   .on("mouseout",function(d){
    		   var rect = d3.select(this);
    		   setTimeout(restoreBar(rect,d,y(d.sum),x(binsize - 2 * binmargin)),200);
    		});
    	
    }
    
    console.log("Num bins:",numbins)
    
	var xlabels = svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (h - margin.bottom) + ")")
    .call(xAxis);
	
    xlabels.selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
        return "rotate(-30)";});
    
    svg.append("text")
    .attr("class", "x label")
    .attr("x", w - 2*margin.right - 2*margin.left)
    .attr("y",h -margin.bottom - 6)
    .style("text-anchor", "end")
    .text("K-value");
    
    svg.append("text")
    .attr("x", w)
    .attr("y",h - 2*margin.top - 48)
    .style("text-anchor", "end")
    .style('font-size', '14px');
    
	svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);
	
	svg.append("text")
	.attr("class","y label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(yLabel);
    


    function highlightBar(svg,bar,d){
    	console.log("Highlight Bar", d.sum);
    	var rect = bar.select("rect");
    	
    	var x = Math.floor(Number(rect.attr("x"))); //+ Number(binsize/2));
    	var y = Math.floor(Number(rect.attr("y")) + 14);
    	var height = Math.round(Number(rect.attr("height")));
    	var width = Math.round(Number(rect.attr("width")));

    	rect.style("fill","teal")
    	.style("stroke","orange")
    	.style("stroke-width",2)
    	.attr("width", (width + 2))
    	.attr("height",function(d){
    		return height + 6; 
    	})
    	.attr("y", function(value){
    		return y - 20;
    	});


    	console.log("x,y",x,y);
    	bar.append("text")
    		   .attr("font-family", "sans-serif")
    		   .attr("transform","translate(" + (x + width/2) + "," + y + ") rotate(-30)")
    		   .style('text-anchor', 'middle')
    		   .style('font-size', '14px')
    		   .style('fill','black')
    		   .text(function(d){
    		   console.log("text" ,d.startValue, d.endValue);
    		   console.log(d.sum);
    		   return d.sum;
    	   });	
    	
    }



    function restoreBar(bar,d, height, width){
					console.log("Restore Bar", d.sum);
					
					bar.selectAll("text").remove();
					var rect = bar.select("rect");
					
					rect.style("fill", function(d){
                        if (d.k == 8)
                            return "orange";
                        else
                            return "#99ffcc";
                        })
						.style("stroke-width",0)
						.attr("width",width)
						.attr("height",function(d){
							 return h - margin.bottom - height;
						})
						.attr("y", function(d){
							return height;
						});
    }
}





