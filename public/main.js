import * as THREE from "three";
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log("Hello world");

/** module facing -y imported from blender */
const objLoader = new OBJLoader();

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
camera.position.copy(new THREE.Vector3(0, 2, 1));
camera.lookAt(new THREE.Vector3(0,0,0));
//camera.position.z = 1;

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xadadad );
scene.fog = new THREE.FogExp2( 0xadadad, 0.01 );

const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setAnimationLoop( animation );
document.body.appendChild( renderer.domElement );
//const pointerLockControl = new PointerLockControls(camera, document.body);
//console.log(pointerLockControl);


const orbitControls = new OrbitControls( camera, renderer.domElement );
orbitControls.listenToKeyEvents( window ); // optional
orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
orbitControls.dampingFactor = 0.05;
orbitControls.screenSpacePanning = false;
orbitControls.maxDistance = 2;
orbitControls.minDistance = 2;
orbitControls.maxPolarAngle = Math.PI / 3;
orbitControls.minPolarAngle = Math.PI/5;
orbitControls.enableZoom = false;
orbitControls.listenToKeyEvents( window ); // optional


var isMouseDown = false;

var tank = null;
var tank_pref = null;
var bullet_pref = null;

var bullet_fire_interval = 3000; // 3 seconds

var pointer_last_frame_position = new THREE.Vector2();
var cameraRotation = null;
/** pitch, yaw, roll */
var cameraVelocity = new THREE.Vector3(1, 1, 0);
var pitchAngleMin = -45;
var pitchAngleMax = 0;
var cameraLookatObj = new THREE.Object3D();
var cameraDeadZone = 1; // pixels

const textureLoader = new THREE.TextureLoader();

var grassTexture = textureLoader.load("/assets/grass.png");
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(600, 600);

var brickTexture = textureLoader.load("/assets/bricks.png");
brickTexture.wrapS = THREE.RepeatWrapping;
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(600, 600);

var groundTexture = textureLoader.load("/assets/ground.png");
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(600, 600);

var raycaster = new THREE.Raycaster();

var commonMaterial = new THREE.MeshToonMaterial({color: 0x8F9779});

var floorMesh = new THREE.BoxGeometry(10, 0.2, 10);
var floorMaterial = new THREE.MeshToonMaterial({color: 0x50C878, map:grassTexture});
var floorObj = new THREE.Mesh(floorMesh, floorMaterial);
floorObj.scale.x = 100;
floorObj.scale.z = 100;
floorObj.position.y = -0.1;
//scene.add(floorObj);

var groundMaterial = new THREE.MeshToonMaterial({color: 0xffffff, map: groundTexture});
var groundObj = new THREE.Mesh(floorMesh, groundMaterial);
groundObj.scale.x = 100;
groundObj.scale.z = 100;
groundObj.position.y = -0.1;
scene.add(groundObj);

var obstacleGeo = new THREE.BoxGeometry(2,2,2);
var obstacleMaterial = new THREE.MeshToonMaterial({color: 0xffffff, map:brickTexture});


var isTurnLeft = false;
var isTurnRight = false;
var isMoveForward = false;
var isMoveBackward = false;
var canFire = false;
var isFiring = false;
var currentSpeed = 0;
var maxSpeed = 0.01;

var obstacles = new THREE.Group();


/** obstacles */
function initObstacles(){
   for (var i = -40; i <= 40;){
      for (var j = -40; j <= 40;){
         const cube = new THREE.Mesh( obstacleGeo, obstacleMaterial);
         cube.position.set(i, 1, j);
         obstacles.add(cube);

         j += Math.random()*10;
      }
      i += Math.random()*10;
   }
   scene.add(obstacles);
}

initObstacles();

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


/*
document.addEventListener( 'click', function () {
   pointerLockControl.lock();
});

pointerLockControl.addEventListener("change", function(event){
   //console.log(event);
   return;
   if (cameraRotation == null){
      pointer_last_frame_position.set(event.x, event.y);
      cameraRotation = new THREE.Vector3();
      console.log(cameraRotation);
   }
   else{
      var pitch = (event.y - pointer_last_frame_position.y)/10 * cameraVelocity.y;
      var yaw = (event.x - pointer_last_frame_position.x)/10 * cameraVelocity.x;
      cameraRotation.set(pitch, -yaw, 0);

      if(Math.abs(event.x - pointer_last_frame_position.x) <= cameraDeadZone){
         cameraRotation.y = 0;
      }
      if(Math.abs(event.y - pointer_last_frame_position.y) <= cameraDeadZone){
         cameraRotation.x = 0;
      }
      pointer_last_frame_position.set(event.x, event.y);
   }
});
*/

