
var newEllipsoid = null;
var viewer = null;
var layerTable = {};
var isPaused = false;

$instructionsModal = $('#introContainer');
$appLoadingDiv = $('#appLoadingDiv');
$enterVrButton = $("#enterVrButton");
$cesiumContainer =   $('#cesiumContainer');

var bodies = undefined;
var currentBody = undefined;

var _isOrientationSupported = undefined;

var pathTimeLength = 60;

var appTime = "";
var sysTime = "";
var sysstartTime = Date.now();
var interval = setInterval(function() {
    var elapsedTime = Date.now() - sysstartTime;
    //document.getElementById("timer").innerHTML = (elapsedTime / 1000).toFixed(3);
    sysTime = (elapsedTime / 1000).toFixed(5);
}, 50);

var fullScreenFlag = false;
var configInitialized = false;

$(window).on('load', function() {
    //loadConfig(init);

});

window.onunload = function() {
    pauseAnimation();
};

(function ($) {


})(jQuery);

function init() {
    $appLoadingDiv.addClass('hidden');
    initViewer();
    setUpOrientationDetectionBeforeStart();
    checkScreenOrientationBeforeVrStarted();
}

function loadConfig(postFunction) {
    httpCall("config.json", function(result) {
        bodies = result;
        postFunction();
    });


}

function askForDevicePermission() {
    // feature detect
    // var self = this;
    // if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    //     try {
    //         permissionState = DeviceOrientationEvent.requestPermission();
    //
    //     } catch(err) {
    //         console.log(err);
    //     }
    //
    //     var permissionState = DeviceOrientationEvent.requestPermission();
    //
    //     if (permissionState === 'granted') {
    //         window.addEventListener('deviceorientation', new function() {});
    //         self.loadConfig(self.init);
    //     } else {
    //         alert("TrekVR requires device orientation tracking. TrekVR cannot run without this. ");
    //     }
    // } else {
    //     self.loadConfig(self.init);
    // }

    var self = this;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
            if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', () => {});
            self.loadConfig(self.init);
        } else {
            alert("TrekVR requires device orientation tracking. TrekVR cannot run without this. ");
        }
    }).catch(console.error);
    } else {
        self.loadConfig(self.init);
    }

}



function isOrientationSupported() {
    if (_isOrientationSupported == undefined)
        _isOrientationSupported = !isSafari();

    return _isOrientationSupported;
}

function isSafari() {
    var ua = navigator.userAgent.toLowerCase();
    //alert(ua);
    if (ua.indexOf('iphone') != -1) {
        return (ua.indexOf('safari') != -1);
    }
    return false;
}

function setUpOrientationDetectionBeforeStart(){
    if (isOrientationSupported()) {
        screen.orientation.addEventListener('change', checkScreenOrientationBeforeVrStarted);
    }
    else {
        window.addEventListener('orientationchange', checkScreenOrientationBeforeVrStarted);
        window.addEventListener("DeviceOrientationEvent", checkScreenOrientationBeforeVrStarted);
    }
}

function checkScreenOrientationBeforeVrStarted(){
    if(!isScreenLandscape())
        exitVR();
    else
        enterVR();
}

function isScreenLandscape(){
    if (isOrientationSupported())
        return screen.orientation.type.startsWith('landscape');
    else
        return isIOSScreenLandscape();  //for now.  need to be fixed.
}

function isIOSScreenLandscape() {
    switch(window.orientation) {
        case -90 || 90:
            return true;
        default:
            return false;
    }
}

function showInstructionsModal(){
    $instructionsModal.removeClass('hidden');
}

function hideInstructionsModal(){
    $instructionsModal.addClass('hidden');
}

function enterVR() {
    hideInstructionsModal();
    showCesiumWidget();
    setUpOrientationDetectionAfterStart();
    startFullScreen();
    startVRApplication();
}

function exitVR() {
    exitFullScreen();
    hideCesiumWidget();
    showInstructionsModal();
}

function getUrlParam(param) {
    location.search.substr(1).split("&").some(function(item) {
        return item.split("=")[0] == param && (param = item.split("=")[1]);
    });
    return param;
}

function removeOrientationDetectionBeforeStart(){
    if (isOrientationSupported())
        screen.orientation.removeEventListener('change', checkScreenOrientationBeforeVrStarted);
}

function setUpOrientationDetectionAfterStart(){
    if (isOrientationSupported())
        screen.orientation.addEventListener('change', checkScreenOrientationDuringRun);
}

function checkScreenOrientationDuringRun(){
    if(!isScreenLandscape()){
        askUserToUseLandscapeDuringRun();
    }
}

