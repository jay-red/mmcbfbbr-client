

var player = {
	name: "",
	ID: 0,
	color: "",
	// 0 - 360
	alpha: 0,
	// -180 - 180; -30 - 30
	beta: 0,
	// -90 - 90; -45 - 45
	gamma: 0,
	// direction: 0 - 360
	direction: 0,
	// magnitude: 0- 255
	magnitude: 0,
	spotlight: false,
	xAcc: 0,
	yAcc: 0,
	zAcc: 0,
	lastMag: 0,
	isWaffle: false
	health: 100;
};
var orientThreshold = {
	betaMax: 30,
	betaMin: 13,
	gammaMax: 30,
	gammaMin: 8,
	magDiff: 10
};
var ws = null;
var colorScheme = ["#ebdb00", "#740090", "#f15f0b", 
	"#90c8ee", "#ca0032", "#c2c481", "#7f7d83", "#3fb631", "#df73b4", 
	"#4566af", "#eb8062", "#5500a2", "#ddb100", "#9c0090", "#e4f93d", 
	"#85000b", "#88c013", "#7f360d", "#e8001e", "#243a0d"];

window.addEventListener('load', init);
// window.onload = function() {
// 	window.addEventListener('deviceorientation', getDeviceOrientation);
// 	// ScreenOrientation.lock("landscape-primary");
// 	// window.requestAnimationFrame(step);
// }

// window.addEventListener('deviceorientation', function(event) {
//   console.log(event.alpha + ' : ' + event.beta + ' : ' + event.gamma);
// });

function init() {
	ws = new WebSocket("wss://mmcbfbbr.herokuapp.com");
	ws.onopen = openHandler;
	ws.onclose = closeHandler;
	ws.onmessage = handleMessage;
	window.addEventListener('devicemotion', getDeviceAcceleration);
	window.addEventListener('deviceorientation', getDeviceOrientation);
}

function openHandler() {
	var playButton = document.getElementById("playButton");
	playButton.addEventListener('touchstart', sendName);
	playButton.style.backgroundColor = "cyan";
	playButton.style.borderColor = "cyan";
}

function closeHandler() {

}

function getDeviceOrientation(event) {
	// alert(event.alpha + ' : ' + event.beta + ' : ' + event.gamma);
	player.alpha = event.alpha;
	player.beta = event.beta;
	player.gamma = event.gamma;
	printDeviceOrientation();
	sendOrientation(5);
}

function getDeviceAcceleration(event) {
	var acc = event.acceleration;
	player.xAcc = acc.x;
	player.yAcc = acc.y;
	player.zAcc = acc.z;
	// printDeviceOrientation();
}

function printDeviceOrientation() {
	calcPlayerDirection();
	calcPlayerMagnitude(255);
	var display = document.getElementsByClassName("acc");
		for (var i = 0; i < display.length; i++) {
			if (i == 0) display[i].innerHTML = player.alpha;
			else if (i == 1) display[i].innerHTML = player.beta;
			else if (i == 2) display[i].innerHTML = player.gamma;
			else if (i == 3) display[i].innerHTML = player.direction;
			else if (i == 4) display[i].innerHTML = player.magnitude;
			else if (i == 5) display[i].innerHTML = player.xAcc;
			else if (i == 6) display[i].innerHTML = player.yAcc;
			else display[i].innerHTML = player.zAcc;
		}
}

function calcPlayerDirection() {
	var beta = player.beta;
	var gamma = player.gamma;
	if (Math.abs(beta) > orientThreshold.betaMax) {
		if (beta <= 0) beta = -orientThreshold.betaMax;
		else beta = orientThreshold.betaMax;
	}
	if (Math.abs(gamma) > orientThreshold.gammaMax) {
		if (gamma <= 0) gamma = -orientThreshold.gammaMax;
		else gamma = orientThreshold.gammaMax;
	}
	var theta = Math.atan2(gamma / orientThreshold.gammaMax, 
		-beta / orientThreshold.betaMax);
	theta = theta / Math.PI * 180 + 180;
	player.direction = theta;
	return theta;
}

