let blessed = require('blessed');

let spinner = blessed.box({
  parent: UI.box,
  top: 'center',
  left: 'center',
  width: 5,
  height: 1,
  align: 'center',
  hidden: true,
  border: false,
  style: {
    fg: 'white',
    bg: 'black'
  }
});

spinner.start = function () {
  spinner.show();
  spinner.count = 0;
  spinner.interval = setInterval(function () {
    let widg = '';
    switch (spinner.count) {
      case 0:
        widg = '•  ';
        break;
      case 1:
        widg = ' • ';
        break;
      case 2:
        widg = '  •';
        break;
      case 3:
        widg = ' • ';
        break;
    }
    if (spinner.count > 2) { spinner.count = 0; } else { spinner.count++; }
    spinner.setContent(widg);
    screen.render();
  }, 250);
};
spinner.start();
spinner.stop = function () {
  clearInterval(spinner.interval);
  spinner.hide();
  screen.render();
};

setTimeout(function () { spinner.stop(); }, 3000);