function askUserToUseLandscapeDuringRun(){
    hideCesiumWidget();

    var orientationChangeHandler = function() {
        if (!isScreenLandscape()) {
            return;
        }
        if (isOrientationSupported())
            screen.orientation.removeEventListener('change', orientationChangeHandler);
        hideOrientationModal();
        showCesiumWidget();
    };

    if (isOrientationSupported())
        screen.orientation.addEventListener('change', orientationChangeHandler);
}

function hideCesiumWidget(){
    $cesiumContainer.addClass('hidden');
}

function showCesiumWidget(){
    $cesiumContainer.removeClass('hidden');
}

function startFullScreen(){
    if ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {
            document.documentElement.requestFullScreen();
            fullScreenFlag = true;
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
            fullScreenFlag = true;
        } else if (document.documentElement.webkitRequestFullScreen) {
            //document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            document.documentElement.webkitRequestFullScreen();
            fullScreenFlag = true;
        }

    }
}

function exitFullScreen() {
    if (fullScreenFlag) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        fullScreenFlag = false;

    }
}

function startVRApplication(){
    console.log("START VR APP");
    var startTime = Date.now();
    var interval = setInterval(function() {
        var elapsedTime = Date.now() - startTime;
        //document.getElementById("timer").innerHTML = (elapsedTime / 1000).toFixed(3);
        appTime = (elapsedTime / 1000).toFixed(5);
    }, 50);

    setPath();
}

function initViewer() {

    //hack for Grand Canyon Trek

    httpCall("https://trek.nasa.gov/TrekServices/ws/CesiumTerrain/reload", function(result) {});


    //setting up VR Viewer
    viewer = new Cesium.Viewer('cesiumContainer', {
        infoBox: false,
        scene3DOnly: true,
        baseLayerPicker: false,
        imageryProvider: null,
        terrainProvider: null,
        navigationHelpButton: false,
        homeButton: false,
        geocoder: false,
        animation: false,
        fullscreenButton: false,
        timeline: true,
        vrButton : false
    });
    // Click the VR button in the bottom right of the screen to switch to VR mode.

    viewer.scene.globe.enableLighting = false;

    // viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    //     url : 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
    //     requestVertexNormals : true
    // });

    viewer.scene.globe.depthTestAgainstTerrain = true;

    var body = getParameterByName('body');
    var terrain = getParameterByName('terrain');
    var texturesRaw = getParameterByName('textures');
    var alphas = getParameterByName('alphas');
    var novr = getParameterByName('noVR');

    currentBody = getBody(body);

    if (novr == undefined)
        viewer.scene.useWebVR = true;

    //var startingPoint = getParameterByName('point');//Not used
    var path = getParameterByName('path');

    setBodyScene(body, terrain, texturesRaw, alphas);
    console.log("SSET BODY SCENE DONE", "APP:" + appTime + " / " + "SYS:" + sysTime);
    //createPath(path);

    setUpClickListeners();

    viewer.scene._creditContainer.style.visibility = "hidden";
}


function setUpClickListeners(){
    setUpLeftClickTogglePlay();
}

function setUpLeftClickTogglePlay(){
    //Disable Cesium Double Click
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK );

    var screenSpacehandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    screenSpacehandler.setInputAction( handleLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK );
}

function handleLeftClick(movement){
    if(isPaused){
        viewer.clock.shouldAnimate = true;
        isPaused = false;
    }
    else{
        viewer.clock.shouldAnimate = false;
        isPaused = true;
    }
}

function pauseAnimation() {
    viewer.clock.shouldAnimate = false;
    isPaused = true;
}


function setPath() {
    var body = getParameterByName('body');
    var path = getParameterByName('path');

    console.log("START SETUP PATH", "APP:" + appTime + " / " + "SYS:" + sysTime);
    setUpPath(path, body);

}

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return undefined;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function setBodyScene(body, terrain, texturesRaw, alphas) {
    if(!body){
        body = "mars";
        console.error("No Body Specified. Using Mars as default");
    }

    if (body === "earth") {
        newEllipsoid = new Cesium.Ellipsoid(6378137.0, 6378137.0, 6356752.3142451793);
        setTerrain(terrain);
        setTextureForEarth();
    } else {
        var skyAtmosphere = undefined;
        var hueShift = -1;

        newEllipsoid = new Cesium.Ellipsoid(currentBody.ellipsoidX, currentBody.ellipsoidY, currentBody.ellipsoidZ);
        changeFrame(newEllipsoid);
        setTerrain(terrain);

        if(body === "mars") {
            skyAtmosphere = new Cesium.SkyAtmosphere(newEllipsoid);
            hueShift = 0.5;
        }

        viewer.scene.skyAtmosphere = skyAtmosphere;
        if (hueShift > 0)
            viewer.scene.skyAtmosphere.hueShift = hueShift;

        viewer.scene.fog.enabled = false;

        viewer.scene.globe.lightingFadeInDistance = 1.4 * newEllipsoid.maximumRadius;
        viewer.scene.globe.lightingFadeOutDistance = 1.02 * newEllipsoid.maximumRadius;

        setTextures(texturesRaw, alphas);
    }
}

