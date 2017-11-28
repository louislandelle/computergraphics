var SceneController = function(document)
{
    // world space
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xffffff );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );

    // clip space
    this.clipScene= new THREE.Scene();
    this.clipScene.background = new THREE.Color( 0xf0f0f0 );
    this.clipRenderer = new THREE.WebGLRenderer( { antialias: true } );

    // screen space
    this.screenScene = new THREE.Scene();
    this.screenScene.background = new THREE.Color( 0xffffff );
    this.screenRenderer = new THREE.WebGLRenderer( { antialias: true } );

    this.stats = new Stats();

    this.gui = new dat.GUI();
};

SceneController.prototype.setup = function()
{
    // https://threejs.org/docs/#api/renderers/WebGLRenderer
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth / 3 - 5, window.innerHeight -20);
    document.body.appendChild( this.renderer.domElement );
    this.renderer.autoClear = false;

    this.clipRenderer.setPixelRatio( window.devicePixelRatio );
    this.clipRenderer.setSize( window.innerWidth / 3 - 5, window.innerHeight - 20);
    document.body.appendChild( this.clipRenderer.domElement );
    this.clipRenderer.localClippingEnabled = true;

    this.screenRenderer.setPixelRatio( window.devicePixelRatio );
    this.screenRenderer.setSize( window.innerWidth / 3 - 5, window.innerHeight - 20);
    document.body.appendChild( this.screenRenderer.domElement );

    //add performance logging
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );

    this.setupGUI();
    this.setupCamera();
    this.setupControls();
    this.setupLight();
    this.setupGeometry();
    this.animate();
};

SceneController.prototype.setupGUI = function()
{
    this.otherParams = {
        clipAxes: false,
        sceneAxes: false,
        enableSceneOrbit: true,
        enableClipOrbit: true,
        slerp: slerpInterporlation,
        slerpX: 10,
        slerpY: 0,
        slerpZ: 0,
        rotX: 0,
        rotY: 0,
        rotZ: 0
    };

    this.modelParams = {
        transx: 0,
        transy: 0,
        transz: 0,
        rotx: 0,
        roty: 0,
        rotz: 0,
        scale: 1
    };

    this.cameraParams = {
        near: 5,
        far: 30,
        fov: 70,
        aspectRatio: window.innerWidth / window.innerHeight / 3,
        atX: 0,
        atY: 0,
        atZ: 0,
        eyeX: 0,
        eyeY: 0,
        eyeZ: 25.0,
        upX: 0,
        upY: 1,
        upZ: 0
    };

	var refresh = function(v){
			this.adjustCamera();
			this.adjustClipView();
			this.adjustModel();
	}.bind(this);

    var modelGui = this.gui.addFolder('model manipulation');
    modelGui.add( this.modelParams, "transx", -20.0, 20.0 ).name("X translation").onChange(refresh);
    modelGui.add( this.modelParams, "transy", -20.0, 20.0 ).name("Y translation").onChange(refresh);
    modelGui.add( this.modelParams, "transz", -20.0, 20.0 ).name("Z translation").onChange(refresh);
    modelGui.add( this.modelParams, "rotx", 0, 360.0 ).name("X rotation").onChange(refresh);
    modelGui.add( this.modelParams, "roty", 0, 360.0 ).name("Y rotation").onChange(refresh);
    modelGui.add( this.modelParams, "rotz", 0, 360.0 ).name("Z rotation").onChange(refresh);
    modelGui.add( this.modelParams, "scale", 0.1, 2.0 ).name("Scale").onChange(refresh);


    var cameraGui = this.gui.addFolder('camera');
    cameraGui.add(this.cameraParams,'fov',1,179).onChange(refresh);
    cameraGui.add(this.cameraParams,'aspectRatio',0.1,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'near',0.01,50).onChange(refresh);
    cameraGui.add(this.cameraParams,'far',0.01,50).onChange(refresh);
    cameraGui.add(this.cameraParams,'atX',-10,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'atY',-10,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'atZ',-10,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'eyeX',-10,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'eyeY',-10,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'eyeZ',-30,30).onChange(refresh);
    cameraGui.add(this.cameraParams,'upX',-10,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'upY',-10,10).onChange(refresh);
    cameraGui.add(this.cameraParams,'upZ',-10,10).onChange(refresh);

    this.gui.add( this.otherParams, "sceneAxes" ).name("World axes");
    this.gui.add( this.otherParams, "clipAxes" ).name("Clipping axes");
    this.gui.add( this.otherParams, "enableSceneOrbit" ).name("Scene orbit control");

    var slerpGui = this.gui.addFolder('slerp');
    slerpGui.add(this.otherParams, 'slerpX',-100, 100).name("Dst x");
    slerpGui.add(this.otherParams, 'slerpY',-100, 100).name("Dst y");
    slerpGui.add(this.otherParams, 'slerpZ',-100, 100).name("Dst z");
    slerpGui.add(this.otherParams, 'rotX', 0, 360.0).name("Rotation x");
    slerpGui.add(this.otherParams, 'rotY', 0, 360.0).name("Rotation y");
    slerpGui.add(this.otherParams, 'rotZ', 0, 360.0).name("Rotation z");
    this.gui.add(this.otherParams, 'slerp').name("Interpolate");

    this.at = new THREE.Vector3();
    this.eye = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.gui.open()
};

