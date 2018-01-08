/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
(function(Hi) {
  'use strict';

  var data = {};
  var lb, rt, wh = [0, 0];

  setTimeout(function() {
    if (!window.GGBApplet) {
      console.log('Using GGBApplet simulator');
      data.coords = {};
      data.objects = {};
      window.ggbApplet = {
        getObjectNumber: function() {
          return Object.keys(data.objects).length;
        },
        getObjectName: function(index) {
          return Object.keys(data.objects)[index];
        },
        getObjectType: function(name) {
          var obj = data.objects[name];
          return obj && obj[0] || Hi.selection.indexOf(name) >= 0;
        },
        evalCommand: function(text) {
          data.command = text;
        },
        getValue: Hi.noop,
        setLabelVisible: Hi.noop,
        setLineThickness: Hi.noop,
        setFixed: Hi.noop,
        setVisible: Hi.noop,
        setColor: Hi.noop,
        setCoords: Hi.noop
      };
      Hi.getObjectCoord = function(name) {
        return data.coords[name];
      };
      Hi.getSegmentCoord = function(name, value) {
        var obj = data.objects[name];
        if (obj && obj[1].length === 2 && (value === 0 || value === 1)) {
          return data.coords[obj[1][value]];
        }
      };
    }
  }, 0);

  // 加载GGB图后的回调函数
  window.appletOnLoad = function() {
    data.coords = {};
    data.objects = {};
    wh = [0, 0];
  };
  if (typeof jQuery === 'function') {
    jQuery(window).resize(function() {
      wh = [0, 0];
    });
  }

  // 添加临时图形，允许设置回调函数 Hi.shapeAdded
  function addShape(name, attr) {
    var type, a;

    attr = attr || {};
    if (ggbApplet.setVisible && ggbApplet.setVisible !== Hi.noop) {
      ggbApplet.setVisible(name, !attr.hidden);
      if (attr.dashed) {
        ggbApplet.setLineStyle(name, attr.dashed === true ? 2 : attr.dashed);
      }
      if (attr.trace) {
        ggbApplet.setTrace(name, attr.trace);
      }
      if (attr.thickness) {
        ggbApplet.setLineThickness(name, Math.min(13, attr.thickness));
      }
      if (attr.label) {
        ggbApplet.setCaption(name, attr.label === true ? name.replace(/_{(hi|aux)}/g, '') : attr.label);
        ggbApplet.setLabelVisible(name, true);
        ggbApplet.setLabelStyle(name, 3);
      }
      if (attr.color) {
        if (typeof attr.color === 'string') {
          attr.color = attr.color.replace(/\s/g, '').split(',');
        }
        ggbApplet.setColor(name, parseInt(attr.color[0]), parseInt(attr.color[1]), parseInt(attr.color[2]));
      }
    } else {
      attr.name = name;
      if (!attr.definition && data.command) {
        attr.definition = data.command.split('=');
        attr.definition = attr.definition[1].replace(/^\s+|\s+$/, '');
      }
      delete data.command;

      a = (attr.definition || '').replace(/\s|\]|.+\)/g, '').split(/[\[,]/);
      type = a.length > 1 && a[0].toLowerCase() || 'point';
      data.objects[name] = [type, a.slice(1)];

      if (type === 'polygon') {
        a.push(a[1]);
        a.forEach(function(pt, i) {
          if (pt && i > 0 && i < a.length - 1) {
            Hi.createSegment(a.slice(i, i + 2), {_tmp: true});
          }
        });
      }
      var notify = !attr._tmp;
      delete attr.x;
      delete attr.y;
      delete attr._tmp;
      if (notify && Hi.shapeAdded) {
        Hi.shapeAdded(JSON.stringify(attr));
      }
    }

    type = ggbApplet.getObjectType(name);
    if (type || type === false) {
      // console.log(type + ' ' + name + ' created');
      Hi.selection.push(name);
      return name;
    }
  }

  function round(value) {
    return Math.round(value * 1e3) * 1e-3;
  }

  // 生成 -0.4~-0.1、0.1~0.4 之间的随机数
  function randomCenter() {
    var v = (Math.random() - 0.5) * 0.6;
    return v > 0 ? v + 0.1 : v - 0.1;
  }

  function isCoordInView(xy) {
    return xy[0] > lb[0] && xy[1] > lb[1]
      && xy[0] < lb[0] + wh[0] && xy[1] < lb[1] + wh[1];
  }

  function isExists(name) {
    return ggbApplet.getObjectType(name);
  }

  // 返回分布在当前可见图形区的随机坐标
  Hi.randomCoord = function(center) {
    var ret, i;

    if (!wh[0]) {
      lb = Hi.getExprCoord('x(Corner[1])', 'y(Corner[1])');
      rt = Hi.getExprCoord('x(Corner[3])', 'y(Corner[3])');
      wh[0] = rt[0] - lb[0];
      wh[1] = rt[1] - lb[1];
      if (!wh[0] || !wh[1] || wh[0] < 0.1 || wh[1] < 0.1) {
        lb = [0, 0];
        wh = [10, 8];
      }
    }
    if (center && typeof center === 'string') {
      center = Hi.getObjectCoord(center);
    }
    if (center && center[0] && center[1]) {
      for (i = 0; i < 20 && !(i && isCoordInView(ret)); i++) {
        ret = [round(center[0] + randomCenter() * wh[0]),
          round(center[1] + randomCenter() * wh[1])];
      }
      if (i === 20) {
        console.log('randomCoord out of limit: ' + JSON.stringify(ret));
      }
    } else {
      ret = [round(lb[0] + (0.2 + Math.random() * 0.6) * wh[0]),
        round(lb[1] + (0.2 + Math.random() * 0.6) * wh[1])];
    }
    return ret;
  };

  // 给定多个点创建图形
  Hi.createWithPoints = function(command, points, attr) {
    var name = attr && attr.name || command.toLowerCase() + Hi.selection.length;
    if (isExists(name)) {
      return;
    }
    points = typeof points === 'string' ? points.split('') : points;
    points = points.map(function(ptName) {
      return Hi.createPoint(ptName) || ptName;
    });
    if (attr && attr.definition) {
      ggbApplet.evalCommand(name + '=' + attr.definition);
    } else {
      ggbApplet.evalCommand(name + '=' + command + '[' + points.join(',') + ']');
    }
    return addShape(name, attr);
  };

  // 创建指定名称的随机坐标的自由点
  Hi.createPoint = function(name, attr) {
    attr = attr || {};
    if (!name && !attr.name) {
      attr.label = false;
    }
    name = name || attr.name || 'Pt' + Hi.selection.length;
    if (isExists(name)) {
      return;
    }

    var xy = attr._rndCoord instanceof Array ? attr._rndCoord : Hi.randomCoord();
    if (attr.definition) {
      if (attr.definition.indexOf('undefined') > 0) {
        return;
      }
      ggbApplet.evalCommand(name + '=' + attr.definition);
      if (attr._rndCoord) {
        ggbApplet.setCoords(name, xy[0], xy[1]);
      }
    } else {
      xy = [round(attr.x || xy[0]), round(attr.y || xy[1])];
      if (data.coords) {
        data.coords[name] = xy;
      }
      ggbApplet.evalCommand(name + '=(' + xy[0] + ',' + xy[1] + ')');
    }
    if (attr.label !== false) {
      ggbApplet.setLabelVisible(name, true);
    }

    return addShape(name, attr);
  };

  // 创建圆心
  Hi.createCenter = function(circle, attr) {
    attr = attr || {};
    attr.definition = 'Center[' + circle + ']';
    return Hi.createPoint(null, attr) || attr.name;
  };

  // 创建中点，指定已存在的两点名或线段名
  Hi.createMidpoint = function(ab, attr) {
    attr = attr || {};
    attr.definition = 'Midpoint[' + ab[0] + (ab[1] ? ', ' + ab[1] : '') + ']';
    return Hi.createPoint(null, attr) || attr.name;
  };

  // 给定两个已存在的线名创建交点
  Hi.createIntersect = function(a, b, attr) {
    attr = attr || {};
    attr.definition = 'Intersect[' + a + ', ' + b + ']';
    return a && b && Hi.createPoint(null, attr) || attr.name;
  };

  // 指定两个点名创建线段，自动创建端点
  Hi.createSegment = function(ab, attr) {
    return Hi.findSegment(ab) || Hi.createWithPoints('Segment', ab, attr);
  };

  // 指定两个点名创建射线，自动创建点
  Hi.createRay = function(ab, attr) {
    return Hi.createWithPoints('Ray', ab, attr);
  };

  // 创建线段的延长线，自动创建点
  Hi.createExtension = function(ab, attr) {
    attr = attr || {};
    attr.definition = 'Ray[' + ab[1] + ',Reflect[' + ab[0] + ',' + ab[1] + ']]';
    return Hi.createWithPoints('Ray', ab, attr);
  };

  // 指定两个点名创建射线，自动创建点
  Hi.createLine = function(ab, attr) {
    return Hi.createWithPoints('Line', ab, attr);
  };

  // 给定两点创建圆的弦，自动创建点
  Hi.createChord = function(ab, circle, attr) {
    if (!circle || !ab) {
      return;
    }
    var ptAttr = {definition: 'Point[' + circle + ']', _rndCoord: true};
    var a = Hi.createPoint(ab[0], ptAttr) || ab[0];
    var b = Hi.createPoint(ab[1], ptAttr) || ab[1];
    return Hi.createSegment([a, b], attr);
  };

  // 检查第三个坐标在前两个坐标连线的哪侧
  function detectSide(a, b, c) {
    var d = a[0] * b[1] + b[0] * c[1] + c[0] * a[1];
    var e = c[0] * b[1] + a[0] * c[1] + b[0] * a[1];
    return d > e ? 1 : d < e ? -1 : 0;
  }

  // 指定多个点名创建多边形，可自动创建顶点
  Hi.createPolygon = function(points, attr) {
    var name = attr && attr.name || 'pl' + Hi.selection.length;
    if (Hi.hasPolygon(points) || isExists(name)) {
      return;
    }

    var pts = [];
    points = typeof points === 'string' ? points.split('') : points;
    points = points.filter(function(p) { return p; });
    points = points.map(function(ptName, i) {
      if (isExists(ptName)) {
        pts.push(Hi.getObjectCoord(ptName));
        return ptName;
      }

      var dir = i > 2 && i < 8 && detectSide(pts[0], pts[1], pts[2]);
      var xy = Hi.randomCoord(i > 0 && pts[i - 1]);
      var times = 0;
      var maxTimes = points.length < 5 ? 1000 : points.length < 7 ? 500 : 100;

      while (dir && ++times < maxTimes &&
          (  dir !== detectSide(pts[i - 2], pts[i - 1], xy)
          || dir !== detectSide(pts[i - 1], xy, pts[0])
          || dir !== detectSide(xy, pts[0], pts[1]))) {
        xy = Hi.randomCoord();
      }
      if (times === maxTimes) {
        console.log('concave polygon created for ' + ptName);
      }
      pts.push(xy);
      return Hi.createPoint(ptName, {x: xy[0], y: xy[1]});
    });

    if (points.length >= 3) {
      ggbApplet.evalCommand(name + '=Polygon[' + points.join(',') + ']');
    }

    return addShape(name, attr);
  };

  // 给定三个点名创建三角形，自动创建点
  Hi.createTriangle = function(abc, attr) {
    return Hi.createPolygon([abc[0], abc[1], abc[2]], attr);
  };

  // 给定三点创建等腰三角形，第一个点在对称中心线上，自动创建点
  Hi.createIsoscelesTriangle = function(abc, attr) {
    var name = attr && attr.name || 'pl' + Hi.selection.length;
    if (Hi.hasPolygon(abc) || isExists(name)) {
      return;
    }

    var cenMode, def;

    if (isExists(abc[2])) {
      if (!isExists(abc[1])) {
        abc = [abc[0], abc[2], abc[1]];
      }
      else if (!isExists(abc[0])) {
        cenMode = true;
        abc = [abc[1], abc[2], abc[0]];
      }
      else {
        return;
      }
    }

    var a = Hi.createPoint(abc[0]) || abc[0];
    var b = Hi.createPoint(abc[1], {_rndCoord: Hi.randomCoord(a)}) || abc[1];

    if (cenMode) {
      def = 'Point[PerpendicularBisector[' + a + ', ' + b + ']]';
    } else {
      def = 'Point[Circle[' + a + ', Segment[' + a + ', ' + b + ']]]';
    }
    var c = Hi.createPoint(abc[2], {definition: def, _rndCoord: true});

    if (a && b && c) {
      ggbApplet.evalCommand(name + '=Polygon[' + [a, b, c].join(',') + ']');
      return addShape(name, attr);
    }
  };

  // 给定三个已存在的点创建角度符号
  Hi.createAngle3p = function(abc, attr) {
    var name = attr && attr.name || 'angle' + Hi.selection.length;
    if (isExists(name)) {
      return;
    }

    abc = typeof abc === 'string' ? abc.split('') : abc;
    ggbApplet.evalCommand(name + '=Angle[' + abc.join(',') + ']');

    var value = ggbApplet.getValue(name);
    if (value > Math.PI) {
      ggbApplet.deleteObject(name);
      ggbApplet.evalCommand(name + '=Angle[' + abc.reverse().join(',') + ']');
    }
    ggbApplet.setLabelVisible(name, false);
    return addShape(name);
  };

  // 创建直角三角形，第二个点是直角顶点，自动创建点
  Hi.createRightAngledTriangle = function(abc, attr) {
    var name = attr && attr.name || 'pl' + Hi.selection.length;
    if (Hi.hasPolygon(abc) || isExists(name)) {
      return;
    }

    var cenMode, def;

    if (isExists(abc[2])) {
      if (!isExists(abc[0])) {
        abc = [abc[2], abc[1], abc[0]];
      }
      else if (!isExists(abc[1])) {
        cenMode = true;
        abc = [abc[0], abc[2], abc[1]];
      }
      else {
        return;
      }
    }

    var a = Hi.createPoint(abc[0]) || abc[0];
    var b = Hi.createPoint(abc[1], {_rndCoord: Hi.randomCoord(a)}) || abc[1];

    if (cenMode) {
      def = 'Point[Circle[Midpoint[' + a + ', ' + b + '], ' + a + ']]';
    } else {
      def = 'Point[PerpendicularLine[' + b + ', Segment[' + a + ', ' + b + ']]]';
    }
    var c = Hi.createPoint(abc[2], {definition: def, _rndCoord: Hi.randomCoord(b)});

    if (a && b && c) {
      abc = cenMode ? [a, c, b] : [a, b, c];
      ggbApplet.evalCommand(name + '=Polygon[' + abc.join(',') + ']');
      Hi.createAngle3p(abc, {name: name + 'a'});
      return addShape(name, attr);
    }
  };

  // 指定圆心点和圆上点作圆，自动创建点
  Hi.createCircle2p = function(ab, attr) {
    return Hi.createWithPoints('Circle', [ab[0], ab[1]], attr);
  };

  // 过三点创建圆，自动创建点
  Hi.createCircle3p = function(abc, attr) {
    return abc && abc[2] && Hi.createWithPoints('Circle', abc, attr);
  };

  // 创建给定三点的三角形的内切圆，自动创建点
  Hi.createIncircle = function(abc, attr) {
    return Hi.createWithPoints('Incircle', abc, attr);
  };

  // 给定四个点名创建梯形，第一四点的边与第二三点的边平行，自动创建点
  Hi.createTrapezoid = function(names, attr) {
    var name = attr && attr.name || 'pl' + Hi.selection.length;
    if (Hi.hasPolygon(names) || isExists(name)) {
      return;
    }

    if (isExists(names[3])) {             // D点已存在，不能作为被动约束点
      if (!isExists(names[2])) {          // C点没有，则上下翻转
        names = [names[1], names[0], names[3], names[2]];
      }
      else if (!isExists(names[0])) {     // A点没有，则左右翻转
        names = [names[3], names[2], names[1], names[0]];
      }
      else if (!isExists(names[1])) {     // B点没有，则上下左右都翻转
        names = [names[2], names[3], names[0], names[1]];
      }
      else {
        return;                           // 四点都已存在
      }
    }

    var a = names[0], b = names[1], c = names[2];
    var prev, xy, def, xys, s;

    names = [0, 1, 2, 3].map(function(i) {
      prev = i > 0 && Hi.getObjectCoord(names[i - 1]);
      xy = Hi.randomCoord(prev);

      if (i === 3) {
        def = 'Point[Ray[' + a + ', Vector[' + b + ',' + c + ']]]';
        xys = [0, 1, 2].map(function(idx) {
          return Hi.getObjectCoord(names[idx]);
        });
        for (var t = 0; t < 10 && xys[0] && xys[1] && xys[2] && !(t && isCoordInView(xy)); ++t) {
          s = 0.5 + Math.random() * 1.5;
          xy = [round(xys[0][0] + s * (xys[2][0] - xys[1][0])),
            round(xys[0][1] + s * (xys[2][1] - xys[1][1]))];
        }
        return Hi.createPoint(names[i], {definition: def, _rndCoord: xy});
      }
      if (i === 2) {
        xy[1] = prev && prev[1] || xy[1];
        return Hi.createPoint(names[i], {x: xy[0], y: xy[1]}) || names[i];
      }
      return Hi.createPoint(names[i], {x: xy[0], y: xy[1]}) || names[i];
    });

    ggbApplet.evalCommand(name + '=Polygon[' + names.join(',') + ']');
    return addShape(name, attr);
  };

  // 给定四个点名创建矩形，自动创建点
  Hi.createRectangle = function(names, attr) {
    var name = attr && attr.name || 'pl' + Hi.selection.length;
    if (Hi.hasPolygon(names) || isExists(name)) {
      return;
    }

    var exists = [0, 1, 2, 3].map(function(i) {
      return isExists(names[i]);
    });
    if (exists[3] && exists[2]) {     // CD都已存在
      names = exists[0] ? [names[0], names[3], names[2], names[1]] :  // ADCB
        [names[3], names[2], names[1], names[0]];                     // DCBA
    }
    else if (exists[3]) {             // D存在，C不存在
      names = [names[3], names[0], names[1], names[2]];               // DABC
    }
    else if (exists[2]) {             // C存在，D不存在
      names = [names[2], names[1], names[0], names[3]];               // CBAD
    }

    var a = Hi.createPoint(names[0]) || names[0];
    var b = Hi.createPoint(names[1], {_rndCoord: Hi.randomCoord(a)}) || names[1];

    var def = 'Point[PerpendicularLine[' + b + ', Segment[' + a + ', ' + b + ']]]';
    var c = Hi.createPoint(names[2], {definition: def, _rndCoord: Hi.randomCoord(b)});
    if (!c && Hi.arePerpendicular([a, b], [b, names[2]])) {
      c = names[2];
    }

    def = 'Intersect[PerpendicularLine[' + a + ', Segment[' + a + ', ' + b +
      ']], Line[' + c + ', Segment[' + a + ', ' + b + ']]]';
    var d = Hi.createPoint(names[3], {definition: def});

    if (a && b && c && d) {
      ggbApplet.evalCommand(name + '=Polygon[' + [a, b, c, d].join(',') + ']');
      return addShape(name, attr);
    }
  };

  // 给定四个点名创建平行四边形，自动创建点
  Hi.createParallelogram = function(names, attr) {
    var name = attr && attr.name || 'pl' + Hi.selection.length;
    if (Hi.hasPolygon(names) || isExists(name)) {
      return;
    }

    if (isExists(names[3])) {
      for (var i = 2; i >= 0; i--) {
        if (!isExists(names[i])) {
          names = [0, 1, 2, 3, 0, 1, 2].slice(i + 1, i + 5).map(function(idx) {
            return names[idx];
          });
          break;
        }
      }
    }

    var a = Hi.createPoint(names[0]) || names[0];
    var b = Hi.createPoint(names[1], {_rndCoord: Hi.randomCoord(a)}) || names[1];
    var c = Hi.createPoint(names[2], {_rndCoord: Hi.randomCoord(b)}) || names[2];

    var def = 'Point[' + c + ', Vector[' + b + ', ' + a + ']]';
    var d = Hi.createPoint(names[3], {definition: def});

    if (a && b && c && d) {
      ggbApplet.evalCommand(name + '=Polygon[' + [a, b, c, d].join(',') + ']');
      return addShape(name, attr);
    }
  };

  // 给定四个点名创建菱形，自动创建点
  Hi.createDiamond = function(names, attr) {
    var name = attr && attr.name || 'pl' + Hi.selection.length;
    if (Hi.hasPolygon(names) || isExists(name)) {
      return;
    }

    if (isExists(names[2]) && isExists(names[3])) {
      names = [names[2], names[3], names[0], names[1]];
    }
    else if (isExists(names[2])) {
      names = [names[1], names[2], names[3], names[0]];
    }
    else if (isExists(names[3])) {
      names = [names[0], names[3], names[2], names[1]];
    }

    var a = Hi.createPoint(names[0]) || names[0];
    var b = Hi.createPoint(names[1], {_rndCoord: Hi.randomCoord(a)}) || names[1];

    var def = 'Point[Circle[' + b + ', Segment[' + a + ', ' + b + ']]]';
    var c = Hi.createPoint(names[2], {definition: def, _rndCoord: Hi.randomCoord(b)});

    def = 'Point[' + c + ', Vector[' + b + ', ' + a + ']]';
    var d = Hi.createPoint(names[3], {definition: def});

    if (a && b && c && d) {
      ggbApplet.evalCommand(name + '=Polygon[' + [a, b, c, d].join(',') + ']');
      return addShape(name, attr);
    }
  };

})(window.Hi);
