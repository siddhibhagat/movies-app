# Use the official lightweight Node.js image based on Alpine
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Run tests before starting the app
RUN npm run test

# Expose the application port
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start:dev"]
