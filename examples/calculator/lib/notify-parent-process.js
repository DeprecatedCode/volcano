module.exports.ready = function (error) {
  if (process.send) {
    process.send({ type: error ? 'error' : 'ready', error });
  }
  else {
    console.warn('Could not notify parent process, message was:', { type: error ? 'error' : 'ready', error });
  }
};
