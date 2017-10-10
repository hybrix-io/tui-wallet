// view: asset screen
UI.views.assets = function() {
  // fill local usercrypto object with keys and nonce later on
  GL.usercrypto = { user_keys: GL.session.user_keys, nonce: GL.session.nonce };
  
  UI.edit.topbar = [];
  UI.edit.box = [];
  UI.edit.lowbar = ['Logger','Quit'];
  UI.edit.taborder = [3,1];

  // elements: MAIN
  balance = {}
  balance.asset = [];
  balance.amount = [];
  balance.lasttx = [];
  GL.cur_step = next_step();
  najax({ url: nodepath+zchan(GL.usercrypto,GL.cur_step,'a'),
    success: function(object,pass){
      var object = zchan_obj(GL.usercrypto,GL.cur_step,object);
      var i = 0;
      var output = '';

      // create asset table
      UI.text['AssetsH1'] = blessed.text({
        parent: UI.box,
        padding: { left: 1, right: 1 },
        left: 0,
        top: 1,
        tags: true,
        name: 'AssetsH1',
        content: 'Asset',
        width: '25%',
        height: 1,
        style: {
          fg: '#dddddd',
          bg: 'transparent'
        }
      });
      
      UI.text['AssetsH2'] = blessed.text({
        parent: UI.box,
        padding: { left: 1, right: 1 },
        left: '25%',
        top: 1,
        tags: true,
        name: 'AssetsH2',
        content: 'Balance',
        width: 16,
        height: 1,
        style: {
          fg: '#dddddd',
          bg: 'transparent'
        }
      });

      // initialize all assets
      if( assets.count==0 ) { for (var entry in object.data) { assets.count++; } }
      
      var pass = object.data;
      hybriddcall({r:'/s/deterministic/hashes',z:1,pass:pass},null,
        function(object,passdata){
          assets.modehashes = object.data;

          var i = 0;
          for (var entry in passdata) {
            // load assets and balances into arrays
            balance.asset[i] = entry;
            balance.amount[i] = 0;
            // increment array counter
            i++;

            // get and initialize deterministic encryption routines for assets
            // timeout used to avoid double downloading of deterministic routines            var defer = (assets.init.indexOf(passdata[entry].split('.')[0])==-1?0:12000);
            var defer = (assets.init.indexOf(passdata[entry].split('.')[0])==-1?0:3000);
            assets.init.push(passdata[entry].split('.')[0]);
            setTimeout(function(entry,passdata) {
              init_asset(entry,passdata[entry]);
            },(100*i)+defer,entry,passdata);
            
            // if all assets inits are called run  // if(i==assets.count) { }
          }

          // display assets
          var i=0;
          for (var entry in passdata) {
            balance.lasttx[i] = 0;
              
            //
            // UI fields
            //
            
            // height of each element group
            var y=3+(i*2);

            UI.text['AssetsS-'+balance.asset[i]] = blessed.text({
              parent: UI.box,
              padding: { left: 1, right: 1 },
              left: 0,
              top: y,
              tags: true,
              name: 'AssetsS-'+balance.asset[i],
              content: balance.asset[i].toUpperCase(),
              width: '25%',
              height: 1,
              style: {
                bg: 'transparent'
              }
            });

            UI.text['AssetsA-'+balance.asset[i]] = blessed.text({
              parent: UI.box,
              padding: { left: 1, right: 1 },
              left: '25%',
              top: y,
              tags: true,
              name: 'AssetsA'+balance.asset[i],
              content: '?',
              width: 16,
              height: 1,
              style: {
                bg: 'transparent'
              }
            });
              
            // UI.edit
            UI.edit.box.push('Send'+i);
            UI.edit['Send'+i] = UI.buttonfunc.make(lang.buttonSend,UI.box,-8-(lang.buttonAdv.length+lang.buttonRecv.length),y,0,'blue');
            UI.edit['Send'+i].on('press', function() {
              var asset = this.balance.asset[this.i];
              if(!isNaN(UI.text['AssetsA-'+asset].getText())) {
                var spendable = toInt(UI.text['AssetsA-'+asset].getText()).minus(toInt(assets.fees[asset]));
                if(spendable<0) { spendable=0; }
                
                UI.modalfunc.make(lang.modalSendTxTitle,
                  '\n'+lang.modalSendTxText.replace('%amount%',fromInt(spendable)).replace('%symbol%',asset.toUpperCase())
                );

                var offset='25%';
                UI.text['Modalfield-1'] = blessed.text({
                  parent: UI.modal.box,
                  left: '10%', top: offset,tags:true,
                  content: '{black-bg}'+lang.modalSendTxTo+' {/black-bg}',
                  align: 'left', height: 1
                });
                UI.modalfunc.input('Target','10%',offset+'+1','80%');

                UI.text['Modalfield-2'] = blessed.text({
                  parent: UI.modal.box,
                  left: '10%', top: offset+'+3',tags:true,
                  content: '{black-bg}'+lang.modalSendTxAmount+' {/black-bg}',
                  align: 'left', height: 1
                });
                UI.modalfunc.input('Amount','10%',offset+'+4','80%-'+(3+lang.buttonMax.length));
                UI.edit['Max'] = UI.buttonfunc.make('Max',UI.modal.box,'89%-'+(2+lang.buttonMax.length),offset+'+4',lang.buttonMax,'yellow');

                var content = '('+lang.modalSendTxFee.replace('%fee%',assets.fees[asset].replace(/0+$/, '')).replace('%symbol%',asset.toUpperCase())+')';
                var h = parseInt(content.length*0.5)+1;
                UI.text['Modalfield-3'] = blessed.text({
                  parent: UI.modal.box,
                  left: '50%-'+h,top: offset+(screen.height>16?'+6':'+5'),tags:true,shrink:true,align: 'center',
                  content: content,
                  style: { fg: 'white', bg: 'black' }  
                });
                var content = lang.modalSendTxFrom.replace('%from%',((lang.modalSendTxFrom.length+assets.addr[asset].length)>(screen.width*0.5)?'\n':'')+assets.addr[asset]);
                var h = parseInt((screen.width<80?assets.addr[asset].length:content.length)*0.5)+1;
                UI.text['Modalfield-4'] = blessed.text({
                  parent: UI.modal.box,
                  left: '50%-'+h,top: offset+(screen.height>16?'+8':'+6'),tags:true,shrink:true,align: 'center',
                  content: content,
                  style: { fg: 'white', bg: 'black' }  
                });
                            
                UI.edit['SendTx'] = UI.buttonfunc.make('SendTx',UI.modal.box,-2,-1,lang.buttonSendTx,'blue');
                UI.edit['Cancel'] = UI.buttonfunc.make('Cancel',UI.modal.box,0-(lang.buttonCancel.length+lang.buttonSendTx.length),-1,lang.buttonCancel,'#400040');

                UI.edit['Max'].on('press', function() {
                  UI.edit['Amount'].setValue(String(this.spendable));
                  screen.render();
                }.bind({spendable:spendable}));
              
                UI.edit['Cancel'].on('press', function() {
                  if(typeof UI.spinner.text['SendTx']=='undefined') {
                    UI.modalfunc.destroy();
                  }
                });
                
                UI.edit['SendTx'].on('press', function() {
                  // is TX being sent?
                  if(typeof UI.spinner.text['SendTx']=='undefined') {
                    // send transaction
                    send_tx({
                      element:UI.text['AssetsA-'+asset],
                      asset:asset,
                      amount:UI.edit['Amount'].getValue(),
                      source:assets.addr[asset],
                      target:UI.edit['Target'].getValue()
                    });
                  }
                });
                
                UI.buttonfunc.init({'box':['Target','Amount','Max','Cancel','SendTx']},[1,1]);              
              } else {
                UI.modalfunc.alert(lang.modalSendTxTitle,lang.modalSendTxImpossible);
              }
            }.bind({i:i,balance:balance}));

            UI.edit.box.push('Recv'+i);
            UI.edit['Recv'+i] = UI.buttonfunc.make(lang.buttonRecv,UI.box,-5-lang.buttonAdv.length,y,0,'cyan');
            UI.edit['Recv'+i].on('press', function() {
            
              var asset = this.balance.asset[this.i];
              UI.modalfunc.make(lang.modalRecvTxTitle,(screen.height>12?'\n':'')+lang.modalRecvTxText.replace('%symbol%',asset.toUpperCase()));

              var h = parseInt(assets.addr[asset].length*0.5)+1;
              UI.text['Modalfield'] = blessed.text({
                parent: UI.modal.box,
                left: '50%-'+h,
                top: '50%-2',
                tags: true,shrink:true,align: 'center',
                content: assets.addr[asset],
                height: 2, style: { fg: 'white', bg: 'black' }
              });
            
              UI.edit['Copy'] = UI.buttonfunc.make('Copy',UI.modal.box,'center','50%',lang.buttonCopyClip,'yellow');
              UI.edit['Close'] = UI.buttonfunc.make('Close',UI.modal.box,-2,-1,lang.buttonClose,'#800080');

              UI.edit['Copy'].on('press', function() {
                clipboardy.write(this.address);
                for(var j=-5; j<=this.address.length+3; j=j+2) {
                  setTimeout(function(){
                    if(this.j<=this.address.length) {
                      UI.text['Modalfield'].setContent(
                      '{blue-fg}'+this.address.substr(0,this.j)+'{/blue-fg}{bold}{yellow-fg}'+
                      this.address.substr(this.j,3)+
                      '{/yellow-fg}{/bold}{blue-fg}'+this.address.substr(this.j+3,this.address.length-this.j+3)+'{/blue-fg}');
                    } else {
                      setTimeout(function(){
                        UI.text['Modalfield'].setContent(this.address);
                        screen.render();
                      }.bind({address:this.address}),150);
                    }
                    screen.render();
                  }.bind({j:j,address:this.address}),20*j);
                }
              }.bind({address:assets.addr[asset]}));

              UI.edit['Close'].on('press', function() {
                UI.modalfunc.destroy();
              });

              UI.buttonfunc.init({'box':['Copy','Close']},[1,1]);
            }.bind({i:i,balance:balance}));

            UI.edit.box.push('Adv'+i);
            UI.edit['Adv'+i] = UI.buttonfunc.make(lang.buttonAdv,UI.box,-2,y,0,'yellow');
            UI.edit['Adv'+i].on('press', function() {
              //UI.box.setContent('Advanced '+this.balance.asset[this.i]+' function stub.');
              UI.modalfunc.alert(lang.modalAdvTitle,lang.modalAdvText);
              screen.render();
            }.bind({i:i,balance:balance}));
            
            i++;
          }

          // finally: initialize UI.edit for this screen with their navigation and tab orders
          UI.buttonfunc.init({'topbar':UI.edit.topbar,'box':UI.edit.box,'lowbar':UI.edit.lowbar},UI.edit.taborder);

          // refresh assets
          intervals = setInterval( function(nodepath) {
            getbalances({i:i,balance:balance});
          },30000,nodepath);

          // fill the field elements when interface has just loaded
          loadinterval = setInterval(
            // check if assets are loaded by hybriddcall
            function() {          
              var assetsloaded = true;
              for (i = 0; i < assets.count; i++) {
                if(typeof balance.asset[i] != 'undefined' && typeof assets.addr[balance.asset[i]] == 'undefined') {
                  assetsloaded = false;
                }
              }
              if(assetsloaded) {
                getbalances({i:i,balance:balance});                     
                clearInterval(loadinterval);
              }
            }
          ,500);          

        }
      );
    }
  });
}

