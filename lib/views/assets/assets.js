let blessed = require('blessed');
const lang = require('../../lang');
const UI = require('../../ui');
const assetsUI = require('./assets.ui');

function orderKeys (obj) {
  let keys = Object.keys(obj).sort(function keyOrder (k1, k2) {
    if (k1 < k2) return -1;
    else if (k1 > k2) return +1;
    else return 0;
  });

  let i; let after = {};
  for (i = 0; i < keys.length; i++) {
    after[keys[i]] = obj[keys[i]];
    delete obj[keys[i]];
  }

  for (i = 0; i < keys.length; i++) {
    obj[keys[i]] = after[keys[i]];
  }
  return obj;
}

function initializeAssets (assets, dataCallback, errorCallback, progressCallback) {
  let parallelSteps = {'availableAssets': {data: {query: '/list/asset/details'}, step: 'rout'}}; // amongs retrieving the saved assets, also retrieve the available assets.

  for (let i = 0; i < assets.length; ++i) {
    let symbol = assets[i];
    parallelSteps[symbol] = {data: {symbol: symbol}, step: 'addAsset'};
  }
  for (let symbol in global.assets) {
    if (assets.indexOf(symbol) === -1) { // asset no longer in requested asset list , so remove it
      parallelSteps[symbol] = {data: {symbol: symbol}, step: 'removeAsset'};
    }
  }

  hybrix.sequential(
    [
      parallelSteps, 'parallel',
      (data) => {
        for (let i = 0; i < data.availableAssets.length; ++i) {
          let availableAsset = data.availableAssets[i];
          global.availableAssets[availableAsset.symbol] = availableAsset;
        }
      },
      'asset'
    ],
    dataCallback,
    errorCallback,
    progressCallback
  );
}

function initializeSavedAssets (assets, dataCallback, errorCallback, progressCallback) {
  initializeAssets(assets, dataCallback, errorCallback, progressCallback);
}

function initializeDefaultAssets (data, dataCallback, errorCallback, progressCallback) {
  initializeAssets(['eth', 'btc'], dataCallback, errorCallback, progressCallback);
}

function loadStarredAssets (assets, dataCallback, errorCallback, progressCallback) {
  hybrix.load({key: 'ff00-0034', legacy: true},
    starredAssets => { // Saved asset file found
      global.starredAssets = starredAssets;
      initializeSavedAssets(assets, dataCallback, errorCallback);
    },
    e => { initializeSavedAssets(assets, dataCallback, errorCallback); } // No starred asset file found
  );
}

function loadSavedAssets (data, dataCallback, errorCallback, progressCallback) {
  hybrix.load({key: 'ff00-0033', legacy: true},
    assets => { loadStarredAssets(assets, dataCallback, errorCallback); }, // Saved asset file found
    (error) => { initializeDefaultAssets(error, dataCallback, errorCallback); } // No saved asset file found
  );
}

// view: asset screen
UI.views.assets = function () {
  UI.edit.topbar = [];
  UI.edit.lowbar = ['Logger', 'Terminal', 'Quit'];
  UI.edit.taborder = [4, 1];

  loadSavedAssets(
    undefined,
    assets => {
      global.assets = assets;
      mainView();
    },
    e => {
      mainView();
    }
  );
};

function mainView () {
  // Get dollar prices

  // destroy UI elements
  UI.clearElements();
  assetDisplay();
}

function assetDisplay () {
  // create asset table
  UI.text['AssetsH1'] = blessed.text({
    parent: UI.box,
    padding: { left: 1, right: 1 },
    left: 0,
    top: 1,
    tags: true,
    name: 'AssetsH1',
    content: lang.headerAsset,
    width: '18%',
    height: 1,
    style: {
      fg: 'grey',
      bg: 'black'
    }
  });

  UI.text['AssetsH2'] = blessed.text({
    parent: UI.box,
    padding: { left: 1, right: 1 },
    left: '18%',
    top: 1,
    tags: true,
    name: 'AssetsH2',
    content: lang.headerStarred,
    height: 1,
    style: {
      bg: 'black',
      fg: 'yellow'
    }
  });

  UI.text['AssetsH3'] = blessed.text({
    parent: UI.box,
    padding: { left: 1, right: 1 },
    left: '36%',
    top: 1,
    tags: true,
    name: 'AssetsH3',
    content: lang.headerBalance,
    width: 16,
    height: 1,
    style: {
      fg: 'grey',
      bg: 'black'
    }
  });

  UI.text['AssetsH3'] = blessed.text({
    parent: UI.box,
    padding: { left: 1, right: 1 },
    left: '54%',
    top: 1,
    tags: true,
    name: 'AssetsH4',
    content: lang.headerValuation,
    width: 16,
    height: 1,
    style: {
      fg: 'grey',
      bg: 'black'
    }
  });

  // asset management button
  manageAssets();

  global.assets = orderKeys(global.assets);
  assetsUI.display(global.assets);
}

