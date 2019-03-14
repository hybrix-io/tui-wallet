exports.read = read;

function read (question, options, callback_) {
  // Options can be omited
  if (typeof options === 'function') {
    callback_ = options;
    options = null;
  }
  // Throw possible errors
  if (!question) {
    throw new Error('Prompt question is malformed. It must include at least a question text.');
  }
  // Prints the question
  let performQuestion = function () {
    let str = question;
    str += ': ';
    process.stdout.write(str);
  };
  // Without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);
  process.stdin.resume();
  // We avoid binary
  process.stdin.setEncoding('utf8');
  // On any data into stdin
  var listener = function (char) {
    // ctrl-c ( end of text )
    let key = char.charCodeAt(0);
    if (char === '\u0003') {
      process.stdout.write('\n');
      process.exit();
    } else if (key === 13) { // on enterkey
      // process.stdout.write('\033c'); clear screen
      process.stdout.write('\n');
      process.stdin.removeListener('data', listener);
      process.stdin.pause();
      process.stdin.setRawMode(false);
      callback_(false, result);
    } else if (key === 127) { // on backspace
      process.stdout.write('\b \b'); // delete char at the terminal
      result = result.slice(0, -1);
    } else {
      // write the key to stdout all normal like
      if (char.match(/^[a-zA-Z0-9*]+$/)) {
        let out;
        if (typeof options.password !== 'undefined' && options.password) {
          out = Array(char.length + 1).join('*');
          result = result + char;
        } else if (typeof options.capitalize !== 'undefined' && options.capitalize) {
          out = char.toUpperCase();
          result = result + char.toUpperCase();
        } else {
          out = char;
          result = result + char;
        }
        process.stdout.write(out);
      }
      // DEBUG: console.log(' > '+char.charCodeAt(0)+' < ');
    }
  };
  // start raw key input and store result
  var result = '';
  process.stdin.addListener('data', listener);
  performQuestion();
}
