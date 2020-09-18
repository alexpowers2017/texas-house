
//code that was in the google api tutorial that i'm afraid to get rid of
"use strict";
let map;




/******************************
*** CREATE GLOBAL VARIABLES ***
******************************/


// set color fills for precincts
var color = function(dp, rp, cutoff) {
    if (dp > rp && dp > (rp + cutoff)) { return "rgb(25,9,102)"; }
    else if (dp > rp) { return "rgb(85,65,186)"; }
    else if (rp > dp && rp > (dp + cutoff)) { return "rgb(145,0,7)"; }
    else if (rp > dp) { return "rgb(251,64,73)"; }
    else if (rp = dp) { return "rgb(238,130,238)"; }
    else { return "#d5d5d5"; }
}

//filtering function - keeps 125th district
var include = function(d) {
  if (d.properties.STATEREP == 125) { return true; }
  else { return false; }
}

//used to display decimal values as percentages
var formatAsPercentage = d3.format(".01%");






/*************************
*** READ IN DATA FILES ***
*************************/

var createViz = function(election) {

    d3.csv("data/full_elections.csv", function(data) {

        d3.json("data/Bexar_County_Voter_Precincts.json", function(json) {

            //loops through every row of csv file
            for (var i=0; i < data.length; i++) {

                //reads in data points from csv row
                var dataPrecinct = data[i].precinct;
                var democrat = parseFloat(data[i].democrat);
                var republican = parseFloat(data[i].republican);
                var cast = parseFloat(data[i].cast);

                //if (data[i].election == "March 3rd, 2020 Joint Primary") {
                if (data[i].election_id == election) {

                //loops through every object in json file
                for (var j=0; j < json.features.length; j++) {

                    //read in precinct from json file
                    var jsonPrecinct = json.features[j].properties.NAME;

                    //if precincts from both files match, add data from csv row to respective json object
                    if (dataPrecinct == jsonPrecinct) {
                        json.features[j].properties.democrat = democrat;
                        json.features[j].properties.republican = republican;
                        json.features[j].properties.cast = cast;
                        break;
                    }

                //end of json loop
                }
              }
            //end of csv loop
            }


            //create google map, manually setting options
            var map = new google.maps.Map(document.getElementById("map"), {
                center: {lat: 29.482, lng:-98.605 },
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: true,
                scrollwheel: false,
                draggable: false,
                draggableCursor: 'default'
            });

            //initialize overlay, which will hold d3 viz
            var overlay = new google.maps.OverlayView();
            createOverlay(overlay, json);
            overlay.setMap(map);


        //end of reading in json
        })

    //end of reading in csv
    })

}

createViz("1");

d3.select('#election')
  .on('change', function() {
    removeTooltip();
    var election = eval(d3.select(this).property('value'));
    createViz(election);
});




/****************************
*** DECLARE VIZ FUNCTIONS ***
****************************/



var createOverlay = function(overlay, json) {

    //code to run on creation of overlay
    overlay.onAdd = function() {

        //google maps related variable declarations - i have no idea wtf is going on here
        var markerOverlay = this;
        var overlayProjection = markerOverlay.getProjection();
        var transform = d3.geoTransform({point: function(x, y) {
            var d = new google.maps.LatLng(y, x);
            d = overlayProjection.fromLatLngToDivPixel(d);
            this.stream.point(d.x + 4000, d.y + 4000);
        }});

        //creates layer to write d3 stuff into
        var layer = d3.select(this.getPanes().overlayMouseTarget).append("div").attr("class", "SvgOverlay");
        var svg = layer.append("svg");
        var precinctLayer = svg.append("g").attr("class", "precincts");
        var path = d3.geoPath().projection(transform);


        //function holds d3 code to draw precinct map
        overlay.draw = function() {

            //draw paths onto precinctLayer
            precinctLayer.selectAll("path")
              .data(json.features)
              .enter()
              .append("path")
              .attr("d", path)
              .attr("stroke", function(d) {
                  if (include(d)) { return "#dadada"; }
                  else { return "#aaa"; }
              })
              .attr("stroke-opacity", function(d) {
                  if (include(d)) { return "1"; }
                  else { return "0.1"; }
              })
              .attr("fill", function(d) {
                  var dp = d.properties.democrat / d.properties.cast;
                  var rp = d.properties.republican / d.properties.cast;

                  if (include(d)) { return color(dp, rp, .25); }
                  else {return "#ddd"; }
              })
              .attr("fill-opacity", function(d) {
                  if (include(d)) { return "0.8"; }
                  else { return "0.1"; }
              })
              .on("mouseover", function(d) {
                  if (include(d)) { createTooltip(d); }
              })
              .on("mouseout", function(d) { removeTooltip(); });

        //end of overlay.draw function
        };

    //end of overlay.onAdd function
    };

}



