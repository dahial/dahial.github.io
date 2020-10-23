// Globales convenidas
var renderer, scene, camera;
// Monitor de recursos
var stats;

var fogNear = 375;
var fogFar = 500;

// Parametros escena
var scene_radius = 500;
var count_buildingA = 50;
var count_buildingB = 20
var count_rings = 20;
var ring_radius = scene_radius - 25;
var skyboxTexture;
var distance_warn = 800;
var distance_oob = 1000;
var sphere_max_opacity = 0.2;
var ground_grid_opacity = 0.2;
var grid_master_opacity = 1;

// Objetos prefabricados
var building_A, building_B;
var ring, superring;

// Objetos en escena
var list_buildingA = list_buildingB = [];
var list_rings = [];
var ground, ground_grid, sphere_grid;

// Objetivo juego
var ring_value = 100;
var superring_value = 500;
var currentScore = 0;
var highScore = 0;
var newHighScore = false;

// Parametros usuario
var player = new THREE.Object3D();
var playerScale = 0.035;
var playerRadius = 450;
var playerHeight = 350;

var playerDirection = new THREE.Vector3(0,0,0);
var playerSpeed = 5 / 100;
var playerCurrentBoost = 1;
var playerPreviousBoost = 1; // Evitar recomputar la cámara si la velocidad no cambia
var playerBoostAcceleration = 0.01;
var playerMaxBoost = 2;
var playerMaxBrake = 0.5;
var playerBoost = false;
var playerBrake = false;

var playerCurrentRotation = new THREE.Vector3(0,0,0);
var playerRotationSpeed = Math.PI / 135;
var playerRollAcc = 3 / 100000;
var playerMaxRoll = 2 / 1000;
var playerCurrentRoll = [0, 0]; // [RollLeft, RollRight]
var currentKeys = [false, false, false, false, false, false]; // [PitchUp, PitchDown, YawLeft, YawRight, RollLeft, RollRight]

// Parametros camara
var cameraTarget = new THREE.Vector3();
var cameraLookTarget = new THREE.Vector3();
var cameraDiff = new THREE.Vector3();
var cameraDistance = 10;
var cameraSpeed = 3 / 100; // 0: No se mueve - 1: Instantanea
var cameraFov = 50;
var cameraCurrentFov = cameraFov;
var cameraMaxFov = 90;

// Parametros anillos
var ringMinY = 10;
var ringMaxY = 175;
var ringRotation = 15/1000;

// Tiempo
var antes = Date.now();
var startTime = Date.now();
var deltaT;
var timeLimit = 90;
var remainingTime;

// Audio
var audioListener = new THREE.AudioListener();
var music = new THREE.Audio( audioListener );
var audioContext = music.context;
var wind_audio = new THREE.Audio( audioListener );
var ring_audio = new THREE.Audio( audioListener );
var ring_long_audio = new THREE.Audio( audioListener );
var crash_audio = new THREE.Audio( audioListener );
var warning_audio = new THREE.Audio( audioListener );
var countdown_audio = new THREE.Audio( audioListener );

wind_audio.context = audioContext;
ring_audio.context = audioContext;
ring_long_audio.context = audioContext;
crash_audio.context = audioContext;
warning_audio.context = audioContext;
countdown_audio.context = audioContext;

var musicBaseVolume = 0.15;
var windBaseVolume = 0.5;
var ringVolume = 0.5;
var ringLongVolume = 0.5;
var crashVolume = 0.5;
var warningVolume = 0.5;
var countdownVolume = 0.5;

// Auxiliares
var moveVector = new THREE.Vector3(0,0,1);
var tmpQuaternion = new THREE.Quaternion();
var EPS = 0.000001;
var warning_current = false;
var gameActive = false;
var restart = false;
var pause = false;

// PARTICULAS
// Gracias a Xanmia de https://codepen.io/Xanmia/ por la implementación de la explosión por particulas
var particleSpeed = 40;
var totalParticles = 50;
var particleSize = 10;
var sizeRandomness = 4000;
var dirs = [];
var parts = [];

// Acciones a realizar
init();
loadPrefabs();
loadScene();
render();

