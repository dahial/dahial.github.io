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

// Acciones
init();
loadScene();
render();

function init() {
	// Configurar el motor de render y el canvas
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x0000AA));
	document.getElementById("container").appendChild(renderer.domElement);

	// Escena
	scene = new THREE.Scene();

	// Cámara
	var ar = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera( 50, ar, 0.1, 100  );
	scene.add(camera);
	camera.position.set(0.5, 3, 9);
	camera.lookAt( new THREE.Vector3(0,0,0) );
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

function update() {
	// Variación de la escena entre frames
	angulo += Math.PI/240;
	esferacubo.rotation.y = angulo;
}

function render() {
	// Construir el frame y mostrarlo
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}