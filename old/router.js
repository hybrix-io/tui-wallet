// exports
exports.route = route;

// routing handler
// reserved letters: a asset, f function, n network info, p proc, s source, v views, x xauth

function route(request,modules) {
  var result = null;
	// parse path array
	if(typeof request.url === "string") {
		var xpath = request.url.split("/"); // create xpath array
		for (var i = 0; i < xpath.length; i++) {
			if (xpath[i] === "") { xpath.splice(i,1); i--; } else { xpath[i] = decodeURIComponent(xpath[i]); } // prune empty values and clean vars
		}

		// default error message
		var result = {error:1, info:"Your request was not understood!"};		// route path handling (console.log only feedbacks same route once)
		if (JSON.stringify(xpath) !== JSON.stringify(last_xpath)) {
			logger(" [.] routing RPC request "+JSON.stringify(xpath));
		}
		last_xpath = xpath;
  }

	// routing logic starts here
	if (xpath.length == 0) {
		result = {info:" *** Welcome to the cli4ioc RPC. Please enter a path. For example: /wallet/transaction/from_address/amount/to_address *** ", error:0};
	} else {
		// PLEASE KEEP IN ALPHABETICAL ORDER FOR EASY REFERENCE!!!
		if(xpath[0] === "l" || xpath[0] === "login") {
      result = {info:"Please add userid and passwd to path. Example: /login/USER/PASS", error:1};
      if(typeof xpath[1] !== 'undefined' && typeof xpath[2] !== 'undefined') {
        result = {info:"Login command passed.", error:0};
        if(typeof screen !== 'undefined') {
          if (!screen.destroyed) {
            spinnerStopAll();
            clearInterval(intervals);
            screen.destroy();
            setTimeout(function() {
              GL.assetmodes = {};
              GL.assetnames = {};
            },4000);   // FIXME: wasteful timeout to avoid weird NACL error
            setTimeout(function() {
              try {
                login(xpath[1],xpath[2]);
              } catch(e) {}
            },12000);   // FIXME: wasteful timeout to avoid weird NACL error
          }
        } else {
          login(xpath[1],xpath[2]);
        }
      }
		}
  }

  if(result) {
  	// return stringified data object
  	return JSON.stringify(result);
  } else {
    return '{"info":"Unknown error or timeout!","error":1}';
  }
}