function init() {
	document.getElementById( 'centertext' ).innerText = "Cargando...";

	// Callbacks
	window.addEventListener('resize', updateAspectRatio );
	window.addEventListener('keydown', onKeyDown );
	window.addEventListener('keyup', onKeyUp );

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
	camera.add(audioListener); // Capturar el audio de la escena

	// Audio
	initAudio();

	// STATS --> stats.update() en update()
	stats = new Stats();
	stats.setMode( 0 );					// Muestra FPS
	stats.domElement.style.position = 'absolute';		// Abajo izquierda
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.left = '0px';
	document.getElementById( 'container' ).appendChild( stats.domElement );
}

function initAudio(){
	// Inicializar audio
	var audioLoader = new THREE.AudioLoader();
	audioLoader.load( '../audio/music_loop.ogg', function( buffer ) {
		music.setBuffer( buffer );
		music.setLoop(true);
		music.setVolume(musicBaseVolume);
		music.play();
	});

	audioLoader.load( '../audio/wind_loop.ogg', function( buffer ) {
		wind_audio.setBuffer( buffer );
		wind_audio.setLoop(true);
		wind_audio.setVolume(windBaseVolume);
	});

	audioLoader.load( '../audio/ring.ogg', function( buffer ) {
		ring_audio.setBuffer( buffer );
		ring_audio.setLoop(false);
		ring_audio.setVolume(ringVolume);
	});

	audioLoader.load( '../audio/ring_long.ogg', function( buffer ) {
		ring_long_audio.setBuffer( buffer );
		ring_long_audio.setLoop(false);
		ring_long_audio.setVolume(ringLongVolume);
	});

	audioLoader.load( '../audio/crash.ogg', function( buffer ) {
		crash_audio.setBuffer( buffer );
		crash_audio.setLoop(false);
		crash_audio.setVolume(crashVolume);
	});

	audioLoader.load( '../audio/warning.ogg', function( buffer ) {
		warning_audio.setBuffer( buffer );
		warning_audio.setLoop(true);
		warning_audio.setVolume(warningVolume);
	});

	audioLoader.load( '../audio/countdown.ogg', function( buffer ) {
		countdown_audio.setBuffer( buffer );
		countdown_audio.setLoop(false);
		countdown_audio.setVolume(warningVolume);
	});
}

function setCameras(ar) {

	// Camara perspectiva
	var camaraPerspectiva = new THREE.PerspectiveCamera(cameraFov, ar, 0.1, fogFar*4);
	camaraPerspectiva.position.set(600, 600, 600);
	camaraPerspectiva.lookAt(new THREE.Vector3(0, 0, 0));

	camera = camaraPerspectiva.clone();

	scene.add(camera);
}

function loadPrefabs() {
	console.log("Creating prefabs...");

	const loader = new THREE.TextureLoader();
	const cubeloader = new THREE.CubeTextureLoader();
	const gltfloader = new THREE.GLTFLoader().setPath('../models/proyecto/ship/');

	// Construir la SkyBox
    skyboxTexture = cubeloader.load([
      './images/proyecto/posX.png',
      './images/proyecto/negX.png',
      './images/proyecto/posY.png',
      './images/proyecto/negY.png',
      './images/proyecto/posZ.png',
      './images/proyecto/negZ.png',
    ]);
    scene.background = skyboxTexture;

	// Cargar jugador

	gltfloader.load('ship.gltf',
	// called when the resource is loaded
	function ( gltf ) {
		console.log("Player mesh loaded.")

		child = gltf.scene.children[0];
		while (!child.isMesh)
			child = child.children[0];
		
		child.castShadow = true;
		child.receiveShadow = true;
		player.add(child);

		startGame();
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
    var warehouseSideTexture = loader.load('./images/proyecto/warehouse_diffuse.png');
    var warehouseSideNormal = loader.load('./images/proyecto/warehouse_normal.jpg');

    warehouseSideTexture.color = 0xaaaacc;
    warehouseSideTexture.wrapS = warehouseSideTexture.wrapT = THREE.RepeatWrapping;
    warehouseSideTexture.repeat.set(3,3);
    warehouseSideTexture.anisotropy = 16;

    warehouseSideNormal.wrapS = warehouseSideNormal.wrapT = THREE.RepeatWrapping;
    warehouseSideNormal.repeat.set(3,3);
    warehouseSideNormal.anisotropy = 16;

    var warehouseMaterial = new THREE.MeshPhongMaterial( { map: warehouseSideTexture, normalMap: warehouseSideNormal, envMap: skyboxTexture, reflectivity: 0.35, side: THREE.DoubleSide, shininess: 15, specular: 0x4444aa });

    building_B = new THREE.Mesh(new THREE.BoxGeometry(100, 40, 60), warehouseMaterial);
    building_B.castShadow = true;
    building_B.receiveShadow = true;

    // Ring
    var ringMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, side: THREE.DoubleSide, shininess: 15, specular: 0xffffff, emissive: 0xdddd00} );
    ring = new THREE.Mesh(new THREE.RingGeometry(5,10,3,1), ringMaterial);

    // Super-ring
    var superringMaterial = new THREE.MeshPhongMaterial( { color: 0x000000, side: THREE.DoubleSide, shininess: 15, specular: 0xffcc88, emissive: 0xff8800} );
    superring = new THREE.Mesh(new THREE.RingGeometry(6,10,5,1), superringMaterial);

	console.log("Prefabs created.");
}

