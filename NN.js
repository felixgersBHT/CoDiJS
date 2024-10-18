NN = function () {
    "use strict";

    var neurons = [];
    // growth or run step.
    var step;

    /**
     * Cannot set only forward.
     *
     * @parameter tpos: Array with neuron positions.
     */
    function setNeuronPositions(pos, forward) {
        if (pos === undefined) {
            pos = initRandomPositions(1, Vis.getViewport(800));
        }
        if (forward === undefined) {
            forward = generateRandForwardVectors(pos.length);
        }
        createNeuronBodies(pos, forward);
    }

    function setNeuronPositionsRandomInViewport(nbNeurons) {
        var pos = initRandomPositions(nbNeurons, Vis.getViewport(800));
        var forward = generateRandForwardVectors(nbNeurons);
        createNeuronBodies(pos, forward);
    }

    /**
     * Position neurons in layers in positive y-direction (down->up).
     *
     * @param layer: array with objects, one per layer,
     * containing neuron numbers and spacing within layer and to next layer.
     *  @param perturb [0,1] perturb the spacing, 0=non.
     */
    //todo
    function setNeuronPositionsInLayers(layer) {
        var x,y,z;
        var pos = [];
        var nbNeurons = 0;
        var offset = [300,300,0];
        // Define default topology.
        if (layer === undefined) {
            layer = [
                {nbNeurons: [2, 3], spacing: [100, 0, 100], width: 200},
                //{nbNeurons: [2, 3], spacing: [100, 0, 100], width: 200},
            ];
        }
        y =  + offset[1];
        for (var l = 0; l < layer.length; l++) {
            for (var n = 0; n < layer[l].nbNeurons[0]; n++) {
                for (var m = 0; m < layer[l].nbNeurons[1]; m++) {
                    x = n * layer[l].spacing[0] + offset[0];
                    z = m * layer[l].spacing[2] + offset[2];
                    pos.push([x, y, z]);
                    nbNeurons++;
                }
            }
            y += layer[l].width;
        }

        //pos = initRandomPositions(nbNeurons[i], space, offset);
        //pos = initEvenlySpacedPositions(nbNeurons[i], space, offset, 0);
        var forward = generateRandForwardVectors(nbNeurons, [1, 0, 0], 0.0);
        createNeuronBodies(pos, forward);
    }

    /**
     *
     * Generate a grid according to the dimension/size of the space.
     *
     * @param nbNeurons
     * @param sizeNeuronSpace
     * @param offset
     * @param variance [0,1] perturb the spacing, 0=non.
     * @returns {Array}
     */
    function initEvenlySpacedPositions(nbNeurons, sizeNeuronSpace, offset, variance) {
        var i, d, newPos, pos = [], delta = [];
        for (i = 0; i < 3; i++) {
            delta[i] = sizeNeuronSpace[i] / nbNeurons[i];
        }
        var curPos = new Array(offset);
        var lastModifiedIndex = -1;
        if (offset === undefined) offset = [0, 0, 0];
        for (var n = 0; n < nbNeurons; n++) {
            //newPos = [0, 0, 0];
            newPos = new Array(offset);
            lastModifiedIndex++;
            lastModifiedIndex %= 3;
            for (i = 0; i < 3; i++) {
                newPos[i] = Math.random() * sizeNeuronSpace[i] + offset[i];
                newPos[i] = Math.floor(newPos[i]);
            }

            //vec3.random(newPos,1000);
            pos.push(newPos);
        }
        return pos;
    }

    /**
     * @param nbNeurons : number of neurons.
     * @param sizeNeuronSpace : Array 3d CA space size for neuron bodies.
     * @param offset is the center for the space.
     */
    function initRandomPositions(nbNeurons, sizeNeuronSpace, offset) {
        var i, d, newPos, pos = [];
        if (offset === undefined) offset = [0, 0, 0];
        /*
                 var setRandomPos = function (elm, i, a) {
                 var o = 0;
                 if(offset !== undefined) o = offset[i] || 0;
                 a[i] = Math.random() * sizeNeuronSpace[i] + o;
                 a[i] = Math.floor(a[i]);
                 };
                 */
        for (var n = 0; n < nbNeurons; n++) {
            newPos = [0, 0, 0];
            //newPos.forEach(setRandomPos);
            for (i = 0; i < 3; i++) {
                newPos[i] = Math.random() * sizeNeuronSpace[i] + offset[i];
                newPos[i] = Math.floor(newPos[i]);
            }

            //vec3.random(newPos,1000);
            pos.push(newPos);
        }
        return pos;
    }


    function generateRandForwardVectors(nbNeurons, direction, scale) {
        if (direction === undefined) direction = [1, 0, 0];
        if (scale === undefined) scale = .2;
        var i, f;
        var forward = new Array(nbNeurons);
        for (i = 0; i < nbNeurons; i++) {
            f = vec3.create();
            vec3.random(f, scale);
            vec3.add(f, direction, f);
            vec3.normalize(f, f);
            forward[i] = f;
        }
        return forward;
    }

    /**
     * Init neuron objects, an array of neurons with positions, etc..
     * Plant neuron growth signals in the CA.
     * @param pos : Array with position.
     * @param forward : Array with forward vectors.
     */
    function createNeuronBodies(pos, forward) {
        var i, n, f;
        // Init neuron objects.
        for (i = 0; i < pos.length; i++) {
            if (forward === undefined || forward[i] === undefined) {
                f = [1, 0, 0];
            }
            else {
                f = forward[i];
            }
            n = {
                pos: pos[i],
                // Direction of growth/axon.
                // Must be normalized.
                forward: f,
                gene: GA.createGene()
            };
            neurons[i] = n;
            Sig.createNeuronSeedSignal(n.pos, n.forward, n.gene);
        }
    }


    /**
     * Step the CA in growth mode.
     */
    function grow(tnbSteps) {
        var nbSteps = (tnbSteps === undefined) ? 1 : tnbSteps;
        for (step = 0; step < nbSteps; step++) {
            if (CONST.DEBUG && CONST.DEBUG_STEP) {
                console.log("-----------grow nb Step: " + i);
            }
            Stats.grow.reportStep(step);
            if (!Sig.processAll(CONST.GROW)) break;
        }
    }

    function run() {
        //Sig.processAll(CONST.MP);
    }

    function getCurrentStep() {
        return step;
    }

    return {
        setNeuronPositions: setNeuronPositions,
        setNeuronPositionsRandomInViewport: setNeuronPositionsRandomInViewport,
        setNeuronPositionsInLayers: setNeuronPositionsInLayers,
        grow: grow,
        run: run,
        getCurrentStep: getCurrentStep
    };
}();