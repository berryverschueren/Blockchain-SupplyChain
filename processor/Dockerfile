# Use base node image.
FROM node:carbon
# Change working directory.
WORKDIR /usr/src/app
# Copy package.json file to /usr/src/app.
COPY package.json .
# Run npm install to install all node_modules.
RUN npm install
# Copy all files to /usr/src/app.
COPY . .
# Set the base command to npm start (configured in package.json).
CMD ["npm", "start"]
# Expose port 4000 of the container.
EXPOSE 4000 