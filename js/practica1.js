/**
* Seminario #1 GPC. Pintar puntos en pantalla
* que el usuario va clickando
*/

// SHADER VERTICES
var VSHADER_SOURCE =
'attribute vec4 posicion;		\n' +
'attribute vec4 colorpunto;		\n' +
'void main(){					\n' +
'	gl_Position = posicion;		\n' +
'	gl_PointSize = 10.0;		\n' +
'}								\n' ;

// SHADER FRAGMENTOS
var FSHADER_SOURCE =
'void main(){					\n' +
'	gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);		\n' +
'}								\n' ;

function main()
{
	
	// recuperar el canvas
	var canvas = document.getElementById("canvas");
	if (!canvas){
		console.log("Falló la carga del canvas.");
		return;
	}
	
	// recuperar el contexto de render
	var gl = getWebGLContext( canvas );
	if(!gl){
		console.log("Falló la carga del contexto de render.");
		return;
	}
	
	// Cargar, compilar y montar los shaders en un 'program'
	if( !initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE) ){
		console.log("Falló la carga de los shaders.");
		return;
	}
	
	// fija el color de borrado del canvas
	gl.clearColor(0.0,0.0,0.3,1.0);
	
	// se borra el canvas
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Localiza los atributos en el shader de vértices
	var coordenadas = gl.getAttribLocation( gl.program, 'posicion' );
	var color = gl.getAttribLocation( gl.program, 'colorpunto' );
	
	
	// Crea el buffer, lo activa y enlaza con coordenadas
	var bufferVertices = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );
	gl.vertexAttribPointer( coordenadas, 3, gl.FLOAT, false, 0, 0 );
	//gl.vertexAttribPointer( color, 3, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( coordenadas );
	//gl.enableVertexAttribArray( color );
	
	// Registrar el evento del click
	canvas.onmousedown = function( evento ){ click( evento, gl, canvas, coordenadas, color ); };
}

var clicks = [];
function click(evento, gl, canvas, coordenadas){
	
	// Procesar la coordenada del click
	var x = evento.clientX;
	var y = evento.clientY;
	var rect = evento.target.getBoundingClientRect();
	
	// Conversion de coordenadasx=
	x = ((x-rect.left) - canvas.width/2) * 2/canvas.width;
	y = (canvas.height/2 - (y-rect.top)) * 2/canvas.height;
	
	// Guardar el puntos
	clicks.push(x); clicks.push(y); clicks.push(0.0);
	var puntos = new Float32Array(clicks); // Arary de puntos
	
	// Borrar el canvas
	gl.clear( gl.COLOR_BUFFER_BIT );
	
	// Rellena el BO con las coordenadas y lo manda a proceso
	gl.bufferData( gl.ARRAY_BUFFER, puntos, gl.STATIC_DRAW );
	gl.drawArrays( gl.POINTS, 0, puntos.length/3 );
	gl.drawArrays( gl.LINE_STRIP, 0, puntos.length/3 );

}