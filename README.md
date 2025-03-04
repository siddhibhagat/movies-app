# movies-app
Implementation of search in Movies App
This project is a Dockerized full-stack application consisting of a Movies API (backend) and Movies UI (frontend). The backend is built using NestJS and the frontend is built using React.

This README will guide you through the setup and running of the application on your local machine using Docker and Docker Compose.

# Prerequisites
Before you begin, make sure you have the following installed on your machine:

- Docker
- Docker Compose

# Project structure
- movies-api/: This folder contains the backend application built with NestJS. It exposes API endpoints for searching movie data. 
- movies-ui/: This folder contains the frontend application built with React.
- Primary database: MongoDB(Docker version)
- Search Engine: ElasticSearch(Docker version)

# Getting started
## Step 1: Clone the Repository
```
git clone https://github.com/siddhibhagat/movies-app.git
cd movies-app
```

## Step 2: Add your OMDB api key
path: movies-api/.env: OMDB_API_KEY = <your_api_key>

## Step 3: Build and Run the Docker Containers
```
docker-compose up --build
```

This will:
- Build the Docker images for the movies-api and movies-ui services.
- Start the containers for movies-api, movies-ui, mongodb, and elasticsearch.
## Step 4: View the Application
- Frontend (Movies UI): Open a web browser and go to http://localhost:3000. You should see the movie search page.
- Backend (Movies API): The API will be available at http://localhost:4000. You can interact with the backend (e.g., /api/movies endpoints).
- Run tests: ```docker-compose exec movies-api npm run test```
## Step 5: Stopping the application
When you're done, you can stop all running services with:

```
docker-compose down
```
# Architecture Design Decisions
This project is designed with a microservices-based architecture in mind. However, to make the initial setup simpler, we have chosen to structure the project as a monorepo. This approach allows us to keep both the frontend (Movies UI) and backend (Movies API) in the same repository while still maintaining a separation of concerns.

### Frontend (UI):

The frontend is built with React.js and serves as the user interface for searching movies.
It communicates with the backend via HTTP requests to the RESTful API.
### Backend (API):

The backend is built with NestJS to handle API requests related to movie data.
It uses MongoDB as the database to store movie data and Elasticsearch for indexing and searching movies quickly.
### Database:

MongoDB is used to store movie data as it provides a flexible schema for data that may evolve over time.
### Search Engine:

Elasticsearch is integrated with the backend to provide fast and scalable movie search capabilities.
### Containerization:

Docker and docker-compose are used to containerize the entire application, allowing easy setup, scaling, and management of the different services.

# Architecture Diagram
![moviesearch_architechture_diagram drawio](https://github.com/user-attachments/assets/9f6585df-bda6-4d0c-af09-839169bb4083)


API Endpoints:
- GET /api/movies/search?page=1&limit=10&term=
  
  Empty term string gives complete result with pagination
  
  NOTE: If data is not fetched from elastic search, MongoDB is used a fallback mechanism to search for data.
  
- POST /api/movies/insertData
  
  If I want to manually insert the data from backend. Inserts data both in MongoDB and Elastic Search.