function loadScene() {
	console.log("Loading scene...");

	// Cargador de texturas
	const loader = new THREE.TextureLoader();

    // Luces y niebla

	console.log("Placing lights...");
	scene.add( new THREE.AmbientLight( 0xbbaacc ) );

	var light = new THREE.DirectionalLight( 0xeebbbb, 0.33 );

	var directionalLight1 = light.clone();
	var directionalLight2 = light.clone();
	var directionalLight3 = light.clone();
	directionalLight1.position.set( -150, 250, 500 );
	directionalLight2.position.set( 0, 250, 500 );
	directionalLight3.position.set( 150, 250, 500 );

	directionalLight2.castShadow = true;
	directionalLight2.shadow.mapSize.width = 2048;
	directionalLight2.shadow.mapSize.height = 2048;
	directionalLight2.shadow.camera.near = 0.1;
	directionalLight2.shadow.camera.far = scene_radius * 2;
	directionalLight2.shadow.camera.left = directionalLight2.shadow.camera.bottom = - scene_radius;
	directionalLight2.shadow.camera.right = directionalLight2.shadow.camera.top = scene_radius;

	scene.add( directionalLight1, directionalLight2, directionalLight3);

	console.log("Building ground...");
    // Construir el suelo interior
    var groundTexture = loader.load('./images/proyecto/ground_diffuse.png');
    groundTexture.color = 0xffffff;
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(75,75);
    groundTexture.anisotropy = 16;

    var groundNormalMap = loader.load('./images/proyecto/ground_normal.png');
    groundNormalMap.wrapS = groundNormalMap.wrapT = THREE.RepeatWrapping;
    groundNormalMap.repeat.set(75,75);
    groundNormalMap.anisotropy = 16;

    var groundMaterial = new THREE.MeshPhongMaterial( { map: groundTexture, normalMap: groundNormalMap, side: THREE.DoubleSide, shininess: 15, specular: 0x887788 });

    ground = new THREE.Mesh(new THREE.CircleGeometry(scene_radius, 64), groundMaterial);
    ground.name = "SUELO";
    
    ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;

    scene.add(ground);

    // Construir el suelo exterior
    var groundGridTexture = loader.load('./images/proyecto/ground_grid.png');
    groundGridTexture.color = 0xffffff;
    groundGridTexture.wrapS = groundGridTexture.wrapT = THREE.RepeatWrapping;
    groundGridTexture.repeat.set(100,100);
    groundGridTexture.anisotropy = 16;
    var groundGridMaterial = new THREE.MeshLambertMaterial( { map: groundGridTexture, transparent: true, side: THREE.DoubleSide, emissive: 0x00ffff, color: 0x0, opacity: ground_grid_opacity });
    ground_grid = new THREE.Mesh(new THREE.RingGeometry(scene_radius, distance_oob, 64, 16), groundGridMaterial);
    ground_grid.name = "SUELO";
    ground_grid.rotation.x = -Math.PI / 2;

    // Construir la esfera límite
    var sphereGridTexture = loader.load('./images/proyecto/ground_grid.png');
    sphereGridTexture.color = 0xffffff;
    sphereGridTexture.wrapS = sphereGridTexture.wrapT = THREE.RepeatWrapping;
    sphereGridTexture.repeat.set(300,100);
    sphereGridTexture.anisotropy = 16;
    var sphereGridMaterial = new THREE.MeshLambertMaterial( { map: sphereGridTexture, transparent: true, side: THREE.BackSide, emissive: 0x00ffff, color: 0x0, opacity: 0.0 });
    sphere_grid = new THREE.Mesh(new THREE.SphereGeometry(distance_oob, 64, 64, 0, Math.PI*2, 0, Math.PI/2), sphereGridMaterial)
    sphere_grid.name = "LÍMITE";

    scene.add(ground_grid);
    scene.add(sphere_grid);

	console.log("Scene loaded.")
}

