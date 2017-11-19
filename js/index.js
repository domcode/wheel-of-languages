'use strict';

console.clear();
var log = function log() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    return console.log(args);
};

var COLORS = ['#f7d046', '#ff4c5a', '#f08cba', '#49c4d2', '#924e84', '#fd926f', '#245a65', '#ff6a76', '#633d89'];
var PI = Math.PI;
var TAU = PI * 2;

var degToRad = function degToRad(deg) {
    return deg / 180 * PI;
};

var getCoordOnCircle = function getCoordOnCircle(r, angleInRad, _ref) {
    var cx = _ref.cx;
    var cy = _ref.cy;

    return {
        x: cx + r * Math.cos(angleInRad),
        y: cy + r * Math.sin(angleInRad)
    };
};

var wheelFactory = function wheelFactory(mountElem) {
    if (!mountElem || !('nodeType' in mountElem)) {
        throw new Error('no mount element provided');
    }

    var ratios = {
        tickerRadius: .06, // of width
        textSize: .12, // of radius
        edgeDist: .14
    };
    // of radius
    var options = {
        width: 360,
        height: 360,
        type: 'svg'
    };
    var friction = .95;
    var maxSpeed = .5;
    var isGroupActive = false;
    var textDistFromEdge = 30;
    var curPosArr = [];
    var dirScalar = 1;
    var lastCurTime = undefined;
    var speed = undefined;
    var words = undefined;
    var two = undefined;
    var group = undefined;

    function init(opts) {
        options = Object.assign({}, options, opts);
        two = new Two({
            type: Two.Types[options.type],
            width: options.width,
            height: options.height
        }).bind('resize', handleResize).play();

        two.appendTo(mountElem);
        setViewBox(options.width, options.height);

        two.renderer.domElement.setAttribute('style', '\n        -moz-user-select:none;\n        -ms-user-select:none;\n        -webkit-user-select:none;\n        user-select:none;\n        -webkit-tap-highlight-color: rgba(0,0,0,0);\n      ');
    }

    function setWords(wordsArr) {
        words = wordsArr;
    }

    function setViewBox(width, height) {
        two.renderer.domElement.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    }

    function drawTicker() {
        var _two = two;
        var width = _two.width;

        var outerRadius = ratios.tickerRadius * width;

        var tickerCircle = drawTickerCircle(outerRadius);
        var circleCenter = tickerCircle.translation;

        drawTickerArrow(outerRadius, degToRad(30), circleCenter);
    }

    function drawTickerCircle(outerRadius) {
        var _two2 = two;
        var width = _two2.width;

        var arc = two.makeArcSegment(width / 2, outerRadius, outerRadius, outerRadius * .5, 0, 2 * PI);
        arc.noStroke();

        return arc;
    }

    function drawTickerArrow(radius, tangentAngle, tickerCenter) {
        var x = tickerCenter.x;
        var y = tickerCenter.y;

        var pointA = getCoordOnCircle(radius, PI / 2, {cx: x, cy: y});
        var pointB = getCoordOnCircle(radius, tangentAngle, {cx: x, cy: y});
        var pointC = {
            x: x,
            y: y + radius / Math.cos(PI / 2 - tangentAngle)
        };
        var pointD = getCoordOnCircle(radius, PI - tangentAngle, {cx: x, cy: y});
        var path = two.makePath(pointA.x, pointA.y, pointB.x, pointB.y, pointC.x, pointC.y, pointD.x, pointD.y);
        path.noStroke();

        return path;
    }

    function drawWheel() {
        if (group) {
            destroyPaths();
        }

        var _two3 = two;
        var width = _two3.width;
        var height = _two3.height;

        var numColors = COLORS.length;
        var rotationUnit = 2 * PI / words.length;
        var yOffset = width * ratios.tickerRadius * 2;
        var radius = (width - yOffset) / 2;
        var center = {
            x: width / 2,
            y: radius + yOffset
        };
        group = two.makeGroup();

        words.map(function (word, i, arr) {
            var angle = rotationUnit * i - (PI + rotationUnit) / 2;
            var arc = two.makeArcSegment(center.x, center.y, 0, radius, 0, 2 * PI / arr.length);
            arc.rotation = angle;
            arc.noStroke();
            arc.fill = COLORS[i % numColors];

            var textVertex = {
                x: center.x + (radius - radius * ratios.edgeDist) * Math.cos(angle + rotationUnit / 2),
                y: center.y + (radius - radius * ratios.edgeDist) * Math.sin(angle + rotationUnit / 2)
            };

            var text = two.makeText(word, textVertex.x, textVertex.y);
            text.rotation = rotationUnit * i - PI / 2;
            text.alignment = 'right';
            text.fill = '#fff';
            text.size = radius * ratios.textSize;

            group.add(arc, text);
        });

        group.translation.set(center.x, center.y);
        group.center();
        drawTicker();

        two.update();
    }

    function handleResize() {
        setViewBox(two.width, two.height);
        drawWheel();
        drawTicker();
        two.update();
    }

    function animateWheel() {
        group.rotation = (group.rotation + speed * dirScalar) % TAU;
        speed = speed * friction;

        // handleRotationChange(group.rotation);

        if (speed < 0.005) {
            two.unbind('update', animateWheel);
            if (options.onComplete && typeof options.onComplete === 'function') {
                options.onComplete(getCurrentWord());
            }
        }
    }

    function spin(newSpeed) {
        speed = newSpeed;
        two.bind('update', animateWheel);
    }

    function updateDims(_ref2) {
        var height = _ref2.height;
        var width = _ref2.width;

        two.width = parseInt(width, 10);
        two.height = parseInt(height, 10);
        two.trigger('resize');
    }

    function getCurrentWord() {
        var numWords = words.length;
        var segmentAngle = TAU / numWords;
        var currAngle = (TAU - group.rotation + segmentAngle / 2) % TAU;

        return words.find(function (_, i) {
            return segmentAngle * (i + 1) > currAngle;
        });
    }

    function removeEvents() {
        two.unbind('update');
    }

    function destroyPaths() {
        group.remove.apply(group, group.children);
        two.clear();
    }

    function destroy() {
        destroyPaths();
        removeEvents();

        return true;
    }

    return {
        destroy: destroy,
        drawWheel: drawWheel,
        getCurrentWord: getCurrentWord,
        init: init,
        setWords: setWords,
        spin: spin,
        updateDims: updateDims
    };
};

