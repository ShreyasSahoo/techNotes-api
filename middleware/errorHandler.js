const { logEvents } = require("./logger");

const errorHandler = (err, req, res, next) => {
  const errorMessage = `${err.name} : ${err.message}\t ${req.method}\t${req.url}\t${req.headers.origin}`;
  logEvents(errorMessage, "errLog.txt");
  console.log(err.message);
  const status = req.statusCode ? req.statusCode : 500; //server error
  res.status(status);
  res.json({ message: err.message, isError: true });
};

module.exports = errorHandler;
