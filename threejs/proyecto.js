// Globales convenidas
var renderer, scene, camera;
// Monitor de recursos
var stats;
// Global GUI
var effectController, h;
// Objetos y tiempo
var antes = Date.now();

var fogNear = 375;
var fogFar = 500;

// Parametros escena
var scene_radius = 500;
var count_buildingA = 25;
var count_buildingB = 10

// Objetos prefabricados
var building_A;
var building_B;

// Parametros usuario
var player = new THREE.Object3D();
var playerActive = false;
var playerScale = 0.035;

var playerDirection = new THREE.Vector3(0,0,0);
var playerSpeed = 5 / 100;

var playerCurrentRotation = new THREE.Vector3(0,0,0);
var playerRotationSpeed = Math.PI / 135;
var playerRoll = Math.PI / 4;
var currentKeys = [false, false, false, false]; // [Up, Down, Left, Right]

// Parametros camara
var cameraTarget = new THREE.Vector3();
var cameraLookTarget = new THREE.Vector3();
var cameraDiff = new THREE.Vector3();
var cameraDistance = 20;
var cameraSpeed = 2 / 100; // 0: No se mueve - 1: Instantanea

// Auxiliares de movimiento
var moveVector = new THREE.Vector3(0,0,1);
var tmpQuaternion = new THREE.Quaternion();
var EPS = 0.000001;

// Acciones a realizar
init();
loadScene();
render();

function init()
{
	// Inicializar el renderer
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x000088) );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.logarithmicDepthBuffer = true;
	renderer.autoClear = false; 

	document.getElementById( 'container' ).appendChild( renderer.domElement );

	// Crear el grafo de escena
	scene = new THREE.Scene();

	// Camara
	var ar = window.innerWidth / window.innerHeight;
	setCameras(ar);

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
	window.addEventListener('keyup', onKeyUp );

}

function mouseChange(event){
	console.log("Mouse change");

}

function setCameras(ar) {

	// Camara perspectiva
	var camaraPerspectiva = new THREE.PerspectiveCamera(50, ar, 0.1, fogFar*4);
	camaraPerspectiva.position.set(800, 800, 800);
	camaraPerspectiva.lookAt(new THREE.Vector3(0, 0, 0));

	camera = camaraPerspectiva.clone();

	scene.add(camera);
}

