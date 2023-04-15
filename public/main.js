import * as THREE from "three";
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';

console.log("Hello world");

const objLoader = new OBJLoader();

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
camera.position.copy(new THREE.Vector3(0, 2, 1));
camera.lookAt(new THREE.Vector3(0,0,0));
//camera.position.z = 1;

const scene = new THREE.Scene();

const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );

var isMouseDown = false;

var tank = null;

const textureLoader = new THREE.TextureLoader();

var grassTexture = textureLoader.load("/assets/grass.png");
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(600, 600);

var raycaster = new THREE.Raycaster();

var floorMesh = new THREE.BoxGeometry(10, 0.2, 10);
var floorMaterial = new THREE.MeshToonMaterial({color: 0x50C878, map:grassTexture});
var floorObj = new THREE.Mesh(floorMesh, floorMaterial);
floorObj.scale.x = 100;
floorObj.scale.z = 100;
floorObj.position.y = -0.1;
scene.add(floorObj);

var isTurnLeft = false;
var isTurnRight = false;
var isMoveForward = false;
var isMoveBackward = false;
var isFiring = true;
var currentSpeed = 0;
var maxSpeed = 0.01;


addEventListener("mousedown", event=>{
   isMouseDown = true;
   /*
   console.log("clicked %d,%d", event.clientX,event.clientY);
   var meshNdcPos = tank.position.project(camera);
   var ndc = new THREE.Vector3((event.x/window.innerWidth)*2 - 1,
         -(event.y/window.innerHeight)*2 + 1, meshNdcPos.z);

   raycaster.setFromCamera(ndc, camera);
   var hits = raycaster.intersectObject(floorObj);
   hits.forEach((hit) => {
      if(hit.object === floorObj){
         console.log("hitting floor at: " + hit.point);

         var hitNdcPos = hit.point.project(camera);
         var hitNdc = new THREE.Vector3(ndc.x, ndc.y, hitNdcPos.z);
         var worldPos = hitNdc.unproject(camera);
         tank.position.copy(worldPos);
         tank.position.y += 0.5;
      }
   });
   */
});

addEventListener("mouseup", event=>{
   isMouseDown = false;
});

addEventListener("mousemove", event=>{
   if (!isMouseDown) return;

});

addEventListener('keydown', function(event) {
   if (event.code == 'KeyA') {
     console.log("turn left");
     isTurnLeft = true;
     isTurnRight = false;
   }
   else if(event.code == 'KeyS'){
      //console.log("going backward");
      isMoveForward = false;
      isMoveBackward = true;
   }
   else if(event.code == 'KeyD'){
      console.log("turn right");
      isTurnLeft = false;
      isTurnRight = true;
   }
   else if(event.code == 'KeyW'){
      //console.log("going forwad");
      isMoveForward = true;
      isMoveBackward = false;
   }
   else if(event.code == 'Space'){
      console.log("FIRE");
      isFiring = true;
   }
   console.log("key " + event.code + " pressed");
 });

 addEventListener('keyup', function(event) {
   if (event.code == 'KeyA') {
     console.log("turn left");
     isTurnLeft = false;
   }
   else if(event.code == 'KeyS'){
      console.log("going backward");
      isMoveBackward = false;
   }
   else if(event.code == 'KeyD'){
      console.log("turn right");
      isTurnRight = false;
   }
   else if(event.code == 'KeyW'){
      console.log("going forwad");
      isMoveForward = false;
   }
   else if(event.code == 'Space'){
      console.log("FIRE");
      isFiring = false;
   }
   console.log("key " + event.code + " pressed");
 });

/** loading models */
// load a resource
objLoader.load(
	// resource URL
	'/assets/tank.obj',
	// called when resource is loaded
	function ( object ) {
      console.log(object);
      var material = new THREE.MeshToonMaterial({color: 0x8F9779});
      object.children.forEach((mesh)=>{
         if (mesh){
            mesh.material = material;
         }
      })
      object.position.z = -1;
      object.position.y = 0.5;
      object.scale.copy(new THREE.Vector3(0.2, 0.2, 0.2));
		scene.add( object );

      tank = object;
	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened: ' + error );

	}
);

// animation

var frameRate = 60;
function render(time){
   if (tank != null){
      var direction = new THREE.Vector3();
      tank.getWorldDirection(direction);

      var newPos = new THREE.Vector3();
      newPos.copy(tank.position);
      newPos.x += direction.x*2;
      newPos.z += direction.z*2;
      newPos.y = 2;
      camera.position.copy(newPos);
      camera.lookAt(tank.position);
      //camera.rotation.z = tank.rotation.z;
   }
   renderer.render( scene, camera );

   /** vertical speed */
   if (isMoveForward){
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, maxSpeed, 0.1);
   }
   else if(isMoveBackward){
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, -maxSpeed, 0.1);
   }
   else {
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 0.1);
   }
   
   var turningAngle = 0;
   /** rotation */
   if (isTurnLeft){
      turningAngle = 1;
   }
   else if(isTurnRight){
      turningAngle = -1;
   }

   /** update tank rotation and position */
   if(turningAngle != 0){
      tank.rotateY(THREE.MathUtils.DEG2RAD*turningAngle);
   }
   if(currentSpeed != 0){
      var targetPosition = new THREE.Vector3();
      targetPosition.copy(tank.position);
      var direction = new THREE.Vector3();
      tank.getWorldDirection(direction);

      targetPosition.x += -(direction.x)*currentSpeed;
      targetPosition.z += -(direction.z)*currentSpeed;
      tank.position.copy(targetPosition);
   }


   setTimeout(requestAnimationFrame(render), 1000/frameRate);
}
requestAnimationFrame(render);