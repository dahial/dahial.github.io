"use strict";

// Globales convenidas
var renderer, scene, camera;
// Control de camara
var cameraControls;
// Monitor de recursos
var stats;
// Global GUI
var effectController;
// Objetos y tiempo
var antes = Date.now();

// Acciones a realizar
init();
loadScene();
setupGui();
//updateRobot();
render();

function init()
{
	// Inicializar el motor con sombras
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x000000) );
	document.getElementById( 'container' ).appendChild( renderer.domElement );

	// Crear el grafo de escena
	scene = new THREE.Scene();

	// Crear y situar la camara
	var aspectRatio = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera( 75, aspectRatio , 0.1, 100 );
	camera.position.set( 1,2,10 );
	// Control de camara
	cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
	cameraControls.target.set(0,0,0);

	// STATS --> stats.update() en update()
	stats = new Stats();
	stats.setMode( 0 );					// Muestra FPS
	stats.domElement.style.position = 'absolute';		// Abajo izquierda
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.left = '0px';
	document.getElementById( 'container' ).appendChild( stats.domElement );

	// Callbacks
	window.addEventListener('resize', updateAspectRatio );

}

function loadScene()
{
	// Materiales
	var material = new THREE.MeshBasicMaterial( 
                                      { color:0xFFFFFF,
                                        wireframe: true } );

	// Peonza
	peonza = new THREE.Object3D();
	var cuerpo = new THREE.Mesh(new THREE.CylinderGeometry( 1, 0.2, 2, 10, 2 ), material);
	cuerpo.position.y = 1.5;
	peonza.add( cuerpo );
	var punta = new THREE.Mesh(new THREE.CylinderGeometry( 0.1, 0, 0.5, 10, 1 ), material);
	punta.position.set( 0, 0.25, 0 );
	peonza.add( punta );
	var mango = new THREE.Mesh(new THREE.CylinderGeometry( 0.1, 0.1, 0.5, 10, 1 ), material);
	mango.position.set( 0, 2.75, 0 );
	peonza.add( mango );
	peonza.rotation.x = Math.PI/16;

	eje = new THREE.Object3D();
	eje.position.set(-2.5,0,-2.5);
	eje.add( peonza );
	scene.add(eje);


	// Suelo
	var geoSuelo = new THREE.PlaneGeometry( 5, 5 );
	var suelo = new THREE.Mesh( geoSuelo, material );
	suelo.rotation.x = -Math.PI/2;
	scene.add( suelo );
	
	//Coordinates.drawGrid({size:6,scale:1});
	Coordinates.drawGrid({size:6,scale:1, orientation:"y"});
	Coordinates.drawGrid({size:6,scale:1, orientation:"z"});	

}

function setupGui()
{
	// Definicion de los controles
	effectController = {
		giroBase: 0,
		giroBrazo: 0,
		giroAntebrazoY: 0,
		giroAntebrazoZ: 0,
		giroPinza: 0,
		separacionPinza: 15,
		reiniciar: function(){
			TWEEN.removeAll();
			eje.position.set(-2.5,0,-2.5);
			eje.rotation.set( 0, 0, 0 );
			updateRobot();
		},
		sombras: true,
	};

	// Creacion interfaz
	var gui = new dat.GUI();

	// Construccion del menu
	var h = gui.addFolder("Control Brazo");
	h.add(effectController, "giroBase", -180, 180, 1).name("Giro Base");
	h.add(effectController, "giroBrazo", -45, 45, 1).name("Giro Brazo");
	h.add(effectController, "giroAntebrazoY", -180, 180, 1).name("Giro Antebrazo Y");
	h.add(effectController, "giroAntebrazoZ", -90, 90, 1).name("Giro Antebrazo Z");
	h.add(effectController, "giroBase", -40, 220, 1).name("Giro Pinza");
	h.add(effectController, "separacionPinza", 0, 15, 0.1).name("Separacion Pinza");
	h.add(effectController, "reiniciar").name("Reiniciar");
}

// Recomputa la posición del Brazo Robot
function updateRobot(){

	var giro = new TWEEN.Tween( eje.rotation ).to( {x:0, y:-Math.PI*2, z:0}, 2000 );
	giro.repeat(Infinity);
	giro.start();
}

function updateAspectRatio()
{
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
}

function update()
{
	// Rotacion de la peonza ------------
	var ahora = Date.now();							// Hora actual
	angulo += effectController.velang * 2*Math.PI * (ahora-antes)/1000;			// Incrementar el angulo en 360º / sg
	antes = ahora;									// Actualizar antes
	peonza.rotation.y = angulo;
	//eje.rotation.y = angulo/2;
	// ---------------------------------

	// Control de camra
	cameraControls.update();
	// Actualiza los FPS
	stats.update();
	// Actualiza interpoladores
	TWEEN.update();
}

function render()
{
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}