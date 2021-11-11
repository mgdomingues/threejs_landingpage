import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import fragment from "./shader/fragment.glsl";
import fragment1 from "./shader/fragment1.glsl";
import vertex from "./shader/vertex.glsl";


import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { PostProcessing } from './postprocessing'


import * as dat from "dat.gui";
import gsap from "gsap";
import { degToRad } from "three/src/math/MathUtils";

import landscape from "../photo.jpg"

export default class Sketch{
    constructor(options){
        this.scene = new THREE.Scene();

        this.container = options.dom;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer = new THREE.WebGL1Renderer();

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x111111, 1);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);
        
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.001,
            1000
        );


        this.camera.position.set(0, 0, 2);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.time = 0;

        this.isPlaying = true;

    

        this.addObjects();
        //func to calculate mouse speed 
        this.mouseEvent();
        this.addPost(); 
        this.resize();
        this.render();
        this.setupResize();
        this.settings();

    }


    mouseEvent(){
        this.mouse = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.speed = 0;

        window.addEventListener('mousemove', (e) => {
            //this.speed = (e.pageX - this.lastX) * 0.1
            this.speed = Math.sqrt((e.pageX - this.lastX) ** 2 + (e.pageY - this.lastY) ** 2) * 0.1
            //console.log(e.pageX,e.pageY);
            //console.log(this.speed);
            this.lastX = e.pageX
            this.lastY = e.pageY
        })
    }

    addPost() {
        /**
         * Effect Composer
         */
        this.composer = new EffectComposer(this.renderer);
        //this.composer.setSize(sizes.width, sizes.height);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        
        this.customPass = new ShaderPass(PostProcessing)
        this.customPass.uniforms['resolution'].value = new THREE.Vector2(
            window.innerWidth,
            window.innerHeight
        );
        this.customPass.uniforms['resolution'].value.multiplyScalar(window.devicePixelRatio);
        this.composer.addPass(this.customPass)
    }

    settings() {
        let that = this;
        this.settings = {
            howmuchrgbshifticanhaz: 0.5,
        };
        this.gui = new dat.GUI();
        this.gui.add(this.settings, "howmuchrgbshifticanhaz", 0, 2, 0.01);
    }

    setupResize() {
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize(){
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;


        //image cover
        this.imageAspect = 853/1280;
        let a1; let a2;
        if( this.height / this.width > this.imageAspect ) {
            a1 = (this.height / this.width) * this.imageAspect;
            a2 = 1;
        }else{
            a1 = 1;
            a2 = (this.height / this.width) / this.imageAspect;
        }

        this.material.uniforms.resolution.value.x = this.width;
        this.material.uniforms.resolution.value.y = this.height;
        this.material.uniforms.resolution.value.z = a1;
        this.material.uniforms.resolution.value.w = a2;


        //
        //
        //
        //

        this.camera.updateProjectionMatrix();
    }

    addObjects() {
        let that = this;

        let t=new THREE.TextureLoader().load(landscape);
        t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;

        //material used to apply transforms to the polygon with the images
        this.material = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extensio GL_OES_standard_derivatives : enable" 
            },
            side: THREE.DoubleSide,
            uniforms : {
                time: {type: "f", value: 0},
                //add mouse uniform
                mouse: { value: 0},
                landscape: {value: t},
                resolution: { type: "v4", value: new THREE.Vector4() },
                uvRate1: {
                    value: new THREE.Vector2(1 ,1)
                }
            },
            //wireframe: true,
            //transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment

        });

        //material1 used to apply transforms to the polygone vertices
        this.material1 = new THREE.ShaderMaterial({
            extensions: {
                derivatives: "#extensio GL_OES_standard_derivatives : enable" 
            },
            side: THREE.DoubleSide,
            uniforms : {
                time: {type: "f", value: 0},
                //add mouse uniform
                mouse: {value: 0},
                landscape: {value: t},
                resolution: { type: "v4", value: new THREE.Vector4() },
                uvRate1: {
                    value: new THREE.Vector2(1 ,1)
                }
            },
            //wireframe: true,
            //transparent: true,
            vertexShader: vertex,
            fragmentShader: fragment1

        });

        //IcosahedronGeometry(radius : Float, detail : Integer)
        this.geometry = new THREE.IcosahedronGeometry(1,1);
        this.geometry1 = new THREE.IcosahedronBufferGeometry(
            1.001,
            1
          ) //(1.001, 1)
        
          let length = this.geometry1.attributes.position.array.length
          let bary = []
        
          for (let i = 0; i < length / 3; i++) {
            // xyz, xyz, xyz
            bary.push(0, 0, 1, 0, 1, 0, 1, 0, 0) 
          }
        
          let aBary = new Float32Array(bary)
          this.geometry1.setAttribute('aBary', new THREE.BufferAttribute(aBary, 3))


        this.ico = new THREE.Mesh(this.geometry1, this.material);
        this.icoLines = new THREE.Mesh(this.geometry1, this.material1);

        this.scene.add(this.ico);
        this.scene.add(this.icoLines);

    }

    stop() {
        this.isPlaying = false;
    }

    play() {
        if(!this.isPlaying){
            this.render()
            this.isPlaying = true;
        }
    }

    render() {
        if(!this.isPlaying) return;
        //change rate of rotation
        this.time += 0.005;
        //change the rate os deformations based on mouse
        //console.log("mouse ", this.mouse);
        //console.log("speed ", this.speed);
        this.mouse -= (this.mouse - this.speed) * 0.05;
        //restoure back to normal gradually
        this.speed *=.99;

        
        this.scene.rotation.x = this.time;
        this.scene.rotation.y = this.time;
        
        this.customPass.uniforms.time.value = this.time;
        //this.customPass.uniforms.howmuchrgbshifticanhaz.value = this.settings.howmuchrgbshifticanhaz;
        //making this rgb setting also depend om mouse spped
        this.customPass.uniforms.howmuchrgbshifticanhaz.value = this.mouse/3;

        //add time tranform to both material
        this.material.uniforms.time.value = this.time;
        this.material1.uniforms.time.value = this.time;
       

        //adding mouse tranform to both material    
        this.material.uniforms.mouse.value = this.mouse;
        this.material1.uniforms.mouse.value = this.mouse;

        requestAnimationFrame(this.render.bind(this));
        //this.renderer.render(this.scene, this.camera);
        this.composer.render();

    }
    
}

new Sketch({
    dom: document.getElementById("container")
});
