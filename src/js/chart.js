
/* ---------------------------------------------------------------
                    MODULE: CHART
-----------------------------------------------------------------*/

/* This function draws the chart. It also updates it in response to data changes using D3's
standard update pattern.

Note: After the graphic is drawn, height of page is sent to PymParent. This is to fix a bug
where iframe height wasn't updating properly on parent page.
*/

// --------------------------- IMPORTS ---------------------------

// Third party
import { max } from "d3-array";
import { select } from "d3-selection"
import { scaleLinear, scaleBand, scaleOrdinal } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { transition } from "d3-transition";
import { stack } from "d3-shape"
import { schemeSet2, schemeSet3, schemePaired } from 'd3-scale-chromatic'
import { annotation, annotationLabel } from 'd3-svg-annotation'

// My imports
import { widthTween } from "./tween";
import { tooltipOn, tooltipOff } from "./tooltip";
import { filterData } from "./filter"
import { flattenXValIntoArray } from './parse'

// --------------------------- DRAW CHART ---------------------------

export const drawChart = (rawData, props) => {

  //-------------------- SET UP ------------------------

  // REFINE DATA BASED ON DROPDOWN
  const selectedData = filterData(rawData);

  // DESTRUCTURE METADATA
  const {
    data,
    yAxisLabel,
    xAxisLabel,
    yValDisplayFormat,
    xAxisTickFormat,
    xAxisTickFormatMobile,
    yAxisTickFormat,
    xValDisplayFormat
  } = selectedData

  // DESTRUCTURE PROPS
  const {
    svg,
    graphicInner,
    graph,
    heightRelativeToWidth,
    breakpointSmallScreen,
    transitionDuration    
  } = props;

  // RESPONSIVE: GET WIDTH
  // We get width of graphicInner and then pass it into render to get our svg width
  const width = graphicInner.node().offsetWidth;

  // GET DOM ELEMENTS
  // Most of these were set up in our init func in index.js with specific class names
  const xAxisGroup = graph.selectAll(".axisX");
  const yAxisGroup = graph.selectAll(".axisY");
  const xAxisLabelGroup = graph.selectAll(".xAxis-label");
  const annoGroup = graph.selectAll(".annotation-group")

  // DEFINE Y VALS, SUBGROUPS
  // Define which object props you want here so that you don't have to change every property name in code
  const yVals = data.values.map(d => d.yVal)
  const xValSubGroups = data.xValSubGroups // we need this for stacked chart

  // SET UP SVG DIMS
  // Our height is based on our width, adjust 'heightRelativeToWidth' in index.js to tweak graphic height
  const height = width * heightRelativeToWidth; // height is a ratio of width
  svg.attr("width", width).attr("height", height);

  // RESPONSIVE: SET MARGIN BASED ON SCREEN SIZE
  let margin = {}
  if (width < breakpointSmallScreen) {
    margin = { top: 20, right: 30, bottom: 30, left: 150 };
  } else {
    margin = { top: 20, right: 50, bottom: 30, left: 150 };
  }

  // RESPONSIVE: POSITION X AXIS LABEL
  // COMMENTING THIS OUT: Annotations give us this same info, so not needed
  if (xAxisLabel) {
    margin.bottom += 20; // add margin space
  }

  // SET ACTUAL GRAPH DIMS
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  // POSITION GEAPH
  graph
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // POSITION X AXES
  xAxisGroup.attr("transform", `translate(0,${graphHeight})`); // shifting axis to bottom

  // CREATE X SCALE (excluding domain)
  const xScale = scaleLinear().range([0, graphWidth]);

  // CREATE Y SCALE (excluding domain)
  const yScale = scaleBand()
    .range([0, graphHeight])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  // CREATE COLOR SCALE - FOR STACKED SUBGROUPS
  // const colorScale = scaleOrdinal(schemeSet2)
  // const colorScale = scaleOrdinal(schemePaired)
  // const colorScale = scaleOrdinal(schemePaired).range(["#E3BA22","#F2DA57"]) // custom yellow color scheme
  // const colorScale = scaleOrdinal(schemePaired).range(["#137B80","#42A5B3"]) // custom blue color scheme
  const colorScale = scaleOrdinal(schemePaired).range(["#E6842A","#F6B656"]) // custom orange color scheme

  // GENERATE X AXIS
  const xAxis = axisBottom(xScale) // we pass in x scale so D3 knows where to position everything
    // .tickFormat(xAxisTickFormat)
    .tickSize(-graphHeight) // by setting ticksize to graphWidth we can create horizontal gridlines
    .ticks(max([graphWidth / 130, 2])) // RESPONSIVE: at least two ticks, add more depending on height (NOTE: d3 will make judgements about what looks best, re: number of ticks)

  // RESPONSIVE - X AXIS
  // If xAxisTickFormatMobile is set in metadata, format ticks differently for small screens
  if (width < breakpointSmallScreen && xAxisTickFormatMobile) {
    xAxis.tickFormat(xAxisTickFormatMobile)
  } else {
    xAxis.tickFormat(xAxisTickFormat)
  }

  // GENERATE Y AXIS
  const yAxis = axisLeft(yScale) // we pass in y scale so D3 knows where to position everything
    .tickFormat(yAxisTickFormat)

  // ANIMATION VARIABLES
  const t = transition().duration(transitionDuration); // TRANSITION + DURATION (in milliseconds)

  // STACK THE DATA --> stack per subgroup
  const stackedData = stack()
    .keys(xValSubGroups)(data.values)

  //-------------------- D3 UPDATE PATTERN ------------------------

  // 1) UPDATING DOMAINS IN SCALES
  // Domain will change every time data is updated. Adjust this for a constant domain.
  // xScale.domain([100, 0]); // get max of data to create Y scale domain
  const arrayOfXValues = flattenXValIntoArray(data.values)
  xScale.domain([0, max(arrayOfXValues)]); // get max of data to create Y scale domain
  yScale.domain(yVals);
  colorScale.domain(xValSubGroups)

  // 2) JOIN UPDATED DATA TO ELEMENTS
  const barGroups = graph.selectAll('.barGroups')
  const barGroup = barGroups.selectAll('.barGroup').data(stackedData)
  const bars = barGroup.selectAll('.bar')
  const legendContainer = select('.container__legend')
  const legendGroup = legendContainer.selectAll('.legend__group').data(xValSubGroups)
  const legendLabels = legendGroup.select('.legend__label').data(xValSubGroups)

  // 3) REMOVE UNWANTED SHAPES (IF NEEDED)
  barGroup.exit().remove();
  bars.data(d => d).exit().remove() // removes rects that no longer exist within a group, we use d => d to access rect-level data
  legendGroup.exit().remove()

  // 4) ENTER AND UPDATE
  barGroup
    .enter()
    .append('g')
    .attr('class','barGroup')
    .merge(barGroup)
    .attr('fill', d => colorScale(d.key))
    .selectAll('.bar')
    .data(function(d) { return d; }) // SECOND ENTER - LOOP SUBGROUP
    .enter()
    .append("rect")
      .attr("class","bar")
      .merge(bars)
      .on('mousemove', function(d, i) {
        const subGroupSelected = select(this.parentNode).datum().key;
        tooltipOn(d, subGroupSelected, xValDisplayFormat)
      })
      .on("mouseout", tooltipOff)
      .transition(t)
      .attr("y", function(d) { return yScale(d.data.yVal); })
      .attr("x", function(d) { return xScale(d[0]); })
      .attr("height", yScale.bandwidth())
      .attr("width", function(d) { return xScale(d[1]) - xScale(d[0]) });

  // CALL AXES - takes groups and runs axes functions above
  xAxisGroup
    .transition(t)
    .call(xAxis)
    // .call(g => g.select(".domain").remove()); // this gets rid of the X axis line, which has the class "domain", using post selection method
  select("path.domain").remove(); // this gets rid of the Y axis line, which has the class "domain"

  yAxisGroup
    .transition(t)
    .call(yAxis) 
  select("path.domain").remove(); // this gets rid of the Y axis line, which has the class "domain"

  // RESPONSIVE: POSITION X AXIS LABEL
  // COMMENTING THIS OUT: Annotations give us this same info, so not needed
  if (xAxisLabel) {
    const xAxisLabelYPos = graphHeight + 25; // Positions label just below xAxis group
    xAxisLabelGroup
      .attr("y", xAxisLabelYPos)
      .attr("x", graphWidth / 2) // positions label in middle of xAxis
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(xAxisLabel);
  } else {
    xAxisLabelGroup.text("")
  }

  // ANNOTATION - RESPONSIVE
  // Label positions are set manually, target positions are
  // based on stacked bar positions and change dynamically 
  const anno1LabelPos = {x: (graphWidth/10) * 7, y: 0} // X: we divide graphWidth into tenths, then determine placement
  const anno1TargetPos = {x: xScale(data.values[0].pay * 0.8), y: yScale(data.values[0].yVal) + (yScale.bandwidth() / 2)} // X: similar method as above, Y: midway point of first rect
  const anno1CurvePoints = [[7.5, -4]]
  const anno2LabelPos = {x: (graphWidth * 0.925), y: 0} // X: we divide graphWidth into tenths, then determine placement
  const anno2TargetPos = {x: xScale(data.values[0].pay + (data.values[0].raise/3)), y: yScale(data.values[0].yVal) + (yScale.bandwidth() / 2)} // X: similar method as above, Y: midway point of first rect
  const anno2CurvePoints = [[7.5, -4]]
  const annoEndScale = width > breakpointSmallScreen ? 1 : 0.5 // dot gets smaller when screen is smaller
  const annotations = [{
    note: { label: "Pay"},
    nx: anno1LabelPos.x, ny: anno1LabelPos.y, // label location
    x: anno1TargetPos.x, y: anno1TargetPos.y, // pointer location
    // dy: -15, dx: -20, // label location, relative to pointer
    type: annotationLabel,
    connector: {
      end: "dot", // 'dot' also available
      endScale: annoEndScale,
      type: "curve",
      points: anno1CurvePoints

    },
    subject: { radius: 50, radiusPadding: 10 }
  },
  {
    note: { label: "Raise"},
    nx: anno2LabelPos.x, ny: anno2LabelPos.y, // label location
    x: anno2TargetPos.x, y: anno2TargetPos.y, // pointer location
    // dy: -15, dx: -20, // label location, relative to pointer
    type: annotationLabel,
    connector: {
      end: "dot", // 'dot' also available
      endScale: annoEndScale,
      type: "curve",
      points: anno2CurvePoints

    },
    subject: { radius: 50, radiusPadding: 10 }
  }
]
  const makeAnnotations = annotation()
    .type(annotationLabel)
    .annotations(annotations)

  annoGroup.call(makeAnnotations)

  // UPDATE IFRAME
  // pymChild sends the height to pym script in iframe, we do this because
  // table height changes based on user interaction.
  pymChild.sendHeight();

}