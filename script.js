window.onload = function init()
{
  var canvas = document.getElementById("c");
  var gl = canvas.getContext("webgl");
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  // Prepare empty buffer objects for vertex coordinates, colors, and normals
  model = initVertexBuffers(gl, program);
  var P = perspective(90.0, 1.0, 0.001, 1000.0);
  var mousepose=vec3(0.0, 0.0, 0.0)
  canvas.addEventListener("mousemove", function(ev) {
    console.log('oki')
    var box=event.target.getBoundingClientRect();
    mousepose = vec2(2*(ev.clientX-box.left)/canvas.width-1,
    2*(canvas.height-ev.clientY+box.top)/canvas.height-1);
    render();
  });

  var beta=0.0;
  var radius=10.0;

  function render(){
    requestAnimFrame(render);
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
      // OBJ and all MTLs are available
      g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }
    if (!g_drawingInfo) return;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.cos(beta), 0.0, radius*Math.sin(beta));

    var V = lookAt(eye,vec3(0.0,0.0,0.0), vec3(0.0,1.0,0.0));
    //V= mult(V, rotateX(-90));
    //V= mult(V, rotateZ(-90));
    //V=mult(V, rotateX(-30));
    //V=mult(V,translate(vec3(mousepose, 0.5)));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_ProjectionMatrix"), false, flatten(P));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_ModelMatrix"), false, flatten(V));

    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
  }
  // Start reading the OBJ file
  readOBJFile("hand2.obj", gl, model, 1, true);
  render();
}
  // Create a buffer object and perform the initial configuration
  function initVertexBuffers(gl) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    return o;
  }
  function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    return buffer;
  }

  var g_objDoc = null; // Info parsed from OBJ file
  var g_drawingInfo = null; // Info for drawing the 3D model with WebGL

  // Asynchronous file loading (request, parse, send to GPU buffers)
  function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status !== 404) {
        onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
      }
    }
      request.open('GET', fileName, true);// Create a request to get file
      request.send(); // Send the request
  }

  function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse);
    if (!result) {
      g_objDoc = null;
      g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    }
    g_objDoc = objDoc;
  }

  function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
    return drawingInfo;
   }
