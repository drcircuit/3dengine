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
    let zs = [];
    function zcompare(a, b) {
        let aavg = (a.v[0].z+a.v[1].z+a.v[2].z)/3;
        let bavg = (b.v[0].z+b.v[1].z+b.v[2].z)/3;

        if(!zs.includes(a.v[0].z)){
            zs.push(a.v[0].z);
        }     
        aavg /= 3;
        bavg /= 3;
        if (aavg < bavg)
            return 1;
        if (aavg > bavg)
            return -1;
        return 0;
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
    
    function triangle(vertices){
        vertices = vertices ||  [
            dcl.vector(0,0,0),
            dcl.vector(1,0,0),
            dcl.vector(0,1,0)
        ];
        return {
            v:vertices,
            matrixmul:function(matrix){
                return triangle(
                    [
                        vertices[0].matrixmul(matrix),
                        vertices[1].matrixmul(matrix),
                        vertices[2].matrixmul(matrix)
                    ]);
            },
            normalize: function(){
                v1 = vertices[0].div(vertices[0].w);
                v2 = vertices[1].div(vertices[1].w);
                v3 = vertices[2].div(vertices[2].w);
                return triangle([v1,v2,v3]);
            },
            col: WHITE
        };
    }
    
    function mesh(tris){
        return {
            tris:tris
        };
    }

    
    function drawpixel(x,y,c){
        let ix = 4*(x + y*framebuffer.width);

        framebuffer.data[ix] = c.r;
        framebuffer.data[ix+1] = c.g;
        framebuffer.data[ix+2] = c.b;
        framebuffer.data[ix+3] = Math.floor(c.a.map(0,1,0,255));
    }
    function setup() {
        scr = dcl.setupScreen(640 ,400);
        framebuffer = new ImageData(scr.width, scr.height);
        scr.setBgColor('black');
        document.body.style.backgroundColor = 'gray';      
        //obj = cube();
        let znear = 0.1;
        let zfar = 1000;
        let fov = 90;
        let aspect = scr.height/scr.width;
        projmat = projectionmatrix(fov,aspect,znear,zfar);

    }
    function filltriangle(tri,col){
        tri.v.sort(compare);
        let s,e,dx1,dx2,dx3;
        let a = tri.v[0].floor();
        let b = tri.v[1].floor();
        let c = tri.v[2].floor();
        s = a;
        e = a;
        if(b.y-a.y>0){
            dx1 = (b.x-a.x)/(b.y-a.y);
        } else {
            dx1 = 0;
        }
        if(c.y-a.y >0){
            dx2 = (c.x-a.x)/(c.y-a.y);
        } else {
            dx2 = 0;
        }
        if(c.y-b.y > 0){
            dx3 = (c.x-b.x)/(c.y-b.y);
        } else {
            dx3 = 0;
        }
        if(dx1>dx2){
            for(;s.y<=b.y;s.y++){
                e.y++;
                s.x += dx2;
                e.x += dx1;
                bresenline(s.x,e.x,s.y,e.y,col);
            }
            e = b;
            for(;s.y<=c.y;s.y++){
                e.y++;
                s.x+=dx2;
                e.x+=dx3;
                bresenline(s.x,e.x,s.y,e.y,col);
            }
        } else {
            for(;s.y<=b.y;s.y++){
                e.y++;
                s.x+=dx1;
                e.x+=dx2;
                bresenline(s.x,e.x,s.y,e.y,col);
            }
            s=b;
            for(;s.y<=c.y;s.y++){
                e.y++;
                s.x+=dx3;
                e.x+=dx2;
                bresenline(s.x,e.x,s.y,e.y,col);
            }
        }
    }

    function drawlinefast(x1,x2,y,c){
        x1 = floor(x1);
        x2 = floor(x2);
        y = floor(y);
        if(x1<x2){
            for(;x1<=x2;x1++){
                drawpixel(x1,y,c);
            }
        } else {
            for(;x2<=x1;x2++){
                drawpixel(x1,y,c);
            }
        }
        let d = x2-x1;
        
    }
    // plotLineHigh(x0,y0, x1,y1)
    // dx = x1 - x0
    // dy = y1 - y0
    // xi = 1
    // if dx < 0
    //     xi = -1
    //     dx = -dx
    // end if
    // D = 2*dx - dy
    // x = x0

    // for y from y0 to y1
    //     plot(x,y)
    //     if D > 0
    //     x = x + xi
    //     D = D - 2*dy
    //     end if
    //     D = D + 2*dx
    //     
    // plotLineLow(x0,y0, x1,y1)
    // dx = x1 - x0
    // dy = y1 - y0
    // yi = 1
    // if dy < 0
    //     yi = -1
    //     dy = -dy
    // end if
    // D = 2*dy - dx
    // y = y0

    // for x from x0 to x1
    //     plot(x,y)
    //     if D > 0
    //     y = y + yi
    //     D = D - 2*dx
    //     end if
    //     D = D + 2*dy

    // plotLine(x0,y0, x1,y1)
    // if abs(y1 - y0) < abs(x1 - x0)
    //     if x0 > x1
    //     plotLineLow(x1, y1, x0, y0)
    //     else
    //     plotLineLow(x0, y0, x1, y1)
    //     end if
    // else
    //     if y0 > y1
    //     plotLineHigh(x1, y1, x0, y0)
    //     else
    //     plotLineHigh(x0, y0, x1, y1)
    //     end if
    // end if
    function bresenline(x1,y1,x2,y2,c){
        x1 = round(x1);
        x2 = round(x2);
        y1 = round(y1);
        y2 = round(y2);
        if(x1>x2){
            let t = x1;
            x1 = x2;
            x2 = t;
        }
        if(y1>y2){
            let t = y1;
            y1 = y2;
            y2 = t;
        }
        let dx,dy;
        dx = x2-x1;
        dy = y2-y1;
        let d = 2*dy-dx;
        let y = y1;
        for(let x=x1;x<=x2;x++){
            drawpixel(x,y,c);
            if(d>0){
                y = y + 1;
                d = d-2*dx;
            }
            d = d + 2*dy;
        }
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
    function drawwireframe(tri,c){
        bresenline(tri.v[0].x,tri.v[0].y,tri.v[1].x,tri.v[1].y,c);
        bresenline(tri.v[1].x,tri.v[1].y,tri.v[2].x,tri.v[2].y,c);
        bresenline(tri.v[0].x,tri.v[0].y,tri.v[2].x,tri.v[2].y,c);
    }
    function copyTri(t){
        return triangle([
            dcl.vector(t.p[0].x,t.p[0].y,t.p[0].z),
            dcl.vector(t.p[1].x,t.p[1].y,t.p[1].z),
            dcl.vector(t.p[2].x,t.p[2].y,t.p[2].z)
        ]);
    }
    
    function fequals(a,b,delta){
        delta = delta || 0.1;
        return Math.abs(b-a)<delta;
    }
    function drawshaded(tri,col){
        let dx1, dx2, dx3;
        let sorted = tri.v.sort(compare);
        let a = sorted[0].floor();
        let b = sorted[1].floor();
        let c = sorted[2].floor();
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
        if(dx1>=dx2){
            for(;s.y<=b.y;s.y++){
                drawlinei(s.x,s.y,e.x,e.y,col);
                e.y++;
                s.x+=dx2;
                e.x+= dx1;
            }
            e = dcl.vector(b.x,b.y,b.z);
            for(;s.y<=c.y;s.y++){
                drawlinei(s.x,s.y,e.x,e.y,col);
                e.y++;
                s.x += dx2;
                e.x += dx3;
            }
        } else {
            for(;s.y<= b.y;s.y++){
                drawlinei(s.x,s.y,e.x,e.y,col);
                e.y++;
                s.x += dx1;
                e.x += dx2;
            }
            s = dcl.vector(b.x, b.y, b.z);
            for(;s.y<=c.y;s.y++){
                drawlinei(s.x,s.y, e.x,e.y,col);
                e.y++;
                s.x += dx3;
                e.x+= dx2;
            }
        }
    }
    function getColor(l){
        let pixelbw = Math.floor(l*13);
        
        let darkbase = 64;
        let lightbase = 128;
        let whitebase = 255;
        let c;
        switch(pixelbw){
            case 0:
                return dcl.color(0,0,0);
            case 1:
                c = Math.floor(darkbase*0.25);
                return dcl.color(c,c,c);
            case 2:
                c = Math.floor(darkbase*0.5);
                return dcl.color(c,c,c);
            case 3:
                c = Math.floor(darkbase*0.75);
                return dcl.color(c,c,c);
            case 4:
                c = Math.floor(darkbase);
                return dcl.color(c,c,c);
            case 5:
                c = Math.floor(lightbase*0.25);
                return dcl.color(c,c,c);
            case 6:
                c = Math.floor(lightbase*0.5);
                return dcl.color(c,c,c);
            case 7:
                c = Math.floor(lightbase*0.75);
                return dcl.color(c,c,c);
            case 8:
                c = Math.floor(lightbase);
                return dcl.color(c,c,c);
            case 9:
                c = Math.floor(whitebase*0.25);
                return dcl.color(c,c,c);
            case 10:
                c = Math.floor(whitebase*0.5);
                return dcl.color(c,c,c);
            case 11:
                c = Math.floor(whitebase*0.75);
                return dcl.color(c,c,c);
            case 12:
                c = Math.floor(whitebase);
                return dcl.color(c,c,c);
            default:
                return dcl.color(0,0,0);
            
        }
    }
    function lookAtMatrix(o,vp){
        let m = matrxi();

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
        
        //theta = (60);
        start = t;
        let halftheta = theta/2;
        let quartertheta = theta/4;
        let worldmatrix = dcl.matrix();
        worldmatrix = worldmatrix.mul(dcl.matrix.rotation.z(theta));
        worldmatrix = worldmatrix.mul(dcl.matrix.rotation.x(halftheta));
        //worldmatrix = worldmatrix.mul(dcl.matrix.rotation.y(halftheta));
        worldmatrix = worldmatrix.mul(dcl.matrix.translation(0,0,3));
        let rasterizetris = [];
        let cols = [];
        obj.tris.forEach(function(tri){
            
            let translated = tri.matrixmul(worldmatrix);
            
            let line1 = translated.v[1].sub(translated.v[0]);
            let line2 = translated.v[2].sub(translated.v[0]);

            let normal = line1.cross(line2).norm();
            let viewplane = translated.v[0].sub(camera);
            let prod = normal.dot(viewplane);
            if(Math.round(prod)<0){
                let light = dcl.vector(0,0,-1,0).norm();
                
                let vproj = translated.matrixmul(projmat).normalize();
                let scalingvector = dcl.vector(scr.width/2,scr.height/2,1);
                let drawtri = triangle(
                    [
                        vproj.v[0].add(1,1).mul(scalingvector),
                        vproj.v[1].add(1,1).mul(scalingvector),
                        vproj.v[2].add(1,1).mul(scalingvector)
                    ]);
                let dp = normal.dot(light);
                let col = Math.floor(dp.map(0.2,1,0,255));
                if(col<0){
                    col = 0;
                }
                if(col > 255){
                    col = 255;
                }
                drawtri.col = dcl.pallette.gray[col];
                if(!drawtri.col){
                    console.log("balle");
                }
                cols.push(light.dot(normal));
                rasterizetris.push(drawtri);
            }
        });
        zs = [];
        rasterizetris.sort(zcompare);
        for(let i =0;i<rasterizetris.length;i++){
            let drawtri = rasterizetris[i];
            //filltriangle(drawtri, drawtri.col);
            drawwireframe(drawtri,drawtri.col);
        }
        scr.ctx.putImageData(framebuffer,0,0);        
        requestAnimationFrame(draw);
        
    }
    function loadobj(url, cb) {
        let rq = new XMLHttpRequest();
        rq.open("GET", url);

        rq.addEventListener("load", function (res) {
            let lines = rq.responseText.split("\n");
            let tris = [];
            let verts = [];
            let lowz = 0;
            lines.forEach(function (l) {
                if (l.substr(0, 1) === "v") {
                    //read vertex data from obj file
                    let d = l.split(" ");
                    let x = Number(d[1]);
                    let y = Number(d[2]);
                    let z = Number(d[3]);
                    if (z < lowz) {
                        lowz = z;
                    }
                    verts.push(dcl.vector(x, y, z, 1));
                }
                if (l.substr(0, 1) === "f") {
                    //read face data from obj file
                    let d = l.split(" ");
                    vidx1 = Number(d[1]) - 1;
                    vidx2 = Number(d[2]) - 1;
                    vidx3 = Number(d[3]) - 1;
                    let v1 = verts[vidx1];
                    let v2 = verts[vidx2];
                    let v3 = verts[vidx3];
                    tris.push(triangle([v1, v2, v3]));
                }
            });
            cb(mesh(tris));
        });
        rq.send();
    }
    loadobj("gizmo.obj", function (mesh) {
        obj = mesh;
        setup();
        draw(0);
    });
})();