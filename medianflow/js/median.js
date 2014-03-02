var video = document.getElementById('webcam');
var video_canvas = document.getElementById('video_canvas');
//$(window).load(function() {startVideo()});
"use strict";
function startVideo(callback) {
    try {
        compatibility.getUserMedia({video: true}, function (stream) {
            try {
                video.src = compatibility.URL.createObjectURL(stream);
            } catch (error) {
                video.src = stream;
            }
            setTimeout(function () {
                document.getElementById('livedemo').style.display = 'block';
                video.play();
                demo_app();
                compatibility.requestAnimationFrame(tick);
            }, 500);
            callback({success: true});
        }, function (error) {
            callback({success: false, rtcerror: true, message: "Your webcam (WebRTC) is not available."});
        });
    } catch (error) {
        callback({success: false, rtcerror: false, message: "Hmm. There is a problem connecting to your webcamera. Sorry!"});
    }
}

function stopVideo() {
    video.pause();
    video.src = null;
}

var stat = new profiler();

var gui,options,video_ctx,canvasWidth,canvasHeight;
var curr_img_pyr, prev_img_pyr, point_count, point_status, prev_xy, curr_xy;
var box, mousedown, median_x, median_y, median_s, ratio;

var demo_opt = function(){
    this.win_size = 20;
    this.max_iterations = 30;
    this.epsilon = 0.01;
    this.min_eigen = 0.001;
    this.point_density = 5;
}



function demo_app() {
    canvasWidth  = video_canvas.width;
    canvasHeight = video_canvas.height;
    video_ctx = video_canvas.getContext('2d');

    video_ctx.fillStyle = "rgb(0,255,0)";
    video_ctx.strokeStyle = "#58B4DB";
    video_ctx.lineWidth=10;

    curr_img_pyr = new jsfeat.pyramid_t(3);
    prev_img_pyr = new jsfeat.pyramid_t(3);
    curr_img_pyr.allocate(640, 480, jsfeat.U8_t|jsfeat.C1_t);
    prev_img_pyr.allocate(640, 480, jsfeat.U8_t|jsfeat.C1_t);

    point_count = 0;
    point_status = new Uint8Array(100);
    prev_xy = new Float32Array(100*2);
    curr_xy = new Float32Array(100*2);

    options = new demo_opt();

    mousedown = false;
    box = new Float32Array(4);
    ratio = 1;
}

function tick() {
    compatibility.requestAnimationFrame(tick);
    stat.new_frame();
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        video_ctx.drawImage(video, 0, 0, 640, 480);
        var imageData = video_ctx.getImageData(0, 0, 640, 480);

        // swap flow data
        var _pt_xy = prev_xy;
        prev_xy = curr_xy;
        curr_xy = _pt_xy;
        var _pyr = prev_img_pyr;
        prev_img_pyr = curr_img_pyr;
        curr_img_pyr = _pyr;

        //stat.start("grayscale");
        jsfeat.imgproc.grayscale(imageData.data, curr_img_pyr.data[0].data);
        //stat.stop("grayscale");

        //stat.start("build image pyramid");
        curr_img_pyr.build(curr_img_pyr.data[0], true);
        //stat.stop("build image pyramid");

        //stat.start("optical flow lk");
        jsfeat.optical_flow_lk.track(prev_img_pyr, curr_img_pyr, prev_xy, curr_xy, point_count, options.win_size|0, options.max_iterations|0, point_status, options.epsilon, options.min_eigen);
        //stat.stop("optical flow lk");

        //stat.start("median flow");
        if (box[0]+box[2] == 0) document.getElementById('liveinstructions').style.display = "block";
        else document.getElementById('liveinstructions').style.display = "none";
        updateBoundingBox(video_ctx);
        prune_oflow_points(video_ctx);
        generate_points(box);
        //stat.stop("median flow");

        $('#log').html(stat.log());// + '<br/>Median x, y: ' + median_x + ", " + median_y + '<br/>Median scale: ' + median_s);
    }
}

function add_point(x, y){
    curr_xy[point_count<<1] = x;
    curr_xy[(point_count<<1)+1] = y;
    point_count++;
}

function on_canvas_down(e) {
    var coords = video_canvas.relMouseCoords(e);
    if(coords.x > 0 & coords.y > 0 & coords.x < canvasWidth & coords.y < canvasHeight) {
        box = new Float32Array(4);
        mousedown = true;
        box[0] = coords.x;
        box[1] = coords.y;
        box[2] = coords.x;
        box[3] = coords.y;
    }
}
function on_canvas_move(e) {
    if (!mousedown) return;
    var coords = video_canvas.relMouseCoords(e);
    if(coords.x > 0 & coords.y > 0 & coords.x < canvasWidth & coords.y < canvasHeight) {
        box[2] = coords.x;
        box[3] = coords.y;
    }
}
function on_canvas_up(e) {
    if (!mousedown || box[0]+box[2] == 0) return;
    box = [Math.min(box[0], box[2]), Math.min(box[1], box[3]), Math.max(box[0], box[2]), Math.max(box[1], box[3])]
    generate_points(box);
    //RATIO width over height. used to ensure that ratio doesn't slide over til due to rounding.
    ratio = Math.abs(box[0]-box[2])/Math.abs(box[1]-box[3]);
    mousedown = false;
}
video_canvas.addEventListener('mousedown', on_canvas_down, false);
video_canvas.addEventListener('mousemove', on_canvas_move, false);
video_canvas.addEventListener('mouseup', on_canvas_up, false);

