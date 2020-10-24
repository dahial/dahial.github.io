// Globales convenidas
var renderer, scene, camera;
// Control de camara
var cameraControls;
// Monitor de recursos
var stats;
// Global GUI
var effectController, h;
// Objetos y tiempo
var antes = Date.now();

// Variables globales
var suelo, robot, habitacion;
var l = b = -150;
var r = t = -l;
var planta;
var init_poi = new THREE.Vector3(0,100,0);
var velX = velZ = 2;



// Acciones a realizar
init();
loadScene();
setupGui();
render();

function init()
{
	// Inicializar el motor con sombras
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x000088) );
	renderer.autoClear = false; 
	document.getElementById( 'container' ).appendChild( renderer.domElement );

	// Crear el grafo de escena
	scene = new THREE.Scene();

	// Camara
	var ar = window.innerWidth / window.innerHeight;
	setCameras(ar);

	// Controlador de camara
	cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
	cameraControls.target.set(0,0,0);
	cameraControls.enableKeys = false;
	cameraControls.target = init_poi;
	cameraControls.update();

	// STATS --> stats.update() en update()
	//stats = new Stats();
	//stats.setMode( 0 );					// Muestra FPS
	//stats.domElement.style.position = 'absolute';		// Abajo izquierda
	//stats.domElement.style.bottom = '0px';
	//stats.domElement.style.left = '0px';
	//document.getElementById( 'container' ).appendChild( stats.domElement );

	// Callbacks
	window.addEventListener('resize', updateAspectRatio );
	window.addEventListener('keydown', onKeyDown );

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

	// Luces
	var ambientLight = new THREE.AmbientLight( 0x606060 );
	ambientLight.position.set(-100, 100,-100);
	scene.add(ambientLight);

	var pointLight = new THREE.PointLight( '0xaaaa00' );
	pointLight.position.set(100, 100, 100);
	scene.add(pointLight);

	var spotLight = new THREE.SpotLight ('0xffffff');
	spotLight.position.set(-100, 200, 100);
	spotLight.lookAt(0,0,0);

	spotLight.castShadow = true;

	spotLight.shadow.mapSize.width = 2048;
	spotLight.shadow.mapSize.height = 2048;

	spotLight.shadow.camera.near = 0.1;
	spotLight.shadow.camera.far = 1000;
	spotLight.shadow.camera.fov = 50;

	scene.add(spotLight);

	// Texturas
	const loader = new THREE.TextureLoader();
	const cubeloader = new THREE.CubeTextureLoader();

	var textura_habitacion = cubeloader.load([
      './images/posx.jpg',
      './images/negx.jpg',
      './images/posy.jpg',
      './images/negy.jpg',
      './images/posz.jpg',
      './images/negz.jpg',
    ]);

	var textura_suelo = loader.load('./images/pisometalico_1024.jpg');
	var textura_metal = loader.load('./images/metal_128.jpg');
	var textura_madera = loader.load('./images/wood512.jpg');

	textura_suelo.wrapS = textura_suelo.wrapT = THREE.RepeatWrapping;
    textura_suelo.repeat.set(2,2);
    textura_suelo.anisotropy = textura_metal.anisotropy = textura_madera.anisotropy = 16;

	// Materiales
	var material_habitacion = new THREE.MeshBasicMaterial({ map: textura_habitacion, side: THREE.BackSide });
	var material_suelo = new THREE.MeshLambertMaterial({ map: textura_suelo });
	var material_metal = new THREE.MeshPhongMaterial({ map: textura_metal });
	var material_madera = new THREE.MeshLambertMaterial({ map: textura_madera, side: THREE.DoubleSide });
	var material_reflectante = new THREE.MeshPhongMaterial({ color: 0xaa8800, envMap: textura_habitacion, reflectivity: 1, shininess: 15});

	// Geometrías
	var geo_habitacion = new THREE.BoxGeometry(1000,1000,1000);
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

	habitacion = new THREE.Mesh(geo_habitacion, material_habitacion);
	suelo = new THREE.Mesh(geo_suelo, material_suelo);
	robot = new THREE.Object3D();

	suelo.receiveShadow = true;

	var pinzaIz = new THREE.Mesh(geo_pinza, material_metal); pinzaIz.name = "pinzaIz";
	var pinzaDe = pinzaIz.clone(); pinzaDe.name = "pinzaDe";

	var mano = new THREE.Mesh(geo_mano, material_madera ); mano.name = "mano";
	var nervio1 = new THREE.Mesh(geo_nervio, material_madera);
	var nervio2 = nervio1.clone();
	var nervio3 = nervio2.clone();
	var nervio4 = nervio3.clone();
	var nervio = new THREE.Object3D();
	var disco = new THREE.Mesh(geo_disco, material_madera);

	var rotula = new THREE.Mesh(geo_rotula, material_reflectante);
	var esparrago = new THREE.Mesh(geo_esparrago, material_metal);
	var eje = new THREE.Mesh(geo_eje, material_metal);

	var antebrazo = new THREE.Object3D(); antebrazo.name = "antebrazo";
	var brazo = new THREE.Object3D(); brazo.name = "brazo";

	var base = new THREE.Mesh(geo_base, material_metal); base.name = "base";

	//// Transformaciones y creación del grafo de escena
	//// (Diseño bottom-up aprovechando transformaciones de padres)
	suelo.rotation.x = -Math.PI/2;

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
	scene.add(habitacion);
	scene.add(suelo);
	scene.add(robot);

	robot.traverse( function (pieza) { pieza.castShadow = true; pieza.receiveShadow = true; console.log(pieza.name); });
	
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
		reiniciar: function(){resetRobot();},
		sombras: true,
	};

	// Creacion interfaz
	gui = new dat.GUI();

	// Construccion del menu
	h = gui.addFolder("Control Brazo")
	h.add(effectController, "giroBase", -180, 180, 1).name("Giro Base").onChange(function() {updateRobot()});
	h.add(effectController, "giroBrazo", -45, 45, 1).name("Giro Brazo").onChange(function() {updateRobot()});
	h.add(effectController, "giroAntebrazoY", -180, 180, 1).name("Giro Antebrazo Y").onChange(function() {updateRobot()});
	h.add(effectController, "giroAntebrazoZ", -90, 90, 1).name("Giro Antebrazo Z").onChange(function() {updateRobot()});
	h.add(effectController, "giroPinza", -40, 220, 1).name("Giro Pinza").onChange(function() {updateRobot()});
	h.add(effectController, "separacionPinza", 0, 15, 0.1).name("Separacion Pinza").onChange(function() {updateRobot()});
	h.add(effectController, "reiniciar").name("Reiniciar");
}