function getBody(body) {
    for (var i=0; i < bodies.length; i++) {
        if (bodies[i].name === body)
            return bodies[i];
    }

    return undefined;
}

function changeFrame(ellipsoid) {
    Cesium.Ellipsoid.WGS84 = Cesium.freezeObject(ellipsoid);
    var mapProjection = new Cesium.GeographicProjection(ellipsoid); // below, the toFixed(10) is because Cesium uses 10 decimal places for Earth
    var czm_getWgs84EllipsoidEC = 'czm_ellipsoid czm_getWgs84EllipsoidEC() \
            { \
                vec3 radii = vec3(' + Number(ellipsoid.radii.x).toFixed(10) + ', ' + Number(ellipsoid.radii.y).toFixed(10) + ', ' + Number(ellipsoid.radii.z).toFixed(10) + '); \
                vec3 inverseRadii = vec3(1.0 / radii.x, 1.0 / radii.y, 1.0 / radii.z); \
                vec3 inverseRadiiSquared = inverseRadii * inverseRadii; \
                czm_ellipsoid temp = czm_ellipsoid(czm_view[3].xyz, radii, inverseRadii, inverseRadiiSquared); \
                return temp; \
            }';
    var groundAtmosphereShader = Cesium._shaders['GroundAtmosphere'].replace(new RegExp('6378137.0', 'g'), Number(ellipsoid.minimumRadius).toFixed(10));

    viewer.scene.globe = new Cesium.Globe(ellipsoid);
    viewer.scene.globe.enableLighting = true; //document.getElementById("showlighting").checked;
    viewer.scene.globe.shadows = Cesium.ShadowMode.ENABLED;
    viewer.scene.globe.depthTestAgainstTerrain = true;

    viewer.scene._mapProjection = mapProjection;
    viewer.scene._frameState.mapProjection = mapProjection;
    viewer.camera._projection = mapProjection;

    // Change screenspacecontroller, otherwise mouse movement janky?
    viewer.scene.screenSpaceCameraController._maxCoord = mapProjection.project(new Cesium.Cartographic(Math.PI, Math.PI / 2.0));

    // Shader Replace
    Cesium.ShaderSource._czmBuiltinsAndUniforms['czm_getWgs84EllipsoidEC'] = czm_getWgs84EllipsoidEC; // This overrides the builtin which is used when DepthPlaneFS shader is recombined
    viewer.scene._depthPlane._command = undefined;
    viewer.scene._depthPlane._va = undefined;

    // Replace Atmosphere Shader
    viewer.scene.globe._surfaceShaderSet.baseVertexShaderSource = new Cesium.ShaderSource({
        sources: [groundAtmosphereShader, Cesium._shaders['GlobeVS']]
    });
}
// function changeFrame(ellipsoid) {
//     Cesium.Ellipsoid.WGS84 = Cesium.freezeObject(ellipsoid);
//     var mapProjection = new Cesium.GeographicProjection(ellipsoid); // below, the toFixed(10) is because Cesium uses 10 decimal places for Earth
//     var czm_getWgs84EllipsoidEC = 'czm_ellipsoid czm_getWgs84EllipsoidEC() ' +
//             '{ ' +
//                 'vec3 radii = vec3(' + Number(ellipsoid.radii.x).toFixed(10) + ', ' + Number(ellipsoid.radii.y).toFixed(10) + ', ' + Number(ellipsoid.radii.z).toFixed(10) + '); ' +
//                 'vec3 inverseRadii = vec3(1.0 / radii.x, 1.0 / radii.y, 1.0 / radii.z); ' +
//                 'vec3 inverseRadiiSquared = inverseRadii * inverseRadii; ' +
//                 'czm_ellipsoid temp = czm_ellipsoid(czm_view[3].xyz, radii, inverseRadii, inverseRadiiSquared); ' +
//                 'return temp; ' +
//             '}';
//     var groundAtmosphereShader = Cesium._shaders.GroundAtmosphere.replace(new RegExp('6378137.0', 'g'), Number(ellipsoid.minimumRadius).toFixed(10));
//
//     viewer.scene.imageryLayers.removeAll();
//     viewer.scene.terrainProvider = null;
//
//     viewer.scene.globe = new Cesium.Globe(ellipsoid);
//     viewer.scene.globe.enableLighting = false;
//     viewer.scene.globe.shadows = Cesium.ShadowMode.ENABLED;
//     viewer.scene.globe.depthTestAgainstTerrain = true;
//
//     viewer.scene._mapProjection = mapProjection;
//     viewer.scene._frameState.mapProjection = mapProjection;
//     viewer.camera._projection = mapProjection;
//
//     // Change screenspacecontroller, otherwise mouse movement janky?
//     viewer.scene.screenSpaceCameraController._maxCoord = mapProjection.project(new Cesium.Cartographic(Math.PI, Math.PI / 2.0));
//
//     // Shader Replace
//     Cesium.ShaderSource._czmBuiltinsAndUniforms.czm_getWgs84EllipsoidEC = czm_getWgs84EllipsoidEC; // This overrides the builtin which is used when DepthPlaneFS shader is recombined
//     viewer.scene._depthPlane._command = undefined;
//     viewer.scene._depthPlane._va = undefined;
//
//     // Replace Atmosphere Shader
//     viewer.scene.globe._surfaceShaderSet.baseVertexShaderSource = new Cesium.ShaderSource({
//         sources: [groundAtmosphereShader, Cesium._shaders.GlobeVS]
//     });
// }

