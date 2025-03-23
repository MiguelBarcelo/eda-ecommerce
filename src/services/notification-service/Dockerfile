# Base image
FROM node:18

# Set Working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Expose a port
EXPOSE 5004

# Start the app
CMD ["node", "index.js"]