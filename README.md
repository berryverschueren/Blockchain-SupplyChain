# Blockchain-SupplyChain
Using JavaScript and some other dependencies together with Hyperledger Sawtooth to create a demo application. This application will manage products and transfer of ownership. Besides that there will be some interesting views included to show for example an owned-products list etc.

# Run the demo
## Get the code
First clone this git repository to your desktop or any other folder of your choosing. 
    
`$ git clone "https://github.com/berryverschueren/Blockchain-SupplyChain.git"`

## Install dependencies
Both the client and processor directories contain a package file. The dependencies mentioned here have to be installed. This can be done by running the following command. (Do this in both directories!)

`$ npm install`

## Kickstart Docker
Next you want to run the .yaml file to start up the Docker environment for you. This can be done from the directory in which you cloned the repository. 
    
`$ docker-compose up`

## Build the client application
Before starting the client application, always build it first. This can be done using webpack. Go to the client directory and run the following command.
    
`$ npm run build`

## Start the processor application
Finally it remains to start the processor application to handle our transactions and communicate with the blockchain. This has to be done from the processor directory. Run the following command.
    
`$ npm start`

## Up and running
Now that everything is set up, you can use the application by opening the .html file from the client directory in any (preferably Firefox) browser.

# Side notes
It could be that you have to install some prerequisites, I will try to sum up most of them below. Besides that it may happen that the application does not work because of CORS issues. The easiest fix is to use the CorsE plugin for Firefox.

## Prerequisites
Make sure you have the following installed before you attempt to run the demo.

- cURL
    ```
    $ sudo apt install curl
    $ curl -V
    ```

- Docker
    ```
    Check this guide: https://docs.docker.com/install/linux/docker-ce/ubuntu/
    $ docker --version
    ```
- Docker-Compose
    ```
    $ sudo apt update 
    $ sudo apt install docker-compose 
    $ docker-compose --version
    ```
- Node.js & npm
    ```
    $ sudo bash -c "cat >/etc/apt/sources.list.d/nodesource.list" <<EOL deb https://deb.nodesource.com/node_6.x xenial main deb-src https://deb.nodesource.com/node_6.x xenial main EOL
    $ curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -
    $ sudo apt update
    $ sudo apt install nodejs
    $ sudo apt install npm
    $ node --version && npm --version
    ```
- Go language
    ```
    $ sudo apt update
    $ sudo curl -O https://storage.googleapis.com/golang/go.1.9.2.linux-amd64.tar.gz
        - switch 1.9.2 for the newest version
    $ sudo tar -xvf go1.9.2.linux-amd64.tar.gz
        - switch 1.9.2 for the newest version
    $ sudo mv go /usr/local
    $ echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile
    $ source ~/.profile
    $ go version
    ```