function setTerrain(terrain){
    viewer.scene.terrainProvider = null;
    //set default terrain if not set.
    if (terrain == undefined || terrain == "" ){
        terrain = 'https://marshub.s3.amazonaws.com/mars_v7';
        console.error("No Terrain Specified. Using mars terrain default.", terrain);
    }

    var demProvider = new Cesium.CesiumTerrainProvider({
        url: terrain,
        ellipsoid: newEllipsoid
    });

    viewer.terrainProvider = demProvider;
    console.log("SET TERRAIN", "APP:" + appTime + " / " + "SYS:" + sysTime);
}

//this is just a temp workaround
function setTextureForEarth() {
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
        url: "https://wi.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{TileMatrix}/{TileRow}/{TileCol}",
        ellipsoid: newEllipsoid,
        maximumLevel: 18,
        format: 'image/jpeg',
        layer: "World_Imagery",
        style: "",
        tileMatrixSetID: "",
        tilingScheme: new Cesium.GeographicTilingScheme({ellipsoid: newEllipsoid})
    }));
}

function setTextures(texturesRaw, alphas){
    viewer.imageryLayers.removeAll();
    if (texturesRaw == undefined) {
        console.error("No Textures Sepecified. Using mars textures");

        viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
            url: "https://d1poygwgh8gv6r.cloudfront.net/catalog/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg",
            ellipsoid: newEllipsoid,
            maximumLevel: 9,
            format: 'image/jpeg',
            layer: "Mars_Viking_MDIM21_ClrMosaic_global_232m",
            style: "default",
            tileMatrixSetID: "default028mm",
            tilingScheme: new Cesium.GeographicTilingScheme({ellipsoid: newEllipsoid})
        }));
    } else {
        var textures = texturesRaw.split(",");
        alphas = alphas.split(",");

        for (var i = 0; i < textures.length; i++) {
            try {
                var layerId = textures[i].substring(textures[i].lastIndexOf("/")+1, textures[i].length);
                var params = {endpoint: textures[i], alpha: alphas[i] };
                layerTable[layerId] = params;

                var wmtsCapabilitiesURL = textures[i] + "/1.0.0/WMTSCapabilities.xml";
                httpCall(wmtsCapabilitiesURL, function(result) {
                    console.log("WMTS DONE", "APP:" + appTime + " / " + "SYS:" + sysTime);
                    //assuming we are only getting the WMTS from Trek Services which is one service one layer.
                    var layerId = result.getElementsByTagName("ows:Title")[0].childNodes[0].nodeValue;
                    var format = result.getElementsByTagName("Format")[0].childNodes[0].nodeValue;

                    var provider = createTextureProvider(layerTable[layerId].endpoint, undefined, format);
                    provider.defaultAlpha = Number(layerTable[layerId].alpha);
                    viewer.imageryLayers.addImageryProvider(provider);
                });

            } catch (e) {
                console.error(e);
                continue;
            }

        }
    }
}

function createTextureProvider(endpoint, defaultLayer, format) {
    if (defaultLayer == undefined) {
        defaultLayer = endpoint.substring(endpoint.lastIndexOf("/")+1, endpoint.length);
    }

    // this WMTS client requires the URL to be in this format.  the problem with this is that we need to read WMTS getcapability to see
    // if the tiles are in jpg or png.
    // hardcodding .jpg for now to make this sample work.

    var endpointString = "/1.0.0//{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg";
    if (format !== "image/jpeg" && format !== "image/jpg")
        endpointString = "/1.0.0//{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png";

    var provider = new Cesium.WebMapTileServiceImageryProvider({
        url: endpoint + endpointString,
        format: format,
        layer: defaultLayer,
        style: 'default',
        tileMatrixSetID: 'default028mm',
        ellipsoid: newEllipsoid,
        tilingScheme: new Cesium.GeographicTilingScheme({ellipsoid: newEllipsoid})
    });
    return provider;
}

