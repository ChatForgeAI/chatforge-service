# Use Node.js 20 as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install system dependencies (needed for some Node packages)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json to install dependencies first
# This optimizes Docker's cache layers
COPY package*.json ./

# Install production dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create the storage directory for WhatsApp sessions
RUN mkdir -p /usr/src/app/storage/session

# Expose the port the app runs on (based on .env PORT or server.js default)
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
