const GIFEncoder = require( 'gif-encoder' );
const fs = require( 'fs' );
const util = require( 'util' );
const getPixels = require( 'get-pixels' );

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

export const makeGif = async ( width, height, folder ) => {
	const gif = new GIFEncoder( width, height );

	// // Collect output
	var file = fs.createWriteStream( `${ folder }/flow.gif` );
	gif.pipe( file );
	gif.setQuality( 60 );
	gif.setFrameRate( 60 );
	gif.setDelay( 200 );

	// // Write out the image into memory
	gif.writeHeader();

	const jpegs = fs
		.readdirSync( folder )
		.sort( ( a, b ) => parseInt( a ) - parseInt( b ) );

	if ( jpegs.length < 1 ) {
		return;
    }
    
    // let's limit the number of images for size purposes
    const jpegsToAddToGif = jpegs.slice(Math.max(jpegs.length - 20, 1));

	const getPixelsSync = util.promisify( getPixels );

	const getPix = async ( file ) => {
		try {
			const pixels = await getPixelsSync( `${ folder }/${ file }` );
			return pixels.data;
		} catch ( ex ) {
			return null;
		}
	};

	for ( var i = 0; i < jpegsToAddToGif.length; i++ ) {
		const data = await getPix( jpegsToAddToGif[ i ] );

		if ( data !== null ) {
			gif.addFrame( data );
			gif.read();
		}
	}

	gif.finish();
};
