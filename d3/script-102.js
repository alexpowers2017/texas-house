"use strict";

let map;

// set color fills for precincts
var color = d3.scaleQuantize()
              //.range(['#deebf7', '#08519c']);
              .range(['#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b']);
var formatAsPercentage = d3.format(".01%");

d3.csv("data/population-102.csv", function(data) {
    console.log(d3.min(data, function(d) { return parseFloat(d.Total); }));
    console.log(d3.max(data, function(d) { return parseFloat(d.Total); }));

  color.domain([
    d3.min(data, function(d) { return parseFloat(d.Total); }),
    d3.max(data, function(d) { return parseFloat(d.Total); })
  ])


  d3.json("data/Precinct13.json", function(json) {


    for (var i=0; i < data.length; i++) {

      var dataPrecinct = data[i].Precinct;
      var dataPop = data[i].Total;


      for (var j=0; j < json.features.length; j++) {

        var jsonPrecinct = json.features[j].properties.PCT;


        if (dataPrecinct == jsonPrecinct) {
          json.features[j].properties.pop = dataPop;
        }
      }

    }



    var map = new google.maps.Map(document.getElementById("map"), {
      center: {lat: 32.95, lng:-96.77 },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      scrollwheel: false,
      draggable: false,
      draggableCursor: 'default'
    });


    var overlay = new google.maps.OverlayView();

    overlay.onAdd = function() {
        var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "SvgOverlay");
        var svg = layer.append("svg");
        var precinctLayer = svg.append("g").attr("class", "precincts");
        var markerOverlay = this;
        var overlayProjection = markerOverlay.getProjection();



        var transform = d3.geoTransform({point: function(x, y) {
              var d = new google.maps.LatLng(y, x);

              d = overlayProjection.fromLatLngToDivPixel(d);

              this.stream.point(d.x + 4000, d.y + 4000);

            }
          });


        var path = d3.geoPath().projection(transform);



        overlay.draw = function() {

          precinctLayer.selectAll("path")
            .data(json.features)
            //.attr("d", path)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", function(d) {
              return "#777";
            })
            .attr("stroke-opacity", function(d) {
              if (d.properties.LD == 102) {
                return "0.95";
              } else {
                return "0";
              }
            })
            .attr("fill", function(d) {
              if (d.properties.LD == 102) {
                return color(parseFloat(d.properties.pop));

              } else {
                return "#ccc";
              }
            })
            .attr("fill-opacity", function(d) {
              if (d.properties.LD == 102) {
                return "0.8";
              } else {
                return "0";
              }
            })
            .on("mouseover", function(d) {
              if (d.properties.LD == 102) {


                var xPosition = d3.event.pageX +5;
                var yPosition = d3.event.pageY -100;

                d3.select("#tooltip")
                   .style("left", xPosition + "px")
                   .style("top", yPosition + "px");

                d3.select('#precinct-text')
                  .text(d.properties.PCT);

                d3.select('#population-text')
                  .text(d.properties.pop);

                d3.select("#tooltip").classed("hidden", false);

              }
              /*
               var jsonDistrict = d.properties.STATEREP;
               var dp = d.properties.democrat / d.properties.cast;
               var rp = d.properties.republican / d.properties.cast;
               var cast = d.properties.cast;
               if (jsonDistrict== 125) {

                // create x, y coordinates
                // var xPosition1 = parseFloat(d3.select(this).attr("x")) + 20;
                // var yPosition1 = parseFloat(d3.select(this).attr("y")) / 2 + (20);

                var xPosition = d3.event.pageX +5;
                var yPosition = d3.event.pageY -230;


                //create tooltip
                d3.select("#tooltip")
                   .style("left", xPosition + "px")
                   .style("top", yPosition + "px")
                //    .select("#precinct")
                //     .text(d.properties.NAME)
                // d3.select("#tooltip").select("#cast")
                //    .text(d.properties.cast)
                // d3.select("#tooltip").select("#dem")
                //    .text(formatAsPercentage(dp))
                // d3.select("#tooltip").select("#rep")
                //    .text(formatAsPercentage(rp))
                 ;
               d3.select("#tooltip").classed("hidden", false);


               //create donut
               var precinctVotes = [rp, dp];
               var dh = d3.select("#tooltip").style("height").replace("px", "");
               var dw = d3.select("#tooltip").style("width").replace("px", "");
               var outerRadius = dw / 2;
               var innerRadius = dw / 3.2;
               var pie = d3.pie();
              var color = d3.scaleOrdinal(["rgb(251,64,73)", "rgb(25,9,102)"]);

              var arc = d3.arc()
                          .innerRadius(innerRadius)
                          .outerRadius(outerRadius);

               var donutSvg = d3.select("#tooltip")
                                .append("svg")
                                .attr("class", "donut-chart")
                                .attr("width", dw)
                                .attr("height", dh);

              var arcs = donutSvg.selectAll("g.arc")
                            .data(pie(precinctVotes))
                            .enter()
                            .append("g")
                            .attr("class", "arc")
                            .attr("transform", "translate(" + outerRadius + ", " + outerRadius + ")");

             arcs.append("path")
                      .attr("fill", function(d, i) {
                        return color(i);
                      })
                      .attr("d", arc);

              arcs.append("text")
                  .attr("transform", function(d) {
                    return "translate(" + arc.centroid(d) + ")";
                  })
                  .attr("text-anchor", "middle")
                  .text(function(d) {
                    return formatAsPercentage(d.value);
                  })
                  .attr("class", "donut-label")



            var textSvg = d3.select(".donut-chart").append("svg")
                .attr("width",dw)
                .attr("height",dh)
                .attr("class", "text-svg")
                .append("g")
                .attr("transform","translate("+dw/2+","+(dh/2)+")");


            textSvg.append("text")
              .text('Precinct ' + d.properties.NAME)
              .attr("text-anchor", "middle")
              .attr("transform", "translate(0, -10)")
              .attr("font-weight", "bold")
              .attr("font-size", "13px");


            textSvg.append("text")
               .attr("text-anchor", "middle")
               .text("Total votes: " + cast)
               .attr("transform", "translate(0, 10)")
               .attr("font-size", "10px");;





             }
             */
            })
            .on("mouseout", function(d) {

              d3.select("#tooltip").classed("hidden", true);


            })
            ;


        };

    };

    overlay.setMap(map);

  })
})
