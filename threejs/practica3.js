// Variables imprescindibles
var renderer, scene, camera;

// Variables globales
var suelo, robot;
var l = b = -150;
var r = t = -l;
var cameraControls;
var planta;
var init_poi = new THREE.Vector3(0,100,0);

// Acciones
init();
loadScene();
render();


function init() {
	// Crear el motor, la escena y la camara

	// Motor de render
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth,window.innerHeight);
	renderer.setClearColor( new THREE.Color(0x000088) );
	renderer.autoClear = false; 
	document.getElementById('container').appendChild(renderer.domElement);

	// Escena
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

	// Captura de eventos
	window.addEventListener('resize',updateAspectRatio);
}

function loadScene() {
	// Construir el grafo de escena

	// Materiales
	var material = new THREE.MeshBasicMaterial({color:'white', wireframe:true});
	var material_suelo = new THREE.MeshBasicMaterial({color:'gray', wireframe:true});

	// Geometrías
	var geo_suelo = new THREE.PlaneGeometry(1000,1000,20,20);

	var geo_base = new THREE.CylinderGeometry(50, 50, 15, 40);

	var geo_eje = new THREE.CylinderGeometry(20, 20, 18, 30);
	var geo_esparrago = new THREE.BoxGeometry(12, 120, 18);
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
		new THREE.Face3(0,7,4),
		new THREE.Face3(0,3,7),
		new THREE.Face3(5,2,1),
		new THREE.Face3(5,6,2),
		new THREE.Face3(0,4,1),
		new THREE.Face3(5,1,4),
		new THREE.Face3(3,2,7),
		new THREE.Face3(2,6,7),

		new THREE.Face3(4,8,5),
		new THREE.Face3(5,8,9),
		new THREE.Face3(4,7,8),
		new THREE.Face3(8,7,11),
		new THREE.Face3(5,9,6),
		new THREE.Face3(6,9,10),
		new THREE.Face3(9,8,11),
		new THREE.Face3(10,9,11),
		new THREE.Face3(7,6,11),
		new THREE.Face3(11,6,10)
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
	eje.rotation.z = Math.PI/2;

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
	scene.add(new THREE.AxesHelper(5) );

	var helper = new THREE.CameraHelper( camera );
	scene.add( helper );
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

function updateAspectRatio() {
	// Renueva la relacion de aspecto de la camara

	// Ajustar el tamaño del canvas
	renderer.setSize( window.innerWidth, window.innerHeight );

	// Razon de aspecto
	var ar = window.innerWidth/window.innerHeight;

	// Camara perspectiva
	camera.aspect = ar;

	camera.updateProjectionMatrix();

}

function update() {
	// Cambios entre frames

}

function render() {
	// Dibujar cada frame 
	requestAnimationFrame(render);
	update();
	renderer.clear();

	// Renderizar la cámara perspectiva en la totalidad del canvas
	renderer.setViewport(0,0,
						 window.innerWidth,window.innerHeight);
	renderer.render( scene, camera );

	// Renderizar la vista en miniatura en la esquina superior izquierda, basada en la altura del contenedor
	renderer.setViewport(0,3*window.innerHeight/4,
						 window.innerHeight/4, window.innerHeight/4);
	renderer.render( scene, planta );
	
}