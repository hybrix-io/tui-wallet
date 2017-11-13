// button functions
exports.make=makeButton;
exports.reset=resetButtons;
exports.init=initButtons;

function initButtons(groups,updown) {
  var hist = {};
  if(typeof groups==='undefined') { groups = {}; hist = UI.edit.hist.pop(); } else {
    UI.edit.hist.push({'g':UI.edit.cycles,'t':UI.edit.updown});
  }
  UI.edit.cycles = [
    //(typeof groups.topbar!='undefined'?groups.topbar: (typeof hist.g!='undefined' && typeof hist.g[0]!='undefined'?hist.g[0]:UI.edit.topbar) ),
    (typeof groups.box!='undefined'?groups.box: (typeof hist.g!='undefined' && typeof hist.g[0]!='undefined'?hist.g[0]:UI.edit.box) ),
    (typeof groups.lowbar!='undefined'?groups.lowbar: (typeof hist.g!='undefined' && typeof hist.g[1]!='undefined'?hist.g[1]:UI.edit.lowbar) )
  ]
  UI.edit.updown = (typeof updown!='undefined'?updown:hist.t);
  UI.edit.group = 0;
  UI.edit.cycle = UI.edit.cycles[UI.edit.group];
  UI.edit.cfast = UI.edit.updown[UI.edit.group];
  UI.edit.focus = -1;
  screen.render();
}

function resetButtons() {
  if(UI.edit.focus<-1) { UI.edit.focus==UI.edit.cycle.length-1; } else { UI.edit.focus--; }
  UI.activated.focus();
}

function makeButton(name,parent,x,y,content,color) {
  return blessed.button({
    parent: parent,
    mouse: true,
    keys: true,
    shrink: true,
    padding: { left: 1, right: 1 },
    left: (!isNaN(x)&&x>-1?x+1:(isNaN(x)&&x[0]==='-'?(100-parseInt(x.replace('%','').replace('-','')))+'%-'+name.length:(x<0?null:x))),
    right: (x<0?-1-x:null),
    top: (y>0||isNaN(y)?y:null),
    bottom: (y<0&&!isNaN(y)?-1-y:null),
    shrink: true,
    tags: true,
    name: name,
    content: (typeof content!='undefined'&&content?content:name),
    style: {
      bg: (typeof color!='undefined'?color:'blue'),
      focus: {
        bg: 'white',
        fg: 'black'
      },
      hover: {
        bg: 'white',
        fg: 'black'
      }
    }
  });
}
