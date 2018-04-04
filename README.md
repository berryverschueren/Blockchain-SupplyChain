# Blockchain-SupplyChain
Using JavaScript and some other libraries together with Hyperledger Sawtooth to create a demo application. This application will manage products and transfer of ownership. Besides that there will be some interesting views included to show for example an owned-products list etc.

# Run the demo
## Get the code
First clone this git repository to your desktop or any other folder of your choosing. 
    $ git clone "https://github.com/berryverschueren/Blockchain-SupplyChain.git"

## Kickstart Docker
Next you want to run the .yaml file to start up the Docker environment for you. This can be done from the directory in which you cloned the repository. 
    $ docker-compose up

## Build the client application
Before starting the client application, always build it first. This can be done using webpack. Go to the client directory and run the following command.
    $ npm run build

## Start the processor application
Finally it remains to start the processor application to handle our transactions and communicate with the blockchain. This has to be done from the processor directory. Run the following command.
    $ npm start

## Up and running
Now that everything is set up, you can use the application by opening the .html file from the client directory in any (preferably Firefox) browser.
