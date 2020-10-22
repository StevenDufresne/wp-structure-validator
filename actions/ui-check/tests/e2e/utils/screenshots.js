
/**
 * Returns the percentage of pixels that are opaque in a png with transparency
 * @param {array} imageData Representation of the png
 * @return {number} Number between 0 - 100 representing the percentage of opaque pixels within the transparent png
 */
export const getPercentOfOpaqueness = ( imageData ) => {
	let i;
	let opaquePixels = 0;

	// Pixels are represented in groups of four. Ie: rgba(255,0,0,0)
	// We check the 4th item for transparency
	for ( i = 3; i < imageData.length; i += 4 ) {
		if ( imageData[ i ] === 255 ) {
			opaquePixels++;
		}
	}

	const totalPixels = imageData.length / 4;
	return ( opaquePixels / totalPixels ) * 100;
};

/**
 *  Returns whether the percentage of change is great enough
 * @param {number} changePercent
 */
export const meetsChangeThreshold = ( changePercent ) => {
	return changePercent > 0;
};
