var Stats = (function () {
    "use strict";
    /**
     * reportXXX: Give a report of the date collected so far.
     */

    // Object for growth phase statistics.
    var grow = ( function () {

        var collision = [];
        var nbOccupiedCells = 0;
        // Number of signals at every growth step for each celltype.
        var nbSignals = [];
        var maxSignals = 0;


        function reset() {
            collision = [];
            nbOccupiedCells = 0;
            nbSignals = [];
            maxSignals = 0;
        }

        function reportStep(step) {
            var signals = Sig.getSignals();
            if( signals !== undefined) {
                var sl = signals.length;
                nbSignals[step] = sl;
                if(maxSignals < sl) { maxSignals = sl; }
            }
        }

        function reportCollision(sig) {
            collision.push(sig);
            if (CONST.DEBUG && CONST.DEBUG_CELL_COLLISION) {
                console.log("collision.length:" + collision.length);
            }
        }

        function calc() {
            var i;
            for (i = 0; i < nbSignals.length; i++) {
                if(maxSignals < nbSignals[i]) { maxSignals = nbSignals[i]; }
            }
        }

        function display() {
            var i, elem;
            //calc();
            // Show the container.
            elem = document.getElementById('growStatsDiv');
            elem.style.visibility = "visible";
            // Set content
            elem = document.getElementById('growStats');
            elem.innerHTML = "<b>Growth</b>" + "<br/>";
            elem.innerHTML += "Step: " + NN.getCurrentStep() + "<br/>";
            elem.innerHTML += "Signals: " + Sig.getSignals().length + "<br/>";
            elem.innerHTML += "max Signals: " + maxSignals + "<br/>";
            elem.innerHTML += "Collisions: " + collision.length + "<br/>";
            elem.innerHTML += "Occupied Cells: " + CA.getNbOccupiedCells() + "<br/>";

            // Show the container.
            elem = document.getElementById('growStatsCtDiv');
            elem.style.visibility = "visible";
            // Set content
            elem = document.getElementById('growStatsCt');
            elem.style.visibility = "visible";
            elem.innerHTML = "<b>Celltypes</b>" + "<br/>";
            var vd = Geo.getVertexData();
            var ct = CA.getCellTypes();
            var ctn = CONST.CELL_TYPE_NAMES;
            for (i = 0; i < ct.length; i++) {
                if(ct[i].count === 0) continue;
                var c = vd[i].color255;
                elem.innerHTML += "<span style='color:rgb("+c[0]+","+c[1]+","+c[2]+")'>&#9724</span>";
                elem.innerHTML += ctn[i]+": "+ct[i].count + "<br/>";
            }
        }

        return {
            reset: reset,
            display: display,
            calc: calc,
            reportStep: reportStep,
            reportCollision: reportCollision
        }

    }());


    // Object for geometry statistics.
    var geometry = ( function () {

        // 2D arrays, first dimension ist cell type.
        // Array for histogram.
        var meanPathLength;
        // Max path length to neuron body.
        var maxPathLength;
        // Nb signal stops for a celltype.
        var nbBranchTips;

        function reset() {
            meanPathLength = [];
            maxPathLength = [];
            nbBranchTips = [];

            for (var i = 0; i < CONST.ERROR_CELL; i++) {
                meanPathLength[i] = 0;
                maxPathLength[i] = 0;
                nbBranchTips[i] = 0;
            }
        }

        function reportSigStop(sig) {
            if(!sig) {
                console.error("reportSigStop: No sig");
                return;
            }
            var ct = sig.cellType;
            nbBranchTips[ct]++;
            meanPathLength[ct] += sig.distToNeuronBody;
            if (maxPathLength[ct] < sig.distToNeuronBody) {
                maxPathLength[ct] = sig.distToNeuronBody;
            }
        }

        function calc() {
            var i;
            // Calc mean.
            for (i = 0; i < CONST.ERROR_CELL; i++) {
                if (!nbBranchTips || nbBranchTips[i] === 0) continue;
                meanPathLength[i] = Math.floor(meanPathLength[i] / nbBranchTips[i]);
            }
        }
        
        function display() {
            var i, elem;
            calc();
            // Show the container.
            elem = document.getElementById('geometryStatsDiv');
            elem.style.visibility = "visible";
            // Set content
            elem = document.getElementById('geometryStats');
            elem.innerHTML = "<b>Geometry</b>" + "<br/>";
            elem.innerHTML += "Mean/Max Path Length " + "<br/>";
            var ct = CA.getCellTypes(); // todo use CONST directly, see other loops
            var ctn = CONST.CELL_TYPE_NAMES;
            for (i = 0; i < ct.length; i++) {
                if(maxPathLength[i] === undefined || maxPathLength[i] === 0) continue;
                if(meanPathLength[i] === undefined || meanPathLength[i] === 0) continue;
                elem.innerHTML += ctn[i]+": "+meanPathLength[i]+"/"+ maxPathLength[i]+"<br/>";
            }
        }

        return {
            reset: reset,
            display: display,
            calc: calc,
            reportSigStop: reportSigStop
        }
    }());

    function init() {
        grow.reset();
        geometry.reset();
    }

    return {
        init: init,
        grow: grow,
        geometry: geometry
    };

}());