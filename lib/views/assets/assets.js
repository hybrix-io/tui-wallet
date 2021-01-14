const blessed = require('blessed');
const lang = require('../../lang');
const UI = require('../../ui');
const assetsUI = require('./assets.ui');

/**
 * @param assets
 */
function orderSymbols (assets) {
  global.logger([], 'assets1 = ' + JSON.stringify(assets));
  const symbols = Object.keys(assets).sort((symbol1, symbol2) => {
    const isStarred1 = assets.hasOwnProperty(symbol1) && assets[symbol1].starred;
    const isStarred2 = assets.hasOwnProperty(symbol2) && assets[symbol2].starred;
    if (isStarred1 && !isStarred2) return -1;
    else if (!isStarred1 && isStarred2) return 1;
    else return symbol1.localeCompare(symbol2);
  });
  global.logger([], 'symbols = ' + JSON.stringify(symbols));
  const after = {};
  for (let symbol of symbols) {
    after[symbol] = assets[symbol];
    delete assets[symbol];
  }

  for (let symbol of symbols) assets[symbol] = after[symbol];
  global.logger([], 'assets2 = ' + JSON.stringify(assets));

  return assets;
}

/**
 * @param assets
 * @param assetPreferences
 * @param dataCallback
 * @param errorCallback
 * @param progressCallback
 */
function initializeAssets (assetPreferences, dataCallback, errorCallback, progressCallback) {
  if (typeof assetPreferences !== 'object' || assetPreferences === null) assetPreferences = {};// TODO default & no save

  const parallelSteps = {'availableAssets': {data: {query: '/list/asset/details'}, step: 'rout'}}; // amongs retrieving the saved assets, also retrieve the available assets.

  for (let symbol in assetPreferences) {
    parallelSteps[symbol] = {data: {symbol: symbol}, step: 'addAsset'};
  }
  for (let symbol in global.assets) {
    if (!assetPreferences.hasOwnProperty(symbol)) { // asset no longer in requested asset list , so remove it
      parallelSteps[symbol] = {data: {symbol: symbol}, step: 'removeAsset'};
    }
  }

  return hybrix.sequential(
    [
      parallelSteps, 'parallel',
      data => {
        for (let i = 0; i < data.availableAssets.length; ++i) {
          const availableAsset = data.availableAssets[i];
          global.availableAssets[availableAsset.symbol] = availableAsset;
        }
        global.assets = {};
        for (let symbol in assetPreferences) {
          global.assets[symbol] = {starred: !!assetPreferences[symbol], ...global.availableAssets[symbol]};
        }
        global.assets = orderSymbols(global.assets);
      },
      'asset'
    ],
    dataCallback,
    errorCallback,
    progressCallback
  );
}

/**
 * @param assets
 * @param assetPreferences
 * @param dataCallback
 * @param errorCallback
 * @param progressCallback
 */
function initializeSavedAssets (assetPreferences, dataCallback, errorCallback, progressCallback) {
  initializeAssets(assetPreferences, dataCallback, errorCallback, progressCallback);
}

/**
 * @param data
 * @param dataCallback
 * @param errorCallback
 * @param progressCallback
 */
function initializeDefaultAssets (data, dataCallback, errorCallback, progressCallback) {
  initializeAssets({eth: 0, btc: 0}, dataCallback, errorCallback, progressCallback);
}

/**
 * @param data
 * @param dataCallback
 * @param errorCallback
 * @param progressCallback
 */
function loadSavedAssets (data, dataCallback, errorCallback, progressCallback) {
  hybrix.load({key: global.legacyFilePrefix.assetPreference, legacy: true},
    assetPreferencesString => {
      let assetPreferences;
      try {
        assetPreferences = JSON.parse(assetPreferencesString);
      } catch (error) {
        global.logger(['info'], 'Failed to parse asset preferences.');
        return initializeDefaultAssets(error, dataCallback, errorCallback);
      }
      return initializeSavedAssets(assetPreferences, dataCallback, errorCallback);
    },
    error => {
      global.logger(['info'], 'No stored asset preferences found, loading default.');
      initializeDefaultAssets(error, dataCallback, errorCallback);
    }
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
      if (typeof assets === 'object' && assets !== null) global.assets = assets;
      mainView();
    },
    e => mainView()
  );
};

/**
 *
 */
function mainView () {
  // Get dollar prices

  // destroy UI elements
  UI.clearElements();
  assetDisplay();
}

/**
 *
 */
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
  assetsUI.display(global.assets);
}

/**
 *
 */
function manageAssets () {
  UI.edit['ManageAssets'] = UI.buttonfunc.make(lang.buttonManageAssets, UI.box, -2, 1, 0, '#446644');

  UI.edit['ManageAssets'].on('press', function () {
    const selectedAssets = {};

    const renderAddButton = function (entry, y, toggle) {
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

    const renderAssets = function (assets, search) {
      if (typeof search === 'string') search = search.toLowerCase();

      let linecontent;
      const buttons = [];
      let y = 0;
      for (let symbol in assets) {
        const asset = assets[symbol];
        // destroy old elements and keybindings
        if (typeof UI.text['ManageAssets-' + symbol] !== 'undefined') UI.text['ManageAssets-' + symbol].destroy();

        if (typeof UI.edit['ManageAssets-' + symbol] !== 'undefined') UI.edit['ManageAssets-' + symbol].destroy();

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
      selectedAssets[symbol] = global.assets.hasOwnProperty(symbol);
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
      const managedAssets = [];
      for (let symbol in this.selectedAssets) {
        if (this.selectedAssets[symbol]) managedAssets.push(symbol);
      }

      const refreshView = () => {
        // manually destroy modal for UI reinitialization (blessed lib is buggy!)
        UI.modal.box.destroy();
        UI.modal.hide();
        UI.modal.isvisible = false;
        // restart the main asset view
        mainView();
      };

      const saveAssets = () => {
        if (Object.keys(global.assets).length === 0) return refreshView();
        const assetPreferences = {};
        for (let symbol in global.assets) assetPreferences[symbol] = global.assets[symbol].starred ? 1 : 0;
        const value = JSON.stringify(assetPreferences);
        global.logger([], 'Manage::SAve ' + value);
        return hybrix.save({key: global.legacyFilePrefix.assetPreference, value, legacy: true},
          refreshView,
          e => {
            global.logger(['error'], 'Failed to store favorite assets.');
            refreshView();
          }
        );
      };
      const assetPreferences = {};
      for (let symbol of managedAssets) {
        const isStarred = global.assets[symbol] && global.assets[symbol].starred;
        assetPreferences[symbol] = isStarred ? 1 : 0;
      }

      return initializeAssets(
        assetPreferences,
        () => saveAssets(),
        () => {
          global.logger(['error'], 'Failed to initialize assets.');
          saveAssets();
        }
      );
    }.bind({selectedAssets: selectedAssets}));
  });
}
