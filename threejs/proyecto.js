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

var fogNear = 7500;
var fogFar = 10000;

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
	cameraControls.target = new THREE.Vector3(0,0,0);
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
	window.addEventListener('keydown', onKeyDown );

}

function setCameras(ar) {

	// Camara perspectiva
	var camaraPerspectiva = new THREE.PerspectiveCamera(50, ar, 0.1, fogFar*4);
	camaraPerspectiva.position.set(-300, 1000, 300);
	camaraPerspectiva.lookAt(new THREE.Vector3(0, 1000, 0));

	camera = camaraPerspectiva.clone();

	scene.add(camera);
}

function loadScene()
{
	// Cargador de texturas
	const cubeloader = new THREE.CubeTextureLoader();
	const loader = new THREE.TextureLoader();

	// Construir la SkyBox
    const skyboxTexture = cubeloader.load([
      './images/proyecto/posX.png',
      './images/proyecto/negX.png',
      './images/proyecto/posY.png',
      './images/proyecto/negY.png',
      './images/proyecto/posZ.png',
      './images/proyecto/negZ.png',
    ]);
    scene.background = skyboxTexture;

    // Luces y niebla

	scene.add( new THREE.AmbientLight( 0x665577 ) );

	var light = new THREE.DirectionalLight( 0xeebbbb, 1 );
	light.position.set( 0, 400, 800 );
	light.lookAt(0,0,0);

	light.castShadow = true;

	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;

	var d = 300;

	//light.shadow.camera.left = - d;
	//light.shadow.camera.right = d;
	//light.shadow.camera.top = d;
	//light.shadow.camera.bottom = - d;

	//light.shadow.camera.far = 1000;

	scene.add( light );

	scene.fog = new THREE.Fog(0xb4a2bb, fogNear, fogFar);

    // Construir el suelo
    var groundTexture = loader.load('./images/proyecto/ground_diffuse.png');
    groundTexture.color = 0xffffff;
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(200,200);
    groundTexture.anisotropy = 16;

    var groundNormalMap = loader.load('./images/proyecto/ground_normal.png');

    var groundMaterial = new THREE.MeshPhongMaterial( { map: groundTexture, normalMap: groundNormalMap, side: THREE.DoubleSide, shininess: 5, specular: 0x887788 });

    var ground = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000, 100, 100), groundMaterial);
    
    ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;

    scene.add(ground);

    // Construir los edificios

    var buildingSideTexture = loader.load('./images/proyecto/skyscraper_window.png');
    var buildingTopTexture = loader.load('./images/proyecto/skyscraper_top.png');
    buildingSideTexture.color = buildingTopTexture.color = 0xffddee;
    buildingSideTexture.wrapS = buildingSideTexture.wrapT = THREE.RepeatWrapping;
    buildingSideTexture.repeat.set(75,35);
    buildingSideTexture.anisotropy = 16;

    var buildingSideMaterial = new THREE.MeshPhongMaterial({ map: buildingSideTexture, envMap: skyboxTexture, reflectivity: 1, side: THREE.DoubleSide, shininess: 20, specular: 0x887788 });
    var buildingTopMaterial = new THREE.MeshPhongMaterial({ map: buildingTopTexture, side: THREE.DoubleSide, shininess: 0});
    var building_a = new THREE.Mesh(new THREE.BoxGeometry(500, 5000, 500), [buildingSideMaterial, buildingSideMaterial, buildingTopMaterial, buildingTopMaterial, buildingSideMaterial, buildingSideMaterial,]);
    building_a.receiveShadow;

    var building_a1 = building_a.clone();
    building_a1.position.y = 2500;

    scene.add(building_a1);



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

	//scene.getObjectByName("base", true).rotation.y = effectController.giroBase * Math.PI / 180;
	//scene.getObjectByName("brazo", true).rotation.x = effectController.giroBrazo * Math.PI / 180;
	//scene.getObjectByName("antebrazo", true).rotation.y = effectController.giroAntebrazoY * Math.PI / 180;
	//scene.getObjectByName("antebrazo", true).rotation.x = effectController.giroAntebrazoZ * Math.PI / 180;
	//scene.getObjectByName("mano", true).rotation.x = - effectController.giroPinza * Math.PI / 180;
	//scene.getObjectByName("pinzaIz", true).position.y = - effectController.separacionPinza;
	//scene.getObjectByName("pinzaDe", true).position.y = effectController.separacionPinza;
}

function resetRobot(){

	//h.__controllers.forEach(controller => controller.setValue(controller.initialValue));
	//updateRobot();

	//robot.position.x = robot.position.z = planta.position.x = planta.position.z = 0;
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
		print("Left");
	else if(keyCode == "ArrowRight")
		print("Right");

	if(keyCode == "ArrowUp")
		print("Up");
	else if(keyCode == "ArrowDown")
		print("Down");



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
}