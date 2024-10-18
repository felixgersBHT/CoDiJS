var Sig = ( function() {

    // Arrays with signal objects, see addSignal_XXX.
    var signals = [];
    // Unique id of a signal used for debut.
    var signalId = 0;

    // Arrays with functions to process for each celltype.
    var process = [];
    process[CONST.GROW] = [];
    process[CONST.MP] = [];


    function reset() {
        signals = [];
    }

    /**
     * @param pos {Array}
     * @param forward {vec3} direction of growth of the axon.
     * @param gene {object}
     */
    function createNeuronSeedSignal(pos, forward, gene) {
        vec3.normalize(forward, forward);
        var newSig = {
            // Signal id is used for debug only.
            id : signalId++,
            // see CONST for signal types.
            type : CONST.GROW,
            cellType : CONST.NEURON_SEED,
            // wait/hold n steps before processing starts.
            hold: 0,
            pos : pos,
            forward : forward,
            maxForwardIndex : undefined,
            signMaxForwardIndex : undefined,
            probForward : vec3.create(),
            gene : gene,
            // Number Steps the signal proceeded since its creation.
            dist : 0,
            // Total Distance in cells from neuron body.
            distToNeuronBody : 0,
            // Init to max in case offset<dist.
            nbSplits : 0,
            distToLastSplitPoint : CONST.MAX_SAFE_INTEGER,
            // Init to max in case offset<dist.
            // Include split points also as branches.
            distToLastBranchPoint : CONST.MAX_SAFE_INTEGER,
            // Also used to determine if signal is on branch or main.
            distOnBranch : 0,
            distToLastTurnPoint :0,
            // Store last move direction to avoid branch in the same direction.
            // This is the direction towards the cell a signal came from.
            // Format: See branch function.
            movedFromDirection : undefined
        };
        calcProbAndMaxIndexFromForward(newSig);
        signals.push(newSig);
    }

    /**
     * See createNeuronSeedSignal for signal parameter.
     * Clone and add as new signal on stack.
     * Keep gene as reference.
     * @param sig {Object} signal with default values.
     * @returns {Object} new signal.
     */
    function clone(sig) {
        //var newSig = Object.assign({}, sig);
        var newPos = vec3.clone(sig.pos);
        var newForward = vec3.clone(sig.forward);
        var probForward = vec3.clone(sig.probForward);
        var newSig = {
            id : signalId++,
            type : sig.type,
            cellType : sig.cellType,
            hold : sig.hold,
            pos : newPos,
            forward : newForward,
            maxForwardIndex : sig.maxForwardIndex,
            signMaxForwardIndex : sig.signMaxForwardIndex,
            probForward : probForward,
            gene : sig.gene,
            dist : sig.dist,
            distToNeuronBody : sig.distToNeuronBody,
            nbSplits : sig.nbSplits,
            distToLastBranchPoint : sig.distToLastBranchPoint,
            distToLastSplitPoint : sig.distToLastSplitPoint,
            distOnBranch : sig.distOnBranch,
            distToLastTurnPoint : sig.distToLastTurnPoint,
            // This is not very useful, should be undefined:
            movedFromDirection : sig.movedFromDirection
        };
        signals.push(newSig);
        return newSig;
    }

    function calcPerpendicularBranchForward(sig, direction, sign, g) {
        var scale, j, randVec, rand;

        var forward = sig.forward;
        // Remember parent forward as starting point.
        var oldForward = vec3.clone(forward);

        var maxIndex = sig.maxForwardIndex;
        var max = forward[maxIndex];
        var signMaxIndex = sig.signMaxForwardIndex;

        // Assume maxIndex != direction, also if signs differ.
        forward[maxIndex] = - forward[direction];
        forward[direction] = max;
        if(signMaxIndex != sign) {
            vec3.negate(forward, forward);
        }
        // Index of the remaining direction is:
        j = 3 - (direction+maxIndex);
        forward[j] = 0;

        // Calc vector perpendicular to old/parent and new/branch forward.
        // Use it for random perpendicular perturbation.
        randVec = vec3.create();
        vec3.cross(randVec, forward, oldForward);
        if(CONST.DEBUG && CONST.DEBUG_BRANCH_FORWARD) {
            console.log("_______new branch direction and forward:"+sig.pos);
            console.log(" direction: "+direction);
            console.log(" sign: "+sign);
            console.log(" oldForward: "+oldForward);
            console.log(" forward: "+forward);
            console.log(" randVec: "+randVec);
        }
        rand = Math.random()*2-1;
        // Max direction index should be keep, also after perturbation.
        scale = rand * (Math.abs(max) - Math.abs(forward[maxIndex]));
        vec3.scale(randVec, randVec, scale);
        vec3.add(forward, forward, randVec);
        if(CONST.DEBUG && CONST.DEBUG_BRANCH_FORWARD) {
            console.log("_______new perpendicular branch forward:"+sig.pos);
            console.log(" forward: "+forward);
            console.log(" randVec scaled: "+randVec);
            console.log(" scale: "+scale);
        }

        // Add branching angle range [inf,inf]: converges to 90° +- angle[-1,+1 = +-45°]
        vec3.normalize(forward, forward);
        rand = Math.random()*2-1;
        // Max direction index should be keep, also after perturbation.
        scale = g.angle + rand * g.range;
        // mix org forward with 90° branch direction, 0=90°, +-1=+-45°.
        vec3.scaleAndAdd(forward, forward, oldForward, scale);

        // Naive solution.
        //forward[direction] *= 1 - a;
        //forward[direction] += sign * a;
        //
        // This to general, therefore slow.
        //  var vec = vec3.create();
        // vec[direction] += sign;
        // vec3.lerp(forward, forward, vec, 0.5);
        //forward[direction] += sign;

        vec3.normalize(forward, forward);
        calcProbAndMaxIndexFromForward(sig);
    }

    /**
     * To be applied on a vec3.
     *
     * @returns {number}
     */
    function getMaxIndex() {
        var max = 0;
        var index = 0;
        var abs;
        for (var i = 0; i < 3; i++) {
            abs = Math.abs(this[i]);
            if (abs > max) {
                index = i;
                max = abs;
            }
        }
        return index;
    }

    /**
     * Scale forward to a probability vector with sum x(i) =1.
     * (which is not the same as a length of 1).
     * Accumulate probability over dim.
     * @param sig {Object}
     */
    function calcProbAndMaxIndexFromForward(sig) {
        var sum = 0, i;
        var prob = sig.probForward;
        for(i=0; i<3; i++) {
            var absVal = Math.abs(sig.forward[i]);
            prob[i] = absVal;
            sum += absVal;
        }
        // Store accumulated probability.
        if( sum === 0) {
            //console.error("prob sum=0");
            sum = 1;
        }
        sum = 1 / sum;
        prob[0] *= sum;
        prob[1] = prob[0] + prob[1] * sum;
        // prob[2] should be 1, not used.
        //prob[2] = prob[1] + prob[2] * sum;

        // calc Max forward index and sign.
        sig.maxForwardIndex = getMaxIndex.apply(sig.forward);
        sig.signMaxForwardIndex= sig.forward[sig.maxForwardIndex] > 0 ? +1 : -1;
    }

    //noinspection OverlyComplexFunctionJS
    /**
     * Branch on main or on branch.
     *
     * Check offset.
     * Calculate random probability to branch.
     *
     * @param sig
     */
    function branch(sig) {

        var dist = sig.distOnBranch === 0 ? "dist" : "distOnBranch";
        var loc = sig.distOnBranch === 0 ? "main" : "branch";
        var g = sig.gene[sig.cellType][loc].branch;
        if(g===undefined) return;

        if (sig[dist] < g.offset) {
            return;
        }
        // Dist between branches.
        if (sig.distToLastBranchPoint < g.dist) {
            return;
        }
        if (g.prob < Math.random()) {
            return;
        }
        var newSig = createNewBranchSignal(sig, g);

        // T-Branch.
        g = sig.gene[sig.cellType][loc].tbranch;
        if(g !== undefined) {
            tbranch(sig, newSig, g);
        }
    }

    /**
     * Try to find empty cell to branch to only, do this only once.
     * Perform branch only if it will probably succeed (not blocked by own strand).
     * However, a branch may be blocked by some other branch signal in the next step.
     *
     * Try to T-Branch.
     *
     * @param sig signal
     * @param g gene as parameter because we lost if are on branch or main (and split or branch).
     *
     * @return newSig This may be T-branch sig when two signals are created.
     */
    function createNewBranchSignal(sig, g) {

        var newSig, direction, sign;

        newSig = clone(sig);
        if (CONST.DEBUG && CONST.DEBUG_BRANCH) {
            debugSigToConsole(sig, "branch from sig");
        }

        // Chose random direction [0,5]-map to-> [-2,+2] including sign.
        // Exclude the direction where the signal moved to an where it came from.
        direction = Math.floor((Math.random() * 6));
        // Avoid cells used by parent branch in previous or next step.
        // Parent will move in maxForwardIndex direction after branch.
        // Also we do not want to branch in the positive or negative forward of the parent.
        var moveToDirection = sig.maxForwardIndex + (sig.signMaxForwardIndex === +1 ? 3 : 0);
        var negForwardDirection = sig.maxForwardIndex + (sig.signMaxForwardIndex === -1 ? 3 : 0);
        while ((direction == sig.movedFromDirection)
        || (direction == moveToDirection)
        || (direction == negForwardDirection)
            ) {
            if (CONST.DEBUG && CONST.DEBUG_BRANCH) {
                console.log("occupied direction:" + direction);
                console.log("sig.movedFromDirection:" + sig.movedFromDirection);
                console.log("moveToDirection:" + moveToDirection);
            }
            direction = Math.floor((Math.random() * 6)); // that is more random.
            //direction = (direction + 1) % 6;
        }
        if (CONST.DEBUG && CONST.DEBUG_BRANCH) {
            console.log("final direction:" + direction);
        }
        if (direction > 2) {
            direction -= 3;
            sign = +1;
        }
        else {
            sign = -1;
        }
        // Go back to position before current move (in this step) of sig.
        // Than add the new step on the branch.
        newSig.pos[direction] += sign;
        newSig.movedFromDirection = direction + (sign === -1 ? 3 : 0);

        calcPerpendicularBranchForward(newSig, direction, sign, g);

        // Check direction an forward sanity.
        if ((direction != newSig.maxForwardIndex) || (sign != newSig.signMaxForwardIndex)) {
            if (CONST.DEBUG && CONST.DEBUG_BRANCH) {
                console.warn(newSig.id+"<-"+sig.id+" branch direction != newSig.maxForwardIndex sigfoward:"
                    +Util.roundVecToSting(sig.forward)+" pos:" + newSig.pos);
                console.log("(intended & sign) direction:" + direction + " sign:" + sign);
                debugSigToConsole(newSig, "branch direction != newSig.maxForwardIndex");
                /*
                 //Fix it, tweak forward so that it matches max index.
                 //
                 // No! we want angles <45°, and first grow some steps 90° to avoid collision.
                 //
                 var max = newSig.forward[newSig.maxForwardIndex];
                 var secondMaxIndex = (newSig.maxForwardIndex+1) % 3;
                 var otherIndex = (secondMaxIndex+1) % 3;
                 if(newSig.forward[otherIndex] > newSig.forward[secondMaxIndex]){
                 secondMaxIndex = otherIndex;
                 }
                 newSig.forward[newSig.maxForwardIndex] = newSig.forward[secondMaxIndex];
                 newSig.forward[secondMaxIndex] = max; // Which is not max.
                 // Check if order is correct.
                 if(!((direction === newSig.maxForwardIndex) &&
                 (newSig.forward[newSig.maxForwardIndex] >= newSig.forward[secondMaxIndex]) &&
                 (newSig.forward[otherIndex] <= newSig.forward[secondMaxIndex])
                 )) {
                 console.warn("Still not branch direction === newSig.maxForwardIndex" +
                 " pos:" + newSig.pos);
                 }
                 */
            }
        }

        newSig.distToLastBranchPoint = 1;
        // distToLastSplitPoint is set elsewhere, see branchOrSplit().
        sig.distToLastBranchPoint = 0; // Has not moved yet, thus is on branch point.
        newSig.distOnBranch++;
        newSig.distToNeuronBody++;
        newSig.dist++;
        newSig.distToLastTurnPoint = 0; // we do not wand to turn on branch immediately.

        if (CONST.DEBUG && CONST.DEBUG_BRANCH) {
            debugSigToConsole(newSig, "branch to newSig");
        }

        return newSig;
    }

    /**
     * Reuse the parent sig for t-branch.
     * Modify parent forward between exact, symmetric t-branch/fork and no change in parent.
     *
     * @param sig : object parent
     * @param newSig : object branch
     * @param g : object tbranch gene
     */
    function tbranch(sig, newSig, g) {
        var rand, scale, project;

        if ((g.prob === undefined) || (g.prob === 0)) { return; }
        // angle=0 means stick to parent forward.
        if (g.angle === 0) { return; }
        if (g.prob < Math.random()) { return; }

        // Keep old values in case we have to backtrack.
        var oldParentForward = vec3.clone(sig.forward);
        var oldParentMaxForwardIndex = sig.signMaxForwardIndex;

        // forward: -neg(brother-branch)+ 2* project(brother on org sig forward)
        var symmetricTBranch = vec3.clone(newSig.forward);
        project = 2 * vec3.dot(symmetricTBranch, sig.forward);
        vec3.negate(symmetricTBranch, symmetricTBranch);
        vec3.scaleAndAdd(symmetricTBranch, symmetricTBranch, sig.forward, project);
        // Kind of lerp (with angle[0, inf] ) between old parent forward and exact T.
        rand = Math.random() * 2 - 1;
        scale = g.angle + rand * g.range;
        if (scale < 0) {
            scale = 0.0;
        }
        // mix parent forward with exact T-branch direction, 0=parent, +1=mean, inf=exact.
        vec3.scaleAndAdd(sig.forward, sig.forward, symmetricTBranch, scale);

        vec3.normalize(sig.forward, sig.forward);
        calcProbAndMaxIndexFromForward(sig);

        // First check for collision if parent forward cell direction changed.
        // On collision backtrack.
        if (oldParentMaxForwardIndex !== sig.signMaxForwardIndex) {
            var parentDirection = sig.maxForwardIndex + (sig.signMaxForwardIndex === +1 ? 3 : 0);
            var childDirection = newSig.maxForwardIndex + (newSig.signMaxForwardIndex === +1 ? 3 : 0);
            if ((parentDirection === sig.movedFromDirection) ||
                (parentDirection === childDirection)) {
                // No T-branch.
                if (CONST.DEBUG && CONST.DEBUG_T_BRANCH) {
                    console.log("No T-branch:");
                    console.log("parentDirection:" + parentDirection);
                    console.log("childDirection:" + childDirection);
                }
                // Backtrack.
                vec3.copy(sig.forward, oldParentForward);
                calcProbAndMaxIndexFromForward(sig);
            } else {
                // T-branch success.
                if (CONST.DEBUG && CONST.DEBUG_T_BRANCH) {
                    console.log(newSig.id + "<-" + sig.id + " T-branch pos:" + newSig.pos);
                }
            }
        }
    }
    
    /**
     * Only modify forward vector of the signal.
     * No new signal is generated.
     *
     * @param sig
     */
    function turn(sig) {
        var dist = sig.distOnBranch === 0 ? "dist" : "distOnBranch";
        var loc = sig.distOnBranch === 0 ? "main" : "branch";
        var g = sig.gene[sig.cellType][loc].turn;
        if(g===undefined) return;
        var p = g.prob;
        if((p === undefined) || (p === 0)) { return; }
        if (sig[dist] < g.offset) { return; }
        if( sig.distToLastTurnPoint < g.dist ) { return; }
        if(p < Math.random()) return;
        // Add random Vector to forward.
        var r = g.range;
        var forward = sig.forward;
        for(var i = 0; i < 3; i++) {
            forward[i] += (Math.random() * 2.0 -1.0) * r;
        }
        vec3.normalize(forward, forward);
        calcProbAndMaxIndexFromForward(sig);

        sig.distToLastTurnPoint = 0;
    }

    //noinspection OverlyComplexFunctionJS,OverlyComplexFunctionJS
    /**
     * Move signal forward and recycle sig object.
     * Chose stochastic direction according to prob and forward.
     */
    function moveForward(sig) {
        var sign;
        var moveToDirection = undefined;

        if(CONST.DEBUG && CONST.DEBUG_MOVE) {
            debugSigToConsole(sig, "move from sig");
        }

        // Check if just branched.
        // If so move forward in max index direction
        // or in last movement direction to avoid collision.
        // Problem: On child signal (dist=1) may not have moved in max forward direction.
        // As parent, sig is still in branch point (dist=0), move one step in max forward.
        if (sig.distToLastBranchPoint === 0 ) {
            moveToDirection = sig.maxForwardIndex;
            sign = sig.signMaxForwardIndex;
        } else if (sig.distToLastBranchPoint <= CONST.MOVE_NB_CELLS_TO_MOVE_STRAIGHT_AFTER_BRANCH) {
            // On parent or child branch.
            moveToDirection = sig.movedFromDirection % 3;
            // Move in opposite direction.
            sign= sig.movedFromDirection > 2 ? -1 : +1;
        }
        // Not after branching.
        if (moveToDirection === undefined) {
            // Determine direction according to probability.
            var rand = Math.random();
            if (rand < sig.probForward[0]) {
                moveToDirection = 0;
            } else {
                if (rand < sig.probForward[1]) {
                    moveToDirection = 1;
                } else {
                    moveToDirection = 2;
                }
            }
            sign = sig.forward[moveToDirection] > 0 ? +1 : -1;
        }

        if(CONST.DEBUG && CONST.DEBUG_MOVE) {
            console.log("move to :"+moveToDirection+"  sign : "+sign);
        }

        sig.pos[moveToDirection] += sign;
        // Remember moveFromDirection [0,5] including sign for branching.
        sig.movedFromDirection = moveToDirection + (sign === -1 ? 3 : 0);

        if(CONST.DEBUG && CONST.DEBUG_MOVE) {
            debugSigToConsole(sig, "move to sig");
        }

        //vec3.add(sig.pos, sig.pos, sig.forward);
        sig.distToNeuronBody++;
        sig.dist++;
        sig.distToLastBranchPoint++;
        sig.distToLastSplitPoint++;
        if(sig.distOnBranch > 0) sig.distOnBranch++;
        sig.distToLastTurnPoint++;

        // We did not clone the signal, to recycle it we have to push ist by hand.
        // For debug stop branching branch after branching.
        //if(!((sig.distToLastBranchPoint ==1) && (sig.dist > 5)))
        signals.push(sig);

    }

    /**
     * 
     * @param sig
     * @returns {boolean} true on success.
     */
    function split(sig) {
        var gMain = sig.gene[sig.cellType].main;
        var g = gMain.split;
        // Split may also not be defined.
        if(g===undefined) return false;
            
        if (sig.nbSplits < g.maxNb) {
            if (sig.dist > g.offset) {
                if (sig.distToLastSplitPoint > g.dist) {
                    // No to close to a branch.
                    if (sig.distToLastBranchPoint > (gMain.branch.dist * 0.5)) {
                        if (g.prob > Math.random()) {
                            if (sig.nbSplits >= g.minNb) {
                                // Return with 50% prob but count as split try.
                                if (Math.random() > 0.5) {
                                    sig.nbSplits++;
                                    return false;
                                }
                            }
                            // Perform split.
                            var newSig = createNewBranchSignal(sig, g);
                            newSig.distToLastSplitPoint = 1;
                            sig.distToLastSplitPoint = 0; // Has not moved yet, thus is on split point.
                            sig.nbSplits++;
                            // No more second order splits.
                            newSig.nbSplits = g.maxNb;
                            // Stay on main.
                            newSig.distOnBranch = 0;
                            if (CONST.DEBUG && CONST.DEBUG_SPLIT) {
                                console.log(newSig.id + "<-" + sig.id + " Split");
                            }
                            return true;
                        }
                    }
                }
            }
        }
        // We did not split.
        return false;
    }

    /**
     * Try to split than if no split try to branch.
     * Split only on main not on branch.
     *
     * @param sig
     */
    function branchOrSplit(sig) {
        // On a branch we can only branch.
        if (sig.distOnBranch > 0) {
            branch(sig);
            return;
        }
        // On main we can still split or branch.
        // Split may also not be defined.
        // First try to split.
        if( ! split(sig) ) {
            branch(sig);
        }
    }

    /**
     * @param sig
     * @returns {boolean} true if signal should be killed, i.e. not proceeded.
     */
    function stop(sig){
        var dist = sig.distOnBranch === 0 ? "dist" : "distOnBranch";
        var loc = sig.distOnBranch === 0 ? "main" : "branch";
        var g = sig.gene[sig.cellType][loc];

        // Check if we stop and kill the signal.
        if (sig[dist] >= g.stop.offset) {
            if (g.stop.prob === 0) return true;
            if((g.stop.prob === 0) || (g.stop.prob > Math.random())) {
                Stats.geometry.reportSigStop(sig);
                return true;
            }
        }
        return false;
    }

    /**
     * Transform to a new celltype.
     * @param sig
     * @returns {boolean}
     */
    function transform(sig) {
        var loc = sig.distOnBranch === 0 ? "main" : "branch";
        var g = sig.gene[sig.cellType][loc];
        if(g.stop.trans === undefined) { return false; }

        // recycle the signal.
        sig.cellType = g.stop.trans;
        sig.dist = 0;
        sig.nbSplits = 0;
        sig.distToLastSplitPoint = CONST.MAX_SAFE_INTEGER;
        sig.distToLastBranchPoint = CONST.MAX_SAFE_INTEGER;
        sig.distOnBranch = 0;
        sig.distToLastTurnPoint = 0;

        return true;
    }

    /**
     * Process signals for growth of main an branch for axon and dendrites.
     *
     * @param sig
     */
    function grow(sig) {
        if(stop(sig)) {
            if(! transform(sig) ) { return; }
        }

        // Turn before move, this only modifies the forward vector of the signal.
        turn(sig);

        // It is important to avoid collision between branch/split and parent.
        // We branch/split first, than move xx steps in same direction (should be max forward).
        // On parent move xx steps towards max forward direction direction after branch.
        branchOrSplit(sig);

        moveForward(sig);
    }

    process[CONST.GROW][CONST.AXON.INITIAL] = grow;
    process[CONST.GROW][CONST.AXON.STEM] = grow;
    process[CONST.GROW][CONST.AXON.TERMINAL] = grow;
    process[CONST.GROW][CONST.DENDRITE.BASAL]  = grow;
    process[CONST.GROW][CONST.DENDRITE.APICAL.INITIAL] = grow;
    process[CONST.GROW][CONST.DENDRITE.APICAL.TRUNK] = grow;
    process[CONST.GROW][CONST.DENDRITE.APICAL.TUFT] = grow;
    process[CONST.GROW][CONST.DENDRITE.OBLIQUE] = grow;


    process[CONST.GROW][CONST.NEURON_BODY] = function GROW_NEURON_BODY(sig) {
        var i,d;
        // Flood fill.
        for (d = 0; d < 3; d++) {
            for (i = -1; i <= 1; i+=2) {
                if(sig.dist > 3) continue;
                var newSig = clone(sig);
                newSig.pos[d] += i;
                newSig.distToNeuronBody++;
                newSig.dist++;
                newSig.hold = 2;
            }
        }
    }
    
    //noinspection OverlyComplexFunctionJS
    process[CONST.GROW][CONST.NEURON_SEED] = function GROW_NEURON_SEED(sig) {

        var g = sig.gene[sig.cellType];
        var gt; // gene for cellType to grow from neuron body.

        var i;
        // Split signal into axon and dendrite.
        // Get dominant forward direction.
        var maxIndex = sig.maxForwardIndex;
        var max = sig.forward[maxIndex];
        var signMaxIndex = sig.forward[maxIndex] > 0 ? +1 : -1;
        var scale;

        var randomPerturbation = function (fVec, scale) {
            var randVec = vec3.create();
            vec3.random(randVec, scale);
            vec3.add(fVec, fVec, randVec);
            vec3.normalize(fVec, fVec);
        };

        // Create Axon signal.
        gt = g.AXON.INITIAL;
        if(gt.grow) {
            // In forward direction.
            var newSig = clone(sig);
            newSig.cellType = CONST.AXON.INITIAL;
            newSig.hold = gt.hold;
            newSig.pos[maxIndex] += signMaxIndex;
            newSig.movedFromDirection = maxIndex + (signMaxIndex === -1 ? 3 : 0);
            if (gt.turn > 0) {
                scale = 0.707 * gt.turn; // 1/sqrt(2)
                randomPerturbation(newSig.forward, scale);
                calcProbAndMaxIndexFromForward(newSig);
            }
        }

        // Create Apical Dendrite signal.
        gt = g.DENDRITE.APICAL.INITIAL;
        if(gt.grow) {
            // In backward direction.
            newSig = clone(sig);
            newSig.cellType = CONST.DENDRITE.APICAL.INITIAL;
            newSig.hold = gt.hold;
            vec3.negate(newSig.forward, newSig.forward);
            newSig.pos[maxIndex] -= signMaxIndex;
            newSig.movedFromDirection = maxIndex + (signMaxIndex === +1 ? 3 : 0);
            if (gt.turn > 0) {
                scale = 0.707 * gt.turn; // 1/sqrt(2)
                randomPerturbation(newSig.forward, scale);
            }
            calcProbAndMaxIndexFromForward(newSig);
        }


        // Four basal dendrite signals.
        gt = g.DENDRITE.BASAL;
        if(gt.grow) {
            // All perpendicular to forward direction plus random perturbation.
            for (i = 0; i < 3; i++) {
                if (i === maxIndex) continue;
                if (i === -maxIndex) continue;
                newSig = clone(sig);
                newSig.cellType = CONST.DENDRITE.BASAL;
                newSig.hold = gt.hold;
                // Calc new forward, keep length to 1.
                var forward = newSig.forward;
                forward[maxIndex] = -forward[i];
                forward[i] = max;
                // Index of the remaining direction is:
                var j = 3 - (i + maxIndex);
                forward[j] = 0;
                newSig.pos[i] += signMaxIndex;
                newSig.movedFromDirection = i + (signMaxIndex === -1 ? 3 : 0);
                // Sig in the opposite direction.
                var newSigNeg = clone(sig);
                newSigNeg.cellType = CONST.DENDRITE.BASAL;
                newSigNeg.hold = gt.hold;
                vec3.negate(newSigNeg.forward, forward);
                newSigNeg.pos[i] -= signMaxIndex;
                newSigNeg.movedFromDirection = i + (signMaxIndex === +1 ? 3 : 0);
                // Random perturbation.
                if (gt.turn > 0) {
                    scale = (Math.abs(max) - Math.abs(forward[maxIndex])) * 0.5;
                    scale *= gt.turn;
                    randomPerturbation(forward, scale);
                    randomPerturbation(newSigNeg.forward, scale);
                }

                // Modify forward angle away from forward.
                if (gt.angle > 0 || gt.range > 0) {
                    var rand = Math.random() * 2 - 1;
                    scale = gt.angle + rand * gt.range;
                    // mix neuron forward with 90° dendrite direction, angel [-inf,+inf], 0=90°, +-1=+-45°.
                    vec3.scaleAndAdd(forward, forward, sig.forward, scale);
                    vec3.normalize(forward, forward);
                    vec3.scaleAndAdd(newSigNeg.forward, newSigNeg.forward, sig.forward, scale);
                    vec3.normalize(newSigNeg.forward, newSigNeg.forward);
                }
                
                // Modify forward angle away from forward.
                if (false) {
                    vec3.scaleAndAdd(forward, forward, sig.forward, -gt.angle);
                    vec3.normalize(forward, forward);
                    vec3.scaleAndAdd(newSigNeg.forward, newSigNeg.forward, sig.forward, -gt.angle);
                    vec3.normalize(newSigNeg.forward, newSigNeg.forward);
                }
                //
                calcProbAndMaxIndexFromForward(newSig);
                calcProbAndMaxIndexFromForward(newSigNeg);
            }
        }
    };

    /**
     *  Process all signals of a type.
     *
     * @param signalType {int} : signal type to process (undefined = all)
     */
    function processAll(signalType) {
        // Reference signals for current step and
        // create new array for signals of next step.
        if(signals.length === 0) return false;
        var currentSignals = signals;
        signals = [];
        var len = currentSignals.length;
        if(CONST.DEBUG && CONST.DEBUG_NB_SIGNALS) {
            console.log("_______currentSignals.length: " + len);
        }
        for (var i = 0; i < len; i++) {
            var sig = currentSignals[i];
            // Sig may have been removed.
            if((sig === undefined) || (sig === null)) continue;
            // Process only growth signals.
            if((signalType !== undefined) && (sig.type !== CONST.GROW)) continue;
            // Check waiting/hold.
            if(sig.hold >0){
                sig.hold--;
                signals.push(sig);
                continue;
            }
            // Set new CA cell containing signal only if empty.
            if ( CA.setv3(sig.pos, sig.cellType) === false) {
                Stats.grow.reportCollision(sig);
                if(CONST.DEBUG && CONST.DEBUG_CELL_COLLISION) {
                    console.warn(sig.id+" signal on occupied cell:"+sig.pos+
                        " distOnBranch:"+sig.distOnBranch+
                        " distToLastSplitPoint:"+sig.distToLastSplitPoint+
                        " distToLastBranchPoint:"+sig.distToLastBranchPoint);
                    //debugSigToConsole(sig, "signal on occupied cell");
                }
                continue;
            }
            process[signalType][sig.cellType](sig);
        }
        return true;
    }

    function getSignals(){ return signals; }

    function debugSigToConsole(sig, message) {
        if(!CONST.DEBUG) return;
        console.log(message+" id: "+sig.id+" "+sig);
        console.log(message+" pos: "+sig.pos);
        console.log(message+" forward: "+sig.forward);
        console.log(message+" maxForwardIndex: "+sig.maxForwardIndex);
        console.log(message+" signMaxForwardIndex: "+sig.signMaxForwardIndex);
        console.log(message+" distOnBranch:"+sig.distOnBranch);
        console.log(message+" distToNeuronBody:"+sig.distToNeuronBody);
        console.log(message+" dist:"+sig.dist);
        console.log(message+" distToLastSplitPoint:"+sig.distToLastSplitPoint);
        console.log(message+" distToLastBranchPoint:"+sig.distToLastBranchPoint);
        console.log(message+" movedFromDirection:"+sig.movedFromDirection);
    }

    return {
        reset : reset,
        createNeuronSeedSignal : createNeuronSeedSignal,
        processAll : processAll,
        getSignals : getSignals
    };

}());