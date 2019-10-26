

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
	spotlight: false
};
var orientThreshold = {
	betaMax: 30,
	gammaMax: 45
};
var ws = null;

// window.onload = initWs;
window.onload = function() {
	window.addEventListener('deviceorientation', getDeviceOrientation);
	// ScreenOrientation.lock("landscape-primary");
	// window.requestAnimationFrame(step);
}

// window.addEventListener('deviceorientation', function(event) {
//   console.log(event.alpha + ' : ' + event.beta + ' : ' + event.gamma);
// });

function initWs() {
	ws = new Webocket("wss://mmcbfbbr.herokuapp.com");
	ws.onopen = openHandler;
	ws.onclose = closeHandler;
	ws.onmessage = handleMessage;
}

function openHandler() {
	var playButton = document.getElementById("playButton");
	playButton.addEventListener('touchstart', sendName);
	window.addEventListener('deviceorientation', getDeviceOrientation);
}

function closeHandler() {

}

function getDeviceOrientation(event) {
	// alert(event.alpha + ' : ' + event.beta + ' : ' + event.gamma);
	player.alpha = event.alpha;
	player.beta = event.beta;
	player.gamma = event.gamma;
	printDeviceOrientation();
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
			else display[i].innerHTML = player.magnitude;
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
	if (beta > orientThreshold.betaMax) {
		beta = orientThreshold.betaMax;
	}
	if (gamma > orientThreshold.gammaMax) {
		gamma = orientThreshold.gammaMax;
	}
	beta = beta / orientThreshold.betaMax * Math.sqrt(Math.pow(range, 2) / 2);
	gamma = gamma / orientThreshold.gammaMax * Math.sqrt(Math.pow(range, 2) / 2);
	var mag = Math.sqrt(Math.pow(beta, 2) + Math.pow(gamma, 2));
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
	var playButton = document.getElementById("playButton");
	playButton.detachListender
	var name = document.getElementById("nameField").value;
	var message = String.fromCharCode(0x00) + name + String.fromCharCode(0x00);
	console.log("sendName: " + message);
	ws.send(message);
	waitGameStart();
}

function waitGameStart() {
	var startScreen = document.getElementById("startScreen");
	startScreen.setAttribute("style", "display: none");
	var waitScreen = document.getElementById("waitScreen");
	waitScreen.setAttribute("style", "display: initial");
}

function sendOrientation() {
	var modeByte = player.spotlight ? "04" : "03";
	var orientation = "0x" + modeByte + player.direction.toString(16) 
		+ player.magnitude.toString(8);
	console.log("sendOrientation: " + orientation);
	ws.send(orientation);
}

function handleMessage(ms) {
	switch(ms.charCodeAt(0)) {
		case 0:
			if (ms.charCodeAt(1) != 0) {
				player.ID = ms.charCodeAt(1);
				player.color = "0x" + ms.charCodeAt(2).toString(16) + 
				ms.charCodeAt(3).toString(16) + ms.charCodeAt(4).toString(16);
			}
			else {
				document.getElementById("waitMsg").innerHTML = "Cannot join game";
			}
		case 1:
		default:
	}
}

