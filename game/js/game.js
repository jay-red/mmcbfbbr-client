var OP_JOIN = 0x00;
	OP_GAME = 0x01;
	OP_START = 0x02;
	OP_PMOVE = 0x03;
	OP_SMOVE = 0x04;
	OP_PROG = 0x05;
	OP_SPEC = 0x06;
	OP_STOP = 0x07,
	OP_WAIT = 0x08,
	MAX_VELOCITY_PLAYER = 2,
	MAX_VELOCITY_BOSS = 1,
	PLAYER_HITBOX = [[0,0],[14,0],[14,20],[0,20]],
	SPOTLIGHT_HITBOX = [[3,3],[17,3],[17,17],[3,17]],
	WAFFLE_HITBOX = [[13,33],[55,33],[55,89],[13,89]],
	BEACH_HITBOX = [[6,6],[34,6],[34,34],[6,34]];

function mmcbfbbr() {
	var img_name = "",
		knight_imgs = [],
		spotlight_imgs = [],
		waffle_img = new Image();
		loaded = 0,
		errored = 0,
		knights_ready = false,
		waffle_ready = false;

	function knight_load() {
		loaded += 1;
		if( loaded + errored == 40 ) {
			knights_ready = knights_ready || true;
		}
	}

	function knight_error() {
		errored += 1;
		if( loaded + errored == 40 ) {
			knights_ready = knights_ready || true;
		}
	}

	function waffle_load() {
		waffle_ready = true;
	}

	waffle_img.addEventListener( "load", waffle_load );
	waffle_img.src = "assets/waffle.png";

	for( var i = 1; i <= 20; i++ ) {
		img_name = "knight_";
		if( i < 10 ) img_name += "0";
		img_name += i.toString();
		img_name += ".png";
		knight_imgs.push( new Image() );
		knight_imgs[ i - 1 ].addEventListener( "load", knight_load );
		knight_imgs[ i - 1 ].addEventListener( "load", knight_error );
		knight_imgs[ i - 1 ].src = "assets/" + img_name;
		img_name = "spotlight_";
		if( i < 10 ) img_name += "0";
		img_name += i.toString();
		img_name += ".png";
		spotlight_imgs.push( new Image() );
		spotlight_imgs[ i - 1 ].addEventListener( "load", knight_load );
		spotlight_imgs[ i - 1 ].addEventListener( "load", knight_error );
		spotlight_imgs[ i - 1 ].src = "assets/" + img_name;
	}

	function Player( uid, name ) {
		this.uid = uid;
		this.name = name;
		this.x = 0;
		this.y = 0;
		this.direction = 0;
		this.magnitude = 0;
		this.dx = 0;
		this.dy = 0;
		this.sx = 0;
		this.sy = 0;
		this.sdirection = 0;
		this.smagnitude = 0;
		this.sdx = 0
		this.sdy = 0
		this.spotlight = false;
		this.health = 100
		this.alive = true;
	}

	function Game() {
		this.canvas = null;
		this.ctx = null;
		this.players = {};
		this.countdown = 5;
		this.interval = null;
		this.started = false;
		this.boss = -1;
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
			game.started = true;
		}
	}

	function start_game() {
		cols.setAttribute( "class", "hidden" );
		play.setAttribute( "class", "hidden" );
		countdown.setAttribute( "class", "" );
		countdown.innerHTML = "5";
		cdtext.setAttribute( "class", "" );
		game.interval = setInterval( countdown_game, 1000 );
		ws.send( String.fromCharCode( OP_WAIT ) );
	}

	function update( elapsed ) {
		var players = Object.values( game.players ),
			MAX_VELOCITY = MAX_VELOCITY_PLAYER,
			width = 14,
			height = 20,
			player;
		for( var i = 0; i < players.length; i++ ) {
			player = players[ i ];
			if( player.uid == game.boss ) {
				MAX_VELOCITY = MAX_VELOCITY_BOSS;
				width = 70;
				height = 94;
			}
			if( player.spotlight ) {
				player.sdy += ( Math.sin( player.sdirection ) * player.smagnitude * 50 ) * .000001 * elapsed;
				player.sdx += ( Math.cos( player.sdirection ) * player.smagnitude * 50 ) * .000001 * elapsed;
				if( player.sdy < -MAX_VELOCITY ) {
					player.sdy = -MAX_VELOCITY;
				} else if( player.sdy > MAX_VELOCITY ) {
					player.sdy = MAX_VELOCITY;
				}
				if( player.sdx < -MAX_VELOCITY ) {
					player.sdx = -MAX_VELOCITY;
				} else if( player.sdx > MAX_VELOCITY ) {
					player.sdx = MAX_VELOCITY;
				}
				player.sy += player.sdy;
				player.sx += player.sdx;
				if( player.sy < 0 ) {
					player.sy = 0;
					if( player.sdy < 0 ) {
						player.sdy = 0;
					}
				}
				if( player.sy + height > game.canvas.height ) {
					player.sy = game.canvas.height - height;
					if( player.sdy > 0 ) {
						player.sdy = 0;
					}
				}
				if( player.sx < 0 ) {
					player.sx = 0;
					if( player.sdx < 0 ) {
						player.sdx = 0;
					}
				}
				if( player.sx + width > game.canvas.width ) {
					player.sx = game.canvas.width - width;
					if( player.sdx > 0 ) {
						player.sdx = 0;
					}
				}
			} else {
				player.dy += ( Math.sin( player.direction ) * player.magnitude * 50 ) * .000001 * elapsed;
				player.dx += ( Math.cos( player.direction ) * player.magnitude * 50 ) * .000001 * elapsed;
				if( player.dy < -MAX_VELOCITY ) {
					player.dy = -MAX_VELOCITY;
				} else if( player.dy > MAX_VELOCITY ) {
					player.dy = MAX_VELOCITY;
				}
				if( player.dx < -MAX_VELOCITY ) {
					player.dx = -MAX_VELOCITY;
				} else if( player.dx > MAX_VELOCITY ) {
					player.dx = MAX_VELOCITY;
				}
				console.log( "dx: " + player.dx.toString() + " dy: " + player.dy.toString() );
				player.y += player.dy;
				player.x += player.dx;
				if( player.y < 0 ) {
					player.y = 0;
					if( player.dy < 0 ) {
						player.dy = 0;
					}
				}
				if( player.y + height > game.canvas.height ) {
					player.y = game.canvas.height - height;
					if( player.dy > 0 ) {
						player.dy = 0;
					}
				}
				if( player.x < 0 ) {
					player.x = 0;
					if( player.dx < 0 ) {
						player.dx = 0;
					}
				}
				if( player.x + width > game.canvas.width ) {
					player.x = game.canvas.width - width;
					if( player.dx > 0 ) {
						player.dx = 0;
					}
				}
			}
		}
	}

	function collide() {
		var waffle = game.players[ game.boss ],
			players = Object.values( game.players ),
			x,
			y,
			sx,
			sy,
			player;
		if( waffle.alive ) {
			for( var i = 0; i < players.length; i++ ) {
				player = players[ i ];
				if( player.alive && player.spotlight ) {
					for( var j = 0; j < 4; j++ ) {
						sx = players[ i ].sx + SPOTLIGHT_HITBOX[ j ][ 0 ];
						sy = players[ i ].sy + SPOTLIGHT_HITBOX[ j ][ 1 ];
						if( sx >= waffle.x + WAFFLE_HITBOX[ 0 ][ 0 ] && sx <= waffle.x + WAFFLE_HITBOX[ 2 ][ 0 ] 
						&& sy >= waffle.y + WAFFLE_HITBOX[ 0 ][ 1 ] && sy <= waffle.y + WAFFLE_HITBOX[ 2 ][ 1 ] ) {
							console.log( "DEATH TO WAFFLE" );
						}
						x = players[ i ].x + PLAYER_HITBOX[ j ][ 0 ];
						y = players[ i ].y + PLAYER_HITBOX[ j ][ 1 ];
						if( x >= waffle.sx + BEACH_HITBOX[ 0 ][ 0 ] && x <= waffle.sx + BEACH_HITBOX[ 2 ][ 0 ] 
						&& y >= waffle.sy + BEACH_HITBOX[ 0 ][ 1 ] && y <= waffle.sy + BEACH_HITBOX[ 2 ][ 1 ] ) {
							console.log( "DEATH TO US" );
						}
					}
				}
			}
		} else {

		}
		
	}

	function render_players() {
		var players = Object.values( game.players ),
			player,
			waffle;
		for( var i = 0; i < players.length; i++ ) {
			player = players[ i ];
			if( player.alive && game.boss != player.uid ) {
				game.ctx.drawImage( knight_imgs[ player.uid - 1 ], 0, 0, 14, 20, player.x | 0, player.y | 0, 14, 20 );
				if( player.spotlight ) {
					game.ctx.drawImage( spotlight_imgs[ player.uid - 1 ], 0, 0, 20, 20, player.sx | 0, player.sy | 0, 20, 20 );
				}
			}
		}
		waffle = game.players[ game.boss ];
		if( waffle.alive ) {
			game.ctx.drawImage( waffle_img, 0, 0, 70, 94, waffle.x | 0, waffle.y | 0, 70, 94 );
		}
	}

	function game_loop( ts ) {
		if( game.canvas != null ) {
			if( !game.lastTS ) game.lastTS = ts;
			if( game.started && knights_ready ) {
				game.ctx.clearRect( 0, 0, game.canvas.width, game.canvas.height );
				update( ts - game.lastTS );
				collide();
				render_players();
			}
			game.lastTS = ts;
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
		console.log( code );
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
				player.direction = player.direction / 180 * Math.PI;
				player.spotlight = false;
				//console.log( "magnitude: " + player.magnitude.toString() + " direction: " + player.direction.toString() )
				break;
			case OP_SMOVE:
				var player = game.players[ data.charCodeAt( 0 ) ];
				if( !player.spotlight ) {
					player.sx = player.x - 3;
					player.sy = player.y;
				}
				player.smagnitude = data.charCodeAt( 3 );
				player.sdirection = data.charCodeAt( 1 ) << 8;
				player.sdirection += data.charCodeAt( 2 );
				player.sdirection = player.sdirection / 180 * Math.PI;
				player.spotlight = true;
				//console.log( "smagnitude: " + player.magnitude.toString() + " sdirection: " + player.direction.toString() )
				break;
			case OP_WAIT:
				//game.boss = data.charCodeAt( 0 );
				break;
		}
	}

	game.boss = 1;
	game.players[ 2 ] = new Player( 2, "waffle" );

	ws.onopen = ws_open;
	ws.onclose = ws_close;
	ws.onmessage = ws_msg;

	window.requestAnimationFrame( game_loop );

	play.addEventListener( "touchstart", start_game );

	play.addEventListener( "click", start_game );
}

window.addEventListener( "load", mmcbfbbr );