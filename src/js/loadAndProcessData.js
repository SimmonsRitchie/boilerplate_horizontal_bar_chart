/* ---------------------------------------------------------------
                    MODULE: LOAD AND PROCESS
-----------------------------------------------------------------*/
/*
This module gets out data and parses it if neccesary.
*/

// --------------------------- IMPORTS ---------------------------

// Third party
import { csv } from "d3-fetch";

// My imports
import { formatData } from "./parse";
import moment from "moment";
import { timeFormat } from "d3-time-format";
import { format } from "d3-format";

export const loadAndProcessData = () =>
  // GETTING DATA USING PROMISE ALL
  // Promise.all performs all async tasks before continuing
  Promise.all([csv("static/raises1.csv"), csv("static/raises2.csv")]).then(
    ([raises1, raises2]) => {
      /* ----------------- DATA GROUP PARSER ---------------------
    Below we create objects for each data file that includes instructions 
    on how they should be parsed and formatted.*/

      // FORMATTER/PARSING FUNCTIONS
      // These Functions are fed into metadata fields in our dataGroup objects to
      // parse our data in different ways.
      const parserUnary = d => +d; // converts to int, typically needed with all imported numeric values
      const formatCurrency = d => "$" + format(",.0f")(d); // display 100000 = $100,000
      const formatCurrencyMobile = d => "$" + format("~s")(d); // display 100000 = $100k
      const sortByTotalPay = (a, b) => b.raise + b.pay - (a.raise + a.pay);
      const defaultData = d => d; // pass this function when we don't want to parse in any way
      const parseYear = d => moment(d, "YYYY"); // parse text into datetime object
      const tickFormatYear = d => timeFormat("%Y"); // special d3 object for time formats
      const formatYear = d => moment(d).format("YYYY"); // moment js display for time format
      const sortByRaise = (a, b) => b.raise - a.raise;

      // SET META DATA
      // Below we define objects metadata and processing info. 'map' method is chained onto the end
      // to add meta data for all objects.
      // NOTE: I've left properties in the first object that are redundant because they're included
      // in the map call. However, I've left them there as a reference for each key's purpose.
      const dataGroups = [
        {
          groupLabel: "Top staff", // Required: label used in dropdown
          data: raises1, // Required: imported data
          sortData: sortByTotalPay, // Optional: function for customizing how data is sorted (and therefore arranged in graph)
          xAxisLabel: null, // Optional: label alongside our x Axis, margin will be adjusted automatically if set
          yValParser: null, // Optional: function to parse imported xAxis value, eg. converting to moment object
          xAxisTickFormat: formatCurrency, // Optional:  function to determine how to display xVals in axis
          xAxisTickFormatMobile: formatCurrencyMobile, // Optional: function for formatting ticks in more concise format
          xValDisplayFormat: formatCurrency, // Optional: function to determine how to display xVals in general (eg. in tooltips)
          xValParser: parserUnary, // Optional: function to parse imported yAxis values
          yValDisplayFormat: null, // Optional: function to determine how to display yVals in general (eg. in tooltips)
          yAxisTickFormat: null // Optional: function to determine how to display xVals in axis
        },
        {
          groupLabel: "Other staff",
          data: raises2
        }
      ]
        // DEFAULT PROPERTIES
        // These properties are applied to all data
        .map(obj => ({
          ...obj,
          sortData: sortByTotalPay,
          xAxisTickFormat: formatCurrency,
          xAxisTickFormatMobile: formatCurrencyMobile,
          xValDisplayFormat: formatCurrency,
          xValParser: parserUnary
        }));

      // PARSING DATA GROUPS
      // Loop over our datagroups and parse the 'data' payload.
      const dataReady = {};
      for (var i = 0, len = dataGroups.length; i < len; i++) {
        dataGroups[i].data = formatData(dataGroups[i]);
        dataReady[dataGroups[i].groupLabel] = dataGroups[i];
      }
      return dataReady;
    }
  );