function manageAssets () {
  UI.edit['ManageAssets'] = UI.buttonfunc.make(lang.buttonManageAssets, UI.box, -2, 1, 0, '#446644');

  UI.edit['ManageAssets'].on('press', function () {
    let selectedAssets = {};

    let renderAddButton = function (entry, y, toggle) {
      if (typeof toggle !== 'undefined' && toggle) {
        if (this.selectedAssets[entry] === true) {
          this.selectedAssets[entry] = false;
          UI.edit['ManageAssets-' + entry].setContent('{green-bg} ' + lang.buttonManageAssetsAdd + ' {/green-bg}');
        } else {
          this.selectedAssets[entry] = true;
          UI.edit['ManageAssets-' + entry].setContent('{red-bg} ' + lang.buttonManageAssetsDel + ' {/red-bg}');
        }
      } else {
        if (this.selectedAssets[entry] === true) {
          UI.edit['ManageAssets-' + entry] = UI.buttonfunc.make(lang.buttonManageAssetsDel, UI.modal.box.list, -3, y, ' ' + lang.buttonManageAssetsDel + ' ', 'red', 0);
        } else {
          UI.edit['ManageAssets-' + entry] = UI.buttonfunc.make(lang.buttonManageAssetsAdd, UI.modal.box.list, -3, y, ' ' + lang.buttonManageAssetsAdd + ' ', 'green', 0);
        }

        UI.edit['ManageAssets-' + entry].on('focus', function () {
          UI.scrollWindow(UI.modal.box.list, this.y);
        }.bind({y: UI.edit['ManageAssets-' + entry].top}));

        UI.edit['ManageAssets-' + entry].on('press', function () {
          renderAddButton(this.entry, this.y, 1);
          screen.render();
        }.bind({entry: entry, y: y}));

        UI.edit['ManageAssets-' + entry].key(['left', 'a', ','], function (ch, key) {
          UI.edit.override = true;
          UI.edit.focus = 1;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
        UI.edit['ManageAssets-' + entry].key(['home', 'W', ']'], function (ch, key) {
          UI.edit.override = true;
          UI.edit.focus = 3;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
        UI.edit['ManageAssets-' + entry].key(['right', 'd', '.'], function (ch, key) {
          UI.edit.override = true;
          UI.edit.focus = UI.edit.cycle.length - 2;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
        UI.edit['ManageAssets-' + entry].key(['end', 'S', '['], function (ch, key) {
          UI.edit.override = true;
          UI.edit.focus = UI.edit.cycle.length - 3;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
        UI.edit['ManageAssets-' + entry].key(['escape'], function (ch, key) {
          UI.edit.override = true;
          UI.edit.focus = UI.edit.cycle.length - 2;
          UI.edit[UI.edit.cycle[UI.edit.focus]].focus();
          screen.render();
        });
      }
    }.bind({selectedAssets: selectedAssets});

    let renderAssets = function renderAssets (assets, search) {
      if (typeof search !== 'undefined') {
        search = search.toLowerCase();
      }
      let linecontent;
      let buttons = [];
      let y = 0;
      for (let symbol in assets) {
        let asset = assets[symbol];
        // destroy old elements and keybindings
        if (typeof UI.text['ManageAssets-' + symbol] !== 'undefined') {
          UI.text['ManageAssets-' + symbol].destroy();
        }
        if (typeof UI.edit['ManageAssets-' + symbol] !== 'undefined') {
          UI.edit['ManageAssets-' + symbol].destroy();
        }
        // add search stuff here...
        if (typeof search === 'undefined' || symbol.toLowerCase().indexOf(search) !== -1 || asset.name.toLowerCase().indexOf(search) !== -1) {
          let backgroundColor = y % 2 ? 'grey' : 'black';
          linecontent = '{' + backgroundColor + '-bg}' + String(symbol.toUpperCase() + '            ').substr(0, 12) + asset.name + '{/' + backgroundColor + '-bg}';
          //            console.log(UI.modal.box.list.position.width);
          UI.text['ManageAssets-' + symbol] = blessed.text({
            parent: UI.modal.box.list,
            left: 0,
            top: y,
            tags: true,
            shrink: false,
            align: 'left',
            width: '100%-4',
            content: linecontent,
            style: { fg: 'white', bg: backgroundColor }
          });

          renderAddButton(symbol, y);
          buttons.push('ManageAssets-' + symbol);

          y++;
        }
      }
      UI.buttonfunc.init({'box': ['Searchbox', 'Reset'].concat(buttons, ['Cancel', 'Close'])}, [1, 1]);
    };

    UI.modalfunc.make(lang.modalManageAssetsTitle);

    UI.text['SearchboxTitle'] = blessed.text({
      parent: UI.modal.box,
      left: 0,
      top: 1,
      tags: true,
      shrink: true,
      align: 'left',
      content: lang.modalManageAssetsSearchbox,
      style: { fg: 'white', bg: 'black' }
    });

    UI.modalfunc.input('Searchbox', 0, 2, '100%-8');

    UI.edit['Reset'] = UI.buttonfunc.make('Reset', UI.modal.box, -1, 2, 'X', '#446644');

    UI.edit['Cancel'] = UI.buttonfunc.make('Cancel', UI.modal.box, -5 - lang.buttonApply.length, -1, lang.buttonCancel, '#400040');

    UI.edit['Close'] = UI.buttonfunc.make('Close', UI.modal.box, -2, -1, lang.buttonApply, 'blue');

    UI.modal.box.list = blessed.form({
      parent: UI.modal.box,
      scrollable: true,
      top: 4,
      left: 0,
      width: '100%-4',
      bottom: 2,
      border: false,
      tags: true,
      keys: false,
      vi: false,
      mouse: true,
      draggable: false,
      content: null,
      scrollback: 5000,
      style: {
        bg: 'black'
      },
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          inverse: true
        }
      }
    });

    for (let symbol in global.availableAssets) {
      if (global.assets.hasOwnProperty(symbol)) {
        selectedAssets[symbol] = true;
      } else {
        selectedAssets[symbol] = false;
      }
    }
    renderAssets(global.availableAssets);

    UI.edit.Searchbox.focus();

    UI.edit.Searchbox.key(['enter'], function (ch, key) {
      let search = UI.edit.Searchbox.getValue();
      renderAssets(global.availableAssets, search);
      // one extra late render in case searching produces a race condition
      setTimeout(function () {
        UI.edit[UI.edit.cycle[2]].focus();
        screen.render();
        UI.edit.Searchbox.focus();
      }, 300);
    });

    UI.edit.Reset.on('press', function () {
      UI.edit.Searchbox.setValue('');
      renderAssets(global.availableAssets);
    });

    UI.edit.Cancel.on('press', function () {
      // manually destroy modal for UI reinitialization (blessed lib is buggy!)
      UI.modal.box.destroy();
      UI.modal.hide();
      UI.modal.isvisible = false;
      // restart the main asset view
      mainView();
    });

    UI.edit.Close.on('press', function () {
      let managedAssets = [];
      for (let symbol in this.selectedAssets) {
        if (this.selectedAssets[symbol]) {
          managedAssets.push(symbol);
        }
      }

      let refreshView = () => {
        // manually destroy modal for UI reinitialization (blessed lib is buggy!)
        UI.modal.box.destroy();
        UI.modal.hide();
        UI.modal.isvisible = false;
        // restart the main asset view
        mainView();
      };

      let saveAssets = () => {
        hybrix.save({key: 'ff00-0033', value: Object.keys(global.assets), legacy: true},
          refreshView,
          e => {
            // TODO Do something with error could not save assets
            refreshView();
          }
        );
      };

      initializeAssets(
        managedAssets,
        (assets) => {
          global.assets = assets;
          saveAssets();
        },
        () => { saveAssets(); } // TODO do something with error could  not initialize assets
      );
    }.bind({selectedAssets: selectedAssets}));
  });
}