function draw_point(video_ctx, x, y) {
    video_ctx.beginPath();
    video_ctx.arc(x, y, 3, 0, Math.PI*2, true); 
    video_ctx.closePath();
    video_ctx.fill();
}

function prune_oflow_points(video_ctx) {
    var n = point_count;
    var i=0,j=0;

    for(; i < n; ++i) {
        if(point_status[i] == 1) {
            if(j < i) {
                curr_xy[j<<1] = curr_xy[i<<1];
                curr_xy[(j<<1)+1] = curr_xy[(i<<1)+1];
            }
            draw_point(video_ctx, curr_xy[j<<1], curr_xy[(j<<1)+1]);
            ++j;
        }
    }
    point_count = j;
}

function generate_points(box){
    var resolution_x = options.point_density;
    var resolution_y = options.point_density;
    var min_dist = 15;
    var x = Math.min(box[0], box[2]);
    var y = Math.min(box[1], box[3]);
    var width = Math.abs(box[0]-box[2]);
    var height = Math.abs(box[1]-box[3]);
    var res_x = Math.max(Math.round(width/resolution_x), min_dist);
    var res_y = Math.max(Math.round(height/resolution_y), min_dist);

    point_count = 0;
    point_status = new Uint8Array(100);
    for (var i=res_x/2; i<width; i+=res_x){
        for (var j=res_y/2; j<height; j+=res_y){
            add_point(Math.round(x+i), Math.round(y+j));
        }
    }
}

function median(values, count) {
    Array.prototype.sort.call(values, function(a, b) { return a - b; });
    var half = Math.floor(values.length/2);
    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}
function updateBoundingBox(video_ctx) {
    if (box[2]+box[3] != 0){
        if (!mousedown){
            var count = 0;
            for (var i=0; i<point_count; i++) if(point_status[i] == 1) count++;
            var list_x = new Float32Array(count);
            var list_y = new Float32Array(count);
            var list_s = new Float32Array(Comb(count, 2));
            var j = 0;
            var scale_counter = 0;
            for (var i=0; i<point_count; i++){
                if(point_status[i] == 1){
                    var pos = i<<1;
                    list_x[j] = curr_xy[pos]-prev_xy[pos];
                    list_y[j] = curr_xy[pos+1]-prev_xy[pos+1];
                    for (var h=i+1; h<point_count; h++){
                        if(point_status[h] == 1){
                            var pos2 = h<<1;
                            var d1 = Math.sqrt( Math.pow(prev_xy[pos]-prev_xy[pos2],2) + Math.pow(prev_xy[pos+1]-prev_xy[pos2+1],2) );
                            var d2 = Math.sqrt( Math.pow(curr_xy[pos]-curr_xy[pos2],2) + Math.pow(curr_xy[pos+1]-curr_xy[pos2+1],2) );
                            list_s[scale_counter] = d2/d1;
                            scale_counter++;
                        }
                    }
                    j++;
                }
            }
            median_x = median(list_x, count);
            median_y = median(list_y, count);
            median_s = median(list_s, scale_counter);
            
            var h = Math.abs(box[1]-box[3]);
            var h_mod = (h*median_s-h)/2;
            box[1] += median_y-h_mod;
            box[3] += median_y+h_mod;
            
            h = Math.abs(box[1]-box[3]);
            var w = Math.abs(box[0]-box[2]);
            var w_mod = (h*ratio-w)/2;
            box[0] += median_x-w_mod;
            box[2] = box[0] + h*ratio;

        }
        video_ctx.beginPath();
        video_ctx.rect(Math.min(box[0], box[2]), Math.min(box[1], box[3]), Math.abs(box[0]-box[2]), Math.abs(box[1]-box[3]));
        video_ctx.lineWidth=10;
        video_ctx.stroke();
        video_ctx.closePath(); 
    }

}

function relMouseCoords(event) {
    /*
    var totalOffsetX=0,totalOffsetY=0,canvasX=0,canvasY=0;
    var currentElement = this;

    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}*/
    var rect = video_canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

$(window).unload(function() {
    video.pause();
    video.src=null;
});

//http://www.ciphersbyritter.com/JAVASCRP/PERMCOMB.HTM#Combinations
function Comb( n, r ) {
    // combinations of n things taken r at a time, order not impt.
    // Comb( n, 0 ) = 1, and Comb( n, n ) = 1
    // Comb( n, r ) = 0 if r > n or r < 0
    if ((r == 0) || (r == n)) return 1;
    else
    if ((r > n) || (r < 0)) return 0;
    else
    return factdivdiv( n, r, n-r );
} 
function factdivdiv( n, k1, k2 ) {
    // computes (n! / k1! k2!) for combinations
    // assure k1 >= k2
    if (k1 < k2) { i = k1; k1 = k2; k2 = i; }
    if (k1 > n) t = 0;
    else {
        // accumulate the factors for k2 factorial
        var t=1;
        while (k2 > 1)
        t *= k2--;
        // accumulate the factors from n downto k1
        var t2=1;
        while (n > k1)
        t2 *= n--;
        t = t2 / t;
    }
    return t;
}