SceneController.prototype.setCameraView = function() {
    this.at.set( this.cameraParams.atX, this.cameraParams.atY, this.cameraParams.atZ );
    this.eye.set( this.cameraParams.eyeX, this.cameraParams.eyeY, this.cameraParams.eyeZ );
    this.up.set( this.cameraParams.upX, this.cameraParams.upY, this.cameraParams.upZ );
};

SceneController.prototype.setupCamera = function()
{
    var fov    = this.cameraParams.fov || 70;  // in degrees
    var aspect = this.cameraParams.aspectRatio || (window.innerWidth / window.innerHeight / 3);  // canvas width/height
    var near   = this.cameraParams.near ||  5;  // measured from eye
    var far    = this.cameraParams.far  || 30;  // measured from eye

    // viewing camera
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1 * near, 100 * far);
    this.camera.position.z = 60;
    this.camera.position.x = 20;

    this.perspectiveCamera = new THREE.PerspectiveCamera( fov, aspect, near, far);
    this.setCameraView();
    this.perspectiveCamera.position.copy(this.eye);
    // // Cameras inherit an "up" vector from Object3D.
    this.perspectiveCamera.up.copy(this.up);
    this.perspectiveCamera.lookAt(this.at);

    this.perspectiveCameraHelper = new THREE.CameraHelper(this.perspectiveCamera);
    this.scene.add(this.perspectiveCameraHelper);

    this.screenScene.add(this.perspectiveCamera);

    var frustumSize = 3;
    this.clipCamera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / - 2, near, far);
    this.clipCamera.position.x = - 3;
    this.clipCamera.position.y = 3;
    this.clipCamera.position.z = 10;
    this.clipCamera.lookAt(this.clipScene.position);
    this.clipScene.add(this.clipCamera);
};

SceneController.prototype.setupControls = function()
{
    this.controls = new THREE.OrbitControls( this.camera );
    this.controls.enableDamping = true;
    this.controls.enableZoom = true;
    this.controls.enableKeys = false;
    //bind? --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    this.controls.addEventListener( 'change', this.render.bind(this) );

};

SceneController.prototype.setupGeometry = function()
{
    this.params = {
        wireframe: false,
        sphereDetail: 10,
        cylinderDetail: 10,
        nose: true,
        noseRadius: 0.5,
        noseRotation: degToRad(10),
        ears: true,
        earRadius: 0.6,
        earScale: 0.5,
        earAngle: Math.PI/4,
        eyes: true,
        eyeRadius: 0.3,
        eyeAngleX: -Math.PI/6,
        eyeAngleY: +Math.PI/6,
        arms: true,
        armLength: 7,
        armRadiusTop: 1.5,
        armRadiusBottom: 1.2,
        legs: true,
        legRadiusTop: 1.8,
        legRadiusBottom: 1.4,
        legLength: 9,
        legRotationX: -degToRad(60),
        legRotationZ: degToRad(20),
        hipWidth: 2.5,
        hipHeight: -7,
        head: true,
        headRadius: 2,
        bodyRadius: 5,
        bodyScaleY: 2,
        noop: "last param"
    };

    this.axes = buildAxes(15);
    this.axes.position.set(0, 0, 0);
    this.scene.add(this.axes);

    this.clipAxes = buildAxes(15, left_hand=true);
    this.clipAxes.position.set(0, 0, -1);
    this.clipScene.add(this.clipAxes);

    this.bear = createTeddyBear(this.params);
    this.scene.add(this.bear);

    // Box
    var geometry = new THREE.CubeGeometry( 2, 2, 2);
    var geo = new THREE.EdgesGeometry( geometry );
    var cubeMat = new THREE.LineBasicMaterial( { color: 0xff8010, linewidth: 2} );
    var wireframe = new THREE.LineSegments( geo, cubeMat);
    this.clipScene.add( wireframe );

    this.bear3 = createTeddyBear(this.params);
    this.screenScene.add(this.bear3);
};

