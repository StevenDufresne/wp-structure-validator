/**
 * External dependencies
 */
import { createURL } from '@wordpress/e2e-test-utils';
const core = require( '@actions/core' );

/**
 * Internal dependencies
 */
import urls from './pages';

const cleanErrorMessage = ( msg ) => {
	return msg.replace( 'expect(received).toPassAxeTests(expected)', '' );
}

describe( 'Accessibility', () => {
	beforeAll( async () => {
		await page.goto( createURL( '/' ) );
	} );
	
	const defaultUrl = ( path, query ) => {
		let defaultUrl = path;

		if( query.length > 1 ) {
			defaultUrl += `?${ query }`;
		}

		return `(${ defaultUrl })`;
	}

	test.each( urls )(
		'Should pass Axe tests on %s',
		async ( name, path, query ) => {
			await page.goto( createURL( path, query ) );

			try {
				await expect( page ).toPassAxeTests( {
					options: {
						runOnly: {
							type: 'tag',
							values: [ 'wcag2a' ],
						},
						exclude: [ [ '.entry-content' ] ],
					},
				} );
			} catch ( e ) {
				core.setFailed( `[ Accessibility - Required Tests ]: \n\nRunning tests on ${ name }${ defaultUrl( path, query ) } using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test ${ cleanErrorMessage( e.message ) }` );
			}
		}
	);
	
	it( "Should contain skip links", async () => {
		await page.keyboard.press('Tab');

		try {
			const elementCopy = await page.evaluate( () =>  {
				return document.activeElement.innerText;
			} );
			
			expect( elementCopy.toLowerCase().indexOf( 'skip' ) >= 0 ).toBeTruthy();
		} catch ( e ) {
			core.setFailed( `[ Accessibility - Required Tests ]: \n\nRunning tests on Home(/) using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test Problems with Skip Links` );
		}
	} );

	// OPTIONAL: Alert user about other important tests
	test.each( urls )(
		'Should pass optional Axe tests on %s',
		async ( name, path, query ) => {
			await page.goto( createURL( path, query ) );

			try {
				await expect( page ).toPassAxeTests( {
					options: {
						runOnly: {
							type: 'tag',
							values: [ 'best-practice' ],
						},
						exclude: [ [ '.entry-content' ] ],
					},
				} );
			} catch ( e ) {
				core.warning( `[ Accessibility - Optional Tests ]: \n\nRunning tests on ${ name }${ defaultUrl( path, query ) } using: \nhttps://github.com/wpaccessibility/a11y-theme-unit-test ${ cleanErrorMessage( e.message ) }` );
			}
		}
	);
} );