function generateBuildings(max_radius) {
	// BuildingA
	for(j=0; j < count_buildingA; j++){

    	var building = building_A.clone();

    	do{
	    	var scale = 0.3 + Math.random()*0.7;
	    	building.position.y = 125.5 * scale;
	    	building.scale.y = scale;

	    	building.name = "RASCACIELOS";

	 		//Posicionar BuildingA en el radio
	 		var r = max_radius * Math.random();
	  		var theta = Math.random() * 2 * Math.PI;

	  		building.position.x = r * Math.cos(theta);
	  		building.position.z = r * Math.sin(theta);
	  		//building.rotation.y = theta;
  		}
  		while(checkBuildingCollision(building, true, false, false) != null); // Comprobar no-solapamiento de BuildingA entre si

  		list_buildingA.push(building);
    	scene.add(building);
	}

	// BuildingB
	for(j=0; j < count_buildingB; j++){

    	var building = building_B.clone();

    	do{
    		var scale = 0.5 + Math.random()*0.5;
	    	building.position.y = 20.5 * scale;
	    	building.scale = new THREE.Vector3(scale,scale,scale);

	    	building.name = "ALMACÉN";

	 		//Posicionar BuildingB en el radio
	 		var r = max_radius * Math.random() * 0.8;
	  		var theta = Math.random() * 2 * Math.PI;

	  		building.position.x = r * Math.cos(theta);
	  		building.position.z = r * Math.sin(theta);
  		}
  		while(checkBuildingCollision(building, false, true, false) != null); // Comprobar no-solapamiento de BuildingB entre si
  		//while(false);

  		list_buildingB.push(building);
    	scene.add(building);

	}
}

function generateRings() {
	// Rings
	for(i=0; i < count_rings; i++){

    	var ring_instance = ring.clone();
    	ring_instance.name = "ANILLO";

    	placeRing(ring_instance);

  		list_rings.push(ring_instance);
    	scene.add(ring_instance);
	}

	var ring_instance = superring.clone();
	superring.name = "SUPERANILLO";

	placeRing(superring);
	list_rings.push(superring);
	scene.add(superring);
}

function placeRing(ring){
	do{
    	ring.position.y = ringMinY + (ringMaxY - ringMinY) * Math.random();

 		//Posicionar ring en el radio
 		var r = ring_radius * Math.random();
  		var theta = Math.random() * 2 * Math.PI;

  		ring.position.x = r * Math.cos(theta);
  		ring.position.z = r * Math.sin(theta);
  		ring.rotation.y = theta;
	}
	while((checkBuildingCollision(ring, true, true, true, 5) != null) || (checkRingCollision(ring, false) != null)); // Comprobar no-colision
	//while(false); // Comprobar no-colision
}

function checkBuildingCollision(object, checkA, checkB, useCenter, centerDistance = 1) {
	// Usar centro del objeto
	if(useCenter){
		// Building A
		if(checkA){
			for(i=0; i < list_buildingA.length; i++){
				var collider = new THREE.Box3().setFromObject(list_buildingA[i]);

		    	if (collider.distanceToPoint(object.position) < centerDistance && object.id != list_buildingA[i].id)
		    		return list_buildingA[i];

			}
		}

		// Building B
		if(checkB){
			for(i=0; i < list_buildingB.length; i++){
				var collider = new THREE.Box3().setFromObject(list_buildingB[i]);

		    	if (collider.distanceToPoint(object.position) < centerDistance && object.id != list_buildingB[i].id)
		    		return list_buildingB[i];
		    }
		}
	}
	// Usar BoundingBox del objeto
	else{
		var objectBox = new THREE.Box3().setFromObject(object)

		// Building A
		if(checkA){
			for(i=0; i < list_buildingA.length; i++){
				var collider = new THREE.Box3().setFromObject(list_buildingA[i]);

		    	if (collider.intersectsBox(objectBox) && object.id != list_buildingA[i].id)
		    		return list_buildingA[i];

			}
		}

		// Building B
		if(checkB){
			for(i=0; i < list_buildingB.length; i++){
				var collider = new THREE.Box3().setFromObject(list_buildingB[i]);

		    	if (collider.intersectsBox(objectBox) && object.id != list_buildingB[i].id)
		    		return list_buildingB[i];
		    }
		}
	}
	

	return null;
}

