App = ( function() {

    const growthSteps = 1000;
    const growthStepDelay = 1; // 25 // In ms.
    //const runSteps = 200;
    //const runStepDelay = 0; // In ms.
    // Rotate the camera after growth is ready.
    const autoRotateCamera = false;

    function start() {
        init();
        grow(growthStepDelay);
        //UI.autoRotateCamera();
        //UI.stopAutoRotateCamera();
        run();
    }

    function init(){
        GA.init();
        CA.init();
        Stats.init();
        Geo.init();
        Vis.init();
        UI.init();
        GUI.init();
        Display.init();
    }

    function grow(stepDelay){
        //NN.setNeuronPositions([Vis.getViewportCenter()],[[1,0,0]]);
        NN.setNeuronPositionsRandomInViewport(50);
        //NN.setNeuronPositionsRandomInViewport(1);
        //NN.setNeuronPositionsInLayers();

        if(stepDelay === 0) {
            NN.grow(growthSteps);
            Vis.update();
            Stats.grow.display();
            Stats.geometry.display();
        } else {
            var stepCounter = 0;
            var stepFkt = function(){
                NN.grow(1);
                Vis.update();
                Stats.grow.display();
                stepCounter++;
                if(stepCounter == growthSteps) { 
                    clearInterval(id);
                    Stats.geometry.display();
                    if(autoRotateCamera)
                        UI.autoRotateCamera();
                }
            };
            var id = setInterval( stepFkt, stepDelay );
        }
    }

    function run(){
        NN.run();
    }

    // Interface.
    return {
        start: start,
        grow: grow,
        run: run
    };

}());