/*
 *The MIT License (MIT)
 *
 *Copyright (c) 2013 Hubert Eichner
 *
 *Permission is hereby granted, free of charge, to any person obtaining a copy
 *of this software and associated documentation files (the "Software"), to deal
 *in the Software without restriction, including without limitation the rights
 *to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *copies of the Software, and to permit persons to whom the Software is
 *furnished to do so, subject to the following conditions:
 *
 *The above copyright notice and this permission notice shall be included in
 *all copies or substantial portions of the Software.
 *
 *THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *THE SOFTWARE.
 */


/**** A class representing a body. Notably, contains state, forces, vertices ****/
var Body = function(vertices, center, theta, mInv, moiInv, vLin, vAng) {
  this.vertices = vertices; // array of vertices relative to center
  this.center = center; // center of mass
  this.theta = theta;   // rotation angle
  this.mInv = mInv;     // inverse of the mass
  this.moiInv = moiInv; // inverse of the moment of inertia
  this.vLin = vLin;     // linear (translational) velocity
  this.vAng = vAng;     // angular (rotational) velocity
  this.forces = [];     // array of forces...
  this.forcePoints = [];// ... and the vertex index of force application.
                        // undefined is center of mass.
  this.addForce = function(force, forcePoint) {
    this.forces.push(force);
    this.forcePoints.push(forcePoint);
  };
  this.getRotationMatrix = function() {
    return [[Math.cos(this.theta), -Math.sin(this.theta)],
            [Math.sin(this.theta),  Math.cos(this.theta)]];
  };
  this.getVerticesInWorldCoords = function() {
    var vertsAbsolute = [];
    var rotationMatrix = this.getRotationMatrix();
    for (var i=0; i<this.vertices.length; i++) {
      vertsAbsolute.push(MV.VpV(this.center,
                                MV.MxV(rotationMatrix, this.vertices[i])));
    }
    return vertsAbsolute;
  };
};

/**** The World class. Contains bodies and offers function step() for progressing ****/
var World = function() {
  this.dt = 1/60;
  this.bodies = [];
  this.t = 0;
  
  this.step = function() {
    /***** 1. integrate forces/torques to compute new velocities *****/
    for (var i=0; i<this.bodies.length; i++) {
      var mInv = this.bodies[i].mInv;
      if (mInv == 0) continue;
      
      var moiInv = this.bodies[i].moiInv;
      var rotationMatrix = this.bodies[i].getRotationMatrix();
      // each force independently leads to a change in linear and angular
      // velocity; i.e., add up all these changes by iterating over forces
      for (var j=0; j<this.bodies[i].forces.length; j++) {
        var force = this.bodies[i].forces[j];
        var forcePoint = this.bodies[i].forcePoints[j];
        // linear motion is simply the integrated force, divided by the mass
        this.bodies[i].vLin = MV.VpV(this.bodies[i].vLin, MV.SxV(this.dt * mInv, force));
        // angular motion depends on the force application point as well via the torque
        if (forcePoint !== undefined) { // 'undefined' means center of mass
          var torque = MV.cross2(MV.MxV(rotationMatrix, this.bodies[i].vertices[forcePoint]), force);
          this.bodies[i].vAng += this.dt * moiInv * torque;
        }
      }
    }
    
    /***** 2. update positions *****/
    for (var i=0; i<this.bodies.length; i++) {
      this.bodies[i].center = MV.VpV(this.bodies[i].center, MV.SxV(this.dt, this.bodies[i].vLin));
      this.bodies[i].theta += this.dt * this.bodies[i].vAng;
    }
  };
  
  this.addBody = function(body) {
    this.bodies.push(body);
  }
};
