/** 3dengine */
(function(){
    var scr;
    let obj;
    let theta = 0;
    let start = 0;
    let projmat;
    let framebuffer;
    let camera = dcl.vector(0,0,0);

    function matrix(m){
        return {m:m || [
            [1,0,0,0],
            [0,1,0,0],
            [0,0,1,0],
            [0,0,0,1],
        ],isMatrix:true};
    }
    function compare(a,b) {
        if (a.y < b.y)
          return -1;
        if (a.y > b.y)
          return 1;
        return 0;
      }
    
    function matmul(v, m){
        let x = v.x * m.m[0][0]+v.y*m.m[1][0]+v.z*m.m[2][0]+m.m[3][0];
        let y = v.x * m.m[0][1]+v.y*m.m[1][1]+v.z*m.m[2][1]+m.m[3][1];
        let z = v.x * m.m[0][2]+v.y*m.m[1][2]+v.z*m.m[2][2]+m.m[3][2];
        let w = v.x * m.m[0][3]+v.y*m.m[1][3]+v.z*m.m[2][3]+m.m[3][3];
       
        return dcl.vector(x,y,z,w);
    }

    function matrixmatrixmul(a, b) {
        let m = [];
        for (let r = 0; r < a.m.length; r++) {
            let row = [];
            for (let c = 0; c < b.m[0].length; c++) {
                let n = 0;
                for (let br = 0; br < b.m.length; br++) {
                    n += a.m[r][br] * b.m[br][c];
                }
                row.push(n);
            }
            m.push(row);
        }
        return matrix(m);
    }

    function translationmatrix(x,y,z){
        let m = matrix();
        m.m[3][0] = x;
        m.m[3][1] = y;
        m.m[3][2] = z;
        return m;
    }
    function projectionmatrix(fov,aspect,znear,zfar){
        let fovrad = 1/Math.tan((fov/2).toRadians());
        let m = matrix();
        m.m[0][0] = aspect*fovrad;
        m.m[1][1] = fovrad;
        m.m[2][2] = zfar / (zfar-znear);
        m.m[3][2] = (-zfar *znear)/(zfar-znear);
        m.m[2][3] = 1;
        m.m[3][3] = 0;
        return m;
    }
    function rotationmatrixx(deg){
        let theta = deg.toRadians();
        let m = matrix();
        m.m[0][0] = 1;
        m.m[1][1] = cos(theta);
        m.m[1][2] = sin(theta);
        m.m[2][1] = -sin(theta);
        m.m[2][2] = cos(theta);
        m.m[3][3] = 1;
        return m;
    }
    function rotationmatrixy(deg){
        let theta = deg.toRadians();
        let m = matrix();
        m.m[0][0] = cos(theta);
        m.m[0][2] = sin(theta);
        m.m[1][1] = 1
        m.m[2][0] = -sin(theta);
        m.m[2][3] = cos(theta);
        m.m[3][3] = 1;
        return m;
    }
    function rotationmatrixz(deg){
        let theta = deg.toRadians();
        let m = matrix();
        m.m[0][1] = sin(theta);
        m.m[0][0] = cos(theta);
        m.m[1][0] = -sin(theta);
        m.m[1][1] = cos(theta);
        m.m[2][2] = 1;
        m.m[3][3] = 1;
        return m;
    }
    function triangle(vertices){
        return {
            v:vertices ? vertices : [
                dcl.vector(0,0,0),
                dcl.vector(1,0,0),
                dcl.vector(0,1,0)
            ]
        };
    }
    
    function mesh(tris){
        return {
            tris:tris
        };
    }

    function cube(){
        return mesh([
            //front
            triangle(
                [
                    dcl.vector(0,0,0),
                    dcl.vector(0,1,0),
                    dcl.vector(1,1,0),
                
                ]
            ),
            triangle(
                [
                    dcl.vector(0,0,0),
                    dcl.vector(1,1,0),
                    dcl.vector(1,0,0),
                
                ]
            ),
            //right
            triangle(
                [
                    dcl.vector(1,0,0),
                    dcl.vector(1,1,0),
                    dcl.vector(1,1,1),
                
                ]
            ),
            triangle(
                [
                    dcl.vector(1,0,0),
                    dcl.vector(1,1,1),
                    dcl.vector(1,0,1),
                
                ]
            ),
            //back
            triangle(
                [
                    dcl.vector(1,0,1),
                    dcl.vector(1,1,1),
                    dcl.vector(0,1,1),
                
                ]
            ),
            triangle(
                [
                    dcl.vector(1,0,1),
                    dcl.vector(0,1,1),
                    dcl.vector(0,0,1),
                
                ]
            ),
            //left
            triangle(
                [
                    dcl.vector(0,0,1),
                    dcl.vector(0,1,1),
                    dcl.vector(0,1,0),
                
                ]
            ),
            triangle(
                [
                    dcl.vector(0,0,1),
                    dcl.vector(0,1,0),
                    dcl.vector(0,0,0),
                
                ]
            ),
            //top
            triangle(
                [
                    dcl.vector(0,1,0),
                    dcl.vector(0,1,1),
                    dcl.vector(1,1,1),
                
                ]
            ),
            triangle(
                [
                    dcl.vector(0,1,0),
                    dcl.vector(1,1,1),
                    dcl.vector(1,1,0),
                
                ]
            ),
            //bottom
            triangle(
                [
                    dcl.vector(0,0,1),
                    dcl.vector(0,0,0),
                    dcl.vector(1,0,0),
                
                ]
            ),
            triangle(
                [
                    dcl.vector(0,0,1),
                    dcl.vector(1,0,0),
                    dcl.vector(1,0,1),
                
                ]
            ),
        ]);
    }
    function drawpixel(x,y,c){
        let ix = 4*(x + y*framebuffer.width);

        framebuffer.data[ix] = c.r;
        framebuffer.data[ix+1] = c.g;
        framebuffer.data[ix+2] = c.b;
        framebuffer.data[ix+3] = Math.floor(c.a.map(0,1,0,255));
    }
    function setup() {
        scr = dcl.setupScreen(512 ,512);
        framebuffer = new ImageData(scr.width, scr.height);
        scr.setBgColor('black');
        document.body.style.backgroundColor = 'gray';      
        obj = cube();
        let znear = 0.1;
        let zfar = 1000;
        let fov = 90;
        let aspect = scr.height/scr.width;
        projmat = projectionmatrix(fov,aspect,znear,zfar);

    }

    function equals(a,b){
        return Math.abs(b-a)< 0.1;
    }

    function drawline(x1,y1,x2,y2,c){
        c = c ? c : dcl.color(255,255,255,1);
        if(equals(x1,x2) && equals(y1,y2)){
            return;
        }

        let midx = (x2+x1)/2;
        let midy = (y2+y1)/2;

        drawline(x1,y1,midx,midy,c);
        drawline(midx+0.001,midy+0.001,x2,y2,c);
        // dcl.rect(midx,midy,1,1,"white");
        drawpixel(Math.floor(midx),Math.floor(midy),c);
    }
    function drawtriangle(tri,c){
        drawline(tri.v[0].x,tri.v[0].y,tri.v[1].x,tri.v[1].y,c);
        drawline(tri.v[1].x,tri.v[1].y,tri.v[2].x,tri.v[2].y,c);
        drawline(tri.v[0].x,tri.v[0].y,tri.v[2].x,tri.v[2].y,c);
    }
    function copyTri(t){
        return triangle([
            dcl.vector(t.p[0].x,t.p[0].y,t.p[0].z),
            dcl.vector(t.p[1].x,t.p[1].y,t.p[1].z),
            dcl.vector(t.p[2].x,t.p[2].y,t.p[2].z)
        ]);
    }
    function filltriangle(tri,col){
        let dx1, dx2, dx3;
        let sorted = tri.v.sort(compare);
        let a = sorted[0];
        let b = sorted[1];
        let c = sorted[2];
        if(b.y-a.y>=0){
            dx1 = (b.x-a.x)/(b.y-a.y);
        } else {
            dx1 = 0;
        }
        if(c.y-a.y>=0){
            dx2 = (c.x-a.x)/(c.y-a.y);
        } else {
            dx2 = 0;
        }
        if(c.y-b.y>=0){
            dx3 = (c.x-b.x)/(c.y-b.y);
        } else {
            dx3 = 0;
        }
        let s = dcl.vector(a.x,a.y,a.z);
        let e = dcl.vector(a.x,a.y,a.z);
        if(dx1>dx2){
            for(;s.y<=b.y;s.y++){
                drawline(s.x,s.y,e.x,e.y,col);
                e.y++;
                s.x+=dx2;
                e.x+= dx1;
            }
            e = dcl.vector(b.x,b.y,b.z);
            for(;s.y<=c.y;s.y++){
                drawline(s.x,s.y,e.x,e.y,col);
                e.y++;
                s.x += dx2;
                e.x += dx3;
            }
        } else {
            for(;s.y<= b.y;s.y++){
                drawline(s.x,s.y,e.x,e.y,col);
                e.y++;
                s.x += dx1;
                e.x += dx2;
            }
            s = dcl.vector(b.x, b.y, b.z);
            for(;s.y<=c.y;s.y++){
                drawline(s.x,s.y, e.x,e.y,col);
                e.y++;
                s.x += dx3;
                e.x+= dx2;
            }
        }
        
    }
    function clear(buffer){
        for(let i =0;i<buffer.data.length;i+=4){
            buffer.data[i] = 0;
            buffer.data[i+1] = 0;
            buffer.data[i+2] = 0;
            buffer.data[i+3] = 0;
        }
    }
    function draw(t){
        dcl.clear();
        clear(framebuffer);
        // Draw Tris
        let dt = t-start;
        
        
        theta += dt/10;
        
        //theta = (30);
        start = t;
        let halftheta = theta/2;
        let quartertheta = 0;
        let worldmatrix = dcl.matrix();
        worldmatrix = matrixmatrixmul(worldmatrix,rotationmatrixz(theta));
        worldmatrix = matrixmatrixmul(worldmatrix,rotationmatrixx(halftheta));
        // worldmatrix = matrixmatrixmul(worldmatrix,rotationmatrixy(quartertheta));
        worldmatrix = matrixmatrixmul(worldmatrix,translationmatrix(0,0,3));
        

        
        
        obj.tris.forEach(function(tri){
            // let trizrot = triangle([
            //     matmul(tri.v[0],mzrot),
            //     matmul(tri.v[1],mzrot),
            //     matmul(tri.v[2],mzrot)
            // ]);
            // let trizxrot = triangle([
            //     matmul(trizrot.v[0],mxrot),
            //     matmul(trizrot.v[1],mxrot),
            //     matmul(trizrot.v[2],mxrot)
            // ]);

            // // let trizxyrot = triangle([
            // //     matmul(trizxrot.v[0],myrot),
            // //     matmul(trizxrot.v[1],myrot),
            // //     matmul(trizxrot.v[2],myrot),
            // // ])
            // let translated = triangle([
            //     matmul2(trizxrot.v[0],translation),
            //     matmul2(trizxrot.v[1],translation),
            //     matmul2(trizxrot.v[2],translation)
            // ]);
            let translated = triangle([
                matmul(tri.v[0],worldmatrix),
                matmul(tri.v[1],worldmatrix),
                matmul(tri.v[2],worldmatrix),
            ]);            
            
            let line1 = dcl.vector(
                translated.v[1].x - translated.v[0].x,
                translated.v[1].y - translated.v[0].y,
                translated.v[1].z - translated.v[0].z
            );
            let line2 = dcl.vector(
                translated.v[2].x - translated.v[0].x,
                translated.v[2].y - translated.v[0].y,
                translated.v[2].z - translated.v[0].z
            );
            let normal = line1.cross(line2).norm();
            let viewplane = translated.v[0].sub(camera);
            let prod = viewplane.dot(normal);
            if(Math.round(prod)<0){
                let light = dcl.vector(0,-1,-1).norm();
                let col = Math.abs(Math.floor(normal.dot(light).map(0,1,50,255)));
                let vproj = triangle([
                    matmul(translated.v[0],projmat),
                    matmul(translated.v[1],projmat),
                    matmul(translated.v[2],projmat)]
                );
                vproj.v[0] = vproj.v[0].div(vproj.v[0].w);
                vproj.v[1] = vproj.v[1].div(vproj.v[1].w);
                vproj.v[2] = vproj.v[2].div(vproj.v[2].w);
                let scalingvector = dcl.vector(scr.width/2,scr.height/2);
                let drawtri = triangle(
                    [
                        vproj.v[0].add(1,1).mul(scalingvector),
                        vproj.v[1].add(1,1).mul(scalingvector),
                        vproj.v[2].add(1,1).mul(scalingvector)
                    ]);
                filltriangle(drawtri, dcl.color(col,col,col));
                //drawtriangle(drawtri,dcl.color(255,0,0));
            }
        });
        scr.ctx.putImageData(framebuffer,0,0);        
        requestAnimationFrame(draw);
        
    }
    setup();
    draw(0);
})();