# WordPress Theme Check Action

This action runs the [Theme Check](https://wordpress.org/plugins/theme-check/) plugin and outputs its results.

## Requirements

- NodeJs
- NPM
- Docker

## Action Inputs

- `root-folder` Location of your theme's root folder


## Development

1. Run `npm install` to install dependencies
2. Run `npm run wp-env start` to start WordPress

If you want to test a theme locally, add the theme to the `/test-theme` folder and run:
 `npm run theme-check`
