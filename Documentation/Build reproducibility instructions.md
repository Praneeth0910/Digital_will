## Build Reproducibility 

To verify that the project build is reproducible:

1. Remove existing dependencies:
rm -rf node_modules

2. Reinstall dependencies:
npm install

3. Start the application:
npm start

If the application runs successfully again at http://localhost:5000, the build is reproducible.
