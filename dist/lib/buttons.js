const UI = require('./ui');
let blessed = require('blessed');

// button functions
exports.make = makeButton;
// exports.reset=resetButtons;
exports.init = initButtons;

// add setBg method to blessed button
blessed.button.prototype.setBg = function (color) {
  if (this.bg !== 'undefined') {
    this.bg = (typeof color !== 'undefined' ? color : 'blue');
  }
  if (this.style !== 'undefined' && this.style.bg !== 'undefined') {
    this.style.bg = (typeof color !== 'undefined' ? color : 'blue');
  }
  this.emit('bg change');
};

function initButtons (groups, updown) {
  let hist = {};
  if (typeof groups === 'undefined') { groups = {}; hist = UI.edit.hist.pop(); } else {
    UI.edit.hist.push({'g': UI.edit.cycles, 't': UI.edit.updown});
  }
  UI.edit.cycles = [
    // (typeof groups.topbar!='undefined'?groups.topbar: (typeof hist.g!='undefined' && typeof hist.g[0]!='undefined'?hist.g[0]:UI.edit.topbar) ),
    (typeof groups.box !== 'undefined' ? groups.box : (typeof hist.g !== 'undefined' && typeof hist.g[0] !== 'undefined' ? hist.g[0] : UI.edit.box)),
    (typeof groups.lowbar !== 'undefined' ? groups.lowbar : (typeof hist.g !== 'undefined' && typeof hist.g[1] !== 'undefined' ? hist.g[1] : UI.edit.lowbar))
  ];
  UI.edit.updown = (typeof updown !== 'undefined' ? updown : hist.t);
  UI.edit.group = 0;
  UI.edit.cycle = UI.edit.cycles[UI.edit.group];
  UI.edit.cfast = (typeof UI.edit.updown[UI.edit.group] === 'undefined' ? 1 : UI.edit.updown[UI.edit.group]);
  UI.edit.focus = 0 - UI.edit.cfast;
  screen.render();
}

/*
  function resetButtons() {
  //if(UI.edit.focus<-1) { UI.edit.focus=UI.edit.cycle.length-1; } else { UI.edit.focus--; }
  UI.activated.focus();
  }
*/

function makeButton (name, parent, x, y, content, color, pad, style) {
  padding = 1;
  if (typeof pad !== 'undefined') { padding = pad; }
  if (typeof fgColor === 'undefined') { fgColor = 'white'; }
  if (typeof style === 'undefined') {
    style = {
      bg: (typeof color !== 'undefined' ? color : 'blue'),
      fg: 'white',
      focus: {
        bg: 'white',
        fg: 'black'
      },
      hover: {
        bg: 'white',
        fg: 'black'
      }
    };
  }
  return blessed.button({
    parent: parent,
    mouse: true,
    keys: true,
    shrink: true,
    padding: { left: padding, right: padding },
    left: (!isNaN(x) && x > -1 ? x + 1 : (isNaN(x) && x[0] === '-' ? (100 - parseInt(x.replace('%', '').replace('-', ''))) + '%-' + name.length : (x < 0 ? null : x))),
    right: (x < 0 ? -1 - x : null),
    top: (y > 0 || isNaN(y) ? y : null),
    bottom: (y < 0 && !isNaN(y) ? -1 - y : null),
    tags: true,
    name: name,
    content: (typeof content !== 'undefined' && content ? content : name),
    style: style
  });
}