function checkRingCollision(object, useCenter, centerDistance = 1) {
	// Usar centro del objeto
	if(useCenter){
	    // Rings
	    for(i=0; i < list_rings.length; i++){
			var collider = new THREE.Box3().setFromObject(list_rings[i]);

	    	if (collider.distanceToPoint(object.position) < centerDistance && object.id != list_rings[i].id)
	    		return list_rings[i];
	    }

	}
	// Usar BoundingBox del objeto
	else{
		var objectBox = new THREE.Box3().setFromObject(object)

	    // Rings
	    for(i=0; i < list_rings.length; i++){
			var collider = new THREE.Box3().setFromObject(list_rings[i]);

	    	if (collider.intersectsBox(objectBox) && object.id != list_rings[i].id)
	    		return list_rings[i];
	    }
	}
	

	return null;
}

function updateAspectRatio() {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
}

function onKeyDown(event) {
	// Inicializar contexto de audio al interactuar con la ventana
	if(music.context.state !== 'running')
		music.context.resume();

	var keyCode = event.code;

	switch(keyCode){
		case "ArrowUp": currentKeys[0] = true; break;
		case "ArrowDown": currentKeys[1] = true; break;
		case "ArrowLeft": currentKeys[2] = true; break;
		case "ArrowRight": currentKeys[3] = true; break;
		case "KeyQ": currentKeys[4] = true; break;
		case "KeyE": currentKeys[5] = true; break;
		case "Space": playerBoost = true; 
					wind_audio.setPlaybackRate(1.25);
					wind_audio.setVolume(windBaseVolume * 1.5);
					break;
		case "ShiftLeft": playerBrake = true; break;
		case "KeyR": if(restart){
						restart = false;
						startGame();
					}
					break;
		case "Escape": if(pause) togglePause(); break;
	}
}

function onKeyUp(event) {
	var keyCode = event.code;

	switch(keyCode){
		case "ArrowUp": currentKeys[0] = false; break;
		case "ArrowDown": currentKeys[1] = false; break;
		case "ArrowLeft": currentKeys[2] = false; break;
		case "ArrowRight": currentKeys[3] = false; break;
		case "KeyQ": currentKeys[4] = false; break;
		case "KeyE": currentKeys[5] = false; break;
		case "Space": playerBoost = false;
					wind_audio.setPlaybackRate(1);
					wind_audio.setVolume(windBaseVolume);
		break;
		case "ShiftLeft": playerBrake = false; break;
	}
}

function updatePlayerRotation() {

	playerCurrentRotation.x = (currentKeys[0] - currentKeys[1]) * playerRotationSpeed;
	playerCurrentRotation.y = (currentKeys[2] - currentKeys[3]) * playerRotationSpeed;
	playerCurrentRotation.z = 1;
}