function setUpPath(trekPath, body){
    console.log("SETUPPATH METH", "APP:" + appTime + " / " + "SYS:" + sysTime);
    if(trekPath){
        getElevationAndShowPath(trekPath, body);
    }
}

function getElevationAndShowPath(trekPath, body){
    trekPath = conformTrekPath(trekPath);
    getElevationsThenCreatePath(trekPath, body);
}

function conformTrekPath(trekPath){
    trekPath = convertStringsIntoNumbers(trekPath.split(","));
    trekPath = removeLastRepeat(trekPath);
    trekPath = splitPath(trekPath);

    return trekPath;
}

function convertStringsIntoNumbers(strings){
    var numbers = [];
    for(var i = 0; i < strings.length; i++){
        numbers.push(Number(strings[i]));
    }
    return numbers;
}

function removeLastRepeat(trekPath){
    var lastLat = trekPath[trekPath.length-2];
    var lastLon = trekPath[trekPath.length-1];

    var secondToLastLat = trekPath[trekPath.length-4];
    var secondToLastLon = trekPath[trekPath.length-3];

    if(lastLat == secondToLastLat && lastLon == secondToLastLon){
        trekPath.pop();
        trekPath.pop();
    }

    return trekPath;
}

function splitPath(trekPath){
    return trekPath;
}

function getElevationsThenCreatePath(trekPath, body){
    console.log("GETELEVTHENCREATEPATH METH", "APP:" + appTime + " / " + "SYS:" + sysTime);
    var elevationUrl = createElevationProfileUrl(trekPath, body);
    //var elevationUrl = "testPath.json";


    $.ajax({
        type: "GET",
        url: elevationUrl,
        dataType: 'json',
        success: function(elevationJson){
            console.log("END ELEVATION CALL", "APP:" + appTime + " / " + "SYS:" + sysTime);

            if (currentBody.demFromZero)
                transformElevationVaue(elevationJson, -1 * currentBody.ellipsoidX);

            /* workaround for Vesta */
            // if (body === "vesta")
            //     transformElevationVaue(elevationJson, -255000);
            createPathThenInterpolate(elevationJson, body);
            setTimeout(function(){
                viewer.clock.shouldAnimate = true;
                isPaused = false;
            }, 5000);
        }
    });
}

function transformElevationVaue(elevationJson, offset) {
    var jsonPoints = elevationJson.line;

    for(var i = 0; i < jsonPoints.length; i++){
        jsonPoints[i].elevation = jsonPoints[i].elevation + offset;
    }
}

function createElevationProfileUrl(trekPath, body){
    var numberOfPoints = 100;
    console.log("BODY", body);
    var radiusInMeters = currentBody.radius;
    var urlSuffix = currentBody.urlSuffix;
    var pointsArrayString = "[";
    for(var i = 0; i < trekPath.length; i += 2) {
        var lat = trekPath[i];
        var lon = trekPath[i + 1];

        if(i === 0){
            pointsArrayString += "[" + lon + "," + lat + "]";
        }
        else{
            pointsArrayString += ",[" + lon + "," + lat + "]";
        }
    }
    pointsArrayString += "]";

    var url = urlSuffix + encodeURI(pointsArrayString);

    url += encodeURI("&numberOfPoints=" + numberOfPoints);
    url += encodeURI("&radiusInMeters=" + radiusInMeters);
    console.log("ELEVATION URL", url);

    return url;
}

