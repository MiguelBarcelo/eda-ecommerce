# Base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Force-install nodemon globally
RUN npm install -g nodemon

# Copy application source
COPY . .

# Expose a port
EXPOSE 5003

# Start the app
CMD ["npm","run", "dev"]