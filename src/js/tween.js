/* ---------------------------------------------------------------
                    MODULE: ANIMATION TWEEN
-----------------------------------------------------------------*/
/* Calculates animation based on start point, end point, and selected duration */

// --------------------------- IMPORTS ---------------------------

import { interpolate } from "d3-interpolate";

// --------------------------- FUNCTION ---------------------------


export const widthTween = (d, xScale) => {
  // DEFINE INTERPOLATION (returns a function which we call 'i')
  // interpolation = value between 0 and x.bandwidth representing position
  let i = interpolate(0, xScale.bandwidth());

  // RETURN A FUNCTION THAT TAKES IN A TIME TICKER 'T'
  // timeticker = value between 0 and 1 representing our duration)
  return function(t) {
    // RETURN THE VALUE FROM PASSING THE TICKER INTO INTERPOLATION
    // Timeticker value is passed in over and over again as animation runs,
    // each time that happens, this function get us the value of 'i', which
    // we use for our animation.
    return i(t);
  };
};