function createPathThenInterpolate(elevationJson, body){
    console.log("CREATEPATHTHENINTERPOLATE METH", "APP:" + appTime + " / " + "SYS:" + sysTime);
    var jsonPoints = elevationJson.line;
    console.log("ELEVATION JSON", elevationJson);

    var maxHeight = Number.NEGATIVE_INFINITY;
    for(var i = 0; i < jsonPoints.length; i++){
        if(jsonPoints[i].elevation > maxHeight){
            maxHeight = jsonPoints[i].elevation;
        }
    }
    console.log("MAX HEIGHT", maxHeight);

    var distance = elevationJson.totalDistance;
    console.log("DISTANCE", distance);

    var aboveTheSurface = distance / 100;
    if (aboveTheSurface < 1000) {
        aboveTheSurface = aboveTheSurface + 1000;
    }
    var distanceMultiplier = currentBody.distanceMultiplier;
    var distanceMultiplied = distance * distanceMultiplier;
    console.log("Multiplied Distance", distanceMultiplied);

    var altitude = maxHeight + distanceMultiplied;
    console.log("ALTITUDE", altitude);

    var points = [];
    for(var i = 0; i < jsonPoints.length; i++){
        //alt = max + x
        //x =  dist * c

        var lon = jsonPoints[i].x;
        var lat = jsonPoints[i].y;

        var surfaceCartographicZero = Cesium.Cartographic.fromDegrees(lon, lat, 0, new Cesium.Cartographic());
        var surfaceCartographicPoint = new Cesium.Cartographic(surfaceCartographicZero.longitude, surfaceCartographicZero.latitude, jsonPoints[i].elevation + aboveTheSurface);
        var surfaceCartesianPoint = newEllipsoid.cartographicToCartesian(surfaceCartographicPoint, new Cesium.Cartesian3());

        var endPointColor = Cesium.Color.TOMATO;
        var startPointColor = Cesium.Color.CHARTREUSE;
        var floorPointColor = Cesium.Color.YELLOW.withAlpha(0.5, new Cesium.Color());
        if(i === 0){
            viewer.entities.add({
                position : surfaceCartesianPoint,
                point : {
                    pixelSize : 20,
                    color: startPointColor
                },
                label : {
                    text : 'Start',
                    font : '30px sans-serif',
                    showBackground : false,
                    horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
                    pixelOffset : new Cesium.Cartesian2(0.0, -15),
                    pixelOffsetScaleByDistance : new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                    fillColor : startPointColor,
                    outlineColor : startPointColor,
                    outlineWidth : 1,
                    style : Cesium.LabelStyle.FILL_AND_OUTLINE
                }
            });
        }
        else if(i === jsonPoints.length - 1){
            viewer.entities.add({
                position : surfaceCartesianPoint,
                point : {
                    pixelSize : 20,
                    color: endPointColor
                },
                label : {
                    text : 'End',
                    font : '30px sans-serif',
                    showBackground : false,
                    horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
                    pixelOffset : new Cesium.Cartesian2(0.0, -15),
                    pixelOffsetScaleByDistance : new Cesium.NearFarScalar(1.5e2, 3.0, 1.5e7, 0.5),
                    fillColor : endPointColor,
                    outlineColor : endPointColor,
                    outlineWidth : 1,
                    style : Cesium.LabelStyle.FILL_AND_OUTLINE
                }
            });
        }
        else{

            viewer.entities.add({
                position : surfaceCartesianPoint,
                point : {
                    pixelSize : 4,
                    color: floorPointColor
                }
            });
        }




        var altitudeCartographicZero = Cesium.Cartographic.fromDegrees(lon, lat, 0, new Cesium.Cartographic());
        var altitudeCartographicPoint = new Cesium.Cartographic(altitudeCartographicZero.longitude, altitudeCartographicZero.latitude, altitude);
        var altitudeCartesianPoint = newEllipsoid.cartographicToCartesian(altitudeCartographicPoint, new Cesium.Cartesian3());

        viewer.entities.add({
            position : altitudeCartesianPoint
            // ,
            // point : {
            //     pixelSize : 5,
            //     color : Cesium.Color.TRANSPARENT,
            //     outlineColor: Cesium.Color.YELLOW,
            //     outlineWidth : 2
            // }
        });

        points.push(altitudeCartesianPoint);
    }

    interpolate(points);


}

function calculateElevation(heighestElevation, elevationMultiplier){
    if(heighestElevation < 0){
        return heighestElevation + (heighestElevation * (-1 * elevationMultiplier));
    }
    else{
        return heighestElevation - (heighestElevation * elevationMultiplier);
    }
}