function calcPlayerMagnitude(range) {
	var beta = Math.abs(player.beta);
	var gamma = Math.abs(player.gamma);
	var mag = 0;
	if (beta > orientThreshold.betaMax) {
		beta = orientThreshold.betaMax;
	}
	else if (beta < orientThreshold.betaMin) {
		beta = 0;
	}

	if (gamma > orientThreshold.gammaMax) {
		gamma = orientThreshold.gammaMax;
	}
	else if (gamma < orientThreshold.gammaMin) {
		gamma = 0;
	}

	beta = beta / orientThreshold.betaMax * 255;
	gamma = gamma / orientThreshold.gammaMax * 255;

	if (beta != 0 && gamma != 0) {
		var tangent = Math.tan(player.direction);
		// beta = beta / orientThreshold.betaMax * Math.sqrt(Math.pow(range, 2) / 2);
		// gamma = gamma / orientThreshold.gammaMax * Math.sqrt(Math.pow(range, 2) / 2);
		var x = Math.sqrt(1 / ((1 / Math.pow(beta, 2)) + (Math.pow(tangent, 2) 
			/ Math.pow(gamma, 2))));
		var y = x * tangent;
		mag = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	}
	else if (beta != 0) {
		mag = beta;
	}
	else if (gamma != 0) {
		mag = gamma;
	}
	player.lastMag = player.magnitude;
	player.magnitude = mag;
	return mag;
}

var start = null;

function step(timestamp) {
  if (!start) start = timestamp;
  var progress = timestamp - start;
  printDeviceOrientation();
  if (progress % 100 == 50) {
    window.requestAnimationFrame(step);
  }
}

function sendName() {
	event.preventDefault();
	var name = document.getElementById("nameInput").value;
	if (!name) return;
	var playButton = document.getElementById("playButton");
	var message = String.fromCharCode(0x00) + name;
	console.log("sendName: " + message);
	ws.send(message);
	playButton.removeEventListener('click', sendName);
	waitGameStart();
}

function waitGameStart() {
	console.log("waiting");
	var startScreen = document.getElementById("startScreen");
	startScreen.style.display = "none";
	var waitScreen = document.getElementById("waitScreen");
	waitScreen.style.display = "initial";
	if (player.color != "") {
		waitScreen.style.backgroundColor = player.color;
	}
}

function gameStart() {
	// window.addEventListener('deviceorientation', getDeviceOrientation);
	// window.addEventListener('devicemotion', getDeviceAcceleration)
	var waitScreen = document.getElementById("waitScreen");
	waitScreen.style.display = "none";
	var gameScreen = document.getElementById("gameScreen");
	gameScreen.style.display = "initial";
	var gameButton = document.getElementById("modeButton");
	gameButton.addEventListener('touchstart', function() {
		player.spotlight = !player.spotlight;
	});
}

function sendOrientation(threshold) {
	var mode = player.spotlight ? 0x04 : 0x03;
	var orientation = String.fromCharCode(mode) + 
		String.fromCharCode((player.direction & 0xFF00) >> 8) + 
		String.fromCharCode(player.direction & 0x00FF) + 
		String.fromCharCode(player.magnitude);
	console.log("sendOrientation: " + orientation);
	if (Math.abs(player.lastMag - player.magnitude) > threshold)
		ws.send(orientation);
}

function handleMessage(ms) {
	ms = ms.data;
	switch(ms.charCodeAt(0)) {
		case 0:
			if (ms.charCodeAt(1) != 0) {
				player.ID = ms.charCodeAt(1);
				console.log("ID: " + player.ID);
				// player.color = "0x" + ms.charCodeAt(2).toString(16) + 
				// ms.charCodeAt(3).toString(16) + ms.charCodeAt(4).toString(16);
				player.color = colorScheme[colorScheme.length - player.ID];
				console.log("color: " + player.color);
				var waitScreen = document.getElementById("waitScreen");
				waitScreen.style.backgroundColor = player.color;
			}
			else {
				document.getElementById("waitMsg").innerHTML = "Cannot join game";
			}
			break;
		case 2:
			// game starts?
			console.log( "game start" );
			gameStart();
			break;
		case 8:
			// countdown starts
			if (ms.charCodeAt(1) == player.ID) {
				player.isWaffle = true;
			}
			break;
		default:
	}
}

