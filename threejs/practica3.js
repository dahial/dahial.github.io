/**
*	Seminario GPC#2. Forma Básica.
*	Dibujar formas básicas y un modelo importado.
*	Muestra el bucle típico de inicialización, escena y render.
*
*/

// Variables de consenso
// Motor, escena y cámara
var renderer, scene, camera;

// Otras globales
var esferaCubo, angulo = 0;
var b, l = -4;
var t, r = 4;
var cameraControls;
var alzado, planta, perfil;

// Acciones
init();
loadScene();
render();

function init() {
	// Configurar el motor de render y el canvas
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x0000AA));
	renderer.autoClear = false;

	document.getElementById("container").appendChild(renderer.domElement);

	// Escena
	scene = new THREE.Scene();

	// Cámara
	var ar = window.innerWidth / window.innerHeight;
	setCameras(ar);

	// Controlador de cámara
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	cameraControls.target.set(0,0,0);
	cameraControls.nokeys = true;

	// Captura de eventos
	window.addEventListener('resize', updateAspectRatio);
	renderer.domElement.addEventListener('dblclick', rotate);
}

function setCameras(ar) {
	// Construye las cámaras planta, alzado, perfil y perspectiva

	var origen = THREE.Vector3(0,0,0);

	if(ar > 1)
		var camaraOrtografica = new THREE.OrthographicCamera( l*ar, r*ar, t, b, -20, 20);
	else
		var camaraOrtografica = new THREE.OrthographicCamera( l, r, t/ar, b/ar, -20, 20);

	// Camaras ortograficas
	alzado = camaraOrtografica.clone();
	alzado.position.set (0, 0, 4);
	alzado.lookAt(origen);

	perfil = camaraOrtografica.clone();
	perfil.position.set (4, 0, 0);
	perfil.lookAt(origen);

	planta = camaraOrtografica.clone();
	planta.position.set (0, 4, 0);
	planta.lookAt(origen);
	planta.up = new THREE.Vector3(0, 0, 1);

	// Camara perspectiva
	var camaraPerspectiva = new THREE.PerspectiveCamera(50, ar, 0.1, 50);
	camaraPerspectiva.position.set(1, 2, 10);
	camaraPerspectiva.lookAt(origen);

	camara = camaraPerspectiva.clone();

	scene.add(alzado);
	scene.add(perfil);
	scene.add(planta);
	scene.add(camera);
}

function loadScene() {
	// Construir el grafo de escena

	// Materiales
	var material = new THREE.MeshBasicMaterial({color:'yellow', wireframe:true});

	// Geometrias
	var geocubo = new THREE.BoxGeometry(2,2,2);
	var geoesfera = new THREE.SphereGeometry(1,30,30);
	
	// Objetos
	var cubo = new THREE.Mesh( geocubo, material );
	var esfera = new THREE.Mesh( geoesfera, material);
	/// Orden de las transformaciones: TRS (De derecha a izquierda: Scale 1st, Rotation 2nd, Translation 3rd)
	cubo.position.x = -1;
	cubo.rotation.y = Math.PI/4;
	esfera.position.x = 1;

	// Objeto contenedor
	esferacubo = new THREE.Object3D();
	esferacubo.position.y = 0.5;
	esferacubo.rotation.y = angulo;

	// Modelo externo
	var loader = new THREE.ObjectLoader();
	loader.load( 'models/soldado/soldado.json',
				function(obj){
					obj.position.set(0,1,0);
					cubo.add(obj);
				});

	// Organizacion de la escena
	esferacubo.add(cubo);
	cubo.add(new THREE.AxisHelper(1));
	esferacubo.add(esfera);
	scene.add(esferacubo);
	scene.add (new THREE.AxisHelper(3) );

}

function updateAspectRatio() {
	// Renueva la relación de aspecto de la cámara

	// Ajustar el tamaño del canvas
	renderer.setSize( window.innerWidth, window.innerHeight );

	// Razón de aspecto
	var ar = window.innerWidth / window.innerHeight;
	
	// Cámara ortográfica
	/*if(ar > 1){
		camera.left = -4*ar;
		camera.right = 4*ar;
		camera.bottom = -4;
		camera.top = 4;
	}
	else{
		camera.left = -4;
		camera.right = 4;
		camera.bottom = -4/ar;
		camera.top = 4/ar;
	}*/

	// Cámara perspectiva
	camera.aspect = ar;

	camera.updateProjectionMatrix();
	
}

function rotate(event) {

	// Gira el objeto señalado 45 grados
	var x = event.clientX;
	var y = event.clientY;

	// Transformación a cuadrado de 2x2
	x = (x / window.innerWidth) * 2 - 1;
	y = -(y / window.innerHeight) * 2 + 1;

	var rayo = new THREE.Raycaster();
	rayo.setFromCamera( new THREE.Vector2(x,y), camera);

	var interseccion = rayo.intersectObjects( scene.children, true );

	if(interseccion.length > 0)
		interseccion[0].object.rotation.y += Math.PI / 4;
}

function update() {
	// Variación de la escena entre frames
}

function render() {
	// Construir el frame y mostrarlo
	requestAnimationFrame( render );

	update();

	// Para cada render debo indicar el viewport

	renderer.setViewPort(window.innerWidth/2, window.innerHeight/2,
		window.innerWidth/2, window.innerHeight/2)
	renderer.render( scene, perfil );

	renderer.setViewPort(0, window.innerHeight/2,
		window.innerWidth/2, window.innerHeight/2)
	renderer.render( scene, alzado );

	renderer.setViewPort(0, 0,
		window.innerWidth/2, window.innerHeight/2)
	renderer.render( scene, planta );

	renderer.setViewPort(window.innerWidth/2, 0,
		window.innerWidth/2, window.innerHeight/2)
	renderer.render( scene, camera );
}