function interpolate(points){
    console.log("INTERPOLATE METH", "APP:" + appTime + " / " + "SYS:" + sysTime);
    //viewer.clock.shouldAnimate = false;

    var start = Cesium.JulianDate.fromDate(new Date());
    var stop = Cesium.JulianDate.addSeconds(start, pathTimeLength, new Cesium.JulianDate());

    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 1.0;

    //Set timeline to simulation bounds
    viewer.timeline.zoomTo(start, stop);

    //var modelURI = 'CesiumBalloon.glb';
    var positions = computeFlightPath(start,points);
    console.log("GET POSITIONS", "APP:" + appTime + " / " + "SYS:" + sysTime);
    var modelURI = 'Cesium_Air.glb';
    var entity = viewer.entities.add({
        availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
            start : start,
            stop : stop
        })]),
        //position : computeCirclularFlight(longitude, latitude, radius, start),
        position : positions,
        // ,
        //model : {
        //     uri : modelURI,
        //     minimumPixelSize : 64//,
        //color: new Cesium.Color(0, 0, 0, 0)
        // },
        // //Show the path as a pink line sampled in 1 second increments.
        path : {
            resolution : 1,
            // material : new Cesium.PolylineGlowMaterialProperty({
            //     glowPower : 0.1,
            //     color : Cesium.Color.YELLOW
            // }),
            width : 0
        }
    });
    console.log("ENTITY ADDED", "APP:" + appTime + " / " + "SYS:" + sysTime);

    entity.position.setInterpolationOptions({
        interpolationDegree : 2,
        interpolationAlgorithm : Cesium.HermitePolynomialApproximation
        //interpolationAlgorithm : Cesium.LagrangePolynomialApproximation
    });
    console.log("ENITTY INTERPOLATION OPT", "APP:" + appTime + " / " + "SYS:" + sysTime);

    var position1 = getPositionAtSeconds(0, positions);
    var position2 = getPositionAtSeconds(10, positions);

    console.log("position1", position1);
    console.log("position2", position2);

    var vector1To2 = getVectorFromPosition1ToPosition2(position1, position2);
    var vector1To2Normalized = normalizeVector(vector1To2);
    console.log("Vector1To2Normalized", vector1To2Normalized);

    console.log("VECTOR CREATED", "APP:" + appTime + " / " + "SYS:" + sysTime);

    // viewer.entities.add({
    //     position : position1,
    //      point : {
    //          pixelSize : 10,
    //          color : Cesium.Color.WHITE,
    //          outlineWidth : 0
    //      }
    // });
    //
    // viewer.entities.add({
    //     position : position2,
    //      point : {
    //          pixelSize : 10,
    //          color : Cesium.Color.WHITE,
    //          outlineWidth : 0
    //      }
    // });

    // Set initial camera position and orientation to be when in the model's reference frame.
    var camera = viewer.camera;
    camera.position = new Cesium.Cartesian3(0.25, 0.25, 0.0);
    camera.direction = new Cesium.Cartesian3(vector1To2Normalized.x + camera.position.x, -1 * (vector1To2Normalized.y + camera.position.y), 0.0);
    camera.up = new Cesium.Cartesian3(0.0, 0.0, 1.0);
    camera.right = new Cesium.Cartesian3(0.0, -1.0, 0.0);

    var firstTime = true;
    var orientationReady = false;

    setTimeout(function() {
        orientationReady = true;
    }, 2000);

    viewer.scene.preRender.addEventListener(function(scene, time) {
        // if (viewer.scene._deviceOrientationCameraController._gamma != undefined)
        //     orientationReady = true;
        //
        // if (!orientationReady)
        //     return;

        if(firstTime){
            firstTime= false;
            console.log("FIRST PRERENDER", "APP:" + appTime + " / " + "SYS:" + sysTime);
            var CC3=Cesium.Cartesian3;
            var startPos1 = getPositionAtSeconds(0, positions);
            var startPos2 = getPositionAtSeconds(10, positions);

            //velocity in terms of Earth Fixed
            var Wvelocity = CC3.subtract(startPos2, startPos1, new CC3());
            CC3.normalize(Wvelocity, Wvelocity);
            var Wup = new CC3();var Weast = new CC3();var Wnorth = new CC3();
            Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(startPos1, Wup);
            CC3.cross({x:0,y:0,z:1},Wup,Weast);
            CC3.cross(Wup,Weast,Wnorth);

            //velocity in terms of local ENU
            var Lvelocity=new CC3();
            Lvelocity.x=CC3.dot(Wvelocity,Weast);
            Lvelocity.y=CC3.dot(Wvelocity,Wnorth);
            Lvelocity.z=CC3.dot(Wvelocity,Wup);

            //angle of travel
            var Lup = new CC3(0,0,1);var Least = new CC3(1,0,0);var Lnorth = new CC3(0,1,0);
            var x = CC3.dot(Lvelocity,Least);
            var y = CC3.dot(Lvelocity,Lnorth);
            var z = CC3.dot(Lvelocity,Lup);
            var angle = Math.atan2(x,y);//math: y b4 x, heading: x b4 y
            var pitch = Math.asin(z);//make sure Lvelocity is unitized

            //angles offsets
            var cameraPitch = 90;
            if (viewer.scene._deviceOrientationCameraController != undefined && viewer.scene._deviceOrientationCameraController._gamma != undefined)
            //if (viewer.scene._deviceOrientationCameraController._gamma != undefined)
                cameraPitch = Cesium.Math.toDegrees(viewer.scene._deviceOrientationCameraController._gamma);

            if (cameraPitch > 0)
                cameraPitch = cameraPitch - 90;
            else
                cameraPitch = 90 + cameraPitch;

            angle+=0/180*Math.PI;
            pitch+=(cameraPitch-20)/180*Math.PI;

            //var range = 80;
            var range = 1;
            var offset = new Cesium.HeadingPitchRange(angle, pitch, range);
            viewer.scene.camera.lookAt(entity.position.getValue(time), offset);

            if (viewer.scene._deviceOrientationCameraController)
                viewer.scene._deviceOrientationCameraController.enableVRControl();
        }
        else{
            var position = entity.position.getValue(time);
            if (!Cesium.defined(position)) {
                return;
            }

            var transform;
            if (!Cesium.defined(entity.orientation)) {
                transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
            } else {
                var orientation = entity.orientation.getValue(time);
                if (!Cesium.defined(orientation)) {
                    return;
                }

                transform = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(orientation), position);
            }

            // Save camera state
            var offset = Cesium.Cartesian3.clone(camera.position);
            var direction = Cesium.Cartesian3.clone(camera.direction);
            var up = Cesium.Cartesian3.clone(camera.up);

            // Set camera to be in model's reference frame.
            camera.lookAtTransform(transform);

            // Reset the camera state to the saved state so it appears fixed in the model's frame.
            Cesium.Cartesian3.clone(offset, camera.position);
            Cesium.Cartesian3.clone(direction, camera.direction);
            Cesium.Cartesian3.clone(up, camera.up);
            Cesium.Cartesian3.cross(direction, up, camera.right);
        }


    });



    // viewer.scene.primitives.add(new Cesium.DebugModelMatrixPrimitive({
    //     modelMatrix : viewer.camera.transform,
    //     length : 100000.0
    // }));

    //setTimeout(function(){

    // var center = viewer.entities._entities._array[0].position._value;
    // var transform = Cesium.Transforms.eastNorthUpToFixedFrame(center, newEllipsoid);
    //
    // // View in east-north-up frame
    // var camera = viewer.camera;
    // camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
    // camera.lookAtTransform(transform, new Cesium.Cartesian3(-120000.0, -120000.0, 120000.0));


    // Show reference frame.  Not required.


    // var center = new Cesium.Cartesian3(points[0].x, points[0].y);
    // var transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
    // var camera = viewer.camera;
    // camera.constrainedAxis = Cesium.Cartesian3.UNIT_Y;
    // camera.lookAtTransform(transform, new Cesium.Cartesian3(2, 0.0, 0.0));

    /*
    setTimeout(function(){
      viewer.camera.zoomIn(25);
    }, 1000);
    */
    // }, 2000);

}

