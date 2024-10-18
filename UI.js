/**
 * UI is for the 3D view.
 * See GUI.
 * @type {{init}}
 */
var UI = ( function() {

    var deltaRotate = Math.PI / 360;
    var deltaTranslate = 10;
    //var deltaFovy = 0.05;
    var deltaZoom = 3;

    var stopAutoRotateCameraFkt = undefined;

    var mouse = {
        pageX : 0,
        pageY : 0,
        isDown : false,
        minPixelMove : 3
    };

    function init() {
        initEventHandler();
    }

    function reset() {
        mouse.isDown = false;
    }

    function initEventHandler() {
        var canvas = document.getElementById('canvas');

        canvas.addEventListener("mousedown", onmousedown, false);
        canvas.addEventListener("onmouseup", onmouseup, false);
        // Use document to detect mouse move outside canvas.
        // This works the same as no other element handles mouse events.
        canvas.addEventListener("onmousemove", onmousemove, false);
        canvas.addEventListener("onmousewheel", onmousewheel, false);
        canvas.addEventListener("mouseleave", onmouseleave, false);
        canvas.addEventListener("mouseenter", onmouseenter, false);
        //window.
    }

    onmouseleave = function(evt) {
        //console.log("onmouseleave" + evt);
        reset();
    };

    onmouseenter = function(evt) {
        //console.log("onmouseenter" + evt);
        reset();
    };

    onmousewheel = function(evt) {
        if(mouse.isDown) return;
        //if(! /^canvas/.test(evt.target)) return;
        //var target =  event.target.id.toString();
        if(evt.target.id.search(/canvas/)) return;
        evt.stopPropagation();
        evt.preventDefault();
        const zoomSpeed = 2;
        var delta = Math.max(-1, Math.min(1, (evt.wheelDelta || -evt.detail)));
        Vis.camera.addZoom(zoomSpeed * delta * deltaZoom);
        Vis.update();
    };

    onmousedown = function(evt){
        //console.log("onmousedown" + evt);
        mouse.isDown = true;
        mouse.whichButtonDown = evt.which;
        mouse.pageX = evt.pageX;
        mouse.pageY = evt.pageY;
    };

    onmouseup = function(evt){
        //console.log("onmouseup" + evt);
        mouse.isDown = false;
    };

    onmousemove = function(evt){
        //console.log("onmousemove" + evt);
        if(!mouse.isDown) return;
        var dx = evt.pageX - mouse.pageX;
        var dy = evt.pageY - mouse.pageY;
        //console.log(dx + ", " + dy);
        // Ignore small moves.
        if(Math.abs(dx) < mouse.minPixelMove &&
            Math.abs(dy) < mouse.minPixelMove) return;
        //console.log("do: "+dx + ", " + dy);
        mouse.pageX = evt.pageX;
        mouse.pageY = evt.pageY;

        switch(mouse.whichButtonDown) {
            case(1): //left button
                Vis.camera.addYaw(dx * deltaRotate);
                Vis.camera.addPitch(dy * deltaRotate);
                break;
            case(2): // middle button
                Vis.camera.moveEye(0, -dx * deltaTranslate, dy * deltaTranslate);
                break;
            default: return;
        }
        Vis.update();
    };


    window.onkeydown = function(evt) {
        var key = evt.which ? evt.which : evt.keyCode;
        var c = String.fromCharCode(key);
        //console.log(evt);
        // Use shift key to change sign.
        var sign = evt.shiftKey ? -1 : 1;

        // Translate Model.
        switch(c) {
            case('X'):
                Vis.camera.moveEye(deltaTranslate,0,0);
                break;
            case('Y'):
                Vis.camera.moveEye(-deltaTranslate,0,0);
                break;
            case('D'):
                Vis.camera.moveEye(0,deltaTranslate,0);
                break;
            case('A'):
                Vis.camera.moveEye(0,-deltaTranslate,0);
                break;
            case('W'):
                Vis.camera.moveEye(0,0,deltaTranslate);
                break;
            case('S'):
                Vis.camera.moveEye(0,0,-deltaTranslate);
                break;
        }
        // Zoom in an out.
        switch(c) {
            case('Z'):
                Vis.camera.addZoom(sign * deltaZoom);
                break;
            case('I'):
                Vis.camera.addZoom(deltaZoom);
                break;
            case('O'):
                Vis.camera.addZoom(-deltaZoom);
                break;
            case('U'):
                Vis.camera.addZoom(-deltaZoom);
                break;
        }
        // Change projection of scene.
        switch(c) {
            case('R'):
                Vis.camera.setProjection("ortho");
                break;
            case('F'):
                Vis.camera.setProjection("frustum");
                break;
            case('P'):
                Vis.camera.setProjection("perspective");
                break;
        }
        Vis.update();
    };

    function autoRotateCamera(doVisUpdate, stepDelay, deltaX, deltaY){
        if(doVisUpdate === undefined) doVisUpdate = true;
        if(stepDelay === undefined || stepDelay === 0) stepDelay = 50;
        if(deltaX === undefined || deltaX === 0) deltaX = 3;
        if(deltaY === undefined || deltaY === 0) deltaY = 4;
        var stepFkt = function() {
            Vis.camera.addYaw(deltaX * deltaRotate);
            Vis.camera.addPitch(deltaY * deltaRotate);
            if(doVisUpdate) Vis.update();
        };
        var id = setInterval( stepFkt, stepDelay );
        stopAutoRotateCameraFkt = function() { clearInterval(id); }
    }

    function stopAutoRotateCamera(){
        if(stopAutoRotateCameraFkt !== undefined) {
            stopAutoRotateCameraFkt();
        }
        stopAutoRotateCameraFkt = undefined;
    }


    // Interface.
    return {
        init : init,
        autoRotateCamera : autoRotateCamera,
        stopAutoRotateCamera : stopAutoRotateCamera
    }

}());