//function to create tooltip chart and labels
var createTooltip = function(d) {

    //read in mouse x/y positions
    var xPosition = d3.event.pageX +5;
    var yPosition = d3.event.pageY -230;

    //read in height/width of tooltip, set in css
    var dh = d3.select("#tooltip").style("height").replace("px", "");
    var dw = d3.select("#tooltip").style("width").replace("px", "")

    //place tooltip on screen
    d3.select("#tooltip")
    .style("left", xPosition + "px")
    .style("top", yPosition + "px")
    ;

    //show tooltip
    d3.select("#tooltip").classed("hidden", false);

    //call chart/label creation functions
    createDonut(d, dw, dh);
    createDonutLabel(d, dw, dh);

}



//draws donut chart to appear in tooltip
var createDonut = function(d, dw, dh) {

    //initial variable declarations
    var outerRadius = dw / 2;
    var innerRadius = dw / 3.2;
    var pie = d3.pie();
    var color = d3.scaleOrdinal(["rgb(251,64,73)", "rgb(25,9,102)"]);

    //creates arc? still not sure how this works
    var arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    //creates svg to hold donut chart
    var donutSvg = d3.select("#tooltip")
      .append("svg")
      .attr("class", "donut-chart")
      .attr("width", dw)
      .attr("height", dh);

    //creates arcs? and adds dem/rep vote percentages to them
    var arcs = donutSvg.selectAll("g.arc")
      .data(pie([
        (d.properties.republican / d.properties.cast),
        (d.properties.democrat / d.properties.cast)
      ]))
      .enter()
      .append("g")
      .attr("class", "arc")
      .attr("transform", "translate(" + outerRadius + ", " + outerRadius + ")");

    //draws path, assigns red/blue color based on what order dem/rep data was added to arcs
    arcs.append("path")
      .attr("fill", function(d, i) { return color(i); })
      .attr("d", arc);

    //add labels to donut chart
    arcs.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("text-anchor", "middle")
      .text(function(d) { return formatAsPercentage(d.value); })
      .attr("class", "donut-label")

}



//creates and places label to go in center of donut chart
var createDonutLabel = function(d, dw, dh) {

    //initial variable declarations
    var jsonDistrict = d.properties.STATEREP;
    var cast = d.properties.cast;
    var name = d.properties.NAME;

    //creates svg to hold labels and moves it to center of tooltip
    var textSvg = d3.select(".donut-chart").append("svg")
      .attr("width",dw)
      .attr("height",dh)
      .attr("class", "text-svg")
      .append("g")
      .attr("transform","translate("+dw/2+","+(dh/2)+")");

    //adds precinct text and puts it slightly above center
    textSvg.append("text")
      .text('Precinct ' + name)
      .attr("text-anchor", "middle")
      .attr("transform", "translate(0, -10)")
      .attr("font-weight", "bold")
      .attr("font-size", "13px");

    //adds 'total votes' text and puts it slightly below center
    textSvg.append("text")
      .attr("text-anchor", "middle")
      .text("Total votes: " + cast)
      .attr("transform", "translate(0, 10)")
      .attr("font-size", "10px");

}



//hides all tooltip elements
var removeTooltip = function() {
    d3.select("#tooltip").classed("hidden", true);
    d3.select(".donut-chart").remove();
    d3.select(".text-svg").remove();
}