function applyPlayerMovement(deltaTime) {
	updatePlayerRotation();

	var lastQuaternion = new THREE.Quaternion();
	var lastPosition = new THREE.Vector3();


	var rotMult = deltaTime * playerRotationSpeed;

	// Roll acceleration
	if(currentKeys[4])
		playerCurrentRoll[0] += playerRollAcc;
	else
		playerCurrentRoll[0] -= playerRollAcc * 3;
	playerCurrentRoll[0] = THREE.MathUtils.clamp(playerCurrentRoll[0], 0, playerMaxRoll)

	if(currentKeys[5])
		playerCurrentRoll[1] += playerRollAcc;
	else
		playerCurrentRoll[1] -= playerRollAcc * 3;

	playerCurrentRoll[1] = THREE.MathUtils.clamp(playerCurrentRoll[1], 0, playerMaxRoll)

	var rollMult = (playerCurrentRoll[1] - playerCurrentRoll[0]) * deltaTime;

	// Move acceleration
	playerPreviousBoost = playerCurrentBoost;

	if(playerBoost != playerBrake){

		if(playerBoost){
			if(playerCurrentBoost < 1)
				playerCurrentBoost += 2*playerBoostAcceleration;
			else
				playerCurrentBoost += 2*playerBoostAcceleration;
		}
		else{
			if(playerCurrentBoost > 1)
				playerCurrentBoost -= 2*playerBoostAcceleration;
			else
				playerCurrentBoost -= playerBoostAcceleration;
		}

		playerCurrentBoost = THREE.MathUtils.clamp(playerCurrentBoost, playerMaxBrake, playerMaxBoost)
	}
	else{
		if(playerCurrentBoost < 1)
			playerCurrentBoost += playerBoostAcceleration;
		if(playerCurrentBoost > 1)
			playerCurrentBoost -= playerBoostAcceleration;
	}

	var moveMult = deltaTime * playerSpeed * playerCurrentBoost;

	// Apply translation and rotation
	player.translateX( moveVector.x * moveMult );
	player.translateY( moveVector.y * moveMult );
	player.translateZ( moveVector.z * moveMult );

	tmpQuaternion.set( playerCurrentRotation.x * rotMult, playerCurrentRotation.y * rotMult, playerCurrentRotation.z * rollMult, 1 ).normalize();
	player.quaternion.multiply( tmpQuaternion );

	lastQuaternion.copy( player.quaternion );
	lastPosition.copy( player.position );
	
	player.getWorldDirection(playerDirection);
}

function updateCameraFov() {
	if((playerCurrentBoost != playerPreviousBoost) && playerCurrentBoost >= 1){
		var newFov = cameraFov + ((playerCurrentBoost - 1) / (playerMaxBoost - 1)) * (cameraMaxFov - cameraFov);
		camera.fov = newFov;
		camera.updateProjectionMatrix();
	}
}

function cameraFollowPlayer() {
	cameraTarget.subVectors(player.position, playerDirection.multiplyScalar(cameraDistance / Math.max(playerCurrentBoost, 1))); // Objetivo de la cámara = detrás del usuario (más cerca si está acelerando, igual si frena)
		cameraDiff.subVectors(cameraTarget, camera.position);
		if(cameraDiff.length() < 0.25)
			camera.position = cameraTarget; // Si cerca del objetivo, saltar al objetivo
		else
			camera.position.addVectors(camera.position, cameraDiff.multiplyScalar(cameraSpeed)); // Si lejos del objetivo, avanzar hacia el objetivo

		cameraLookTarget.addVectors(player.position, playerDirection.multiplyScalar(cameraDistance));
		//camera.up.set(player.up.x, player.up.y, player.up.z);
		camera.up = new THREE.Vector3(0,1,0).transformDirection(player.matrixWorld);
		camera.lookAt(cameraLookTarget);

		updateCameraFov(); // Cambiar angulo de visión si el usuario acelera
}

function checkPlayerCollisions() {
	var collision;

	// Comprobar colisión con edificios
	collision = checkBuildingCollision(player, true, true, true);

	if(collision != null)
		playerCrashed(collision);

	// Comprobar colisión con anillos
	collision = checkRingCollision(player, false);

	if(collision != null)
		collectRing(collision);
}

function checkPlayerInBounds() {
	if(player.position.y <= 0)
		playerCrashed(ground);

	var curr_distance = player.position.distanceTo(new THREE.Vector3(0,0,0));

	if(warning_current){

		// Computar transparencia de la esfera límite según la distancia
		sphere_grid.material.opacity = ((curr_distance - distance_warn) / (distance_oob - distance_warn)) * sphere_max_opacity * grid_master_opacity;

		if(curr_distance < distance_warn){
			warning_current = false;
			toggleWarning()
		}

		else if(curr_distance > distance_oob)
			playerOOB();
	}
	else{
		if(curr_distance > distance_warn){
			warning_current = true;
			toggleWarning()
		}
	}
}

function stopAudioLoops() {
	if(wind_audio.isPlaying)
		wind_audio.stop();
	if(warning_audio.isPlaying)
		warning_audio.stop();
	if(countdown_audio.isPlaying)
		countdown_audio.stop();
}

function toggleWarning() {
	if(warning_current){
		console.log("ATENCIÓN: Abandonando el terreno de juego");
		warning_audio.play();
		document.getElementById("warning").innerText = "¡Regresa a la zona de vuelo!";
	}
	else
	{
		sphere_grid.material.opacity = 0;
		console.log("Regresando al terreno de juego");
		warning_audio.stop();
		document.getElementById("warning").innerText = "";
	}
}

