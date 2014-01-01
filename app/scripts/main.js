define('modernizr', [], Modernizr);


require.config({
    shim: {

        underscore : {
            exports: '_'
        },

        greensockLite : {
            exports: 'TweenLite'
        },



    },

    paths: {
        jquery     : '../bower_components/jquery/jquery',
        //threeJs    : '../bower_components/threejs/index',
        eddy       : '../bower_components/eddy-js/build/eddy',
        underscore : '../bower_components/underscore/underscore',
        greensockLite  : '../bower_components/greensock/src/uncompressed/TweenLite',

        // loader
        OBJMTLLoader : 'helper/OBJMTLLoader',
        MTLLoader    : 'helper/MTLLoader'

    }
});

require([
    // library
    'jquery',
    'greensockLite',

    // helper
    'helper/ticker',
    'helper/windower',
    'helper/events',
    'helper/mouse',
    'helper/keys',
    'helper/constans',

    //
    'OBJMTLLoader',

    'eddy',


], function ( $, TweenLite, ticker, windower, Events, mouse, keys, Constans, OBJMTLLoader  ) {

    var scene, renderer, camera;
    var loader;


    var obj = {rate: 0.001};
    var year = {count: 0};

    var isFujiLoad = false;
    var fujiObject;

    var isHorseLoad = false;
    var horseNum = 2014;
    var horseCurCount = 0;
    var horseScale = 0;
    var horseGeometry;
    var horseMesh;
    var horseAnimationStatus = false;
    var horseDataCollection = [];

    var horseLoader = new THREE.JSONLoader(true);

    var horseMeshes = [];

    var duration = 1000;
    var keyframes = 15, interpolation = duration / keyframes;
    var lastKeyframe = 0, currentKeyframe = 0;

    var currentTime, prevTime;

    var cameraPositionCount = -1;
    var cameraPrevPositionCount = 0;
    var cameraValue = {rate: 0};
    var cameraPosition = [[245, 1, 1], [500, 1, 1500], [500, 500, 1000], [1, 500, 500]];

    var mouseDownStatus = false;
    var mouseMoveActive = false;
    var curCameraPositionX;
    var mouseMoveCameraMoveTarget = 0;
    var mouseMoveCameraMove = 0;



    var clickDownCount = 0;
    var MAX_CLICK_COUNT = 4;

    // jquery
    var $text = $("#text");
    var $yearText = $("#text-year");
    var $click = $("#click");
    var $loading = $("#loading");



    if(Modernizr.mobile){
        var html =  "<div>" +
            "<p>Thank you for checking 'Three.js start kit' demo page.</p>" +
            "<p>Your browser doesn't seem to support WEBGL.</p>" +
            "<p>Please check it on WebGL Supported browser such as Google Chrome in PC.</p>" +
            "</div>"

        Constans.$BODY.html(html);
        Constans.$BODY.addClass("mobile");

    }else{
        loadingStart();
        Events.on(Events.WINDOW_RESIZE, onResize);
    }

    function onResize(){
        camera.aspect = windower.width / windower.height;
        camera.updateProjectionMatrix();

        renderer.setSize( windower.width, windower.height );
    }

    function loadingStart(){
        setTimeout(function(){
            $loading.addClass('inactive');
        }, 500)

        setTimeout(function(){

            $loading.css({ display: 'none' });

        }, 2000);

        setTimeout(function(){

            currentTime = prevTime = Date.now();
            ticker.start();
            Events.on(Events.TICK,  loop);

            TweenLite.to(year, 4.5, {count: 2014, ease:Power1.easeInOut, onUpdate: onYearCountUpdate, onComplete: onYearCountComplete });

        }, 100);


        loader = new THREE.OBJMTLLoader();
        loader.load('data/fuji.obj', 'data/fuji.mtl', function(object){
            fujiObject = object;

            isFujiLoad = true;

            if(isFujiLoad && isHorseLoad) initScene();
        });

        // ------------

        horseLoader.load('data/horse.js', function(geometry){
            horseGeometry = geometry;

            isHorseLoad = true;

            // start to counting
            //

            if(isFujiLoad && isHorseLoad) initScene()
        });



    }

    function initScene(){

        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize( windower.width, windower.height );

        document.getElementById("main").appendChild(renderer.domElement);

        // setting camera
        camera = new THREE.PerspectiveCamera(45, windower.width/windower.height, 0.1, 10000);
        camera.position.x = 0;
        curCameraPositionX = 0;
        camera.position.y = 500;
        camera.position.z = 0;
        scene.add(camera);



        // adding fuji

        fujiObject.scale.x = fujiObject.scale.y = fujiObject.scale.z =  32;
        scene.add( fujiObject );







        var manager = new THREE.LoadingManager();
        manager.onProgress = function(item, loaded, total){
            console.log(item, loaded, total);
        };

        // ground

        var initColor = new THREE.Color(0x022C52);
        var initTexture = THREE.ImageUtils.generateDataTexture( 1, 1, initColor );

        var groundMaterial = new THREE.MeshPhongMaterial({color: 0xffffff, specular: 0x111111, map: initTexture });
        //var groundTexture = THREE.ImageUtils.loadTexture( "data/grasslight-big.jpg", undefined, function() { groundMaterial.map = groundTexture } );
        //groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;

        var gMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), groundMaterial);
        //gMesh.scale.set(0.1, 0.1, 0.1);
        gMesh.receiveShadow = true;
        gMesh.rotation.x = - Math.PI / 2;
        scene.add( gMesh );

        // ---------

        var light = new THREE.DirectionalLight( 0xffefef, 0.5 );
        light.position.x = 0;
        light.position.y = 10;
        light.position.z = 0;
        scene.add( light );

        var light = new THREE.DirectionalLight( 0xffefef, 3  );
        light.position.set( -10, -10, -10 );
        scene.add( light );

        // add helper
        var helperObject = new THREE.AxisHelper(100);
        helperObject.position.set(120, 0, 200);
        //scene.add(helperObject);



        camera.lookAt(scene.position);


        // loadView disable
        // adding horse

        onAddHorse();

        renderer.render(scene, camera);
    }

    function loop(){
        /**
        horseScale += 0.02;
        horseMesh.scale.set( horseScale, horseScale, horseScale );
         */

        mouseMoveCameraMove = (mouseMoveCameraMoveTarget - mouseMoveCameraMove) * 0.001;
        camera.position.x = curCameraPositionX + mouseMoveCameraMove;
        camera.lookAt(scene.position);

        onAnimationHorseLoop();


        renderer.render(scene, camera);
    }

    function onMouseDown(){
        if($click.hasClass('active'))
            $click.removeClass('active')

        if(!mouseDownStatus){
            cameraPrevPositionCount = cameraPositionCount;
            cameraPositionCount = (cameraPositionCount + 1) % cameraPosition.length;
            cameraValue.rate = 0;

            TweenLite.to(cameraValue, 1, {rate: 1, onUpdate: onCameraChangeUpdate, onComplete: onCameraChangeComplete });

            mouseDownStatus = true;
        }

    }

    function onCameraChangeUpdate(){
        var posX, posY, posZ;

        if(cameraPrevPositionCount == -1){
            posX = cameraValue.rate * cameraPosition[cameraPositionCount][0];
            posY = (1 - cameraValue.rate) * 500 + cameraValue.rate * cameraPosition[cameraPositionCount][1];
            posZ = cameraValue.rate * cameraPosition[cameraPositionCount][2];
        }else{
            posX = (1 - cameraValue.rate) * cameraPosition[cameraPrevPositionCount][0] + cameraValue.rate * cameraPosition[cameraPositionCount][0];
            posY = (1 - cameraValue.rate) * cameraPosition[cameraPrevPositionCount][1] + cameraValue.rate * cameraPosition[cameraPositionCount][1];
            posZ = (1 - cameraValue.rate) * cameraPosition[cameraPrevPositionCount][2] + cameraValue.rate * cameraPosition[cameraPositionCount][2];
        }


        camera.position.x = posX;
        camera.position.y = posY;
        camera.position.z = posZ;

        curCameraPositionX = posX;

    }

    function onCameraChangeComplete(){
        camera.position.x = cameraPosition[cameraPositionCount][0];
        camera.position.y = cameraPosition[cameraPositionCount][1];
        camera.position.z = cameraPosition[cameraPositionCount][2];

        curCameraPositionX = cameraPosition[cameraPositionCount][0];

        mouseDownStatus = false;

        if(clickDownCount < MAX_CLICK_COUNT){
            clickDownCount++;
            $click.addClass('active')
        }

        if(!mouseMoveActive){
            Events.on(Events.MOUSE_MOVE, onMouseMove);
            mouseMoveActive = true;
        }


    }

    function onAnimationHorseLoop(){
        currentTime = Date.now();
        var dt = currentTime - prevTime;

        // -------

        var i;
        var mesh, horseData;
        //console.log(horseMeshes)

        if(horseAnimationStatus){
            for( i  in horseMeshes) {
                mesh = horseMeshes[i];
                horseData = horseDataCollection[i];

                var rad = horseData.rad;
                //if(i == 0) console.log(horseData)

                // -------------

                if(!horseData.velStatus){
                    horseData.currentVelocityTheta += dt * horseData.currentAclTheta;

                    if(horseData.currentVelocityTheta > horseData.MAX_VELOCITY_THETA){
                        horseData.currentVelocityTheta = horseData.MAX_VELOCITY_THETA;
                        horseData.velStatus = true;
                    }
                }

                // -------------

                var theta = horseData.theta - horseData.currentVelocityTheta * dt;
                var rotation = Math.PI - theta;

                mesh.position.set(rad * Math.cos(theta), 0, rad * Math.sin(theta));
                mesh.rotation.set( 0, rotation, 0 );

                horseDataCollection[i].theta = theta;
            }
        }

        // -------

        for(i  in horseMeshes){
            mesh = horseMeshes[i];
            horseData = horseDataCollection[i];


            var currentKeyframe = horseData.curKeyframe;
            var lastKeyframe = horseData.lastKeyframe;

            var currentTime = horseData.curTime + dt;

            var time = currentTime % duration;
            var keyframe = Math.floor( time / interpolation);

            if(keyframe != currentKeyframe){

                mesh.morphTargetInfluences[ lastKeyframe ] = 0;
                mesh.morphTargetInfluences[ currentKeyframe ] = 1;
                mesh.morphTargetInfluences[ keyframe ] = 0;

                lastKeyframe = currentKeyframe;
                currentKeyframe = keyframe;

                horseDataCollection[i].lastKeyframe = lastKeyframe;
                horseDataCollection[i].curKeyframe = currentKeyframe;

            }

            mesh.morphTargetInfluences[ keyframe ] = ( time % interpolation ) / interpolation;
            mesh.morphTargetInfluences[ lastKeyframe ] = 1 - mesh.morphTargetInfluences[ keyframe ];

            horseDataCollection[i].curTime = currentTime;

        }

        // -------

        prevTime = currentTime;

    }

    function keyDownMove(){
        if      (keys.isKeyDown(keys.KEY_A)) cam_move("x", -1);
        else if (keys.isKeyDown(keys.KEY_D)) cam_move("x",  1);
        else if (keys.isKeyDown(keys.KEY_W)) cam_move("y",  1);
        else if (keys.isKeyDown(keys.KEY_X)) cam_move("y", -1);
        else if (keys.isKeyDown(keys.KEY_P)) cam_move("z",  1);
        else if (keys.isKeyDown(keys.KEY_L)) cam_move("z", -1);
        else if (keys.isKeyDown(keys.KEY_ESCAPE)) Events.off(Events.TICK,  loop);
    }

    function cam_move( axis, val){
        switch (axis){
            case 'x':
                camera.position.x += val;
                break;
            case 'y':
                camera.position.y += val;
                break;
            case 'z':
                camera.position.z += val;
                break;
        }

        console.log('camera position: (x, y, z) = (' + camera.position.x + ',' + camera.position.y + ',' + camera.position.z + ')')
    }

    function onAddHorse(){
        // adding the horse --->
        for(var i = 0; i < 100; i++){
            horseMesh = new THREE.Mesh(horseGeometry, new THREE.MeshLambertMaterial({color: 0x999999, morphTargets: true})); //0x36140A
            horseMesh.scale.set( obj.rate, obj.rate, obj.rate);
            var rad = 150 + 100 * Math.random();
            var theta = Math.PI * 2 * Math.random();
            var velTheta = 0.1 / (Math.PI * 2 * rad);
            var aclTheta = 0.00002 / (Math.PI * 2 * rad);
            var rotation = Math.PI - theta;
            var curTime = parseInt(duration * Math.random());
            horseMesh.position.set(rad * Math.cos(theta), 0, rad * Math.sin(theta) );
            horseMesh.rotation.set( 0, rotation, 0 );
            scene.add( horseMesh );

            var horseData = {rad: rad, theta: theta, lastKeyframe: 0, curKeyframe: 0, curTime: curTime, MAX_VELOCITY_THETA: velTheta, currentVelocityTheta: 0, currentAclTheta: aclTheta, velStatus: false };

            //if(i == 0) console.log(horseData);

            horseDataCollection.push(horseData);
            horseMeshes.push(horseMesh);
        }

        // <--- adding the horse

        TweenLite.to(obj, 0.4, {rate:0.02, onUpdate: onAddHorseUpdate, onComplete: onAddHorseComplete });
    }

    function onAddHorseUpdate(){

        for(var i = 0; i < 100; i++){
            var num = 100 * horseCurCount + i;
            horseMeshes[num].scale.set( obj.rate, obj.rate, obj.rate );
        }

    }

    function onAddHorseComplete(){
        if(horseCurCount > 9 ){
            horseAnimationStatus = true;

        }else{
            horseCurCount++;
            obj.rate = 0.001;

            onAddHorse();
        }

    }

    function onYearCountUpdate(){
        var parseIntYear = parseInt(year.count);
        var yearString;
        if(parseIntYear < 0){
            yearString = "0000";
        }else if(parseIntYear < 10){
            yearString = "000" + parseIntYear;
        }else if(parseIntYear < 100){
            yearString = "00" + parseIntYear;
        }else if(parseIntYear < 1000){
            yearString = "0" + parseIntYear;
        }else{
            yearString = parseIntYear;
        }
        $yearText.html(yearString);

    }

    function onYearCountComplete(){
        $text.addClass("active");

        // --------------

        setTimeout(function(){
            $('body').addClass("pointer");
            $click.addClass('active')

            Events.on(Events.MOUSE_DOWN, onMouseDown);

        }, 2400);
    }


    function onMouseMove(data){
        var mouseX = data.mouse.x;
        var rate = (mouseX - windower.halfWidth) / windower.halfWidth;


        mouseMoveCameraMoveTarget = rate * 50000;

    }


});
