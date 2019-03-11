/// <reference path="webgl.d.ts" />

let hero = class {
    constructor(gl, pos) {
        this.positionBuffer = gl.createBuffer();
        this.jump = false;
        this.speed = 0.2;
        this.on_train = false;
        this.jetpack = false;
        this.sneaker = false;
        this.acceleration = 0;
        this.pos = pos;
        this.bounding_box = {
            len_x : 1.5,
            len_y : 1.85,
            len_z : 0.2,
            x : pos[0],
            y : pos[1],
            z : pos[2],
          }
        this.parts = [];

        this.parts.push(new cube(gl, pos, './images/body.jpg', 1, 1, 0.2));
        this.parts.push(new cube(gl, [pos[0], pos[1] + 0.75, pos[2]], './images/hair.jpg', 0.5, 0.5, 0.2));
        this.parts.push(new cube(gl, [pos[0] + 0.625, pos[1] + 0.25, pos[2]], './images/arms.jpg', 0.25, 0.5, 0.2));
        this.parts.push(new cube(gl, [pos[0] - 0.625, pos[1] + 0.25, pos[2]], './images/arms.jpg', 0.25, 0.5, 0.2));
        this.parts.push(new cube(gl, [pos[0] + 0.25, pos[1] - 0.85, pos[2]], './images/legs.jpg', 0.3, 0.7, 0.2));
        this.parts.push(new cube(gl, [pos[0] - 0.25, pos[1] - 0.85, pos[2]], './images/legs.jpg', 0.3, 0.7, 0.2));
    }

    tick() {
        this.bounding_box = {
            len_x : 1.5,
            len_y : 1.85,
            len_z : 0.2,
            x : this.pos[0],
            y : this.pos[1],
            z : this.pos[2],
          }
          this.parts[0].pos = this.pos;
          this.parts[1].pos = [this.pos[0], this.pos[1] + 0.75, this.pos[2]];
          this.parts[2].pos = [this.pos[0] + 0.625, this.pos[1] + 0.25, this.pos[2]];
          this.parts[3].pos = [this.pos[0] - 0.625, this.pos[1] + 0.25, this.pos[2]];
          this.parts[4].pos = [this.pos[0] + 0.25, this.pos[1] - 0.85, this.pos[2]];
          this.parts[5].pos = [this.pos[0] - 0.25, this.pos[1] - 0.85, this.pos[2]];
    };

    drawPlayer(gl, projectionMatrix, programInfo, deltaTime) {
        let x = 0;
        for (x of this.parts) {
            x.drawCube(gl, projectionMatrix, programInfo, deltaTime);
        }
    }
};
