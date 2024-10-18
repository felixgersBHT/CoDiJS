/**
 // *  Generate parameter Vertex data for CA.
 // */

var Geo = ( function() {

    // Min number of cells for min size of types vertex array.
    const minNbCellsPerCellType = 1024;

    // Vertex Data for all cell types of the CA.
    var vertexData = [];

    function init(){
        var size = minNbCellsPerCellType * 3;
        // Colors.
        const black = [0,0,0,255];
        const grey = [128,128,128,255];
        const lightgrey = [180,180,180,255];
        const darkgrey = [100,100,100,255];
        const magenta = [255,0,255,255];
        const magenta1 = [238,0,238,255];
        const magenta2 = [226,64,253,255];
        const magenta4 = [139,0,139,255];
        const MediumOrchid = [186,85,211,255];
        const DarkViolet = [148,0,211,255];
        const green = [104,243,18,255];
        const yellow = [255,215,0,255];
        const orange = [255,165,0,255];
        const red = [255,0,0,255];
        const blue = [0,0,255,255];
        const cyan = [0,255,255,255];
        vertexData[CONST.NEURON_SEED] = generateVertexData(size, yellow);
        vertexData[CONST.NEURON_BODY] = generateVertexData(size, red);
        vertexData[CONST.AXON.INITIAL] = generateVertexData(size, black);
        vertexData[CONST.AXON.STEM] = generateVertexData(size, grey);
        vertexData[CONST.AXON.TERMINAL] = generateVertexData(size, lightgrey);
        vertexData[CONST.DENDRITE.BASAL]= generateVertexData(size, green);
        vertexData[CONST.DENDRITE.OBLIQUE]= generateVertexData(size, orange);
        vertexData[CONST.DENDRITE.APICAL.INITIAL]= generateVertexData(size, DarkViolet);
        vertexData[CONST.DENDRITE.APICAL.TRUNK]= generateVertexData(size, magenta2);
        vertexData[CONST.DENDRITE.APICAL.TUFT]= generateVertexData(size, magenta);
        vertexData[CONST.SPINE]= generateVertexData(size, cyan);
        vertexData[CONST.SYNAPSE]= generateVertexData(size, blue);
        vertexData[CONST.ERROR_CELL]= generateVertexData(size, orange);
    }

    /**
     * @param tsize
     * @param tcolor : Array rgba 0..255
     * @returns {{color: *, vertices: Float32Array, used: number}}
     */
    function generateVertexData(tsize, tcolor){
        var size = tsize;
        // Clone the color array, because it gets transformed.
        var color = tcolor.slice(0);
        if( size === undefined) { size = minNbCellsPerCellType * 3; }
        if( color === undefined) { color = [0, 0, 0, 0]; }
        color.forEach( function(e,i,a){a[i] /= 255;}  );
        var color255 = tcolor.slice(0);
        return {
            color : color,
            color255 : color255,
            vertices : new Float32Array(size),
            // Nb of data used in typed array (=3*count=3*nb of vertices).
            used : 0,
            // nb of vertices (count = used/3). Used for draw call.
            count :0
        };
    }

    /**
     * Update geometry with new CA cells.
     * @returns : Array vertexData.
     */
    function updateVertexData(){
        var cellTypes = CA.getCellTypes();
        var vertices, currentVertices;
        var len, v;
        // Loop cell types.
        for(var i=0; i<cellTypes.length; i++){
            if(cellTypes[i] === undefined) continue;
            var count = cellTypes[i].count;
            if(!count) continue;
            vertices = vertexData[i].vertices;
            // Re-Init type array size with power of > count, or min,
            // to avoid a new allocation at every CA step.
            // time 3 for xyz position of each cell.
            if(vertexData[i].vertices.length  < count * 3) {
                var newSize = Math.pow(2, ~~(Math.log(count) / Math.LN2) + 1);
                // Create new, larger buffer with old data.
                currentVertices = vertices;
                vertices = new Float32Array(3 * newSize);
                len = vertexData[i].used;
                for (v = 0; v < len; v++) {
                    vertices[v] = currentVertices[v];
                }
                vertexData[i].vertices = vertices;
                currentVertices = null;
            }
            // Copy new cells.
            var newCells = cellTypes[i].newCells;
            len = newCells.length;
            var vv = vertexData[i].used;
            for (v = 0; v < len; v++, vv++) {
                vertices[vv] = newCells[v];
            }
            vertexData[i].used += len;
            vertexData[i].count = count;
            // Check.
            if(count * 3 != vertexData[i].used ){
                console.error("Vertex data used does not fit cell count.");
            }
        }
        CA.resetNewCells();
        return vertexData;
    }

    function getVertexData() { return vertexData; }

    return {
        init : init,
        updateVertexData : updateVertexData,
        getVertexData : getVertexData
    };

}());