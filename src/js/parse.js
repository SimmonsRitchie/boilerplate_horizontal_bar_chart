
/* ---------------------------------------------------------------
                    MODULE: PARSE
-----------------------------------------------------------------*/
/* Handles data parsing */

export const formatData = (dataGroup) => {

  /*
  A function for parsing imported data. Note: Because this is a horizontal bar chart, x and y values and labels
  are flipped from how they are used in a vertical bar chart.

  PARAMS

  -- dataGroup (obj)
  An object with both our imported data and metadata that includes information about how we want to parse this data.
  This function assumes the original CSV data was in this format and you want the first column as your X axis:

    year, data1, data2, data3
    2001, 10, 20, 30
    2002, 30, 40, 50
  */

  // DESTRUCTURE PROPS
  const {
    data, // our core data for parsing
    sortData, // sorts data
    xValParser, // parses xAxis values (eg. converting to datetime object)
    yValParser, // parses yAxis values (eg. converting to int)
  } = dataGroup
  
  // GET Y-AXIS TICK LABELS
  // We're assuming the first column in data is our desired X Axis
  const yAxisName = data.columns[0]

  // GET SUBGROUPS FOR X-AXIS VALUES (STACKED CHART)
  // We're assuming data in the other columns is what we want to plot on Y axis
  // This creates an array of subgroup names
  const xValSubGroups = data.columns.slice(1) // creates new array with all columns name except for first col, which is our xAxis

  // PARSE DATA
  // We pass in our x and y parsing functions
  // We rename the first column in our data as 'yVal'
  const parsedData = data.map(d => {
    d["yVal"] = yValParser ? yValParser(d[yAxisName]) : d[yAxisName] // if yValParser is not present then do nothing
    delete d[yAxisName]
    xValSubGroups.forEach(subgroup => {
      d[subgroup] = xValParser ? xValParser(d[subgroup]) : d[subgroup] // if xValParser is not present then do nothing
    })
    return d
  })

  // SORT DATA
  // If sort option is chosen, then we'll sort the data in a specific way using provided function
  if (sortData) {
    parsedData.sort(sortData)
  }

  // CREATE FINAL PAYLOAD
  const dataReady = {
    "values": parsedData,
    xValSubGroups
  }

  return dataReady
}

export const flattenXValIntoArray = (data) => {
  /* To get the extent for a stacked bar chart, we need to sum each subgroup
  
  This function returns an array with all subgroups summed for each group
  */

  const arrayOfSummedVals = data.map(group => {
    const groupCopy = {...group} // create object copy so we don't mess with original data
    delete groupCopy.yVal // remove yVal key-value pairs
    const xVals = Object.values(groupCopy) // gets all values
    return xVals.reduce((accumulator, xVal) => {
      xVal = +xVal
      return accumulator + xVal
    })
  })
  return arrayOfSummedVals

}