function loadScene()
{
	// Cargador de texturas
	const loader = new THREE.TextureLoader();
	const cubeloader = new THREE.CubeTextureLoader();
	const gltfloader = new THREE.GLTFLoader().setPath('../models/proyecto/ship/');

	// Cargar jugador
	gltfloader.load('ship.gltf',
	// called when the resource is loaded
	function ( gltf ) {

		child = gltf.scene.children[0];
		while (!child.isMesh)
			child = child.children[0];
		
		child.castShadow = true;
		child.receiveShadow = true;
		player.add(child);

		player.position.set(500,500,500);
		player.scale.set(playerScale, playerScale, playerScale);

		scene.add( player );
		player.lookAt(0,0,0);
		playerActive = true;

		console.log( 'Player model loaded' );

	},
	// called while loading is progressing
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );
		console.log(error);

	});

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

	scene.add( new THREE.AmbientLight( 0xbbaacc ) );

	var light = new THREE.DirectionalLight( 0xeebbbb, 0.33 );

	var directionalLight1 = light.clone();
	var directionalLight2 = light.clone();
	var directionalLight3 = light.clone();
	directionalLight1.position.set( -150, 250, 500 );
	directionalLight2.position.set( 0, 250, 500 );
	directionalLight3.position.set( 150, 250, 500 );

	directionalLight2.castShadow = true;
	directionalLight2.shadow.mapSize.width = 1024;
	directionalLight2.shadow.mapSize.height = 1024;
	directionalLight2.shadow.camera.near = 0.5;
	directionalLight2.shadow.camera.far = scene_radius * 2;
	directionalLight2.shadow.camera.left = directionalLight2.shadow.camera.bottom = - scene_radius;
	directionalLight2.shadow.camera.right = directionalLight2.shadow.camera.top = scene_radius;

	scene.add( directionalLight1, directionalLight2, directionalLight3);

    // Construir el suelo
    var groundTexture = loader.load('./images/proyecto/ground_diffuse.png');
    groundTexture.color = 0xffffff;
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(75,75);
    groundTexture.anisotropy = 16;

    var groundNormalMap = loader.load('./images/proyecto/ground_normal.png');

    var groundMaterial = new THREE.MeshPhongMaterial( { map: groundTexture, normalMap: groundNormalMap, side: THREE.DoubleSide, shininess: 15, specular: 0x887788 });

    var ground = new THREE.Mesh(new THREE.CircleGeometry(scene_radius, 64), groundMaterial);
    
    ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;

    scene.add(ground);

    // Construir los edificios

    // Building A
    var buildingSideTexture = loader.load('./images/proyecto/skyscraper_window.png');
    var buildingTopTexture = loader.load('./images/proyecto/skyscraper_top.png');

    buildingSideTexture.color = buildingTopTexture.color = 0xffddee;
    buildingSideTexture.wrapS = buildingSideTexture.wrapT = THREE.RepeatWrapping;
    buildingSideTexture.repeat.set(60,30);
    buildingSideTexture.anisotropy = 16;

    var buildingSideMaterial = new THREE.MeshPhongMaterial({ map: buildingSideTexture, envMap: skyboxTexture, reflectivity: 1, side: THREE.DoubleSide, shininess: 1, specular: 0x887788 });
    var buildingTopMaterial = new THREE.MeshPhongMaterial({ map: buildingTopTexture, side: THREE.DoubleSide, shininess: 0});
    building_A = new THREE.Mesh(new THREE.BoxGeometry(25, 250, 25), [buildingSideMaterial, buildingSideMaterial, buildingTopMaterial, buildingTopMaterial, buildingSideMaterial, buildingSideMaterial,]);
    building_A.castShadow = true;
    building_A.receiveShadow = true;

    // Building B
    var warehouseSideTexture = loader.load('./images/proyecto/warehouse_tile.png');

    warehouseSideTexture.color = 0xffddee;
    warehouseSideTexture.wrapS = warehouseSideTexture.wrapT = THREE.RepeatWrapping;
    warehouseSideTexture.repeat.set(10,20);
    warehouseSideTexture.anisotropy = 16;

    var warehouseMaterial = new THREE.MeshPhongMaterial({ map: warehouseSideTexture, side: THREE.DoubleSide, shininess: 1, specular: 0x887788 });
    building_B = new THREE.Mesh(new THREE.BoxGeometry(100, 40, 60), warehouseMaterial);
    building_B.castShadow = true;
    building_B.receiveShadow = true;

    generateBuildings(scene_radius - 25);
}

function generateBuildings(max_radius)
{
	// BuildingA
	for(i=0; i < count_buildingA; i++){

    	var building = building_A.clone();

    	var scale = 0.6 + Math.random()*0.4;
    	building.position.y = 125.5 * scale;
    	building.scale.y = scale;

    	building.name = "skyscraper";

 		//Posicionar BuildingA en el radio
 		var r = max_radius * Math.random();
  		var theta = Math.random() * 2 * Math.PI;

  		building.position.x = r * Math.cos(theta);
  		building.position.z = r * Math.sin(theta);
  		building.rotation.y = theta;

    	scene.add(building);
	}

	// BuildingB
	for(i=0; i < count_buildingB; i++){

    	var building = building_B.clone();

    	var scale = 0.5 + Math.random()*0.5;
    	building.position.y = 20.5 * scale;
    	building.scale = new THREE.Vector3(scale,scale,scale);

    	building.name = "warehouse";

 		//Posicionar BuildingA en el radio
 		var r = max_radius * Math.random();
  		var theta = Math.random() * 2 * Math.PI;

  		building.position.x = r * Math.cos(theta);
  		building.position.z = r * Math.sin(theta);
  		building.rotation.y = Math.random() * 2 * Math.PI;

    	scene.add(building);
	}

}

function updateAspectRatio()
{
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
}

