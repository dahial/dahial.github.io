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
var count_buildingA = 35;
var count_buildingB = 15
var count_rings = 20;
var ring_radius = scene_radius - 25;
var skyboxTexture;
var distance_warn = 800;
var distance_oob = 1000;

// Objetos prefabricados
var building_A;
var building_B;
var ring;

// Objetos en escena
var list_buildingA = list_buildingB = [];
var list_rings = [];
var ground, ground_grid;

// Objetivo juego
var ring_value = 100;
var currentScore = 0;
var maxScore = 0;

// Parametros usuario
var player = new THREE.Object3D();
var playerActive = false;
var playerScale = 0.035;

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

// Auxiliares
var moveVector = new THREE.Vector3(0,0,1);
var tmpQuaternion = new THREE.Quaternion();
var EPS = 0.000001;
var warning_current = false;

// Acciones a realizar
init();
loadPrefabs();
loadScene();
render();

function init()
{
	console.log("init()");

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

function setCameras(ar) {

	// Camara perspectiva
	var camaraPerspectiva = new THREE.PerspectiveCamera(cameraFov, ar, 0.1, fogFar*4);
	camaraPerspectiva.position.set(800, 800, 800);
	camaraPerspectiva.lookAt(new THREE.Vector3(0, 0, 0));

	camera = camaraPerspectiva.clone();

	scene.add(camera);
}

function loadPrefabs() {
	console.log("loadPrefabs()");

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

		child = gltf.scene.children[0];
		while (!child.isMesh)
			child = child.children[0];
		
		child.castShadow = true;
		child.receiveShadow = true;
		player.add(child);

		player.position.set(500,500,500);
		player.scale.set(playerScale, playerScale, playerScale);

		scene.add( player );
		player.lookAt(0,500,0);
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

    // Ring
    var ringMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, side: THREE.DoubleSide, shininess: 15, specular: 0xffffff, emissive: 0xdddd00} );
    ring = new THREE.Mesh(new THREE.RingGeometry(5,10,3,1), ringMaterial);

}

function loadScene()
{
	console.log("loadScene()");

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

    var groundMaterial = new THREE.MeshPhongMaterial( { map: groundTexture, normalMap: groundNormalMap, side: THREE.DoubleSide, shininess: 15, specular: 0x887788 });

    ground = new THREE.Mesh(new THREE.CircleGeometry(scene_radius, 64), groundMaterial);
    ground.name = "ground";
    
    ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;

    scene.add(ground);

    // Construir el suelo exterior
    var groundGridTexture = loader.load('./images/proyecto/ground_grid.png');
    var groundGridAlphaTexture = loader.load('./images/proyecto/ground_grid_alpha.png');
    groundGridTexture.color = 0xffffff;
    groundGridTexture.wrapS = groundGridTexture.wrapT = THREE.RepeatWrapping;
    groundGridTexture.repeat.set(250,250);
    groundGridTexture.anisotropy = 16;

    var groundGridMaterial = new THREE.MeshBasicMaterial( { map: groundGridTexture, transparent: true, alphaMap: groundGridAlphaTexture, side: THREE.DoubleSide, emissive: 0xddaaaa });

    ground_grid = new THREE.Mesh(new THREE.RingGeometry(scene_radius, distance_oob, 64, 16), groundGridMaterial);
    ground_grid.name = "ground";
    
    ground_grid.rotation.x = -Math.PI / 2;

    scene.add(ground_grid);


	console.log("Generating buildings...");
    // Añadir edificios
    generateBuildings(scene_radius - 25);

    // Añadir objetivos
    generateRings();
}

