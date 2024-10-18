var Vis = ( function () {

    var gl;

    // The shader program object is also used to
    // store attribute and uniform locations.
    var prog;

    // Create and initialize Model-View-Matrix.
    var mvMatrix = mat4.create();
    var mvMatrixIsUpToDate = false;

    // RGB.
    const clearColor = [255,255,255];//[245,245,245];//[250,250,250];//[0,0,255];///[68,185,243];

    /**
     * Model is all neuron data, it may refer to the selected neurons later.
     */
    var model = ( function() {

        // Set default Transformation Vectors.
        var translate = vec3.fromValues(0,0,0);
        var rotate = vec3.create();
        var scale = vec3.fromValues(1,1,1);

        // Create and initialize Model-Matrix.
        var mMatrix = mat4.create();
        var mMatrixIsUpToDate = false;

        function init(){
            calcModelMatrix();
        }

        /**
         * Update model matrix from transformation vectors.
         */
        function calcModelMatrix() {
            if(mMatrixIsUpToDate) return;
            mMatrixIsUpToDate = true;
            mvMatrixIsUpToDate = false;

            // Reset matrices to identity.
            mat4.identity(mMatrix);

            // Translate.
            mat4.translate(mMatrix, mMatrix, translate);
            // Rotate.
            mat4.rotateX(mMatrix, mMatrix, rotate[0]);
            mat4.rotateY(mMatrix, mMatrix, rotate[1]);
            mat4.rotateZ(mMatrix, mMatrix, rotate[2]);
            // Scale
            mat4.scale(mMatrix, mMatrix, scale);
        }

        /**
         * @param t : vec3 or Array
         * @param r : vec3 or Array
         * @param s : vec3 or Array
         */
        function addTransformation(t,r,s) {
            mMatrixIsUpToDate = false;
            vec3.add(translate, translate, t);
            vec3.add(rotate, rotate, r);
            vec3.add(scale, scale, s);
            calcModelMatrix();
        }

        function translate(x,y,z){
            mMatrixIsUpToDate = false;
            translate[0] += x;
            translate[1] += y;
            translate[2] += z;
        }

        return {
            init : init,
            calcModelMatrix : calcModelMatrix,
            addTransformation : addTransformation,
            translate : translate,
            mMatrix : mMatrix
        };
    }());


    var camera = ( function() {

        // Initial position of the camera.
        var eye; // see init = vec3.fromValues(0,0,1);
        // Point to look at.
        var center = vec3.create(); // see init = vec3.fromValues(0,0,0);
        var up = vec3.fromValues(0,1,0);
        // Forward: center = eye + forward.
        var forward = vec3.fromValues(0,0,-1);
        // right = forward x up.
        var right = vec3.fromValues(0,1,0);
        // Yaw and pitch (no roll) of the camera.
        var yaw = - Math.PI / 2.0;
        var pitch = 0;
        // Opening angle given in radian.
        // radian = degree*2*PI/360.
        var fovy = 60.0 * Math.PI / 180;
        // Camera near plane dimensions:
        // value for left right top bottom in projection.
        var near; // see init = { l:0, r:50, t:50, b:0, d:-1000};
        // Distance of the far clipping plane.
        var far = 1000;
        // How much space has a point on the near plane.
        // Assuming square pixel and points.
        var sizeOfPointInPixel;
        // Aspect ratio from canvas.
        var aspect;
        // Projection types: ortho, perspective, frustum.
        var projectionType = "ortho";
        // View matrix.
        var vMatrix = mat4.create();
        var vMatrixIsUpToDate = false;
        // Projection matrix.
        var pMatrix = mat4.create();
        var pMatrixIsUpToDate = false;

        function init() {
            var w = gl.viewportWidth;
            var h = gl.viewportHeight;
            var w2 = w/2;
            var h2 = h/2;

            // Look-at camera.
            //center = vec3.fromValues(w2,h2,0);
            eye = vec3.fromValues(w2,h2,0);

            // Perspective.
            // Cells should be rectangular.
            // Set projection aspect ratio.
            aspect = w / h;
            //var lrtb = w/4;
            //near = { l:0-lrtb, r:lrtb, t:lrtb, b:0-lrtb, d:-1000};
            near = { l:-w2, r:w2, t:h2, b:-h2, d:-1000};

            calcProjectionMatrix();
            calcViewMatrix();
        }

        /**
         * Set projection according to defaults in camera.
         */
        function calcProjectionMatrix() {
            if(pMatrixIsUpToDate) return;
            pMatrixIsUpToDate = true;
            // Set projection Matrix.
            var n = near;
            switch (projectionType) {
                case("ortho"):
                    mat4.ortho(pMatrix, n.l, n.r, n.b, n.t, n.d, far);
                    break;
                case("frustum"):
                    mat4.frustum(pMatrix, n.l, n.r, n.t, n.b, n.d, far);
                    break;
                case("perspective"):
                    mat4.perspective(pMatrix, fovy, aspect, 1, 10);
                    break;
                default: {
                    console.error("no valid projection.");
                }
            }
            // Set projection uniform from matrix values.
            gl.uniformMatrix4fv(prog.pMatrixUniform, false, pMatrix);

            sizeOfPointInPixel = Math.ceil(gl.viewportWidth/(n.r - n.l));
            gl.uniform1f(prog.pointSizeUniform, sizeOfPointInPixel);
        }

        /**
         * Set view matrix depending on camera vectors.
         */
        function calcViewMatrix() {
            if(vMatrixIsUpToDate) return;
            vMatrixIsUpToDate = true;
            mvMatrixIsUpToDate = false;

            // Assume that forward direction was modified.
            //forward[0] = Math.cos(pitch) * Math.cos(yaw);
            //forward[1] = Math.sin(pitch);
            //forward[2] = Math.cos(pitch) * Math.sin(yaw);

            vec3.add(center, eye, forward);

            // Gram–Schmidt_process,
            // assume forward, up and right were orthogonal.
            var tmpVec = vec3.create;
            // Correct up.
            var projUp = vec3.dot(forward, up);
            vec3.scale(tmpVec, forward, projUp);
            vec3.sub(up, up, tmpVec);
            vec3.normalize(up, up);
            // Calc right new instead of correcting.
            vec3.cross(right, forward, up);

            mat4.lookAt(vMatrix, eye, center, up);
        }

        /**
         * Update model matrix from transformation vectors.
         */
        function setProjection(type) {
            pMatrixIsUpToDate = false;
            projectionType = type;
        }

        function addNear(val){
            pMatrixIsUpToDate = false;
            const min = 10; // Half pixel of frustum.
            var roundFkt;
            if(val < 0 ) {
                roundFkt = Math.ceil;
            } else {
                roundFkt = Math.floor;
            }
            var scale = 1-val/100;
            near.r = Math.max(min, roundFkt(near.r * scale));
            near.l = - near.r;
            near.t = Math.max(min, roundFkt(near.t * scale));
            near.b = - near.t;
        }

        /**
         * Zoom independent of the current perspective.
         * @param val : number percentage
         */
        function addZoom(val) {
            pMatrixIsUpToDate = false;
            addNear(val);
        }

        /**
         * Update view matrix from transformation vectors (eye, center, up).
         *
         * @param e : vec3 or Array
         * @param c : vec3 or Array
         * @param u : vec3 or Array
         */

        function setView(e,c,u) {
            vMatrixIsUpToDate = false;
            vec3.add(eye, eye, e);
            vec3.add(center, center, c);
            vec3.add(up, up, u);
        }

        function addPitch( val ) {
            vMatrixIsUpToDate = false;

            // Add some up to forward.
            var s = Math.tan(val);
            var tmpVec = vec3.create;
            vec3.scale(tmpVec, up, s);
            vec3.add(tmpVec, forward, tmpVec);
            // Correct up.
            vec3.scale(forward, forward, -s);
            vec3.add(up, up, forward);
            vec3.normalize(up, up);

            vec3.copy(forward, tmpVec);
            vec3.normalize(forward, forward);

            // We could calculate a new pitch from forward.
            //pitch += val;
        }

        function addYaw( val ) {
            vMatrixIsUpToDate = false;

            // Add some right to forward.
            var s = Math.tan(val);
            var tmpVec = vec3.create;
            vec3.scale(tmpVec, right, s);
            vec3.add(tmpVec, forward, tmpVec);
            // Correct right.
            vec3.scale(forward, forward, -s);
            vec3.add(right, right, forward);
            vec3.normalize(right,right);

            vec3.copy(forward, tmpVec);
            vec3.normalize(forward, forward);

            // We could calculate a new yaw from forward.
            //yaw += val;
        }

        function moveEye(f,r,u){
            vMatrixIsUpToDate = false;
            var tmpVec = vec3.create();
            vec3.scale(tmpVec, forward, f);
            vec3.add(eye,eye,tmpVec);
            vec3.scale(tmpVec, right, r);
            vec3.add(eye,eye,tmpVec);
            vec3.scale(tmpVec, up, u);
            vec3.add(eye,eye,tmpVec);
        }

        return {
            init : init,
            calcViewMatrix : calcViewMatrix,
            calcProjectionMatrix: calcProjectionMatrix,
            setProjection : setProjection,
            setView : setView,
            addPitch : addPitch,
            addYaw : addYaw,
            addZoom : addZoom,
            moveEye : moveEye,
            vMatrix : vMatrix
        };
    }());


    function init() {
        initWebGL();
        initShaderProgram();
        initUniforms();
        initPipeline();
        initBuffers();
        camera.init();
        model.init();
    }

    function initWebGL() {
        // Get canvas and WebGL context.
        var canvas = document.getElementById('canvas');
        gl = canvas.getContext('experimental-webgl');
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    }

    /**
     * Init pipeline parameter that will not change again.
     */
    function initPipeline() {
        clearColor.forEach( function(e,i,a){a[i] /= 255;} );
        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], 1);

        //// Backface culling.
        //gl.frontFace(gl.CCW);
        //gl.enable(gl.CULL_FACE);
        //gl.cullFace(gl.BACK);

        // Depth(Z)-Buffer.
        gl.enable(gl.DEPTH_TEST);

        // Polygon offset of rastered Fragments.
        //gl.enable(gl.POLYGON_OFFSET_FILL);
        //gl.polygonOffset(0.5, 0);

        // Set viewport.
        //gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    }

    function initShaderProgram() {
        // Init vertex shader.
        var vs = initShader(gl.VERTEX_SHADER, "vertexshader");
        // Init fragment shader.
        var fs = initShader(gl.FRAGMENT_SHADER, "fragmentshader");
        // Link shader into a shader program.
        prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        //gl.bindAttribLocation(prog, 0, "aPosition");
        gl.linkProgram(prog);
        gl.useProgram(prog);
    }

    /**
     * Create and init shader from source.
     * @parameter shaderType: openGL shader type.
     * @parameter SourceTagId: Id of HTML Tag with shader source.
     * @returns WebGLShader object.
     */
    function initShader(shaderType, sourceTagId) {
        var shader = gl.createShader(shaderType);
        //var shaderSource = document.getElementById(sourceTagId).text;
        var shaderSource = SHADER[sourceTagId];
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log(sourceTagId + ": " + gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    function initUniforms() {

        prog.pointSizeUniform = gl.getUniformLocation(prog, "uPointSize");

        // Projection Matrix.
        prog.pMatrixUniform = gl.getUniformLocation(prog, "uPMatrix");

        // Model-View-Matrix.
        prog.mvMatrixUniform = gl.getUniformLocation(prog, "uMVMatrix");

        // Color.
        prog.colorUniform = gl.getUniformLocation(prog, "uColor");

        // Vertex data.
        prog.positionAttrib = gl.getAttribLocation(prog, 'aPosition');
        gl.enableVertexAttribArray(prog.positionAttrib);

    }

    /**
     * Combine view and model matrix
     * by matrix multiplication to mvMatrix.
     */
    function updateModelViewMatrix() {
        model.calcModelMatrix();
        camera.calcViewMatrix();
        if(mvMatrixIsUpToDate) return;
        mvMatrixIsUpToDate = true;

        mat4.multiply(mvMatrix, camera.vMatrix, model.mMatrix);
        // Set transformation uniform from matrix values.
        gl.uniformMatrix4fv(prog.mvMatrixUniform, false, mvMatrix);
    }

    /**
     * Update the geometry and render.
     */
    function update() {
        //console.log("Vis update");
        updateModelViewMatrix();
        camera.calcProjectionMatrix();
        var vd = Geo.updateVertexData();
        // Clear framebuffer and depth-/z-buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Render and draw calls on cell types on by one.
        for (var i = 0; i < vd.length; i++) {
            if(vd[i] === undefined) continue;
            if(vd[i].used === 0) continue;
            render.apply(vd[i]);
        }
    }

    /**
     * Geo init must be complete at this Point.
     */
    function initBuffers() {
        var vd = Geo.getVertexData();
        // Create buffer for cell types on by one.
        for (var i = 0; i < vd.length; i++) {
            if(vd[i] === undefined) continue;
            // Setup position vertex buffer object.
            vd[i].vboPos = gl.createBuffer();
        }
    }

    /**
     *  parameter this : object one cell type at a time to render.
     */
    function setupDataAndBuffers() {
        // Setup position vertex buffer object.
        // this.vboPos = gl.createBuffer(); // Done in init.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPos);
        // Copy data into the buffer (not done by reference).
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        // Connect vertex buffer to attribute variable.
        gl.vertexAttribPointer(prog.positionAttrib, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * Run the rendering pipeline.
     */
    function render() {
        // Set color uniform.
        gl.uniform4fv(prog.colorUniform, this.color);
        setupDataAndBuffers.apply(this);

        // Draw call for this object.
        gl.drawArrays(gl.POINTS, 0, this.count);
    }

    function getViewport(z) {
        if(z===undefined) z = 0;
        var w = gl.viewportWidth;
        var h = gl.viewportHeight;
        return [w, h, z];
    }
    function getViewportCenter() {
        var w = gl.viewportWidth;
        var h = gl.viewportHeight;
        return [w/2, h/2, 0];
    }

    return {
        init : init,
        update : update,
        camera : camera,
        model : model,
        getViewport : getViewport,
        getViewportCenter : getViewportCenter
    };
}());
