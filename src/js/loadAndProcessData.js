/* ---------------------------------------------------------------
                    MODULE: LOAD AND PROCESS
-----------------------------------------------------------------*/
/*
This module gets out data and parses it if necesary
*/

// --------------------------- IMPORTS ---------------------------

// Third party
import { csv, json, tsv } from "d3-fetch"; // I'm using d3-fetch instead of d3-request because this tutorial is using V5 API


// My imports
import {formatData, multipleColumnsToSeries} from './parse'
import moment from "moment";
import { timeFormat } from 'd3-time-format';
import { format } from 'd3-format'

export const loadAndProcessData = () =>
  // GETTING DATA USING PROMISE ALL
  // Promise all gets all data before continuing
  Promise.all([
    csv("static/raises1.csv"),
    csv("static/raises2.csv")
  ]).then(([raises1, raises2]) => {

    // FORMATTER AND PARSING FUNCTIONS
    // Functions we can feed into metadata fields in our dataGroup objects
    const defaultData = d => d; // pass this function when we don't want to parse in any way
    const parseYear = d => moment(d, 'YYYY') // parse text into datetime object
    const tickFormatYear = timeFormat('%Y') // special d3 object for time formats
    const formatYear = d => moment(d).format('YYYY') // moment js display for time format
    const parserUnary = d => +d // converts to int, typically needed with all imported numeric values
    const formatCurrency = d => "$" + format(",.0f")(d) // display 100000 = $100,000
    const formatCurrencyMobile = d => "$" + format("~s")(d) // display 100000 = $100k
    const sortByRaise = (a, b) => b.raise - a.raise
    const sortByTotalPay = (a, b) => (b.raise + b.pay) - (a.raise + a.pay)
    

    // DATA GROUPS: SET META DATA
    // Each data group represents all X and Y values being displayed on the graph at a single time.
    // Below we define an object with metadata and processing info for each group. We create this so we only have to adjust things
    // here when we load in different data.
    // NOTE: props in the first object in array may not be redundant because they're mapped on with the chained function,
    // however, we leave them here as an easy reference to the props we can apply.
    const dataGroups = [
      {
      "groupLabel":"Top staff", // Required: label used in dropdown
      "data": raises1, // Required: imported data
      "sortData": sortByTotalPay, // Optional: function for customizing how data is sorted (and therefore arranged in graph)
      "xAxisLabel": null, // Optional: label alongside our x Axis, margin will be adjusted automatically if set
      yValParser: null, // Optional: function to parse imported xAxis value, eg. converting to moment object
      xAxisTickFormat: formatCurrency, // Optional:  function to determine how to display xVals in axis
      xAxisTickFormatMobile: formatCurrencyMobile, // Optional:   function for formatting ticks in more concise format
      xValDisplayFormat: formatCurrency, // Optional: function to determine how to display xVals in general (eg. in tooltips)
      xValParser: parserUnary, // Optional: function to parse imported yAxis values
      yValDisplayFormat: null, // Optional: function to determine how to display yVals in general (eg. in tooltips)
      yAxisTickFormat: null, // Optional: function to determine how to display xVals in axis
    },
    {
      "groupLabel":"Other staff", 
      "data": raises2, 
    },
  ].map(obj=> ({ ...obj,
    sortData: sortByTotalPay,
    xAxisTickFormat: formatCurrency,
    xAxisTickFormatMobile: formatCurrencyMobile,
    xValDisplayFormat: formatCurrency, 
    xValParser: parserUnary, 
  })) // add properties here that we want to apply to all dataGroups in array.

    // PARSING DATA GROUPS
    // Loop over our datagroups and parse the 'data' payload.
    const dataReady = {}
    for (var i = 0, len = dataGroups.length; i < len; i++) {
      dataGroups[i].data = formatData(dataGroups[i])
      dataReady[dataGroups[i].groupLabel] = dataGroups[i]
    }
    return dataReady;
});

