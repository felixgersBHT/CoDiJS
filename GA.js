var GA = (function () {
    //"use strict";


    function init() {
        // loadGene("gene");
        //loadGene("gene_2016-4-25_11-51-41");
        // saveGene();
    }

    /**
     * Gene contains offsets and probabilities for all cell types.
     * There is on gene for each neuron type.
     *
     * name is the neuron type for the gene.
     *
     * First discrimination on location of signal:
     * on main strand
     * on branch
     *
     * Operation (on main strand or branch):
     * stop {}
     * turn {}  angle=0 always, small perturbations to forward.
     * branch {}
     * tbranch {} after branch modify parent forward towards a t-branch.
     * split {} Split main into two main strands (no second order splits).
     *
     * Parameter for each operation (optional, not all for each useful):
     * offset  first possible occurrence of operation.
     * dist  minimal distance between operations.
     * prob  Probability in each time step of operation.
     * trans after stop transform signal into an other celltype.
     * angle
     * * branch.angle: range [inf,inf] 0=rectangular : converges to +-90° +- angle[-1,+1 = +-45°]
     * * tbranch.angle: mix parent forward with exact T-branch direction, 0=parent, +1=mean, inf=exact.
     * range [0,+1] Mean angle +- range, see angle.
     * minNb : minimum nb of times to repeat this operation (number of splits)
     * maxNb : maximum nb of times to repeat this operation (number of splits)
     *
     * For neuron body:
     * grow: Select what to grow (true, false).
     * hold: wait/hold n steps before growth starts.
     * turn:  Perturbation of forward directly from neuron body
     *        in range [0,1] where 1=45° must be guaranteed as max.
     * angle: angle to bend away from (-) or to (+) forward/axon direction, [-inf,+inf], 0=90°, +-1=+-45°.
     * range [0,+1] Mean angle +- range, see angle.
     */
    function createGene() {
        // Constance for default values.  
        //const so = 80; // stop.offset
        const o = 20; // offset
        const d = 20; // dist
        const p = 0.1; // prob
        const r = 0.3; //  range
        const a = 1.0; //  angele
        const tp = 0.5; // tbranch.prob
        const ta = 1.0; //  tbranch.angele

        var gene = [];
        gene.name = "default";
        gene[CONST.NEURON_SEED] = {
            AXON : {
                INITIAL : {grow : true, hold:0, turn : 0.1}
            },
            DENDRITE : {
                BASAL : {grow : true, hold:50, turn : 0.1, angle: 1.0, range: 0.0},
                APICAL : {
                    INITIAL: {grow: true, hold: 20, turn: 0.1},
                },
                OBLIQUE : {grow : true, hold:0, turn : 0}
            }
        };
        gene[CONST.AXON.INITIAL] = {
            main: {
                stop: {offset: 70, prob: p, trans: CONST.AXON.STEM},
                turn: {offset: 0, dist: 15, prob: p, range: 0.1},
                branch: {offset: 0, dist: 0, prob: 0, angle: 2, range: r},
                //tbranch: {prob: 0, angle: 0.0, range: 0},
                //split: {minNb: 0, maxNb: 0, offset: 80, dist: d, prob: p, angle: 8, range: 0.0}
            },
            branch: {
                stop: {offset: 60, prob: p},
                turn: {offset: 0, dist: d, prob: 0.4, range: r},
                branch: {offset: 40, dist: d, prob: p, angle: a, range: r},
                tbranch: {prob: tp, angle: ta, range: r}
            }
        };
        gene[CONST.AXON.STEM] = {
            main: {
                stop: {offset: 220, prob: p, trans: CONST.AXON.TERMINAL},
                turn: {offset: 0, dist: 30, prob: p, range: 0.1},
                branch: {offset: 40, dist: 60, prob: p, angle: 0, range: 1},
                tbranch: {prob: 0, angle: 0.0, range: 0},
                split: {minNb: 0, maxNb: 1, offset: 80, dist: d, prob: p, angle: 5, range: 0.0}
            },
            branch: {
                stop: {offset: 60, prob: p},
                turn: {offset: 0, dist: d, prob: 0.4, range: r},
                branch: {offset: 30, dist: d, prob: p, angle: a, range: r},
                tbranch: {prob: tp, angle: ta, range: r}
            }
        };
        gene[CONST.AXON.TERMINAL] = {
            main: {
                stop: {offset: 120, prob: p},
                turn: {offset: 0, dist: d, prob: p, range: r},
                branch: {offset: 0, dist: 20, prob: p, angle: 2, range: r},
                tbranch: {prob: tp, angle: 0.0, range: 0},
                split: {minNb: 2, maxNb: 3, offset: 0, dist: 15, prob: p, angle: 1, range: 0.0}
            },
            branch: {
                stop: {offset: 80, prob: p},
                turn: {offset: 0, dist: d, prob: 0.4, range: r},
                branch: {offset: d, dist: d, prob: p, angle: a, range: r},
                tbranch: {prob: tp, angle: ta, range: r}
            }
        };
        gene[CONST.DENDRITE.BASAL] = {
            main: {
                stop: {offset: 220, prob: p},
                turn: {offset: 2, dist: 10, prob: p, range: 0.1},
                branch: {offset: 15, dist: 20, prob: p, angle: a, range: r},
                tbranch: {prob: 0.8, angle: ta, range: r},
                split: {minNb: 3, maxNb: 4, offset: 5, dist: 5, prob: p, angle: 1, range: r}
            },
            branch: {
                stop: {offset: 60, prob: p},
                turn: {offset: 0, dist: d, prob: p, range: r},
                branch: {offset: 15, dist: 25, prob: p, angle: a, range: r},
                tbranch: {prob: tp, angle: ta, range: r}
            }
        };
        gene[CONST.DENDRITE.OBLIQUE] = {
            main: {
                stop: {offset: 40, prob: p},
                turn: {offset: 10, dist: 20, prob: p, range: 0.1},
                branch: {offset: 25, dist: 30, prob: p, angle: a, range: r},
                tbranch: {prob: 0.5, angle: ta, range: r},
                //split: {minNb: 2, maxNb: 3, offset: 10, dist: 25, prob: p, angle: 7, range: r}
            },
            branch: {
                stop: {offset: 40, prob: p},
                turn: {offset: 0, dist: d, prob: p, range: r},
                branch: {offset: 25, dist: 100, prob: p, angle: 1, range: r},
                tbranch: {prob: tp, angle: ta, range: r}
            }
        };
        gene[CONST.DENDRITE.APICAL.INITIAL] = {
            main: {
                stop: {offset: 60, prob: p, trans: CONST.DENDRITE.APICAL.TRUNK},
                turn: {offset: 0, dist: 10, prob: p, range: 0.1},
                branch: {offset: 10, dist: 12, prob: p, angle: 0, range: 1},
                //tbranch: {prob: 0, angle: ta, range: r},
                //split: {minNb: 2, maxNb: 3, offset: 10, dist: 25, prob: p, angle: 7, range: r}
            },
            branch: {
                stop: {offset: 1, prob: 1, trans: CONST.DENDRITE.OBLIQUE},
                //turn: {offset: o, dist: d, prob: p, range: r},
                //branch: {offset: o, dist: d, prob: p, angle: a, range: r},
                //tbranch: {prob: tp, angle: ta, range: r}
            }
        };
        gene[CONST.DENDRITE.APICAL.TRUNK] = {
            main: {
                stop: {offset: 180, prob: p, trans: CONST.DENDRITE.APICAL.TUFT},
                turn: {offset: 0, dist: 25, prob: p, range: 0.1},
                branch: {offset: 60, dist: 85, prob: p, angle: a, range: r},
                //tbranch: {prob: 0, angle: ta, range: r},
                split: {minNb: 1, maxNb: 2, offset: 40, dist: 15, prob: p, angle: 7, range: r}
            },
            branch: {
                stop: {offset: 40, prob: p},
                turn: {offset: 0, dist: 10, prob: p, range: 0.1},
                //branch: {offset: 100, dist: 35, prob: p, angle: a, range: r},
                //tbranch: {prob: tp, angle: ta, range: r}
            }
        };
        gene[CONST.DENDRITE.APICAL.TUFT] = {
            main: {
                stop: {offset: 80, prob: p},
                turn: {offset: 0, dist: d, prob: p, range: r},
                branch: {offset: 20, dist: 25, prob: p, angle: 3, range: r},
                tbranch: {prob: 0.3, angle: ta, range: r},
                split: {minNb: 2, maxNb: 3, offset: 20, dist: 15, prob: p, angle: 2, range: r}
            },
            branch: {
                stop: {offset: 80, prob: p},
                turn: {offset: 0, dist: d, prob: p, range: r},
                branch: {offset: 5, dist: 20, prob: p, angle: 3, range: r},
                tbranch: {prob: tp, angle: ta, range: r}
            }
        };

        //checkGeneSanity(gene);
        return gene;
    }

    function checkGeneSanity(g){
        var l,o,loc,op,operation;

        var operations = ["stop","turn","branch","split"];
        var locations = ["branch","main"];

        function warn(str){
            console.warn("checkGeneSanity "+g.name+" : "+
                " ct: "+ct+" loc: "+loc+" op: "+op+" "+
                str);
        }

        // Loop over celltypes for common checks.
        for(var ct=CONST.AXON; ct<=CONST.DENDRITE.BASAL;ct++) {
            for(l=0; l<locations.length; l++) {
                loc = locations[l];
                if(! g.hasOwnProperty(loc)) continue;
                // No Tprob for split.
                operation = g[ct][loc]["split"];
                if (operation !== undefined) {
                    if (operation.prob !== undefined) {
                        warn("Tprob " + operation.prob + " should be undefined ");
                    }
                }
                for(o=0; o<operations.length;o++) {
                    op = operations[o];
                    if(! g[loc].hasOwnProperty(op)) continue;
                    operation = g[ct][loc][op];
                    if (operation !== undefined) {
                        if (operation.prob > 1.0) {
                            warn("prob " + operation.prob + " > 1.0 ");
                        }
                    }
                }
            }
        }
    }

    /**
     * Load gene as JSON object via Ajax.
     *
     * @returns gene object.
     */
    function loadGene(name) {
        return Util.loadJSON("genes",name);
    }

    /**
     * Save gene as JSON object via Ajax.
     */
    function saveGene(gene, name){
        var g = gene;
        var n = name;
        if(g === undefined ) g = createGene();
        if(n === undefined ) n = "gene";
        return Util.saveJSON(g,"genes",n, true);
    }

    return {
        init: init,
        createGene: createGene,
        loadGene: loadGene,
        saveGene: saveGene
    };

} ());