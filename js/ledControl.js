function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
	r: parseInt(result[1], 16),
	g: parseInt(result[2], 16),
	b: parseInt(result[3], 16)
    } : null;
}
function fadeRedOn(Time){
	$.ajax({
		url: '/leds/async/fade/red/on/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time}
	})
}
function fadeRedOff(Time){
	$.ajax({
		url: '/leds/async/fade/red/off/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time}
	})
}
function fadeGreenOn(Time){
	$.ajax({
		url: '/leds/async/fade/green/on/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time}
	})
}
function fadeGreenOff(Time){
	$.ajax({
		url: '/leds/async/fade/green/off/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time}
	})
}
function fadeBlueOn(Time){
	$.ajax({
		url: '/leds/async/fade/blue/on/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time}
	})
}
function fadeBlueOff(Time){
	$.ajax({
		url: '/leds/async/fade/blue/off/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time}
	})
}
function run(Value){
	$.ajax({
		url: '/leds/async/pattern/run/',
		type: 'GET',
		dataType: 'JSONP',
		data: {count: Value}
	})
}
function singleFade(Time, Value){
	$.ajax({
		url: '/leds/async/pattern/singleFade/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time, count: Value}
	})
}
function multiFade(Time, Value){
	$.ajax({
		url: '/leds/async/pattern/multiFade/',
		type: 'GET',
		dataType: 'JSONP',
		data: {time :Time, count: Value}
	})
}
function kill(){
	$.ajax({
		url: '/leds/async/kill/',
		type: 'GET',
		dataType: 'JSONP'
	})
}
function off(){
	kill();
	$.ajax({
		url: '/leds/white/off/',
		type: 'GET',
		dataType: 'JSONP'
	})
}
function setColour(){
	var rgb = hexToRgb($('#color').val());
	$.ajax({
		url: '/leds/set/',
		type: 'GET',
		dataType: 'JSONP',
		data: {r :rgb.r, g: rgb.g, b: rgb.b}
	})
}
