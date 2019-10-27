var OP_JOIN = 0x00;
	OP_GAME = 0x01;
	OP_START = 0x02;
	OP_PMOVE = 0x03;
	OP_SMOVE = 0x04;
	OP_PROG = 0x05;
	OP_SPEC = 0x06;
	OP_STOP = 0x07;

function mmcbfbbr() {
	var img_name = "",
		knight_imgs = [],
		loaded = 0,
		errored = 0,
		knights_ready = false;

	function knight_load() {
		loaded += 1;
		if( loaded + errored == 20 ) {
			knights_ready = knights_ready || true;
		}
	}

	function knight_error() {
		errored += 1;
		if( loaded + errored == 20 ) {
			knights_ready = knights_ready || true;
		}
	}

	for( var i = 1; i <= 20; i++ ) {
		img_name = "knight_";
		if( i < 10 ) img_name += "0";
		img_name += i.toString();
		img_name += ".png";
		knight_imgs.push( new Image() );
		knight_imgs[ i - 1 ].addEventListener( "load", knight_load );
		knight_imgs[ i - 1 ].addEventListener( "load", knight_error );
		knight_imgs[ i - 1 ].src = "assets/" + img_name;
	}

	function Player( uid, name ) {
		this.uid = uid;
		this.name = name;
		this.x = 0;
		this.y = 0;
		this.direction = 0;
		this.magnitude = 0;
	}

	function Game() {
		this.canvas = null;
		this.ctx = null;
		this.players = {};
		this.countdown = 5;
		this.interval = null;
	}

	var ws = new WebSocket( "wss://mmcbfbbr.herokuapp.com" ),
		game = new Game(),
		cols = document.getElementById( "cols" ),
		lists = [ document.getElementById( "list-one" ), document.getElementById( "list-two" ), document.getElementById( "list-three" ) ],
		startscreen = document.getElementById( "startscreen" ),
		gamescreen = document.getElementById( "gamescreen" ),
		play = document.getElementById( "play-button" ),
		countdown = document.getElementById( "countdown" ),
		cdtext = document.getElementById( "countdown-text" ),
		cdInt;

	function init_game() {
		game.canvas = document.getElementById( "game" );
		game.canvas.height = 220;
		game.canvas.width = game.canvas.height / screen.height * screen.width;
		game.ctx = game.canvas.getContext( "2d" );
		game.startTS = null;
	}

	function refresh_players() {
		var players = Object.values( game.players ),
			span,
			col;
		lists[ 0 ].innerHTML = "";
		lists[ 1 ].innerHTML = "";
		lists[ 2 ].innerHTML = "";
		for( var i = 0; i < players.length; i++ ) {
			span = document.createElement( "span" );
			span.setAttribute( "class", "player-name" );
			span.innerHTML = players[ i ].name;
			col = lists[ i % 3 ];
			col.appendChild( span );
		}
	}

	function countdown_game() {
		game.countdown -= 1;
		if( game.countdown >= 0 ) {
			countdown.innerHTML = game.countdown.toString();
		} else {
			clearInterval( game.interval );
			startscreen.setAttribute( "class", "hidden" );
			gamescreen.setAttribute( "class", "" );
			ws.send( String.fromCharCode( OP_START ) );
		}
	}

	function start_game() {
		cols.setAttribute( "class", "hidden" );
		play.setAttribute( "class", "hidden" );
		countdown.setAttribute( "class", "" );
		countdown.innerHTML = "5";
		cdtext.setAttribute( "class", "" );
		game.interval = setInterval( countdown_game, 1000 );
	}

	function game_loop( ts ) {
		if( game.canvas != null ) {
			if( !game.lastTS ) game.lastTS = ts;
			game.lastTS = ts;
			if( knights_ready ) {

			}
		}
		window.requestAnimationFrame( game_loop );
	}

	function ws_open() {
		ws.send( String.fromCharCode( OP_STOP ) );
		ws.send( String.fromCharCode( OP_GAME ) );
		init_game();
	}

	function ws_close() {

	}

	function ws_msg( msg ) {
		var code = msg.data.charCodeAt( 0 ),
			data = msg.data.substring( 1 );
		switch( code ) {
			case OP_JOIN:
				game.players[ data.charCodeAt( 0 ) ] = new Player( data.charCodeAt( 0 ), data.substring( 1 ) );
				refresh_players();
				break;
			case OP_PMOVE:
				var player = game.players[ data.charCodeAt( 0 ) ];
				player.magnitude = data.charCodeAt( 3 );
				player.direction = data.charCodeAt( 1 ) << 8;
				player.direction += data.charCodeAt( 2 );
				console.log( "magnitude: " + player.magnitude.toString() + " direction: " + player.direction.toString() )
			case OP_SMOVE:
				break;
		}
	}

	ws.onopen = ws_open;
	ws.onclose = ws_close;
	ws.onmessage = ws_msg;

	window.requestAnimationFrame( game_loop );

	play.addEventListener( "touchstart", start_game );

	play.addEventListener( "click", start_game );
}

window.addEventListener( "load", mmcbfbbr );