## HERE Hackathon App

Hackathon app built with React. List of libraries used:

HERE Data, HERE Location APIs, Mapbox GL, Bootstrap, Ministry of Education APIs, Postgres, Node.js.

-----

### UI - Development version 

To get started:

- Clone this repo and CD into CitycareUI folder
- Run `npm install` inside root dir
- Run `npm run dev` to start the development server

### UI - Building and deploying 

To build and deploy:

- Run `sudo npm install serve -g`
- Run `npm run build` inside root dir
- Run `npm start` to start the production server

### API - Running the server

Start the API server:

- Run `node server.js` inside root dir

Or, start UI and API using provided startup scripts. 
Set startup scripts as executable:

- `sudo chmod +x start-ui.sh`
- `sudo chmod +x start-api.sh`
- `./start-ui.sh`
- `./start-api.sh`