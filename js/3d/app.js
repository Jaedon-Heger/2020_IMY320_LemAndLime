//import the three js modules necessary
import { GLTFLoader } from './threeModules/GLTFLoader.js';
import { EffectComposer } from './threeModules/EffectComposer.js';
import { RenderPass } from './threeModules/RenderPass.js';
import { UnrealBloomPass } from './threeModules/UnrealBloomPass.js';
import { ShaderPass } from './postprocessing/ShaderPass.js';
import { FXAAShader } from './shaders/FXAAShader.js';

//setup vars
let container;
let camera;
let renderer;
let scene;
let model;
let composer;
let antialiasPass;
let modelAnims;

let loaderReadyToRemove=false;

let mixer;
let prevTime=Date.now();

//objects fopr storing params
var bloom = {
  exposure: 0.5,
  strength: 0.95,
  threshold: 0,
  radius: 1
};
let mouse={
  x:null,
  y:null,
  target:new THREE.Vector3(),
  windowHalfX: window.innerWidth / 2,
  windowHalfY: window.innerHeight / 2
};

//particle system geometry
let particleSystem;
let particleCount;
let particles;
let pMaterial;


//initialisiation functions
function init(){
  console.log("init");
  container=document.querySelector('.scene');
  //create the scene
  scene=new THREE.Scene();
  //scene.fog = new THREE.FogExp2( 0x000000, 0.001 );
  //setup camera
  const fov =35;
  const aspect=container.clientWidth/container.clientHeight;
  const nearPlane=0.1;
  const farPlane=500;

  camera=new THREE.PerspectiveCamera(fov,aspect,nearPlane,farPlane);

  camera.position.set(18,-1,-0.5);
  camera.lookAt(0,-0,-0.5);
  // camera.position.set(-5,-0,0);
  // camera.lookAt(0,-0,0);
  //adding lights
  const ambient=new THREE.AmbientLight(0xf0f0f0,0.8);
  scene.add(ambient);

  const light =new THREE.DirectionalLight(0xffffff,1);
  light.position.set(20,40,-20);
  scene.add(light);

  //INIT THE RENDERER;
  renderer= new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(container.clientWidth,container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  //bloom and render pass
  let renderScene = new RenderPass( scene, camera );

  let bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = bloom.threshold;
  bloomPass.strength = bloom.strength;
  bloomPass.radius = bloom.radius;

  //anti aliaising pass shaders using fxaa
  antialiasPass=new ShaderPass(FXAAShader);
  let pixelRatio = renderer.getPixelRatio();

  antialiasPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
  antialiasPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );


  //make the effect composer
  let width = window.innerWidth || 1;
  let height = window.innerHeight || 1;
  let parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false };

  let renderTarget = new THREE.WebGLRenderTarget( width, height, parameters );
  composer = new EffectComposer( renderer ,renderTarget);
  composer.addPass( renderScene );
  composer.addPass( bloomPass );
  composer.addPass( antialiasPass );



  //load model
  let loader=new GLTFLoader();
  loader.load('./media/3dModels/float4.gltf',(gltf)=>{
      //$("#loadingScreen").remove();

      loaderReadyToRemove=true;
      model = gltf.scene;
      modelAnims=gltf.animations;

      setAnimations();
      scene.add(model);
      setTimeout(()=>{
          $("#loadingScreen").remove();
      },1600);
      setMaterials();
      addParticles();
      animate();

  });
}
function setMaterials(){
  setMaterialBodyJelly();
  setMaterialBigTentacles();
  setMaterialSmallTentacles();
  changeMaterialsSwup();
}

