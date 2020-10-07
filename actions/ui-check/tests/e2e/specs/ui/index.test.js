/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
import { printMessage } from '../../utils';

jest.setTimeout( 1000000 );

let jsError;

page.on( 'pageerror', ( error ) => {
	jsError = error.toString();
} );

describe( 'Browser Console', () => {
	it( "Shouldn't have any JS errors", async () => {
		await page.goto( createURL( '/' ) );

		if ( jsError ) {
			printMessage( 'setFailed', [
				'[ UI ]',
				`Found a JS error: \n\n${ jsError }`,
			] );
		}

		expect( true ).toBeTruthy();
	} );
} );
