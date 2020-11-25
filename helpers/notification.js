const OneSignal = require("onesignal-node");
const client = new OneSignal.Client(
  "34f658cc-57c6-4277-a09c-f8d16e888f43",
  "MDAxMWZlNTgtMTk1Yy00YjVlLTkyMmYtNmEwNmNmZjViNGMz"
);

const createNotification = (device_id,message,callback) => {
    console.log("createNotification -> device_id", device_id)
    //create notification
    const notification = {
      contents: {
        en: message,
      },
      include_player_ids: [device_id],
      filters: [],
    };
    client
      .createNotification(notification)
      .then((response) => {
        console.log("createNotification -> response", response.statusCode);
        callback(true);
      })
      .catch((e) => {
        console.log("createNotification -> e", e);
        callback(false);
      });
  };


module.exports = {createNotification};