function setMaterialBodyJelly(){
  //console.log(model.children[0].name);
  let material=model.children[0].children[0].material;
//  console.log(model.children[0].material);
  material.transparent=true;
  material.opacity=0.75;

  material.depthTest=false;
  material.dithering=true;
  material.flatShading = false;
  material.color={r: 58 /255, g: 66/255, b: 13/255};
  material.emissiveIntensity=0.2;
  material.transmission=0.4;

  let material2=model.children[0].children[1].material;
  material2.transparent=false;
  material2.opacity=0.7;
  material2.emissiveIntensity=5;
}
function setMaterialBigTentacles(){
  // console.log(model.children);
  let material=model.children[1].material;
  material.color={r: 163 /255, g: 49/255, b: 0/255};
  material.emissiveIntensity=9;
  material.dithering=true;
  material.transmission=0.4;

   material=model.children[3].material;
   model.children[1]
  material.emissiveIntensity=9;
  material.dithering=true;
  material.transmission=0.4;
}
function setMaterialSmallTentacles(){
    let material=model.children[7].material;
    material.color={r: 163 /255, g: 49/255, b: 0/255};
    material.emissiveIntensity=5;
    material.dithering=true;


    material=model.children[8].material;
    material.color={r: 163 /255, g: 49/255, b: 0/255};
    material.emissiveIntensity=5;
    material.dithering=true;
}



function setAnimations(){
  // console.log(model.children);
  mixer = new THREE.AnimationMixer(model);
  for(let i=0;i<modelAnims.length;i++)
    mixer.clipAction( modelAnims[i] ).setDuration(1).play();
}

function addParticles(){
    particleCount = 1800;
    particles = new THREE.Geometry();
    let sprite = new THREE.TextureLoader().load( './media/Textures/spark1.png' );

    pMaterial = new THREE.PointsMaterial({
      color: 0xc95b00,
      alphaTest: 0.5,
      transparent: true ,
      map:sprite,
      size: 1.5
    });


    let color = new THREE.Color( 0xffffff );
    let color2 = new THREE.Color( 0xffffff );

    let from=250;
    let to=125;
    for (let p = 0; p < particleCount; p++) {

      // create a particle with random position values
      let pX = Math.random() * from - to,
          pY = Math.random() * from - to,
          pZ = Math.random() * from - to,
          particle = new THREE.Vector3 (pX, pY, pZ);

      // add it to the geometry
      particles.vertices.push(particle);

    }

     particleSystem = new THREE.Points( particles,pMaterial);
    //  particleSystem.material.vertexColors=true;
    particleSystem.sortParticles = true;
    scene.add(particleSystem);
}

const modelAnimRestriction={
  max:{
    x:0,
    y:1.5,
    z:0.5
  },
  min:{
      x:0,
      y:-0.5,
      z:-0.5
    },
  speed:{
        x:0,
        y:0.00005,
        z:0.00005
      },
  directionPos:{
        x:true,
        y:true,
        z:true
    }
}
//animation function
function animate(){

  requestAnimationFrame(animate);

  if (mixer){
    let time = Date.now();
    mixer.update( ( time - prevTime ) * 0.00005 );
    prevTime = time;
  }


  //y float movement
  if(modelAnimRestriction.directionPos.y){
    model.position.y+=modelAnimRestriction.speed.y;
    if(model.position.y>=modelAnimRestriction.max.y){
      modelAnimRestriction.directionPos.y=false;
    }
  }else{
    model.position.y-=modelAnimRestriction.speed.y;
    if(model.position.y<=modelAnimRestriction.min.y){
      modelAnimRestriction.directionPos.y=true;
    }
  }
  //z float movement
  if(modelAnimRestriction.directionPos.z){

    model.position.z+=modelAnimRestriction.speed.z;
    if(model.position.z>=modelAnimRestriction.max.z){
      modelAnimRestriction.directionPos.z=false;
    }
  }else{
    model.position.z-=modelAnimRestriction.speed.z;
    if(model.position.z<=modelAnimRestriction.min.z){
      modelAnimRestriction.directionPos.z=true;
    }
  }
  model.rotation.x=mouse.y*0.5;
  model.rotation.y=mouse.x;
  particleSystem.rotation.z += 0.00025;
  composer.render();
}