var mount = document.querySelector('.js-mount');
var spinButton = document.querySelector('.js-spin');

// spinButton.addEventListener('click', handleSpin);

var wheel = wheelFactory(mount);
wheel.init({
    width: Math.min(window.innerWidth, window.innerHeight),
    height: Math.min(window.innerWidth, window.innerHeight),
    onComplete: function (newWord) {
        showLang(newWord);
    }
});

wheel.setWords(_.chain(LANGUAGES).pluck('name').shuffle().value());
wheel.drawWheel();

function handleSpin() {
    wheel.spin(Math.random());
}

window.addEventListener('resize', function () {
    wheel.updateDims({
        width: Math.min(window.innerWidth, window.innerHeight),
        height: Math.min(window.innerWidth, window.innerHeight)
    });
});

var languagesList = document.querySelector('ul.languages');

function showLang(langName) {

    var language = _.findWhere(LANGUAGES, {name: langName});

    var html = "<h2>"+language.name+"</h2>" +
        "<h3>"+language.description+"</h3>";

    html += "<ul>";
    _.forEach(language.links, function (link) {
        html += '<li><a target="_blank" href="'+link[0]+'">'+link[1]+'</a>';
    });
    html += "</ul>";

    _.forEach(languagesList.querySelectorAll('li'), function (li) {
        if(li.getAttribute('data-lang') == language.name) {
            li.classList.add('active');
        } else if(li.classList.contains('active')) {
            li.classList.remove('active');
        }
    });

    document.querySelector('.language-detail').innerHTML = html;
}

_.forEach(
    _.sortBy(LANGUAGES, 'name'),
    function (lang) {
        var li = document.createElement('li');
        li.innerHTML = '<a href="#" onclick="showLang(\''+ lang.name+'\'); return false;">' + lang.name + '</a>';
        li.setAttribute('data-lang', lang.name);

        languagesList.appendChild(li);
    }
);
languagesList.innerHTML = languagesList.innerHTML + '<li class="random-button"><a href="#" onClick="handleSpin(); return false;">Spin it!</a></li>';