function generateBuildings(max_radius)
{
	// BuildingA
	for(j=0; j < count_buildingA; j++){

    	var building = building_A.clone();

    	do{
	    	var scale = 0.6 + Math.random()*0.4;
	    	building.position.y = 125.5 * scale;
	    	building.scale.y = scale;

	    	building.name = "skyscraper";

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

	    	building.name = "warehouse";

	 		//Posicionar BuildingB en el radio
	 		var r = max_radius * Math.random();
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

function generateRings()
{
	// Rings
	for(i=0; i < count_rings; i++){

    	var ring_instance = ring.clone();
    	ring_instance.name = "ring";

    	placeRing(ring_instance);

  		list_rings.push(ring_instance);
    	scene.add(ring_instance);
	}

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

// Indica con qué edificio está colisionando este objeto
function checkBuildingCollision(object, checkA, checkB, useCenter, centerDistance = 1)
{
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

// Indica con qué anillo está colisionando este objeto
function checkRingCollision(object, useCenter, centerDistance = 1)
{
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
currentKeys[4] = Q
currentKeys[5] = E
playerBoost = Space
playerBrake = Shift
*/
function onKeyDown(event)
{
	var keyCode = event.code;

	switch(keyCode){
		case "ArrowUp": currentKeys[0] = true; break;
		case "ArrowDown": currentKeys[1] = true; break;
		case "ArrowLeft": currentKeys[2] = true; break;
		case "ArrowRight": currentKeys[3] = true; break;
		case "KeyQ": currentKeys[4] = true; break;
		case "KeyE": currentKeys[5] = true; break;
		case "Space": playerBoost = true; break;
		case "ShiftLeft": playerBrake = true; break;
	}
}

function onKeyUp(event)
{
	var keyCode = event.code;

	switch(keyCode){
		case "ArrowUp": currentKeys[0] = false; break;
		case "ArrowDown": currentKeys[1] = false; break;
		case "ArrowLeft": currentKeys[2] = false; break;
		case "ArrowRight": currentKeys[3] = false; break;
		case "KeyQ": currentKeys[4] = false; break;
		case "KeyE": currentKeys[5] = false; break;
		case "Space": playerBoost = false; break;
		case "ShiftLeft": playerBrake = false; break;
	}

}

function updatePlayerRotation()
{

	playerCurrentRotation.x = (currentKeys[0] - currentKeys[1]) * playerRotationSpeed;
	playerCurrentRotation.y = (currentKeys[2] - currentKeys[3]) * playerRotationSpeed;
	playerCurrentRotation.z = 1;

}

function applyPlayerMovement(delta)
{
	updatePlayerRotation();

	var lastQuaternion = new THREE.Quaternion();
	var lastPosition = new THREE.Vector3();


	var rotMult = delta * playerRotationSpeed;

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

	var rollMult = (playerCurrentRoll[1] - playerCurrentRoll[0]) * delta;

	// Move acceleration
	playerPreviousBoost = playerCurrentBoost;

	if(playerBoost != playerBrake){

		if(playerBoost)
			playerCurrentBoost += playerBoostAcceleration;
		else
			playerCurrentBoost -= playerBoostAcceleration;

		playerCurrentBoost = THREE.MathUtils.clamp(playerCurrentBoost, playerMaxBrake, playerMaxBoost)
	}
	else{
		if(playerCurrentBoost < 1)
			playerCurrentBoost += playerBoostAcceleration;
		if(playerCurrentBoost > 1)
			playerCurrentBoost -= playerBoostAcceleration;
	}

	/*if(playerBoost)
		playerCurrentBoost += playerBoostAcceleration;
	else
		playerCurrentBoost -= playerBoostAcceleration;
	playerCurrentBoost = THREE.MathUtils.clamp(playerCurrentBoost, 1, playerMaxBoost)*/

	var moveMult = delta * playerSpeed * playerCurrentBoost;

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

function updateCameraFov()
{
	if((playerCurrentBoost != playerPreviousBoost) && playerCurrentBoost >= 1){
		var newFov = cameraFov + ((playerCurrentBoost - 1) / (playerMaxBoost - 1)) * (cameraMaxFov - cameraFov);
		camera.fov = newFov;
		camera.updateProjectionMatrix();
	}
}

function cameraFollowPlayer()
{
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

function checkPlayerCollisions()
{
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

function checkPlayerInBounds()
{
	if(player.position.y <= 0)
		playerCrashed(ground);

	var curr_distance = player.position.distanceTo(new THREE.Vector3(0,0,0));

	if(warning_current){
		if(curr_distance < distance_warn){
			warning_current = false;
			changeWarning()
		}

		else if(curr_distance > distance_oob)
			playerOOB();
	}
	else{
		if(curr_distance > distance_warn){
			warning_current = true;
			changeWarning()
		}
	}
}

function changeWarning(){
	if(warning_current)
		console.log("ATENCIÓN: Abandonando el terreno de juego");
	else
		console.log("Regresando al terreno de juego");

}

function playerOOB(){

	console.log("Out of bounds");
	playerActive = false;
}

function playerCrashed(object)
{
	console.log("Crashed with " + object.name);
	playerActive = false;
}

function collectRing(object)
{
	currentScore += ring_value;
	maxScore = Math.max(currentScore, maxScore);
	console.log("Score: " + currentScore);

	placeRing(object);

}

function animateRings()
{
	// Rotar anillos
	for(i=0; i < count_rings; i++){
		list_rings[i].rotation.x += ringRotation * 0.8;
		list_rings[i].rotation.y += ringRotation * 1.2;
		list_rings[i].rotation.z += ringRotation * 1.0;
	}
}

function update()
{
	// Actualizar antes/ahora ------------
	var ahora = Date.now();							// Hora actual
	var deltaT = (ahora - antes);					// Tiempo transcurrido en ms
	antes = ahora;									// Actualizar antes

	// ---------------------------------

	// Si el usuario está activo:
	if(playerActive){
		applyPlayerMovement(deltaT); 	// Mover al usuario
		cameraFollowPlayer();			// Seguir al usuario con la cámara
		checkPlayerCollisions();		// Comprobar colisiones del usuario
		checkPlayerInBounds();			// Comprobar que el usuario sigue en el terreno de juego
	}

	animateRings();

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