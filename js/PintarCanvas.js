/**
* Seminario #1. GPC. Pintar el canvas simplemente
*
*/

function main(){
	
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
	
	// fija el color de borrado del canvas
	gl.clearColor(0.1,0.1,0.1,1.0);
	
	// se borra el canvas
	gl.clear(gl.COLOR_BUFFER_BIT);
}