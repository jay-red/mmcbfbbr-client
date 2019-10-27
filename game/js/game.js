var OP_JOIN = 0x00;
	OP_GAME = 0x01;
	OP_START = 0x02;
	OP_PMOVE = 0x03;
	OP_SMOVE = 0x04;
	OP_PROG = 0x05;
	OP_SPEC = 0x06;
	OP_STOP = 0x07;

function mmcbfbbr() {
	function Player( uid, name ) {
		this.uid = uid;
		this.name = name;
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

	function countdown_game() {
		game.countdown -= 1;
		if( game.countdown >= 0 ) {
			countdown.innerHTML = game.countdown.toString();
		} else {
			clearInterval( game.interval );
			startscreen.setAttribute( "class", "hidden" );
			gamescreen.setAttribute( "class", "" );
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
		}
		window.requestAnimationFrame( game_loop );
	}

	function ws_open() {
		ws.send( String.fromCharCode( 0x07 ) );
		ws.send( String.fromCharCode( 0x01 ) );
		init_game();
	}

	function ws_close() {

	}

	function ws_msg( msg ) {
		code = msg.data.charCodeAt( 0 );
		data = msg.data.substring( 1 ); 
		switch( code ) {
			case OP_JOIN:
				game.players[ data.charCodeAt( 0 ) ] = new Player( data.charCodeAt( 0 ), data.substring( 1 ) );
				console.log( game );
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