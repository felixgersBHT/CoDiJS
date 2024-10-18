var CONST = {

    DEBUG : true,
    DEBUG_STEP : false,
    DEBUG_NB_SIGNALS : false,
    //
    DEBUG_BRANCH : false,
    DEBUG_T_BRANCH : false,
    DEBUG_BRANCH_FORWARD : false,
    //
    DEBUG_SPLIT : false,
    //
    DEBUG_MOVE : false,
    DEBUG_CELL_COLLISION : false,

    // Used for branch and split.
    MOVE_NB_CELLS_TO_MOVE_STRAIGHT_AFTER_BRANCH : 2,

    /**
     * Cell types of the NN must start with 0 without holes.
     * Used in CA and of coloring in Geo.
     */
    EMPTY_SPACE : 0,
    NEURON_SEED : 1,
    NEURON_BODY : 2,
    AXON : { INITIAL : 3, STEM: 4, TERMINAL: 5},
    DENDRITE : {
        BASAL : 6,
        OBLIQUE: 7,
        APICAL : { INITIAL : 8, TRUNK: 9, TUFT: 10}
    },
    SPINE : 11,
    SYNAPSE : 12,
    ERROR_CELL: 13, // Must be there as max index of all cell types.

    // Cell type names for display.
    CELL_TYPE_NAMES : [
        "Empty Space",
        "Neuron Seed",
        "Neuron Body",
        "Axon Initial",
        "Axon Stem",
        "Axon Terminal",
        "Basal Dendrite",
        "Oblique Dendrite",
        "Apical Initial",
        "Apical Trunk",
        "Apical Tuft",
        "Spine",
        "Synapse",
        "Cell Error"
    ],

    // Gate directions.
    GATE_PX : 0,
    GATE_NX : 0,
    GATE_PY : 0,
    GATE_NY : 0,
    GATE_PZ : 0,
    GATE_NZ : 0,
    // Signal types.
    //
    GROW : 1,
    // Membrane Potential
    MP : 2,

    MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER
};

if(CONST.MAX_SAFE_INTEGER === undefined) {
    CONST.MAX_SAFE_INTEGER = 10000000;
}
