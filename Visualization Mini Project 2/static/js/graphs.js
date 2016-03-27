sample_type = "";

function plotloandata(sampling_type, dimred_type, mds_type)
{
  url = "/loans/"+sampling_type;
  addToQueue(url,dimred_type,sampling_type,mds_type);
}


function addToQueue(url,dimred_type,sampling_type,mds_type)
{

  console.log(url);
  console.log(dimred_type);

  d3.select(".chart").remove();
  if(dimred_type=="MDS")
      route = url+"?dimred="+dimred_type+"&mdstype="+mds_type;
  else
      route = url+"?dimred="+dimred_type;

  sample_type = sampling_type;
  //alert(route);


  queue()
      .defer(d3.json, route)
      .await(makeGraphs);
}

function wordcloud(){

    //alert(" word clod");
    d3.select(".chart").remove();

    sample_type = "text";
    route = "/word_clouds";
    queue()
      .defer(d3.json, route)
      .await(makeClouds);

    function makeClouds(error,freq_list)
    {
        console.log(freq_list);

        var color = d3.scale.category10();
        d3.layout.cloud().size([800, 300])
                .words(freq_list)
                .rotate(0)
                .fontSize(function(d) { return d.size; })
                .on("end", draw)
                .start();


        function draw(words) {

          var margin = {top: 20, right: 20, bottom: 30, left: 100},
                  width = 1260 - margin.left - margin.right,
                  height = 500 - margin.top - margin.bottom;

            var svg = d3.select("body").append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .attr("class", "chart")
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                  svg
                    .attr("class", "wordcloud")
                    .append("g")
                    // without the transform, words words would get cutoff to the left and top, they would
                    // appear outside of the SVG area
                    .attr("transform", "translate(320,200)")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function(d) { return d.size + "px"; })
                    .style("fill", function(d, i) { return color(i); })
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function(d) { return d.text; });

                  svg.append("text")
                      .attr("x", (width / 2)-10)             
                      .attr("y", 12- margin.top)
                      .attr("text-anchor", "middle")  
                      .style("fill", '#0099cc')
                      .style("font-size", "16px") 
                      .style("text-decoration", "underline")  
                      .text("Most commonly used words on Amazon Food Reviews");

        }
    }


}
function textviz(){

    d3.select(".chart").remove();

    sample_type = "text";
    route = "/text_analytics";
    queue()
      .defer(d3.json, route)
      .await(makeGraphs);

}
function makeGraphs(error, projectsJson) {
      
      var margin = {top: 20, right: 20, bottom: 30, left: 100},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

      // setup x 
      var xValue = function(d) { return d.pc1;}, // data -> value
          xScale = d3.scale.linear().range([0, width]), // value -> display
          xMap = function(d) { return xScale(xValue(d));}, // data -> display
          xAxis = d3.svg.axis().scale(xScale).orient("bottom");

      // setup y
      var yValue = function(d) { return d.pc2;}, // data -> value
          yScale = d3.scale.linear().range([height, 0]), // value -> display
          yMap = function(d) { return yScale(yValue(d));}, // data -> display
          yAxis = d3.svg.axis().scale(yScale).orient("left");

    // setup fill color

      var color = d3.scale.category10();
      d3.select(".chart").remove();
      //d3.select("svg").remove();
      var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "chart")
        .style("fill", '#0099cc')
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        if(sample_type=="text"){
          svg.append("text")
              .attr("x", (width/ 2))             
              .attr("y", 12 - margin.top)
              .attr("text-anchor", "middle")  
              .style("fill", '#0099cc')
              .style("font-size", "16px") 
              .style("text-decoration", "underline")  
              .text("Amazon Food Reviews : Rating range 1-5");
            }
          else{
            svg.append("text")
                      .attr("x", (width / 2))             
                      .attr("y", 12 - margin.top)
                      .attr("text-anchor", "middle")  
                      .style("fill", '#0099cc')
                      .style("font-size", "16px") 
                      .style("text-decoration", "underline")  
                      .text("Prosper Loan Data " + sample_type+" Sampling ");
          }
    // add the tooltip area to the webpage
      var tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);


      //alert(sample_type);
      //Clean projectsJson data
      // console.log(projectsJson);
      var data = projectsJson;
      data.forEach(function(d) {
    
          d.pc1 = d['pc1'];
          d.pc2 = d['pc2'];

          if(sample_type=="Random"){
              d.cluster = Math.floor(Math.random()*10);
              d.label = "";
            }
          else if (sample_type=="Adaptive"){
              d.cluster = d["cluster"];
              d.label = "";
            }
          else if(sample_type=="text"){
              d.label = d["label"]
              d.cluster = d['cluster']
            }
       });


      xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
      yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);



        svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
          .append("text")
          .attr("class", "label")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end")
          .text("Component 1");

          


        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
          .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Component 2")

        svg.selectAll(".dot")
          .data(data)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", xMap)
          .attr("cy", yMap)
          .style("fill", function(d) { 
            return color(d.cluster);
        }) 
          .on("mouseover", function(d) {
            console.log(d.label);
            
            d3.select(this)
            .transition()
            .attr('r',8);
              tooltip.transition()
               .duration(200)
               .style("opacity", .9);
              tooltip.html( d.label + " \n (" + Math.round(xValue(d)*100)/100 
              + ", " + Math.round(yValue(d)*100)/100 + ")")
                   .style("left", (d3.event.pageX + 5) + "px")
                   .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
            d3.select(this)
            .transition()
            .attr('r',3.5);
              tooltip.transition()
                   .duration(500)
                   .style("opacity", 0);
          });

      // draw legend
        var legend = svg.selectAll(".legend")
          .data(color.domain())
          .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      // draw legend colored rectangles
        legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color);

      // draw legend text
        legend.append("text")
          .attr("x", width - 24)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d;})
      
    
}