function computeFlightPath(start, points){
    console.log("COMPUTE FLIGHT PATH METH", "APP:" + appTime + " / " + "SYS:" + sysTime);
    var sampledPositions = new Cesium.SampledPositionProperty();
    var stopTime = pathTimeLength;
    var timeIncrement = stopTime / points.length;

    for(var i = 0; i < points.length; i++){
        var time = null;
        if(i === 0){
            time =  Cesium.JulianDate.addSeconds(start, 0, new Cesium.JulianDate());
        }
        else{
            start = Cesium.JulianDate.addSeconds(start, timeIncrement, new Cesium.JulianDate());
            time = start;
        }

        //console.log("POINTS", points[i]);
        viewer.entities.add({
            position : points[i]
            // ,
            //  point : {
            //      pixelSize : 10,
            //      color : Cesium.Color.BLUE,
            //      outlineWidth : 0
            //  }
        });

        sampledPositions.addSample(time, points[i]);
    }

    return sampledPositions;
}

function getVectorFromPosition1ToPosition2(position1, position2){
    var vector1To2 = {
        "x": position2.x - position1.x,
        "y": position2.y - position1.y,
        "z": position2.z - position1.z
    };
    console.log("vector1To2", vector1To2);
    return vector1To2;
}

function normalizeVector(vector){
    var magnitude = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y) + (vector.z * vector.z));
    var normalizedVector = {
        "x": vector.x / magnitude,
        "y": vector.y / magnitude,
        "z": vector.z / magnitude
    };
    return normalizedVector;
}

function areCartesianPointsEqual(cartesianPoint1, cartesianPoint2){
    if(cartesianPoint1.x === cartesianPoint2.x &&
        cartesianPoint1.y === cartesianPoint2.y &&
        cartesianPoint1.z === cartesianPoint2.z){
        return true;
    }
    else{
        return false;
    }
}

function getNextDifferentPositionFromEntity(startPosition, positions){
    var seconds = 2;

    var positionAtSeconds = getPositionAtSeconds(seconds, positions);
    console.log("POS AT SEC " + seconds, positionAtSeconds);
    console.log("POS1 === POS2", areCartesianPointsEqual(startPosition, positionAtSeconds));
    while(areCartesianPointsEqual(startPosition, positionAtSeconds)){
        seconds++;
        positionAtSeconds = getPositionAtSeconds(seconds, positions);
        console.log("POS AT SEC " + seconds, positionAtSeconds);
        console.log("POS1 === POS2", areCartesianPointsEqual(startPosition, positionAtSeconds));
    }

    return positionAtSeconds;
}

function getPositionAtSeconds(seconds, positions){
    var position = positions.getValue(Cesium.JulianDate.addSeconds(viewer.clock.currentTime, seconds, new Cesium.JulianDate(), new Cesium.Cartesian3()));
    return position;
}

function httpCall(url, resultFunction) {
    var testing = "testing";
    $.ajax({
        type: "GET",
        url: url,
        success: function(result){
            resultFunction(result);
        }
    });
}
