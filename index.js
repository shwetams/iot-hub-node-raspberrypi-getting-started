/*

* IoT Hub Raspberry Pi NodeJS - Microsoft Sample Code - Copyright (c) 2016 - Licensed MIT

*/

'use strict';



// This function is triggered each time a message is revieved in the IoTHub.

// The message payload is persisted in an Azure Storage Table
// npm install node-uuid
var moment = require('moment');



module.exports = function (context, iotHubMessage) {
  var uniqueid = moment.utc().format('hhmmss') + process.hrtime()[1] + '';
  context.log('Message received: ' + JSON.stringify(iotHubMessage));

    context.bindings.outputdocument = JSON.stringify({ 
    id: uniqueid  + '',
    message: JSON.stringify(iotHubMessage)
  });

  context.done();

};

