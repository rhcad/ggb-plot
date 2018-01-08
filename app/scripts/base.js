/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
(function() {
  'use strict';

  var Hi = window.Hi = window.Hi || {
      defaultTimeout: 1500,
      lines: [],
      queue: [],
      step: 0,
      defaultColor: '0,0,255',      // 默认蓝色亮显
      alternativeColor: '255,0,0'   // 行内同种谓词的图形交替使用红色和默认色
    };

  // 设置每个播放项的行内序号(col)、行内同种谓词的序号(order)
  function buildColAndOrder() {
    var line = 0, col;
    var sum = {};

    Hi.queue.forEach(function(r) {
      if (r.line !== line) {
        line = r.line;
        col = -1;
        sum[line] = {count: 0, names: {}};
      }
      r.col = ++col;
      sum[line].count++;
      if (r.name) {
        r.order = sum[line].names[r.name] || 0;
        sum[line].names[r.name] = r.order + 1;
      }
    });
  }

  // 根据几何题文本，初始化GGB亮显的环境参数
  Hi.init = function(text, queue) {
    if (typeof text === 'string') {
      Hi.lines = text.replace(/\n\r|\r\n/g, '\n').split('\n');
    } else {
      Hi.lines = text || [];
      console.assert(Hi.lines instanceof Array, 'text should be string or array');
    }
    if (queue && typeof queue === 'string') {
      queue = JSON.parse(queue);
    }
    console.assert(!queue || queue instanceof Array, 'queue should be an array');

    // 解析几何题的所有行，逐行逐规则逐最优构造出所有的四元组数组queue
    queue = queue || window.parseLines(Hi.lines); // 如果没有传入四元组解析结果就解析文本行，否则不需要 parse.js
    Hi.queue = queue.map(function(r) {
      var timeout = r.rel ? 'Hi.defaultTimeout * 2' : 'Hi.defaultTimeout';      // 有关系，则2倍延时
      var func = 'sel' + r.name.substring(0, 1).toUpperCase() + r.name.substring(1);
      var s = 'Hi.' + func + "('" + r.key + "', {timeout: " + timeout + '})'; // 例如: s= "Hi.selAngle3p('PBA', {timeout: Hi.defaultTimeout})"
      console.assert(Hi[func], func + ' not implemented');
      r.show = new Function(s); // 根据谓词构造亮显函数（包含延时参数）
      return r;
    });
    Hi.step = 0;        // 当前播放项的序号初始化为0
    buildColAndOrder(); // 设置每个播放项的行内序号、行内同种谓词的序号
    return Hi.queue.length;
  };

  // 根据行号和关键字亮显特定图形
  Hi.seek = function(line, key) {
    line = parseInt(line);
    key = key && key.replace(/\s+/g, '');   // 将key去除空格等不可见字符
    // 若window.ggbApplet有值（即window加载GGB运行包成功了），则evalCommand = ggb的执行命令接口
    var evalCommand = window.ggbApplet ? window.ggbApplet.evalCommand : console.log;

    // 扫描四元组数组的每个值，匹配出与(line, key)相匹配的唯一的一个四元组
    for (var i = 0; i < Hi.queue.length; i++) {
      var item = Hi.queue[i];
      if (item.line === line && item.key === key) {
        Hi.step = i + 1;
        evalCommand('line=' + line);    // GGB执行命令，设置line的值（例如：line=3）文本行号
        evalCommand('step=' + Hi.step);
        evalCommand('order=' + (item.line * 10 + item.col + 1));  // GGB执行命令，设置order的值（例如：order=31）文本行列号
        item.show();                    // 调用当前四元组的显亮函数，例如"Hi.selAngle3p('PBA', {timeout: Hi.defaultTimeout})"
        return Hi.step;
      }
    }
  };

  // 得到指定类型的所有图形名称
  Hi.getObjectNames = function(type) {
    var objects = [];
    for (var i = 0, n = ggbApplet.getObjectNumber(); i < n; i++) {
      var name = ggbApplet.getObjectName(i);
      if (!type || type === ggbApplet.getObjectType(name)) {
        objects.push(name);
      }
    }
    return objects;
  };

  Hi.noop = function() {};

  // 计算GGB表达式的值
  Hi.checkExpression = function(expr) {
    if (ggbApplet.getValue && ggbApplet.getValue !== Hi.noop) {
      ggbApplet.evalCommand('xx = ' + expr);
      return ggbApplet.getValue('xx');
    }
  };

  // 得到表达式对应的坐标
  Hi.getExprCoord = function(exprX, exprY) {
    if (!ggbApplet.getValue || ggbApplet.getValue === Hi.noop) {
      return [NaN, NaN];
    }
    ggbApplet.evalCommand('xx = ' + exprX);
    ggbApplet.evalCommand('yy = ' + exprY);
    return [ggbApplet.getValue('xx'), ggbApplet.getValue('yy')];
  };

  // 得到图形(点、线段、射线、圆)上的点坐标，线段：中点，射线：起点，圆：圆心
  Hi.getObjectCoord = function(obj) {
    var type = ggbApplet.getObjectType(obj);
    var xy;

    if (type === 'point') {
      xy = [ggbApplet.getXcoord(obj), ggbApplet.getYcoord(obj)];
      if (!xy[0] && xy[0] !== 0 || !xy[1] && xy[1] !== 0) {
        console.assert(0, 'fail to get coords of ' + obj);
      }
    }
    else if (type === 'segment') {
      xy = Hi.getExprCoord('x(Point[' + obj + ',0.5])', 'y(Point[' + obj + ',0.5])');
    }
    else if (type === 'ray') {
      xy = Hi.getExprCoord('x(Point[' + obj + ',0])', 'y(Point[' + obj + ',0])');
    }
    else if (type === 'circle') {
      xy = Hi.getExprCoord('x(Center[' + obj + '])', 'y(Center[' + obj + '])');
    }

    return xy;
  };

  // 得到线段的参数坐标
  Hi.getSegmentCoord = function(name, value) {
    name += ',' + value + '])';
    return Hi.getExprCoord('x(Point[' + name, 'y(Point[' + name);
  };

  // 判断两个坐标是否相等
  Hi.areEqualCoords = function(a, b) {
    if (typeof a === 'string') {
      a = Hi.getObjectCoord(a);
    }
    if (typeof b === 'string') {
      b = Hi.getObjectCoord(b);
    }
    return a && b && Math.abs(a[0] - b[0]) < 1e-5 && Math.abs(a[1] - b[1]) < 1e-5;
  };

  // 给定坐标查找点图形
  Hi.findPoint = function(xy) {
    var pts = Hi.getObjectNames('point').filter(function(name) {
      return Hi.areEqualCoords(xy, Hi.getObjectCoord(name));
    });
    return pts.length && pts[0];
  };

  // 查找连接两个点的线段，ab为两点名的串或数组
  Hi.findSegment = function(ab) {
    var xy = [Hi.getObjectCoord(ab[0]), Hi.getObjectCoord(ab[1])];
    var names = Hi.getObjectNames('segment').filter(function(name) {
      var p1 = Hi.getSegmentCoord(name, 0), p2 = Hi.getSegmentCoord(name, 1);
      return Hi.areEqualCoords(xy[0], p1) && Hi.areEqualCoords(xy[1], p2) ||
        Hi.areEqualCoords(xy[1], p1) && Hi.areEqualCoords(xy[0], p2);
    });
    return names.length && names[0];
  };

  // 返回线段等对象的长度，如果参数为数组则视为两点的线段
  Hi.getLength = function(name) {
    name = name instanceof Array ? 'Segment[' + name.join(', ') + ']' : name;
    return name ? Hi.checkExpression('Length[' + name + ']') : NaN;
  };

  // 返回两个对象是否等长，如果参数为数组则视为两点的线段
  Hi.areEqualLength = function(a, b) {
    a = a instanceof Array ? 'Segment[' + a.join(', ') + ']' : a;
    b = b instanceof Array ? 'Segment[' + b.join(', ') + ']' : b;
    return a && b && Hi.checkExpression('AreEqual[Length[' + a + '], Length[' + b + ']]');
  };

  // 返回两个对象是否平行，如果参数为数组则视为两点连线
  Hi.areParallel = function(a, b) {
    a = a instanceof Array ? 'Line[' + a.join(', ') + ']' : a;
    b = b instanceof Array ? 'Line[' + b.join(', ') + ']' : b;
    return a && b && Hi.checkExpression('AreParallel[' + a + ', ' + b + ']');
  };

  // 返回两个对象是否垂直，如果参数为数组则视为两点连线
  Hi.arePerpendicular = function(a, b) {
    a = a instanceof Array ? 'Line[' + a.join(', ') + ']' : a;
    b = b instanceof Array ? 'Line[' + b.join(', ') + ']' : b;
    return a && b && Hi.checkExpression('ArePerpendicular[' + a + ', ' + b + ']');
  };

  // 在坐标数组中查找给定坐标所在的序号
  function findCoordIndex(xy, coords) {
    for (var i = 0; i < coords.length; i++) {
      if (Hi.areEqualCoords(coords[i], xy)) {
        return i;
      }
    }
    return -1;
  }

  // 检查是否有给定顶点的多边形
  Hi.hasPolygon = function(points) {
    points = typeof points === 'string' ? points.split('') : points;
    var xy = points.map(Hi.getObjectCoord);
    var indexes = {};
    Hi.getObjectNames('segment').forEach(function(name) {
      var i1 = findCoordIndex(Hi.getSegmentCoord(name, 0), xy);
      var i2 = findCoordIndex(Hi.getSegmentCoord(name, 1), xy);
      if (i1 >= 0 && i2 >= 0 && (Math.abs(i1 - i2) === 1 || Math.abs(i1 - i2) === points.length - 1)) {
        indexes[indexes[i1] ? i1 + points.length : i1] = name;
        indexes[indexes[i2] ? i2 + points.length : i2] = name;
      }
    });
    // console.log(JSON.stringify(indexes, null, 2));
    return Object.keys(indexes).length === points.length * 2;
  };

  // 得到浏览器URL参数
  function getURLParams() {
    var q = window.location.search.substr(1);
    var params = q.split('&');
    var values = {};
    for (var i = 0; i < params.length; i++) {
      var param = params[i].split('=');
      values[param[0]] = param[1];
    }
    return values;
  }

  // 接收到读GGB文件转成Base64编码后，在浏览器打开GGB图形（Base64在浏览器传递的长字符串
  Hi.openGGBFile = function(base64, options) {
    options = options || {};
    if (base64 && typeof base64 === 'object') {
      options = base64;
      base64 = null;
    }
    if (base64 && base64.length < 200 && /\.ggb$/.test(base64)) {
      options.filename = base64;
      base64 = null;
    }

    var params = {};
    var urlParams = getURLParams();
    var excludes = ['ggbBase64', 'preview', 'from', 'onload'];
    var setProp = function(name, value) {
      if (params[name] === undefined && value !== undefined) {
        params[name] = value;
      }
    };

    setProp('borderColor', 'none');
    setProp('enableShiftDragZoom', false);
    setProp('enableRightClick', false);
    setProp('preventFocus', true);
    setProp('width', urlParams.width);
    setProp('height', urlParams.height);
    Hi.selection = [];

    for (var i in options) {
      if (options.hasOwnProperty(i) && /^[a-z]/.test(i) && excludes.indexOf(i) < 0) {
        params[i] = options[i];
      }
    }

    if (base64) {
      params.ggbBase64 = base64;
    } else {
      params.app = true;
    }
    if (!params.width || !params.height) {
      params.fitToScreen = true;
    }

    params.appletOnLoad = function() {
      if (typeof window.appletOnLoad === 'function') {
        window.appletOnLoad();
      }
      if (typeof options.onload === 'function') {
        setTimeout(options.onload, 50);   // 让上一个回调先执行，以便启用GGB模拟器
      }
      setTimeout(function() {
        var frame = document.querySelector('.GeoGebraFrame');
        if (frame && params.borderColor === 'none') {
          frame.style['border-width'] = 0;
        }
      }, 0);
    };

    if (!window.GGBApplet) {
      params.appletOnLoad();
      return false;
    }
    if (options._app && (window.ggbApplet || window.onload)) {
      return false;
    }

    var applet = new window.GGBApplet(params);
    var preview = (options.preview || params.filename || '').replace(/\.ggb$/i, '.png') || null;

    applet.setHTML5Codebase('webSimple/');
    if (params.width && params.height) {
      applet.setPreviewImage(preview, 'loading.png');
    }

    params._loading = true;
    setTimeout(function() {
      if (params._loading) {
        delete params._loading;
        applet.removeExistingApplet('applet');
        applet.inject('applet', 'html5');
      }
    }, 50);
    window.onload = function() {
      delete params._loading;
      applet.inject('applet', 'html5');
    };
    return true;
  };

  setTimeout(function() {
    var params = getURLParams();
    if (!window.ggbApplet) {
      params._app = true;
      Hi.openGGBFile(params);
    }
  }, 0);

})();