function playerOOB() {

	stopAudioLoops();

	scene.remove(player);
	endGame();

	document.getElementById("warning").innerText = "Abandonaste la zona de vuelo.";
}

function playerCrashed(object) {
	stopAudioLoops();

	crash_audio.play();
	instantiateExplosion(player.position, 0xaaaaaa);
	updateScore(-1000);

	scene.remove(player);
	endGame();


	document.getElementById("warning").innerText = "Te estrellaste con: " + object.name;
}

function collectRing(object) {
	if(ring_audio.isPlaying)
		ring_audio.stop();
	ring_audio.play();

	if(object.name == "SUPERANILLO"){

		if(ring_long_audio.isPlaying)
			ring_long_audio.stop();
		ring_long_audio.play();

		updateScore(superring_value);
	}
	else
		updateScore(ring_value);

	instantiateExplosion(object.position, 0xffff00);

	placeRing(object);
}

function updateScore(delta) {
	currentScore = Math.max(currentScore + delta, 0);
	document.getElementById("score").innerHTML = "" + currentScore;

}

function animateRings() {
	// Rotar anillos
	for(i=0; i < list_rings.length; i++){
		list_rings[i].rotation.x += ringRotation * 0.8;
		list_rings[i].rotation.y += ringRotation * 1.2;
		list_rings[i].rotation.z += ringRotation * 1.0;
	}
}

function animateGrid(time) {
	grid_master_opacity = Math.abs(Math.sin(time / 1000));
	ground_grid.material.opacity = ground_grid_opacity * grid_master_opacity;
}

function startGame() {
	console.log("STARTING NEW GAME")

	document.getElementById("centertext").innerHTML = "Cargando...";
	document.getElementById("warning").innerHTML = "";

	currentScore = 0;
	newHighScore = false;

	console.log("Cleaning scene...")
	cleanScene();
	console.log("Scene cleaned.")

	console.log("Generating structures...")
    generateBuildings(scene_radius - 25);
    generateRings();
	console.log("Structures generated.")
	

	console.log("Placing player...")
    placePlayer();

	updateScore(0);

	document.getElementById( 'centertext' ).innerText = "";
	document.getElementById( 'highscore' ).innerText = "Record: " + highScore;

	remainingTime = timeLimit * 1000;
	document.getElementById( 'time' ).innerText = "" + parseInt((remainingTime / 1000)+1);

	console.log("GAME START");
	gameActive = true;
	restart = false;
	pause = true;

	wind_audio.setPlaybackRate(1);
	wind_audio.setVolume(windBaseVolume);
	wind_audio.play();
	music.setVolume(musicBaseVolume);
}

function cleanScene() {
	var object;
	// Eliminar edificios de la escena
	object = scene.getObjectByName("RASCACIELOS");
	while(object != null){
		scene.remove(object);
		object = scene.getObjectByName("RASCACIELOS");
	}

	object = scene.getObjectByName("ALMACÉN");
	while(object != null){
		scene.remove(object);
		object = scene.getObjectByName("ALMACÉN");
	}

	list_buildingA = [];
	list_buildingB = [];

	// Eliminar anillos de la escena
	object = scene.getObjectByName("ANILLO");
	while(object != null){
		scene.remove(object);
		object = scene.getObjectByName("ANILLO");
	}

	object = scene.getObjectByName("SUPERANILLO");
	while(object != null){
		scene.remove(object);
		object = scene.getObjectByName("SUPERANILLO");
	}

	list_rings = [];
}

function placePlayer() {
	//Posicionar al usuario en el radio
	var r = playerRadius * Math.random();
	var theta = Math.random() * 2 * Math.PI;

	player.position.x = r * Math.cos(theta);
	player.position.y = playerHeight;
	player.position.z = r * Math.cos(theta);

	player.scale.set(playerScale, playerScale, playerScale);
	scene.add( player );
	player.lookAt(0,playerHeight,0);

	player.getWorldDirection(playerDirection);

	cameraTarget.subVectors(player.position, playerDirection.multiplyScalar(cameraDistance / Math.max(playerCurrentBoost, 1)));
	cameraLookTarget.addVectors(player.position, playerDirection.multiplyScalar(cameraDistance));

	camera.position.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
	camera.lookAt(cameraLookTarget);
}

