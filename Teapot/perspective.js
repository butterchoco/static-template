"use strict";

var program;
var canvas, render, gl;

var NumVertices  = 36;
var numDivisions = 5;

var pointsArray = [];
var colorsArray = [];

var bezier = function(u) {
    var b = [];
    var a = 1-u;
    b.push(u*u*u);
    b.push(3*a*u*u);
    b.push(3*a*a*u);
    b.push(a*a*a);


    return b;
}

var index = 0;

var points = [];
var normals = [];

var modelViewMatrix = [];
var projectionMatrix = [];
var normalMatrix, normalMatrixLoc;

var axis =0;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var perspectiveTheta = [0, 0, 0];
var dTheta = 5.0;

var flag = true;

var near = 0.3;
var far = 3.0;
var radius = 4.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio

var mvMatrix, pMatrix;
var modelView, projection;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    aspect =  canvas.width/canvas.height;

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    this.console.log(vertices);
    // this.console.log(indices[0][8]);
    var h = 1.0/numDivisions;
    var patch = new Array(numTeapotPatches);
    for(var i=0; i<numTeapotPatches; i++) {
        patch[i] = new Array(16);
    }
    for(var i=0; i<numTeapotPatches; i++) {
        for(var j=0; j<16; j++) {
            // this.console.log("i: " + i + " j: " + j);
            // this.console.log(vertices[indices[i][j]]);
            patch[i][j] = vec4([vertices[indices[i][j]][0],
            vertices[indices[i][j]][2],
            vertices[indices[i][j]][1], 1.0]);
        }
    }

    for ( var n = 0; n < numTeapotPatches; n++ ) {


        var data = new Array(numDivisions+1);
        for(var j = 0; j<= numDivisions; j++) data[j] = new Array(numDivisions+1);
        for(var i=0; i<=numDivisions; i++) for(var j=0; j<= numDivisions; j++) {
            data[i][j] = vec4(0,0,0,1);
            var u = i*h;
            var v = j*h;
            var t = new Array(4);
            for(var ii=0; ii<4; ii++) t[ii]=new Array(4);
            for(var ii=0; ii<4; ii++) for(var jj=0; jj<4; jj++)
                t[ii][jj] = bezier(u)[ii]*bezier(v)[jj];
    
    
            for(var ii=0; ii<4; ii++) for(var jj=0; jj<4; jj++) {
                var temp = vec4(patch[n][4*ii+jj]);
                temp = scale( t[ii][jj], temp);
                data[i][j] = add(data[i][j], temp);
                data[i][j][3] = 1;
            }
        }
    
        var ndata = [];
        for(var i = 0; i<= numDivisions; i++) ndata[i] = new Array(4);
        for(var i = 0; i<= numDivisions; i++) for(var j = 0; j<= numDivisions; j++) ndata[i][j] = new Array(4);
    
        document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
        document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
        document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
        document.getElementById("ButtonT").onclick = function(){flag = !flag;};
    
        for(var i=0; i<numDivisions; i++) for(var j =0; j<numDivisions; j++) {
    
    
          var t1 = subtract(data[i+1][j], data[i][j]);
          var t2  =subtract(data[i+1][j+1], data[i][j]);
          var normal = cross(t1, t2);
    
           normal = normalize(normal);
           normal[3] =  0;
    
            points.push(data[i][j]);
            normals.push(normal);
    
    
            points.push(data[i+1][j]);
            normals.push(normal);
    
    
            points.push(data[i+1][j+1]);
            normals.push(normal);
    
            points.push(data[i][j]);
            normals.push(normal);
    
    
            points.push(data[i+1][j+1]);
            normals.push(normal);
    
    
            points.push(data[i][j+1]);
            normals.push(normal);
    
            index+= 6;
            }
        }

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
        
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    projectionMatrix = ortho(-4, 4, -4, 4, -200, 200);
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    var lightPosition = vec4(10.0, 10.0, 10.0, 0.0 );
    var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
    var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

    var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
    var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
    var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
    var materialShininess = 10.0;

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct ));
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition ));
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );

    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );


    modelView = gl.getUniformLocation( program, "modelView" );
    projection = gl.getUniformLocation( program, "projection" );

// buttons for viewing parameters

    document.getElementById("Button1").onclick = function(){near  *= 1.1; far *= 1.1;};
    document.getElementById("Button2").onclick = function(){near *= 0.9; far *= 0.9;};
    document.getElementById("Button3").onclick = function(){radius *= 2.0;};
    document.getElementById("Button4").onclick = function(){radius *= 0.5;};
    document.getElementById("Button5").onclick = function(){theta += dr;};
    document.getElementById("Button6").onclick = function(){theta -= dr;};
    document.getElementById("Button7").onclick = function(){phi += dr;};
    document.getElementById("Button8").onclick = function(){phi -= dr;};

    render();
}


var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    mvMatrix = lookAt(eye, at , up);
    pMatrix = perspective(fovy, aspect, near, far);
    console.log(theta)
    if(flag) perspectiveTheta[axis] += 0.5;

    modelViewMatrix = mat4();

    modelViewMatrix = mult(modelViewMatrix, rotate(perspectiveTheta[xAxis], [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(perspectiveTheta[yAxis], [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(perspectiveTheta[zAxis], [0, 0, 1]));

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );
    
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );


    gl.drawArrays( gl.TRIANGLES, 0, index );
    requestAnimFrame(render);
}