// Changing pages
function onResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  let pixelRatio = renderer.getPixelRatio();

  antialiasPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
  antialiasPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );

}
function onDocumentMouseMove( event ) {
    mouse.x = ( event.clientX - mouse.windowHalfX );
    mouse.y = ( event.clientY - mouse.windowHalfY );

    mouse.x*=-0.0002;
    mouse.y*=-0.0002;
  //  console.log(mouse);
}

const pageInfo={
  index:{
    bodycolor:{r: 163 /255, g: 49/255, b: 0/255},
    particleColor:{r: 201 /255, g: 91/255, b: 0/255},
    cameraPosition:[18,-1,-0.5],
    cursorHighlightSrc:"./media/cursor/c-highlightPurple.svg"
  },
  p1:{
    bodycolor:{r: 21 /255, g: 71/255, b: 158/255},
    particleColor:{r: 52 /255, g: 119/255, b: 235/255},
    cameraPosition:[18,-1,-0.5],
    cursorHighlightSrc:"./media/cursor/c-highlightOrange.svg"
    },
  p2:{
    bodycolor:{r: 21 /255, g: 71/255, b: 158/255},
    particleColor:{r: 52 /255, g: 119/255, b: 235/255},
    cameraPosition:[18,-1,-0.5],
    cursorHighlightSrc:"./media/cursor/c-highlightOrange.svg"
    },
  p3:{
    bodycolor:{r: 21 /255, g: 71/255, b: 158/255},
    particleColor:{r: 52 /255, g: 119/255, b: 235/255},
    cameraPosition:[18,-1,-0.5],
    cursorHighlightSrc:"./media/cursor/c-highlightOrange.svg"
  },
  p4:{
    bodycolor:{r: 21 /255, g: 71/255, b: 158/255},
    particleColor:{r: 52 /255, g: 119/255, b: 235/255},
    cameraPosition:[18,-1,-0.5],
    cursorHighlightSrc:"./media/cursor/c-highlightOrange.svg"
  },
  p5:{
    bodycolor:{r: 21 /255, g: 71/255, b: 158/255},
    particleColor:{r: 52 /255, g: 119/255, b: 235/255},
    cameraPosition:[18,-1,-0.5],
    cursorHighlightSrc:"./media/cursor/c-highlightOrange.svg"
  },
  about:{
      bodycolor:{r: 108 /255, g: 16/255, b: 161/255},
      particleColor:{r: 139 /255, g: 0/255, b: 194/255},
      cameraPosition:[18,-1,-0.5],
      cursorHighlightSrc:"./media/cursor/c-highlightPurple.svg"
    }
}


