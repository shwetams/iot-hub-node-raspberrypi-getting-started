/*
* IoT Hub Raspberry Pi NodeJS - Microsoft Sample Code - Copyright (c) 2016 - Licensed MIT
*/
'use strict';

var fs = require('fs');
var path = require('path');
var wpi = require('wiring-pi');

// Use MQTT protocol to communicate with IoT hub
var Client = require('azure-iot-device').Client;
var ConnectionString = require('azure-iot-device').ConnectionString;
var Message = require('azure-iot-device').Message;
var Protocol = require('azure-iot-device-mqtt').Mqtt;

// GPIO pin of the LED
var CONFIG_PIN = 7;
// Blink interval in ms
var INTERVAL = 2000;
// Total messages to be sent
var MAX_MESSAGE_COUNT = 20;
var sentMessageCount = 0;

// Prepare for GPIO operations
wpi.setup('wpi');
wpi.pinMode(CONFIG_PIN, wpi.OUTPUT);

// Read device connection string from command line arguments and parse it
var connectionStringParam = process.argv[2];
var connectionString = ConnectionString.parse(connectionStringParam);
var deviceId = connectionString.DeviceId;

// fromConnectionString must specify a transport constructor, coming from any transport package.
var client = Client.fromConnectionString(connectionStringParam, Protocol);

// Configure the client to use X509 authentication if required by the connection string.
if (connectionString.x509) {
  // Read X.509 certificate and private key.
  // These files should be in the current folder and use the following naming convention:
  // [device name]-cert.pem and [device name]-key.pem, example: myraspberrypi-cert.pem
  var options = {
    cert : fs.readFileSync(path.join(__dirname, deviceId + '-cert.pem')).toString(),
    key : fs.readFileSync(path.join(__dirname, deviceId + '-key.pem')).toString()
  };

  client.setOptions(options);

  console.log('[Device] Using X.509 client certificate authentication');
}

/**
 * Start sending messages after getting connected to IoT Hub.
 * If there is any error, log the error message to console.
 * @param {string}  err - connection error
 */
function connectCallback(err) {
  if (err) {
    console.log('[Device] Could not connect: ' + err);
  } else {
    console.log('[Device] Client connected\n');
    // Wait for 5 seconds so that host machine gets connected to IoT Hub for receiving message.
    setTimeout(sendMessage, 5000);
  }
}

/**
 * Blink LED.
 */
function blinkLED() {
  // Light up LED for 100 ms
  wpi.digitalWrite(CONFIG_PIN, 1);
  setTimeout(function () {
    wpi.digitalWrite(CONFIG_PIN, 0);
  }, 100);
}

/**
 * Construct device-to-cloud message and send it to IoT Hub.
 */
function sendMessage() {
  sentMessageCount++;
  var message = new Message(JSON.stringify({ deviceId: deviceId, messageId: sentMessageCount }));
  console.log("[Device] Sending message #" + sentMessageCount + ": " + message.getData());
  client.sendEvent(message, sendMessageCallback);
}

/**
 * Blink LED after message is sent out successfully, otherwise log the error message to console.
 * If sent message count is less than max message count allowed, schedule to send another message.
 * Else, exit process after several seconds.
 * @param {object}  err - sending message error
 */
function sendMessageCallback(err) {
  if (err) {
    console.log('[Device] Message error: ' + err.toString());
  } else {
    // Blink once after successfully sending one message.
    blinkLED();
  }

  if (sentMessageCount < MAX_MESSAGE_COUNT) {
    setTimeout(sendMessage, INTERVAL);
  } else {
    // Wait 5 more seconds to exit so that Azure function has the chance to process sent messages.
    setTimeout(function () {
      process.exit();
    }, 5000);
  }
}

// Connect to IoT Hub and send messages via the callback.
client.open(connectCallback);
