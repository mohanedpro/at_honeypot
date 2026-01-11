# Use the official Node.js 18 slim image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Create the logs directory if it doesn't exist
RUN mkdir -p logs

# Expose the port your Express app runs on (usually 3000)
EXPOSE 3000

# Start the server
CMD [ "node", "server.js" ]