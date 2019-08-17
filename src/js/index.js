
/* ---------------------------------------------------------------
                    BOILERPLATE - STACKED BAR CHART, HORIZONTAL, LEGEND, DYNAMIC
-----------------------------------------------------------------*/
/*
A dyanmic and responsive horizontal, stacked bar chart that uses annotations to indicate subgroups.

Chart is redrawn when:
- A) a new option is chosen from select element
- B) element is resized.

Chart's responsiveness follows 'progressive disclosure philosophy'. More parts of the graph
appear in the DOM as the graph is resized. To adjust these elements, including margins, adjust
chart.js

Note: tween module is no longer used in transition but I've left it in case we want to re-use it.

When adapting this boilerplate don't forget to change:
- filenames and data names in loadAndProcessData
- annotation positions and names in chart.js
 */


// --------------------------- IMPORTS ---------------------------

// Third party
import {select} from 'd3-selection'
import {scaleLinear, scaleBand} from 'd3-scale';
import {axisBottom, axisLeft} from 'd3-axis';
import {transition} from 'd3-transition'
import debounce from 'debounce';
import {max} from 'd3-array'

// My imports
import { loadAndProcessData } from "./loadAndProcessData";
import { createDropdownSelector } from "./dropdownSelector";
import { drawChart } from './chart';
import { tooltipOn, tooltipOff } from "./tooltip";
import { filterData } from "./filter";
// --------------------------- CANVAS SETUP AND BASIC PROPS ---------------------------

  // SET BASIC PROPS
  const heightRelativeToWidth = 0.62 // instead of setting fixed height, set it as a ratio of width (Note: 'golden ratio' is 0.618)
  const breakpointSmallScreen = 400;
  const transitionDuration = 500

  // SET ELEMENT PROPS
  const graphic = select('.container__graphic')
  const svg = graphic.select('.graphic__svg')
  const graphicInner = graphic.select(".graphic__inner");
  const graph = svg.append('g')
    .attr('class',graph)

  // STORE PROPS
  const props = {
    svg,
    graphicInner,
    graph,
    heightRelativeToWidth,
    breakpointSmallScreen,
    transitionDuration
  }

// --------------------------- LOAD DATA AND DRAW GRAPHIC ---------------------------

loadAndProcessData().then(rawData => {

  // --------------------------- RESIZE ---------------------------

  // TODO: This function is probably unecessary, it can be deleted if you can figure out how to pass args into a func that's being debounced
  function resize() {
    drawChart(rawData, props)
  }

  // --------------------------- CREATE DROPDOWN SELECTOR ---------------------------
  
  // Builds dropdown options based on raw data
  createDropdownSelector(rawData)

  // -------------------------- LISTEN FOR DROPDOWN CHANGES ---------------------------

  // Redraws chart if new dropdown option selected
  select(".dropdown").on("change", function() {
    drawChart(rawData, props);
  });

  // ------------------------------------- INIT ----------------------------------
  
  /* Sets up certain groups before we draw our chart
  1) We do this for two reasons: for svg elements that we aren't binding data to, we need to enter them here
  so we don't keep re-adding them to the dom everytime the graph is redrawn
  2) We can set the order of how elements layer on top of each other.
  */ 
  function init() {

    // AXIS LABELS
    // Set yAxis label to class 'yAxis-label'
    graph
      .append('text')
      .attr('class','yAxis-label')
    
    // Set xAxis label to class 'xAxis-label'
    graph
      .append('text')
      .attr('class','xAxis-label')

    // AXIS GROUPS
    // Create axisX group with class 'axisX'
    graph
      .append('g')
      .attr('class','axisX')
    
    // Create axisY group with class 'axisY'
    graph
      .append('g')
      .attr('class','axisY')
      .attr('id','axisY')

    // BAR GROUPS
    graph
      .append('g')
      .attr('class','barGroups')

    // ANNOTATION GROUP
    // This needs to be appended last so that annotiations appear over bars
    graph.append("g")
      .attr("class", "annotation-group")

    // add event listner for any resizes (listner is debounced)
    window.addEventListener("resize", debounce(resize, 200));
    drawChart(rawData, props);
  }

  // ------------------------------------- START ----------------------------------

  init()

});



