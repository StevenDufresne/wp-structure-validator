/**
 * External dependencies
 */
import { loginUser, createURL } from '@wordpress/e2e-test-utils';
const core = require('@actions/core');

jest.setTimeout(1000000);

let jsError;

page.on('pageerror', (error) => {
	jsError = error.toString();
});

describe('Browser Console', () => {
	it("Shouldn't have any JS errors", async () => {
		await page.goto(createURL('/'));

		if (jsError) {
			core.setFailed(`Action failed with error: %0A ${jsError}`);
		}

		expect(true).toBeTruthy();
	});
});