function instantiateExplosion(position, color){
	parts.push(new particleExplosion(position, color));
}

function particleExplosion(position, color){

	var geometry = new THREE.Geometry();
  
  	for (p = 0; p < totalParticles; p++) { 
	    var vertex = new THREE.Vector3();
	    vertex.x = position.x;
	    vertex.y = position.y;
	    vertex.z = position.z;
	  
	    geometry.vertices.push( vertex );
	    dirs.push({x:(Math.random() * particleSpeed)-(particleSpeed/2),y:(Math.random() * particleSpeed)-(particleSpeed/2),z:(Math.random() * particleSpeed)-(particleSpeed/2)});
	  }
  var material = new THREE.ParticleBasicMaterial( { size: particleSize,  color: color});
  var particles = new THREE.ParticleSystem( geometry, material );
  
  this.object = particles;
  this.status = true;
  
  this.xDir = (Math.random() * particleSpeed)-(particleSpeed/2);
  this.yDir = (Math.random() * particleSpeed)-(particleSpeed/2);
  this.zDir = (Math.random() * particleSpeed)-(particleSpeed/2);
  
  scene.add( this.object ); 

  this.update = function(){
    if (this.status == true){
      var pCount = totalParticles;
      while(pCount--) {
        var particle =  this.object.geometry.vertices[pCount]
        particle.y += dirs[pCount].y;
        particle.x += dirs[pCount].x;
        particle.z += dirs[pCount].z;
      }
      this.object.geometry.verticesNeedUpdate = true;
    }
  }
}

function updateParticles(){
	var pCount = parts.length;
          while(pCount--) { parts[pCount].update(); }
}

function endGame(){
	music.setVolume(musicBaseVolume * 0.5);
	gameActive = false;
	currentKeys = [false, false, false, false, false, false];

	console.log("current = " + currentScore);
	console.log("highest = " + highScore);

	if(currentScore > highScore){
		highScore = currentScore;
		document.getElementById("highscore").innerText = "Record: " + highScore;
		document.getElementById("centertext").innerText = "Nuevo Record!\nPresiona 'R' para volver a jugar.";
	}
	else
		document.getElementById("centertext").innerHTML = "Presiona 'R' para volver a jugar.";

	document.getElementById( 'time' ).innerText = "";

	restart = true;
	pause = false;
}

function countdown(time) {

	remainingTime -= time;
	document.getElementById( 'time' ).innerText = "" + parseInt((remainingTime / 1000) + 1);

	if(remainingTime < 1000 * 10 && remainingTime > 1000 * 9 && !countdown_audio.isPlaying ){
		countdown_audio.play();
	}

	if(remainingTime <= 0)
		endGame();

}

function togglePause() {
	currentKeys = [false, false, false, false, false, false];
	if(gameActive){
		document.getElementById("centertext").innerHTML = "Pausa<br>Presiona \"Esc\" para reanudar";
		music.setVolume(musicBaseVolume * 0.5);
		wind_audio.setVolume(windBaseVolume * 0);
	}
	else{
		document.getElementById("centertext").innerHTML = "";
		music.setVolume(musicBaseVolume);
		wind_audio.setVolume(windBaseVolume);
	}

	gameActive = !gameActive;
}

function update() {
	// Actualizar antes/ahora ------------
	var ahora = Date.now();							// Hora actual
	deltaT = (ahora - antes);					// Tiempo transcurrido en ms
	antes = ahora;									// Actualizar antes
	// ---------------------------------

	// Si el usuario está activo:
	if(gameActive){

		applyPlayerMovement(deltaT); 			// Mover al usuario
		cameraFollowPlayer();			// Seguir al usuario con la cámara
		checkPlayerCollisions();		// Comprobar colisiones del usuario
		checkPlayerInBounds();			// Comprobar que el usuario sigue en el terreno de juego
		countdown(deltaT);
	}

	if(gameActive || !pause){
		animateRings();
		animateGrid(ahora - startTime);
	}

	updateParticles();

	// Actualiza los FPS
	stats.update();
}

function render()
{
	// Dibujar cada frame 
	requestAnimationFrame(render);
	update();
	renderer.clear();

	// Renderizar la cámara perspectiva en la totalidad del canvas
	renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
	renderer.render( scene, camera );
}