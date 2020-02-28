const lang = require('../../lang');
let blessed = require('blessed');
let clipboardy = require('clipboardy');
// let spinner = require('../../snippets/spinner');
const UI = require('../../ui');
const functions = require('../../functions');
const transaction = require('../../transaction');

// transaction = require('../../transaction');

exports.display = function (assets) {
  // display assets
  let i = 0;
  let y;
  for (let symbol in assets) {
    let asset = assets[symbol];

    //
    // UI fields
    //

    // height of each element group
    y = 3 + (i * 2);

    UI.text['AssetsS-' + symbol] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: 0,
      top: y,
      tags: true,
      name: 'AssetsS-' + symbol,
      content: symbol.toUpperCase(),
      width: '18%',
      height: 1,
      style: {
        fg: 'white',
        bg: 'black'
      }
    });

    let starStyle = {
      symbol: global.starredAssets.indexOf(symbol) !== -1 ? '\u2605' : '-',
      fg: global.starredAssets.indexOf(symbol) !== -1 ? 'yellow' : 'white',
      bg: 'black',
      hover: { bg: 'grey' },
      focus: { bg: 'grey' }
    };

    UI.edit.box.push('Starred' + i);
    UI.edit['Starred' + i] = UI.buttonfunc.make(lang.buttonStarred, UI.box, '18%+' + Math.floor(lang.headerStarred.length / 2), y, starStyle.symbol, 'black', 1, starStyle);
    UI.edit['Starred' + i].on('press', function () {
      let index = this.i;
      let indexOfSymbol = global.starredAssets.indexOf(this.asset.symbol);
      let toggleStarred = indexOfSymbol === -1;

      if (toggleStarred) {
        global.starredAssets.push(this.asset.symbol);
      } else {
        global.starredAssets.splice(indexOfSymbol, 1);
      }

      hybrix.save({key: 'ff00-0034', value: global.starredAssets, legacy: true}, () => {}, () => {});

      UI.edit['Starred' + index].content = toggleStarred ? '\u2605' : '-';
      UI.edit['Starred' + index].style.fg = toggleStarred ? 'yellow' : 'white';
      screen.render();
    }.bind({i: i, asset: asset}));

    UI.text['AssetsA-' + symbol] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: '37%',
      top: y,
      tags: true,
      name: 'AssetsA-' + symbol,
      content: typeof asset.balance === 'undefined' ? '?' : asset.balance,
      width: 16,
      height: 1,
      style: {
        fg: 'white',
        bg: 'black'
      }
    });

    UI.text['AssetsD-' + symbol] = blessed.text({
      parent: UI.box,
      padding: { left: 1, right: 1 },
      left: '54%',
      top: y,
      tags: true,
      name: 'AssetsD-' + symbol,
      content: '?',
      width: 16,
      height: 1,
      style: {
        fg: 'white',
        bg: 'black'
      }
    });

    // UI.edit
    UI.edit.box.push('Send' + i);
    UI.edit['Send' + i] = UI.buttonfunc.make(lang.buttonSend, UI.box, -6 - (lang.buttonRecv.length), y, 0, 'blue');
    UI.edit['Send' + i].on('press', function () {
      let symbol = this.asset.symbol;
      if (!isNaN(UI.text['AssetsA-' + symbol].getText())) {
        let spendable;
        if (!functions.isToken(symbol)) {
          spendable = functions.toInt(UI.text['AssetsA-' + symbol].getText()).minus(functions.toInt(this.asset.fee));
        } else {
          spendable = functions.toInt(UI.text['AssetsA-' + symbol].getText());
        }
        if (spendable < 0) { spendable = 0; }

        UI.modalfunc.make(lang.modalSendTxTitle,
          '\n' + lang.modalSendTxText.replace('%amount%', functions.fromInt(spendable)).replace('%symbol%', symbol.toUpperCase())
        );

        let offset = '25%';
        UI.text['Modalfield-1'] = blessed.text({
          parent: UI.modal.box,
          left: '10%',
          top: offset,
          tags: true,
          content: '{black-bg}' + lang.modalSendTxTo + ' {/black-bg}',
          align: 'left',
          height: 1
        });
        UI.modalfunc.input('Target', '10%', offset + '+1', '80%');

        UI.text['Modalfield-2'] = blessed.text({
          parent: UI.modal.box,
          left: '10%',
          top: offset + '+3',
          tags: true,
          content: '{black-bg}' + lang.modalSendTxAmount + ' {/black-bg}',
          align: 'left',
          height: 1
        });
        UI.modalfunc.input('Amount', '10%', offset + '+4', '80%-' + (3 + lang.buttonMax.length));
        UI.edit['Max'] = UI.buttonfunc.make('Max', UI.modal.box, '89%-' + (2 + lang.buttonMax.length), offset + '+4', lang.buttonMax, 'yellow');

        let content = '(' + lang.modalSendTxFee.replace('%fee%', functions.formatFloat(this.asset.fee)).replace('%symbol%', symbol.split('.')[0].toUpperCase()) + ')';
        let h = parseInt(content.length * 0.5) + 1;
        UI.text['Modalfield-3'] = blessed.text({
          parent: UI.modal.box,
          left: '50%-' + h,
          top: offset + (screen.height > 16 ? '+6' : '+5'),
          tags: true,
          shrink: true,
          align: 'center',
          content: content,
          style: { fg: 'white', bg: 'black' }
        });
        content = lang.modalSendTxFrom.replace('%from%', ((lang.modalSendTxFrom.length + this.asset.address.length) > (screen.width * 0.5) ? '\n' : '') + this.asset.address);
        h = parseInt((screen.width < 80 ? this.asset.address.length : content.length) * 0.5) + 1;
        UI.text['Modalfield-4'] = blessed.text({
          parent: UI.modal.box,
          left: '50%-' + h,
          top: offset + (screen.height > 16 ? '+8' : '+6'),
          tags: true,
          shrink: true,
          align: 'center',
          content: content,
          style: { fg: 'white', bg: 'black' }
        });

        UI.edit['SendTx'] = UI.buttonfunc.make('SendTx', UI.modal.box, -2, -1, lang.buttonSendTx, 'blue');
        UI.edit['Cancel'] = UI.buttonfunc.make('Cancel', UI.modal.box, 0 - (lang.buttonCancel.length + lang.buttonSendTx.length), -1, lang.buttonCancel, '#400040');

        UI.edit['Max'].on('press', function () {
          UI.edit['Amount'].setValue(String(this.spendable));
          screen.render();
        }.bind({spendable: spendable}));

        UI.edit['Cancel'].on('press', function () {
          if (!UI.spinner.text || typeof UI.spinner.text['SendTx'] === 'undefined') {
            UI.modalfunc.destroy();
          }
        });

        UI.edit['SendTx'].on('press', function () {
          // is TX being sent?
          if (!UI.spinner.text || typeof UI.spinner.text['SendTx'] === 'undefined') {
            transaction.send({
              element: UI.text['AssetsA-' + symbol],
              asset: symbol,
              amount: UI.edit['Amount'].getValue(),
              source: this.asset.address,
              target: UI.edit['Target'].getValue()
            });
          }
        }.bind({asset: this.asset}));

        UI.edit['Target'].focus();
        UI.buttonfunc.init({'box': ['Target', 'Amount', 'Max', 'Cancel', 'SendTx']}, [1, 1]);
      } else {
        UI.modalfunc.alert(lang.modalSendTxTitle, lang.modalSendTxImpossible);
      }
    }.bind({asset: asset}));

    UI.edit.box.push('Recv' + i);
    UI.edit['Recv' + i] = UI.buttonfunc.make(lang.buttonRecv, UI.box, -2, y, 0, 'cyan');
    UI.edit['Recv' + i].on('press', function () {
      if (typeof this.asset.address !== 'undefined') {
        let symbol = this.asset.symbol;
        UI.modalfunc.make(lang.modalRecvTxTitle, (screen.height > 12 ? '\n' : '') + lang.modalRecvTxText.replace('%symbol%', symbol.toUpperCase()));

        let h = parseInt(this.asset.address.length * 0.5) + 1;
        UI.text['Modalfield'] = blessed.text({
          parent: UI.modal.box,
          left: '50%-' + h,
          top: '50%-2',
          tags: true,
          shrink: true,
          align: 'center',
          content: this.asset.address,
          height: 2,
          style: { fg: 'white', bg: 'black' }
        });

        UI.edit['Copy'] = UI.buttonfunc.make('Copy', UI.modal.box, 'center', '50%', lang.buttonCopyClip, 'yellow');
        UI.edit['Close'] = UI.buttonfunc.make('Close', UI.modal.box, -2, -1, lang.buttonClose, '#800080');

        UI.edit['Copy'].on('press', function () {
          clipboardy.write(this.address);
          for (let j = -5; j <= this.address.length + 3; j = j + 2) {
            setTimeout(function () {
              if (this.j <= this.address.length) {
                UI.text['Modalfield'].setContent(
                  '{blue-fg}' + this.address.substr(0, this.j) + '{/blue-fg}{bold}{yellow-fg}' +
                    this.address.substr(this.j, 3) +
                    '{/yellow-fg}{/bold}{blue-fg}' + this.address.substr(this.j + 3, this.address.length - this.j + 3) + '{/blue-fg}');
              } else {
                setTimeout(function () {
                  UI.text['Modalfield'].setContent(this.address);
                  screen.render();
                }.bind({address: this.address}), 150);
              }
              screen.render();
            }.bind({j: j, address: this.address}), 20 * j);
          }
        }.bind({address: this.asset.address}));

        UI.edit['Close'].on('press', function () {
          UI.modalfunc.destroy();
        });

        UI.buttonfunc.init({'box': ['Copy', 'Close']}, [1, 1]);
      }
    }.bind({i: i, asset: asset}));

    // scrolling
    UI.edit['Starred' + i].on('focus', function () {
      UI.scrollWindow(UI.box, this.y);
    }.bind({y: y}));

    UI.edit['Send' + i].on('focus', function () {
      UI.scrollWindow(UI.box, this.y);
    }.bind({y: y}));

    UI.edit['Recv' + i].on('focus', function () {
      UI.scrollWindow(UI.box, this.y);
    }.bind({y: y}));

    i++;
    screen.render();
  }

  // initialize UI.edit for this screen with their navigation and tab orders
  UI.buttonfunc.init({'topbar': UI.edit.topbar, 'box': ['ManageAssets', 'ManageAssets', 'ManageAssets', 'ManageAssets'].concat(UI.edit.box), 'lowbar': UI.edit.lowbar}, UI.edit.taborder);
  // initialize button to navigate down to send,recv,adv fields
  UI.edit.focus = 1;

  // add whitespace margin for a nice UI experience
  UI.text['bottomMargin'] = blessed.text({
    parent: UI.box,
    left: '50%-5',
    top: y + 2,
    tags: true,
    content: '.  .  .  .\n\n',
    style: {fg: '#cccccc', bg: 'black'}
  });
};
