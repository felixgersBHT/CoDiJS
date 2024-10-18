var Util = (function () {
    "use strict";

    /**
     * Load JSON object from file via Ajax.
     *
     * Extension json is added automatically.
     */
    function loadJSON(path, filename) {
        var url = path+"/"+filename+".json";
        var json = undefined;
        var httpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                // The response is received.
                var done = 4, ok = 200;
                if (this.readyState === done && this.status === ok) {
                    //alert(this.responseText);
                    json = JSON.parse(this.responseText);
                } else {
                    alert('There was a problem with the load request.');
                }
            } else {
                // Still not ready.
            }
        };
        httpRequest.open("GET", url, true);
        httpRequest.send();

        return json;
    }

    /**
     * Save object as JSON to file via Ajax.
     * 
     * Extension json is added automatically.
     */
    function saveJSON(obj, path, filename, addDate){
        var date = "";
        if(addDate === true) {
            var d =  new Date();
            date = "_"+
                d.getFullYear()+"-"+
                d.getMonth()+"-"+
                d.getDate()+"_"+
                d.getHours()+"-"+
                d.getMinutes()+"-"+
                d.getSeconds();
        }
        var url = "./php/ajax_post_json.php";
        var file = "../"+path+"/"+filename+date+".json";
        console.log("save file:"+file);

        var json = JSON.stringify(obj);
        var postText = "pw=CoDi&file="+file+"&content="+json;

        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE) {
                // The response is received.
                var done = 4, ok = 200;
                if (this.readyState === done && this.status === ok) {
                    //alert(this.responseText);
                } else {
                    alert('There was a problem with the save request.');
                    return false;
                }
            } else {
                // Still not ready.
            }
        };
        httpRequest.open("POST", url, true);
        httpRequest.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
        //httpRequest.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        httpRequest.send(postText);
        
        return true;
    }

    function roundVecToSting(vec) {
        var i;
        var str = "( ";
        for(i=0;i<3;i++){
            str += Math.round(vec[i]*10)+" ";
        }
        str += ")";
        return str;
    }

    return {
        loadJSON : loadJSON,
        saveJSON : saveJSON,
        roundVecToSting : roundVecToSting
    };

} ());