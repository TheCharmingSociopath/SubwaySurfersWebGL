/// <reference path="webgl.d.ts" />

let coin = class {
    constructor(gl, pos) {
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        this.jump = false;
        this.speed = 0.2;
        this.acceleration = 0;

        this.positions = [];
        let arg = 0,
            arg1 = 0,
            a = 0.2,
            b = 0.2,
            n = 50;

        for (var i = 0; i < n; ++i) {
            this.positions.push(0.0);
            this.positions.push(0.0);
            this.positions.push(0.1);

            this.positions.push(a * Math.cos(arg));
            this.positions.push(a * Math.sin(arg));
            this.positions.push(0.1);

            arg += (2 * Math.PI) / n;

            this.positions.push(a * Math.cos(arg));
            this.positions.push(a * Math.sin(arg));
            this.positions.push(0.1);

            this.positions.push(0.0);
            this.positions.push(0.0);
            this.positions.push(-0.1);

            this.positions.push(b * Math.cos(arg1));
            this.positions.push(b * Math.sin(arg1));
            this.positions.push(-0.1);

            arg1 += (2 * Math.PI) / n;

            this.positions.push(b * Math.cos(arg1));
            this.positions.push(b * Math.sin(arg1));
            this.positions.push(-0.1);

            this.positions.push(a * Math.cos(arg - (2 * Math.PI) / n));
            this.positions.push(a * Math.sin(arg - (2 * Math.PI) / n));
            this.positions.push(0.1);

            this.positions.push(b * Math.cos(arg1 - (2 * Math.PI) / n));
            this.positions.push(b * Math.sin(arg1 - (2 * Math.PI) / n));
            this.positions.push(-0.1);

            this.positions.push(b * Math.cos(arg1));
            this.positions.push(b * Math.sin(arg1));
            this.positions.push(-0.1);

            this.positions.push(a * Math.cos(arg - (2 * Math.PI) / n));
            this.positions.push(a * Math.sin(arg - (2 * Math.PI) / n));
            this.positions.push(0.1);

            this.positions.push(a * Math.cos(arg));
            this.positions.push(a * Math.sin(arg));
            this.positions.push(0.1);

            this.positions.push(b * Math.cos(arg1));
            this.positions.push(b * Math.sin(arg1));
            this.positions.push(-0.1);
        }
        this.rotation = 0;

        this.pos = pos;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);

        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

        let textureCoordinates = [];
        arg = 0;
        arg1 = 0;
        a = 0.5;
        b = 0.5;

        for (var i = 0; i < 50; ++i) {
            textureCoordinates.push(0.5);
            textureCoordinates.push(0.5);

            textureCoordinates.push(0.5 + a * Math.cos(arg));
            textureCoordinates.push(0.5 + a * Math.sin(arg));

            arg += (2 * Math.PI) / n;

            textureCoordinates.push(0.5 + a * Math.cos(arg));
            textureCoordinates.push(0.5 + a * Math.sin(arg));

            textureCoordinates.push(0.5);
            textureCoordinates.push(0.5);

            textureCoordinates.push(0.5 + b * Math.cos(arg1));
            textureCoordinates.push(0.5 + b * Math.sin(arg1));

            arg1 += (2 * Math.PI) / n;

            textureCoordinates.push(0.5 + b * Math.cos(arg1));
            textureCoordinates.push(0.5 + b * Math.sin(arg1));

            for (let j = 0; j < 12; ++j)
                textureCoordinates.push(0.5);
        }

        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.textureCoordinates), gl.STATIC_DRAW);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
            gl.STATIC_DRAW);

        // Build the element array buffer; this specifies the indices
        // into the vertex arrays for each face's vertices.

        // const indexBuffer = gl.createBuffer();
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        // const indices = [
        //     0, 1, 2, 0, 2, 3, // front
        //     4, 5, 6, 4, 6, 7,
        //     8, 9, 10, 8, 10, 11,
        //     12, 13, 14, 12, 14, 15,
        //     16, 17, 18, 16, 18, 19,
        //     20, 21, 22, 20, 22, 23,
        // ];

        // // Now send the element array to GL

        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        //     new Uint16Array(indices), gl.STATIC_DRAW);

        this.buffer = {
            position: this.positionBuffer,
            textureCoord: textureCoordBuffer,
            // indices: indexBuffer,
        }
        this.texture = loadTexture(gl, 'images/coin.png');
    }

    drawCoin(gl, projectionMatrix, programInfo, deltaTime) {
        const modelViewMatrix = mat4.create();
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            this.pos
        );

        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [1, 0, 0]);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the texture coordinates from
        // the texture coordinate buffer into the textureCoord attribute.
        // tell webgl how to pull out the texture coordinates from buffer
        {
            const num = 2; // every coordinate composed of 2 values
            const type = gl.FLOAT; // the data in the buffer is 32 bit float
            const normalize = false; // don't normalize
            const stride = 0; // how many bytes to get from one set to the next
            const offset = 0; // how many bytes inside the buffer to start from
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.textureCoord);
            gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);

        // Set the shader uniforms

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        // Specify the texture to map onto the faces.

        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        {
            const vertexCount = 12 * 50;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
        }
    }
};