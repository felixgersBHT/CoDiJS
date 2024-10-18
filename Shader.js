var SHADER = {

vertexshader : `

attribute vec3 aPosition;

uniform float uPointSize;

uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

void main(){
    gl_Position = uPMatrix * uMVMatrix * vec4(aPosition, 1.0);
    gl_PointSize = uPointSize;
}
`,


fragmentshader : `

precision mediump float;
uniform vec4 uColor;

void main() {
    // Keep error cells.
    //vec4 errorCellColor = vec4(255,165,0,255);
    //if(uColor == errorCellColor){
    //	discard;
    //}
    gl_FragColor = uColor;
}
`

}