function changeMaterial(event){
    //decide what color to switch tolet
    let currPage=document.location.pathname.match(/[^\/]+$/)[0];
    console.log(currPage);
    let bodycolor,tentaclesColor,particlesColor;

    let scrollUp=true;
    let shouldChange=false;
    if(event.originalEvent.wheelDelta >= 0){
      scrollUp=true;
    }else{
       scrollUp=false;
     }

    let cursorHighlight=$("#cursorB");
    switch(currPage){
      case "index.html":
        if(!scrollUp){
          bodycolor=pageInfo.p1.bodycolor;
          particlesColor=pageInfo.p1.particleColor;
          shouldChange=true;
        }
        break;
      case "project1.html":
        if(!scrollUp){
          bodycolor=pageInfo.p2.bodycolor;
          particlesColor=pageInfo.p2.particleColor;
          shouldChange=true;
        }else{
          bodycolor=pageInfo.index.bodycolor;
          particlesColor=pageInfo.index.particleColor;
          shouldChange=true;
        }
        break;
      case "project2.html":
        if(!scrollUp){
          bodycolor=pageInfo.p3.bodycolor;
          particlesColor=pageInfo.p3.particleColor;
          shouldChange=true;
        }else{
          bodycolor=pageInfo.p1.bodycolor;
          particlesColor=pageInfo.p1.particleColor;
          shouldChange=true;
        }
        break;
      case "project3.html":
        if(!scrollUp){
          bodycolor=pageInfo.p4.bodycolor;
          particlesColor=pageInfo.p4.particleColor;
          shouldChange=true;
        }else{
          bodycolor=pageInfo.p2.bodycolor;
          particlesColor=pageInfo.p2.particleColor;
          shouldChange=true;
        }
        break;
      case "project4.html":
          if(!scrollUp){
            bodycolor=pageInfo.p5.bodycolor;
            particlesColor=pageInfo.p5.particleColor;
            shouldChange=true;
          }else{
            bodycolor=pageInfo.p3.bodycolor;
            particlesColor=pageInfo.p3.particleColor;
            shouldChange=true;
          }
          break;

      case "project5.html":
          if(!scrollUp){
            bodycolor=pageInfo.about.bodycolor;
            particlesColor=pageInfo.about.particleColor;
            shouldChange=true;
          }else{
            bodycolor=pageInfo.p4.bodycolor;
            particlesColor=pageInfo.p4.particleColor;
            shouldChange=true;
          }
          break;

      case "about.html":
          if(scrollUp){
            bodycolor=pageInfo.p5.bodycolor;
            particlesColor=pageInfo.p5.particleColor;
            shouldChange=true;
          }
          break;
      default:
        console.log("nothome");
        break;
    }
    //change body
    if(shouldChange){
      switchAllColors(bodycolor,particlesColor);

    }
}


function changeMaterialsSwup(){
    //decide what color to switch tolet
    let currPage=document.location.pathname.match(/[^\/]+$/);
    if(currPage!=null){
     currPage=document.location.pathname.match(/[^\/]+$/)[0];
    }else{
      currPage="index.html";
    }
    let bodycolor,tentaclesColor,particlesColor;
    let shouldChange=false;

    switch(currPage){
      case "index.html":
          bodycolor=pageInfo.index.bodycolor;
          particlesColor=pageInfo.index.particleColor;
          shouldChange=true;
        break;
      case "project1.html":
          bodycolor=pageInfo.p1.bodycolor;
          particlesColor=pageInfo.p1.particleColor;
          shouldChange=true;
        break;
      case "project2.html":
          bodycolor=pageInfo.p2.bodycolor;
          particlesColor=pageInfo.p2.particleColor;
          shouldChange=true;
        break;
      case "project3.html":
          bodycolor=pageInfo.p3.bodycolor;
          particlesColor=pageInfo.p3.particleColor;
          shouldChange=true;
        break;
      case "project4.html":
            bodycolor=pageInfo.p4.bodycolor;
            particlesColor=pageInfo.p4.particleColor;
            shouldChange=true;
          break;
      case "project5.html":
            bodycolor=pageInfo.p5.bodycolor;
            particlesColor=pageInfo.p5.particleColor;
            shouldChange=true;
          break;
      case "about.html":
            bodycolor=pageInfo.about.bodycolor;
            particlesColor=pageInfo.about.particleColor;
            shouldChange=true;
          break;
      default:
          bodycolor=pageInfo.p5.bodycolor;
          particlesColor=pageInfo.p5.particleColor;
          shouldChange=true;
        break;
    }
    //change body
    if(shouldChange){
      switchAllColors(bodycolor,particlesColor);
    }
}


function switchAllColors(color,particlesColor){
  model.children.forEach((child) => {

    if(child.material){
      child.material.color=color;
      child.material.emissive=color;
    }
  });
    //switch body
  let material=model.children[0].children[0].material;
  material.color=color;

  material=model.children[0].children[1].material;
  material.color=color;
  if(pMaterial)
    pMaterial.color=particlesColor;
}
swup.on('contentReplaced', changeMaterialsSwup);

//bind event HANDLERS
// $(window).bind('mousewheel',changeMaterial);
window.addEventListener( 'resize', onResize, false );
window.addEventListener("mousemove", onDocumentMouseMove, false);
//onload
init();
