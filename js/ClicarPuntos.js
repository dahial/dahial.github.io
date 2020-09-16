/**
* Seminario #1 GPC. Pintar puntos en pantalla
* que el usuario va clickando
*/

// SHADER VERTICES
var VSHADER_SOURCE =
'attribute vec4 posicion;		\n' +
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
	gl.clearColor(0.1,0.1,0.1,1.0);
	
	// se borra el canvas
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// Localiza el atributo en el shader de vértices
	var coordenadas = gl.getAttribLocation( gl.program, 'posicion' );
	
	// Registrar el evento
	canvas.onmousedown = function( evento ){ click( evento, gl, canvas, coordenadas ); };
}

var puntos = []; // array de puntos
function click(evento, gl, canvas, coordenadas){
	
	console.log("click registrado");
	
	// Procesar la coordenada del click
	var x = evento.clientX;
	var y = evento.clienty;
	var rect = evento.target.getBoundingClientRect();
	
	// Conversion de coordenadasx=
	x = ((x-rect.left) - canvas.width/2) * 2/canvas.width;
	y = (canvas.height/2 - (y-rect.top)) * 2/canvas.height;
	
	// Guardar el puntos
	puntos.push(x); puntos.push(y);
	
	// Borrar el canvas
	gl.clear( gl.COLOR_BUFFER_BIT );
	
	// Inserta las coordenadas de los puntos como atributos y los
	// dibuja uno a uno
	
	for( var i = 0; i < puntos.length; i += 2){
		console.log("Un punto dibujado");
		gl.vertexAttrib3f( coordenadas, puntos[i], puntos[i+1], 0.0 );
		gl.drawArrays( gl.POINTS, 0, 1);
	}

}