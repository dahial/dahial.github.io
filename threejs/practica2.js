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
var angulo = 0;
var suelo, robot;

var base, brazo;
var eje, esparrago, rotula, antebrazo;
var disco, nervios, mano;
var pinzaIz, pinzaDe;

// Acciones
init();
loadScene();
render();

function init() {
	// Configurar el motor de render y el canvas
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( new THREE.Color(0x000088));
	document.getElementById("container").appendChild(renderer.domElement);

	// Escena
	scene = new THREE.Scene();

	// Cámara
	var ar = window.innerWidth / window.innerHeight;
	camera = new THREE.PerspectiveCamera( 50, ar, 0.1, 2000  );
	scene.add(camera);
	camera.position.set(300, 250, 300);
	camera.lookAt( new THREE.Vector3(0,100,0) );
}

function loadScene() {
	// Construir el grafo de escena

	// Materiales
	var material = new THREE.MeshBasicMaterial({color:'white', wireframe:true});
	var material_suelo = new THREE.MeshBasicMaterial({color:'gray', wireframe:true});

	// Geometrías
	var geo_plano = new THREE.PlaneGeometry(1000,1000,20,20);

	var geo_base = new THREE.CylinderGeometry(50, 50, 15, 40);

	var geo_eje = new THREE.CylinderGeometry(20, 20, 18, 30);
	var geo_esparrago = new THREE.BoxGeometry(18, 120, 12);
	var geo_rotula = new THREE.SphereGeometry(20, 25, 25);

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

	plano = new THREE.Mesh( geo_plano, material_suelo);

	var pinzaIz = new THREE.Mesh( geo_pinza, material);
	var pinzaDe = pinzaIz.clone();

	var mano = new THREE.Mesh( geo_mano, material );


	var antebrazo = new THREE.Object3D();

	var brazo = new THREE.Object3D();



	/// Orden de las transformaciones: TRS (De derecha a izquierda: Scale 1st, Rotation 2nd, Translation 3rd)
	plano.rotation.x = Math.PI/2;

	pinzaIz.position.x = -15;
	pinzaDe.position.x = 15;
	pinzaDe.rotation.z = Math.PI;

	mano.rotation.z = Math.PI/2;

	//cubo.position.x = -1;
	//cubo.rotation.y = Math.PI/4;
	//esfera.position.x = 1;

	// Objeto contenedor
	mano.add(pinzaIz);
	mano.add(pinzaDe);
	//esferacubo = new THREE.Object3D();
	//esferacubo.position.y = 0.5;
	//esferacubo.rotation.y = angulo;

	// Organizacion de la escena

	scene.add(plano);
	scene.add (mano);
	scene.add (new THREE.AxisHelper(3) );

}

function update() {
	// Variación de la escena entre frames
	//angulo += Math.PI/240;
	//pinza.rotation.y = angulo;
}

function render() {
	// Construir el frame y mostrarlo
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}