// Recomputa la posición del Brazo Robot
function updateRobot(){

	scene.getObjectByName("base", true).rotation.y = effectController.giroBase * Math.PI / 180;
	scene.getObjectByName("brazo", true).rotation.x = effectController.giroBrazo * Math.PI / 180;
	scene.getObjectByName("antebrazo", true).rotation.y = effectController.giroAntebrazoY * Math.PI / 180;
	scene.getObjectByName("antebrazo", true).rotation.x = effectController.giroAntebrazoZ * Math.PI / 180;
	scene.getObjectByName("mano", true).rotation.x = - effectController.giroPinza * Math.PI / 180;
	scene.getObjectByName("pinzaIz", true).position.y = - effectController.separacionPinza;
	scene.getObjectByName("pinzaDe", true).position.y = effectController.separacionPinza;
}

function resetRobot(){

	h.__controllers.forEach(controller => controller.setValue(controller.initialValue));
	updateRobot();

	robot.position.x = robot.position.z = planta.position.x = planta.position.z = 0;
}

function updateAspectRatio()
{
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
}

function onKeyDown(event)
{
	var keyCode = event.key;

	if(keyCode == "ArrowLeft")
		robot.position.x -= velX;
	else if(keyCode == "ArrowRight")
		robot.position.x += velX;

	if(keyCode == "ArrowUp")
		robot.position.z -= velZ;
	else if(keyCode == "ArrowDown")
		robot.position.z += velZ;

	planta.position.x = robot.position.x;
	planta.position.z = robot.position.z;


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
	//stats.update();
	// Actualiza interpoladores
	TWEEN.update();
}

function render()
{
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