/* 
currentKeys[0] = Up
currentKeys[1] = Down
currentKeys[2] = Left
currentKeys[3] = Right
*/
function onKeyDown(event)
{
	var keyCode = event.key;

	if(keyCode == "ArrowUp")
		currentKeys[0] = true;
	else if(keyCode == "ArrowDown")
		currentKeys[1] = true;

	if(keyCode == "ArrowLeft")
		currentKeys[2] = true;
	else if(keyCode == "ArrowRight")
		currentKeys[3] = true;

}

function onKeyUp(event)
{
	var keyCode = event.key;

	if(keyCode == "ArrowUp")
		currentKeys[0] = false;
	else if(keyCode == "ArrowDown")
		currentKeys[1] = false;
	
	if(keyCode == "ArrowLeft")
		currentKeys[2] = false;
	else if(keyCode == "ArrowRight")
		currentKeys[3] = false;

}

function updatePlayerRotation()
{

	playerCurrentRotation.x = (currentKeys[1] - currentKeys[0]) * playerRotationSpeed;
	playerCurrentRotation.y = (currentKeys[2] - currentKeys[3]) * playerRotationSpeed;
	playerCurrentRotation.z = 0;

}

function applyPlayerMovement(delta)
{

	var lastQuaternion = new THREE.Quaternion();
	var lastPosition = new THREE.Vector3();

	var moveMult = delta * playerSpeed;
	var rotMult = delta * playerRotationSpeed;

	player.translateX( moveVector.x * moveMult );
	player.translateY( moveVector.y * moveMult );
	player.translateZ( moveVector.z * moveMult );

	tmpQuaternion.set( playerCurrentRotation.x * rotMult, playerCurrentRotation.y * rotMult, playerCurrentRotation.z * rotMult, 1 ).normalize();
	player.quaternion.multiply( tmpQuaternion );

	lastQuaternion.copy( player.quaternion );
	lastPosition.copy( player.position );

	//player.rotation.z = (currentKeys[3] - currentKeys[2]) * playerRoll
	
	player.getWorldDirection(playerDirection);

	//player.rotateOnAxis(new THREE.Vector3(1,0,0).transformDirection(player.matrixWorld), (currentKeys[0] - currentKeys[1]) * playerRotationSpeed);
	//player.rotateOnAxis(new THREE.Vector3(0,1,0).transformDirection(player.matrixWorld), (currentKeys[2] - currentKeys[3]) * playerRotationSpeed);

	//player.rotation.x += (currentKeys[0] - currentKeys[1]) * playerRotationSpeed;
	//player.rotation.y += (currentKeys[2] - currentKeys[3]) * playerRotationSpeed;
	///player.rotation.z = (currentKeys[3] - currentKeys[2]) * playerRoll;

	//player.getWorldDirection(playerDirection);

}

function update()
{
	// Actualizar antes/ahora ------------
	var ahora = Date.now();							// Hora actual
	var deltaT = (ahora - antes);					// Tiempo transcurrido en ms
	antes = ahora;									// Actualizar antes

	// ---------------------------------

	// Actualizar usuario
	updatePlayerRotation();
	applyPlayerMovement(deltaT);
	//player.position.addVectors(player.position, playerDirection.normalize().multiplyScalar(playerSpeed));

	// Camara sigue al usuario si está en la escena
	if(playerActive){
		cameraTarget.subVectors(player.position, playerDirection.multiplyScalar(cameraDistance)); // Objetivo de la cámara = detrás del usuario
		cameraDiff.subVectors(cameraTarget, camera.position);
		if(cameraDiff.length() < 0.25)
			camera.position = cameraTarget; // Si cerca del objetivo, saltar al objetivo
		else
			camera.position.addVectors(camera.position, cameraDiff.multiplyScalar(cameraSpeed)); // Si lejos del objetivo, avanzar hacia el objetivo

		cameraLookTarget.addVectors(player.position, playerDirection.multiplyScalar(cameraDistance))
		camera.up.set(player.up.x, player.up.y, player.up.z);
		camera.lookAt(cameraLookTarget);

		console.log(player.up);
	}

	// Actualiza los FPS
	stats.update();

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