SceneController.prototype.setupLight = function()
{
    // https://threejs.org/docs/#api/lights/PointLight
    var light = new THREE.PointLight( 0xffffcc, 1, 100 );
    light.position.set( 10, 30, 15 );
    this.scene.add(light);

    var light2 = new THREE.PointLight( 0xffffcc, 1, 100 );
    light2.position.set( 10, -30, -15 );
    this.scene.add(light2);

    this.scene.add( new THREE.AmbientLight(0x999999) );
};

SceneController.prototype.adjustCamera = function()
{
	this.scene.remove(this.perspectiveCameraHelper);
	this.screenScene.remove(this.perspectiveCamera);		
	
	var fov    = this.cameraParams.fov || 70;  // in degrees
	var aspect = this.cameraParams.aspectRatio || (window.innerWidth / window.innerHeight / 3);  // canvas width/height
	var near   = this.cameraParams.near ||  5;  // measured from eye
	var far    = this.cameraParams.far  || 30;  // measured from eye

	this.perspectiveCamera = new THREE.PerspectiveCamera( fov, aspect, near, far);
	this.setCameraView();

	this.perspectiveCamera.position.copy(this.eye);
	this.perspectiveCamera.up.copy(this.up);
	this.perspectiveCamera.lookAt(this.at);

	this.perspectiveCameraHelper = new THREE.CameraHelper(this.perspectiveCamera);

	this.scene.add(this.perspectiveCameraHelper);
	this.screenScene.add(this.perspectiveCamera);
};

SceneController.prototype.adjustModel = function()
{
	this.bear.position.set(this.modelParams.transx, this.modelParams.transy, this.modelParams.transz);
	this.bear.rotation.set(degToRad(this.modelParams.rotx), degToRad(this.modelParams.roty), degToRad(this.modelParams.rotz));
	this.bear.scale.set(this.modelParams.scale, this.modelParams.scale, this.modelParams.scale);
	this.bear3.position.set(this.modelParams.transx, this.modelParams.transy, this.modelParams.transz);
	this.bear3.rotation.set(degToRad(this.modelParams.rotx), degToRad(this.modelParams.roty), degToRad(this.modelParams.rotz));
	this.bear3.scale.set(this.modelParams.scale, this.modelParams.scale, this.modelParams.scale);
};

SceneController.prototype.adjustClipView = function()
{
    var frustumSize = 3;
    this.clipCamera = new THREE.OrthographicCamera( frustumSize * this.cameraParams.aspect / - 2, frustumSize * this.cameraParams.aspect / 2,
        frustumSize / 2, frustumSize / - 2, this.cameraParams.near, this.cameraParams.far);
    this.clipCamera.position.x = - 3;
    this.clipCamera.position.y = 3;
    this.clipCamera.position.z = 10;
    this.clipCamera.lookAt(this.clipScene.position);
    //this.clipScene.add(this.clipCamera);
};

SceneController.prototype.render = function()
{
    this.axes.visible = this.otherParams.sceneAxes;
    this.renderer.render( this.scene, this.camera);

    this.clipAxes.visible = this.otherParams.clipAxes;
    this.clipRenderer.render(this.clipScene, this.clipCamera);

    this.screenRenderer.render( this.screenScene, this.camera);

    this.stats.update();
};

function slerpInterporlation(){
}

SceneController.prototype.animate = function()
{
    //bind? --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    requestAnimationFrame( this.animate.bind(this) );
    this.stats.update();

    this.controls.enabled = this.otherParams.enableSceneOrbit;
    this.controls.update();
    this.render()
};