function getbalances(properties) {
  var i = properties.i;
  var balance = properties.balance;
  // fill asset elements
  for (j = 0; j < i; j++) {
    setTimeout(
      function(j) {      
        if(typeof balance.asset[j] !== 'undefined') {
          var element = 'AssetsA-'+balance.asset[j];
          var address = '';
          if((balance.lasttx[j]+60000)<(new Date).getTime()) {
            hybriddcall({r:'a/'+balance.asset[j]+'/balance/'+assets.addr[balance.asset[j]],z:0},element,
              function(object){
                if(typeof object.data=='string') { object.data = formatFloat(object.data); }
                return object;
              }
            );
          }
        }
      }
    ,j*500,j);
  }
}

function send_tx(properties) {
    spinnerStart('SendTx'); // set button to spinner
    var p = {};
    p.asset = properties.asset;
    for(var j=0;j<balance.asset.length;j++) { // block balance updating for transacting asset
      if(balance.asset[j]==p.asset) { balance.lasttx[j] = (new Date).getTime(); }
    }
    p.amount = Number( properties.amount );
    p.fee = Number(assets.fees[p.asset]);
    p.source_address = String(properties.source).trim();
    p.target_address = String(properties.target).trim();
    p.element = properties.element;
    p.balorig = p.element.getText();
    p.balance = toInt(p.balorig).minus(toInt(p.amount).plus(toInt(p.fee)));
    // instantly deduct hypothetical amount from balance in GUI
    p.element.setText(String(p.balance));
    // send call to perform transaction
    if(typeof assets.fact[p.asset]!='undefined') {
      hybriddcall({r:'a/'+p.asset+'/unspent/'+p.source_address+'/'+String(toInt(p.amount).plus(toInt(p.fee))),z:1,pass:p},0, function(object,passdata) {
        if(typeof object.data!='undefined' && !object.err) {
          var unspent = object.data;
          var p = passdata;
          if(typeof unspent!='undefined' && typeof unspent.change!='undefined') { unspent.change = toInt(unspent.change,assets.fact[p.asset]); }
          storage.read(assets.modehashes[ assets.mode[p.asset] ], function(dcode) {
            deterministic = activate( LZString.decompressFromEncodedURIComponent(dcode) );
            setTimeout(function() {
              if(typeof deterministic!='object' || deterministic=={}) {
                alert(lang.alertError,lang.modalSendTxErrorDcode);
                p.element.setText(p.balorig); // restore original amount
              } else {
                try {
                  var transaction = deterministic.transaction({
                    source:p.source_address,
                    target:p.target_address,
                    amount:toInt(p.amount,assets.fact[p.asset]),
                    fee:toInt(p.fee,assets.fact[p.asset]),
                    factor:assets.fact[p.asset],
                    keys:assets.keys[p.asset],
                    seed:assets.seed[p.asset],
                    unspent:unspent
                  });
                  if(typeof transaction!='undefined') {
                    // DEBUG: logger(transaction);
                    hybriddcall({r:'a/'+p.asset+'/push/'+transaction,z:1,pass:p},null, function(object,passdata) {
                      var p = passdata;
                      if(typeof object.data!='undefined' && object.error==0) {
                        // now deduct real amount from balance in GUI
                        p.element.setContent('{red-fg}'+String(p.balance)+'{/red-fg}');
                        setTimeout(function() {
                          spinnerStop('SendTx'); // stop spinner
                          UI.modalfunc.destroy(); // hide modal
                        },1000);
                        // push function returns TXID
                        logger('Node sent transaction ID: '+object.data);
                      } else {
                        spinnerStop('SendTx'); // stop spinner
                        logger('Error sending transaction: '+object.data);
                        alert(lang.alertError,lang.modalSendTxFailed+'\n'+object.data);
                        p.element.setText(p.balorig); // restore original amount
                      }
                    });
                  } else {
                    spinnerStop('SendTx'); // stop spinner
                    alert('The transaction deterministic calculation failed!  Please ask the Internet of Coins developers to fix this.');
                    p.element.setText(p.balorig); // restore original amount
                    logger('Deterministic calculation failed for '+p.asset+'!')
                  }  
                } catch(e) {
                  spinnerStop('SendTx'); // stop spinner
                  alert('Sorry, the transaction could not be generated! Check if you have entered the right address.');
                  p.element.setText(p.balorig); // restore original amount
                  logger('Error generating transaction for '+p.asset+': '+e)
                }
              }
            },500);
          });
        } else {
          spinnerStop('SendTx'); // stop spinner
          alert('Sorry, the node did not send us data about unspents for making the transaction! Maybe there was a network problem. Please simply try again.');
        }
      });
    } else {
      spinnerStop('SendTx'); // stop spinner
      alert('Transaction failed. Assets were not yet completely initialized. Please try again in a moment.');
    }
}
