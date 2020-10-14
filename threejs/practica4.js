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

// Variables globales
var suelo, robot;
var l = b = -150;
var r = t = -l;
var planta;
var init_poi = new THREE.Vector3(0,100,0);

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

	// Camara
	var ar = window.innerWidth / window.innerHeight;
	setCameras(ar);

	// Controlador de camara
	cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
	cameraControls.target.set(0,0,0);
	cameraControls.noKeys = true;
	cameraControls.target = init_poi;
	cameraControls.update();

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

function setCameras(ar) {
	// Construye las camaras planta, alzado, perfil y perspectiva

	// Camara ortográfica, ignorando rázón de aspecto ya que siempre será cuadrada
	planta = new THREE.OrthographicCamera( l, r, t, b, -20, 1000 );
	planta.position.set(0,500,0);
	planta.lookAt(init_poi);
	planta.up = new THREE.Vector3(0,0,-1);

	// Camara perspectiva
	var camaraPerspectiva = new THREE.PerspectiveCamera(50,ar,0.1,2000);
	camaraPerspectiva.position.set(-300, 250, 300);
	camaraPerspectiva.lookAt(init_poi);

	camera = camaraPerspectiva.clone();

	scene.add(planta);
	scene.add(camera);

}

function loadScene()
{
	// Construir el grafo de escena

	// Materiales
	var material = new THREE.MeshBasicMaterial({color:'white', wireframe:true});
	var material_suelo = new THREE.MeshBasicMaterial({color:'gray', wireframe:true});

	// Geometrías
	var geo_suelo = new THREE.PlaneGeometry(1000,1000,20,20);

	var geo_base = new THREE.CylinderGeometry(50, 50, 15, 40);

	var geo_eje = new THREE.CylinderGeometry(20, 20, 18, 30);
	var geo_esparrago = new THREE.BoxGeometry(18, 120, 12);
	var geo_rotula = new THREE.SphereGeometry(20, 15, 15);

	var geo_disco = new THREE.CylinderGeometry(22, 22, 6, 30);
	var geo_nervio = new THREE.BoxGeometry(4,80,4);
	var geo_mano = new THREE.CylinderGeometry(15, 15, 40, 30);

	// Geometría personalizada para las pinzas
	var geo_pinza = new THREE.Geometry();

	geo_pinza.vertices.push(
		new THREE.Vector3(-2, 10, 0),	//0
		new THREE.Vector3(2, 10, 0),	//1
		new THREE.Vector3(2, -10, 0),	//2
		new THREE.Vector3(-2, -10, 0),	//3
		new THREE.Vector3(-2, 10, 19),	//4
		new THREE.Vector3(2, 10, 19),	//5
		new THREE.Vector3(2, -10, 19),	//6
		new THREE.Vector3(-2, -10, 19),	//7
		new THREE.Vector3(-2, 5, 38),	//8
		new THREE.Vector3(0, 5, 38),	//9
		new THREE.Vector3(0, -5, 38),	//10
		new THREE.Vector3(-2, -5, 38)	//11
	);

	geo_pinza.faces.push(
		new THREE.Face3(0,1,2),
		new THREE.Face3(0,2,3),
		new THREE.Face3(0,4,7),
		new THREE.Face3(0,3,7),
		new THREE.Face3(5,2,1),
		new THREE.Face3(5,2,6),
		new THREE.Face3(0,1,4),
		new THREE.Face3(5,1,4),
		new THREE.Face3(3,2,7),
		new THREE.Face3(2,7,6),

		new THREE.Face3(4,5,8),
		new THREE.Face3(5,8,9),
		new THREE.Face3(4,8,7),
		new THREE.Face3(8,7,11),
		new THREE.Face3(5,9,6),
		new THREE.Face3(9,6,10),
		new THREE.Face3(8,9,11),
		new THREE.Face3(10,9,11),
		new THREE.Face3(7,6,11),
		new THREE.Face3(6,11,10)
	);


	// Objetos

	suelo = new THREE.Mesh(geo_suelo, material_suelo);
	robot = new THREE.Object3D();

	var pinzaIz = new THREE.Mesh(geo_pinza, material);
	var pinzaDe = pinzaIz.clone();

	var mano = new THREE.Mesh(geo_mano, material );
	var nervio1 = new THREE.Mesh(geo_nervio, material);
	var nervio2 = nervio1.clone();
	var nervio3 = nervio2.clone();
	var nervio4 = nervio3.clone();
	var nervio = new THREE.Object3D();
	var disco = new THREE.Mesh(geo_disco, material);

	var rotula = new THREE.Mesh(geo_rotula, material);
	var esparrago = new THREE.Mesh(geo_esparrago, material);
	var eje = new THREE.Mesh(geo_eje, material);

	var antebrazo = new THREE.Object3D();
	var brazo = new THREE.Object3D();

	var base = new THREE.Mesh(geo_base, material);

	//// Transformaciones y creación del grafo de escena
	//// (Diseño bottom-up aprovechando transformaciones de padres)
	suelo.rotation.x = Math.PI/2;

	// MANO
	pinzaIz.position.x = -15;
	pinzaDe.position.x = 15;
	pinzaDe.rotation.z = Math.PI;

	mano.rotation.z = Math.PI/2;

	mano.attach(pinzaIz);
	mano.attach(pinzaDe);
	mano.position.y = 83;

	// NERVIOS
	nervio1.position.set(-10,0,-10);
	nervio2.position.set(-10, 0, 10);
	nervio3.position.set(10, 0, 10);
	nervio4.position.set(10, 0, -10);
	nervio.attach(nervio1);
	nervio.attach(nervio2);
	nervio.attach(nervio3);
	nervio.attach(nervio4);
	nervio.position.y = 43;

	// ANTEBRAZO
	antebrazo.attach(mano);
	antebrazo.attach(nervio);
	antebrazo.attach(disco);

	// BRAZO
	antebrazo.position.y = 120;
	rotula.position.y = 120;
	esparrago.position.y = 60;

	brazo.attach(antebrazo);
	brazo.attach(rotula);
	brazo.attach(esparrago);
	brazo.attach(eje);

	// BASE
	brazo.position.y = 3;
	base.attach(brazo);

	// ROBOT
	base.position.y = 7.5;
	robot.attach(base);

	// Organizacion de la escena
	scene.add(suelo);
	scene.add(robot);
	
	//Coordinates.drawGrid({size:6,scale:1});
	//Coordinates.drawGrid({size:6,scale:1, orientation:"y"});
	//Coordinates.drawGrid({size:6,scale:1, orientation:"z"});	

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
	// Actualizar antes/ahora ------------
	var ahora = Date.now();							// Hora actual
	antes = ahora;									// Actualizar antes
	// ---------------------------------

	// Control de camara
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