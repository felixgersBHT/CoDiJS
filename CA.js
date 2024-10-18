var CA = ( function() {

    // Sparse CA space without fixed dimension.
    var space;
    var nbOccupiedCells;

    // Object containing objects for each cell type
    // with color, counts, newCells, geometry, etc., see init.
    var cellTypes = [];

    function init() {
        // ERROR_CELL has the max cellType index.
        for(var i=0; i<=CONST.ERROR_CELL; i++) {
            cellTypes[i] = generateCellType();
        }
        reset();
    }

    function generateCellType(){
        return {
            count : 0,
            // 1D array with xyzxyz.. of new cell positions.
            newCells : []
        };
    }

    function reset(){
        space = [];
        nbOccupiedCells = 0;
        for (var i = 0; i < cellTypes.length; i++) {
            cellTypes[i].count = 0;
            cellTypes[i].newCells = [];
        }
    }

    /** Reset new or changed cells in last step.
     *  One Array for each type.
     *  Used to update geometry.
     */
    function resetNewCells() {
        for (var i = 0; i < cellTypes.length; i++) {
            cellTypes[i].newCells = [];
        }
    }

    /**
     * @param pos : Array 3d position in CA space.
     * @param type : number of cell type from CONST.
     */
    function setv3(pos, type){
        return set3f(pos[0],pos[1],pos[2], type);
    }

    /**
     *
     * @param x
     * @param y
     * @param z
     * @param type
     * @returns {boolean} true if space was empty.
     */
    function set3f(x,y,z,type){
        var spaceX = space[x];
        if(spaceX === undefined) {spaceX = []; space[x] = spaceX; }
        var spaceY = spaceX[y];
        if(spaceY === undefined) {spaceY = []; spaceX[y] = spaceY; }
        var spaceZ = spaceY[z];
        // Check if space is empty.
        if(spaceZ !== undefined){
            // Does not work, see fragment shader.
            // if(CONST.DEBUG && CONST.DEBUG_CELL_COLLISION) {
            //     type = CONST.ERROR_CELL;
            //     spaceY[z] = type;
            //     cellTypes[type].count++;
            //     cellTypes[type].newCells.push(x,y,z);
            // }
            return false;
        }
        //noinspection JSUnusedAssignment
        spaceY[z] = type;
        // Count number of cells of type in CA.
        cellTypes[type].count++;
        // Remember new cells for geo update.
        cellTypes[type].newCells.push(x,y,z);
        nbOccupiedCells++;
        return true;
    }

    function getSpace(){ return space; }
    function getCellTypes(){ return cellTypes; }
    function getNbOccupiedCells(){ return nbOccupiedCells; }


    return {
        init : init,
        reset : reset,
        resetNewCells : resetNewCells,
        setv3 : setv3,
        getSpace : getSpace,
        getCellTypes : getCellTypes,
        getNbOccupiedCells : getNbOccupiedCells
    }

}());