addEventListener('keydown', function(event) {
   if (event.code == 'KeyA') {
     //console.log("turn left");
     isTurnLeft = true;
     isTurnRight = false;
   }
   else if(event.code == 'KeyS'){
      //console.log("going backward");
      isMoveForward = false;
      isMoveBackward = true;
   }
   else if(event.code == 'KeyD'){
      //console.log("turn right");
      isTurnLeft = false;
      isTurnRight = true;
   }
   else if(event.code == 'KeyW'){
      //console.log("going forwad");
      isMoveForward = true;
      isMoveBackward = false;
   }
   else if(event.code == 'Space'){
      //console.log("FIRE");
      isFiring = true;
   }
   //console.log("key " + event.code + " pressed");
 });

 addEventListener('keyup', function(event) {
   if (event.code == 'KeyA') {
     //console.log("turn left");
     isTurnLeft = false;
   }
   else if(event.code == 'KeyS'){
      //console.log("going backward");
      isMoveBackward = false;
   }
   else if(event.code == 'KeyD'){
      //console.log("turn right");
      isTurnRight = false;
   }
   else if(event.code == 'KeyW'){
      //console.log("going forwad");
      isMoveForward = false;
   }
   else if(event.code == 'Space'){
      //console.log("FIRE");
      isFiring = false;
   }
   //console.log("key " + event.code + " pressed");
 });

/** loading models */
function load_model(module_path){
   var prefab = new THREE.Object3D();
   objLoader.load(
      // resource URL
      module_path,
      // called when resource is loaded
      function ( object ) {
         object.children.forEach((mesh)=>{
            if (mesh){
               mesh.material = commonMaterial;
            }
         })
         object.scale.set(0.2, 0.2, 0.2);
         prefab.copy(object, true);
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
   return prefab;
}

tank_pref = load_model("/assets/tank.obj");
bullet_pref = load_model("/assets/bullet.obj");

async function instantiateTank(){
   tank = tank_pref.clone(true);
   tank.position.z = -1;
   tank.position.y = 0.2;
   console.log(tank);
   scene.add(tank);
   cameraLookatObj.position.copy(tank.position);
}

function instantiateBullet(){
   var bullet = bullet_pref.clone(true);
   bullet.position.copy(tank.position);
   console.log(bullet);
   scene.add(bullet);
}
setTimeout(() => {
   instantiateTank();
}, 1000);

setTimeout(() => {
   canFire = true;
}, 1000);


// collision detection
function obstacleDetection(){
   var direction = new THREE.Vector3();
   var targetPosition = new THREE.Vector3();
   targetPosition.copy(tank.position);
   tank.getWorldDirection(direction);

   targetPosition.x += -(direction.x)*currentSpeed;
   targetPosition.z += -(direction.z)*currentSpeed;
   
   //console.log(currentSpeed);

   var raycastDirection = new THREE.Vector3();
   raycastDirection.subVectors(targetPosition, tank.position);
   raycaster.set(tank.position, raycastDirection);
   raycaster.far = 0.3;
   raycaster.near = 0.01;
   var hits = raycaster.intersectObjects(obstacles.children, false);
   // return nearest hit point or null if not hit
   //console.log(hits);
   if (hits.length > 0){
      return hits[0].object.position;
   }
   else return null;
}

// animation

var frameRate = 60;
function render(time){
   if (tank != null){
      if(isMoveForward || isMoveBackward){
         /*
         var direction = new THREE.Vector3();
         tank.getWorldDirection(direction);
         var newPos = new THREE.Vector3();
         newPos.copy(tank.position);
         newPos.x += direction.x;
         newPos.z += direction.z;
         newPos.y = 1;
         camera.position.copy(newPos);
         */
      }
      orbitControls.target.copy(tank.position);
      
      
      //camera.lookAt(tank.position);

      if (cameraRotation != null){
         /** camera rotation */
         //var newPitch = camera.rotation.x + cameraRotation.x;
         //newPitch = THREE.MathUtils.clamp(newPitch, pitchAngleMin, pitchAngleMax);
         //console.log(camera.rotation);
         //var euler = new THREE.Euler(newPitch, newYaw, 0);

         //cameraLookatObj.rotateOnWorldAxis(new THREE.Vector3())
         //console.log(cameraRotation.y);
         //tank.rotateY(cameraRotation.y*THREE.MathUtils.DEG2RAD);
         // console.log(tank.rotation);
         
         //camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), newYaw*THREE.MathUtils.DEG2RAD);
         //console.log(tank);
      }

   }
   renderer.render( scene, camera );

   /** vertical speed */
   if (isMoveForward){
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, maxSpeed, 0.02);
   }
   else if(isMoveBackward){
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, -maxSpeed, 0.02);
   }
   else {
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 0.01);
   }
   
   var turningAngle = 0;
   /** rotation */
   if (isTurnLeft){
      if(isMoveBackward){
         turningAngle = -1;
      } else{
         turningAngle = 1;
      }
   }
   else if(isTurnRight){
      if(isMoveBackward){
         turningAngle = 1;
      } else{
         turningAngle = -1;
      }
   }

   /** FIRE */
   if (isFiring && canFire){
      //instantiateBullet();
      instantiateBullet();
      canFire = false;
      setTimeout(() => {
         canFire = true;
      }, bullet_fire_interval);
   }

   if(tank != null){
      var hitPoint = obstacleDetection();
      if (hitPoint == null){
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
      }
   }

   /** update tank rotation and position */
   /*
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
   */

   orbitControls.update();

   setTimeout(requestAnimationFrame(render), 1000/frameRate);
}
requestAnimationFrame(render);