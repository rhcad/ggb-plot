/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
(function(Hi) {
  'use strict';

  Hi.selection = [];

  function canHighLight(name) {
    return name && Hi.selection.indexOf(name) < 0 && name.indexOf('_{hi}_{hi}') < 0;
  }

  // 删除所有临时图形
  Hi.removeSelection = function(filter) {
    Hi.selection.forEach(function(name) {
      if (!filter || filter(name)) {
        Hi.removeHighLight(name);
      }
    });
  };

  // 删除临时图形
  Hi.removeHighLight = function(name, timeout) {
    var ret = 0;
    var i;

    if (name instanceof Array) {
      for (i = name.length - 1; i >= 0; i--) {
        ret += Hi.removeHighLight(name[i], timeout);
      }
    } else {
      var remove = function() {
        i = Hi.selection.indexOf(name);
        if (i >= 0) {
          ggbApplet.deleteObject(name);
          Hi.selection.splice(i, 1);
          ret++;
        }
      };
      if (timeout) {
        setTimeout(remove, timeout);
      } else {
        remove();
      }
    }
    return ret;
  };

  // 设置亮显图形的显示属性, 例如参数: ('PBA', {timeout: Hi.defaultTimeout})
  function addHighLight(name, attr) {
    var item = Hi.step && Hi.step <= Hi.queue.length && Hi.queue[Hi.step - 1] || {};
    var prev = item && Hi.step > 1 && Hi.queue[Hi.step - 2] || {};

    ggbApplet.setLabelVisible(name, false);   // 不显示标签，仅亮显图形
    ggbApplet.setFixed(name, true);           // 亮显图形不可移动

    attr = attr && typeof attr === 'object' && attr || {};
    // 根据参数中的延时情况，设置不同的亮显颜色，行内同种谓词的图形交替使用蓝色和红色
    if (!attr.color && item.name && item.line === prev.line && item.name === prev.name && item.order % 2 === 1) {
      attr.color = Hi.alternativeColor;
    } else {
      attr.color = attr.color || Hi.defaultColor; // 设置为参数指定的颜色，默认蓝色亮显
    }

    ggbApplet.setVisible(name, !attr.hidden); // 默认要显示亮显图形，除非指定了hidden选项
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

    Hi.selection.push(name);

    if (attr && attr.timeout) {     // 延时删除亮显图形，从而实现不再亮显的效果
      Hi.removeHighLight(name, attr.timeout);
    }
    return name;
  }

  // 得到临时图形的名称
  function buildName(basename, type, attr) {
    return basename + type + '_{' + (attr && attr.aux ? 'aux' : 'hi') + '}';
  }

  // 根据两个点名（串或数组）得到临时图形的名称
  function buildName2(ab, type, attr) {
    if (typeof ab === 'string') {
      console.assert(/^[A-Z]{2}$/.test(ab), 'invalid name');
      return buildName(ab, type, attr);
    } else {        // 参数ab为数组时，每个元素（字符串）可为任意点名
      return buildName(ab.join(''), type, attr);
    }
  }

  // 亮显过三点的圆
  Hi.selCircle3p = function(abc, attr) {
    console.assert(/^[A-Z]{3}$/.test(abc), 'invalid name');
    var hi = buildName(abc, 'c', attr);
    if (canHighLight(hi)) {
      ggbApplet.evalCommand(hi + '=Circle[' + abc.slice(0, 3).split('').join(',') + ']');
      ggbApplet.setLineThickness(hi, 7);
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 指定三个点名的数组参数，亮显角度符号
  Hi.selAngle3pArr = function(name, points, attr) {
    ggbApplet.evalCommand(name + '=Angle[' + points.join(',') + ']');
    var value = ggbApplet.getValue(name);
    if (value > Math.PI) {   // 若当前角度为钝角，则三点反转形成锐角
      ggbApplet.deleteObject(name);
      ggbApplet.evalCommand(name + '=Angle[' + points.reverse().join(',') + ']');
    }

    var timeout = attr && attr.timeout;
    if (timeout) {
      Hi.removeHighLight(Hi.selPoint(points[1]), timeout / 2);
      Hi.removeHighLight(Hi.selSegment(points.slice(0, 2)), timeout);
      Hi.removeHighLight(Hi.selSegment(points.slice(1)), timeout);
    }
  };

  // “∠PBA”形式的角度亮显函数
  Hi.selAngle3p = function(abc, attr) {
    console.assert(/^[A-Z]{3}$/.test(abc), 'invalid name');
    var hi = buildName(abc, 'a', attr);
    if (canHighLight(hi) &&
      ggbApplet.getObjectType(abc[0]) === 'point' &&
      ggbApplet.getObjectType(abc[1]) === 'point' &&
      ggbApplet.getObjectType(abc[2]) === 'point') {
      Hi.selAngle3pArr(hi, abc.split(''), attr);
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // ∠A、∠1、∠α 形式的角度亮显函数
  Hi.selAngle1p = function(name, attr) {
    console.assert(/^[A-Za-z0-9\u0370-\u03ff]$/.test(name), 'invalid name');
    var hi = buildName(name, '1a', attr);
    var cmd, xy, pts = [];

    if (canHighLight(hi)) {
      if (/^[A-Z]$/.test(name)) {   // 是 ∠A 形式的角度，则找到所有端点在给定点的线段及其另一端点的序号
        xy = Hi.getObjectCoord(name);  // 记下给定点的坐标
        Hi.getObjectNames('segment').forEach(function(seg) {       // 遍历每一个线段 seg
          if (Hi.areEqualCoords(Hi.getSegmentCoord(seg, 0), xy)) {      // 如果起点重合，就记下终点
            pts.push(Hi.findPoint(Hi.getSegmentCoord(seg, 1)));
          }
          else if (Hi.areEqualCoords(Hi.getSegmentCoord(seg, 1), xy)) { // 如果终点重合，就记下起点
            pts.push(Hi.findPoint(Hi.getSegmentCoord(seg, 0)));
          }
        });
        if (pts.length === 2) {
          pts.splice(1, 0, name);   // 给定点作为三点的中间点
          Hi.selAngle3pArr(hi, pts, attr);
        }
      } else {    // ∠1、∠α 形式的角度，找到对应名称的角度符号（需要提前画出）
        if (ggbApplet.getObjectType(name) === 'angle') {
          cmd = ggbApplet.getCommandString(name, false);
          pts = cmd.substring(cmd.indexOf('[') + 1, cmd.indexOf(']')).split(',');
          if (pts.length === 3) {  // 取角度符号定义串中的三个点名
            Hi.selAngle3pArr(hi, pts, attr);
          }
        }
      }
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 多边形的亮显函数
  Hi.selPolygon = function(names, attr) {
    console.assert(/^[A-Z]{3,20}$/.test(names), 'invalid name');
    var hi = buildName(names.substring(0, 8), 'g', attr);
    if (canHighLight(hi)) {
      ggbApplet.evalCommand(hi + '=Polygon[' + names.split('').join(',') + ']');
      ggbApplet.setLineThickness(hi, 0);
      if (attr && attr.timeout && names.length > 3) {
        attr.timeout *= Math.min(names.length, 6) / 3;
      }
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 亮显过给定的两点的直线
  Hi.selLine = function(ab, attr) {
    var hi = buildName2(ab, 'line', attr);
    if (canHighLight(hi) &&
      ggbApplet.getObjectType(ab[0]) === 'point' && ggbApplet.getObjectType(ab[1]) === 'point') {
      ggbApplet.evalCommand(hi + '=Line[' + ab[0] + ',' + ab[1] + ']');
      ggbApplet.setLineThickness(hi, attr && attr.dashed ? 5 : 7);
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 给定两点，亮显一个射线，第一个点为起点
  Hi.selRay = function(ab, attr) {
    var hi = buildName2(ab, 'ray', attr);
    if (canHighLight(hi) &&
      ggbApplet.getObjectType(ab[0]) === 'point' && ggbApplet.getObjectType(ab[1]) === 'point') {
      ggbApplet.evalCommand(hi + '=Ray[' + ab[0] + ',' + ab[1] + ']');
      ggbApplet.setLineThickness(hi, attr && attr.dashed ? 5 : 7);
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 给定线段的两个端点，亮显线段延长线
  Hi.selExtension = function(ab, attr) {
    var hi = buildName2(ab, 'ext', attr);
    if (canHighLight(hi) &&
      ggbApplet.getObjectType(ab[0]) === 'point' && ggbApplet.getObjectType(ab[1]) === 'point') {
      ggbApplet.evalCommand(hi + '=Ray[' + ab[1] + ',Reflect[' + ab[0] + ',' + ab[1] + ']]');
      ggbApplet.setLineThickness(hi, attr && attr.dashed ? 5 : 7);
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 线段的亮显函数，参数 ab 为两个点名的串或数组
  Hi.selSegment = function(ab, attr) {
    var hi = buildName2(ab, 's', attr);
    // 下面根据端点创建线段，要求提前在GGB文件中画出端点
    if (canHighLight(hi) &&
      ggbApplet.getObjectType(ab[0]) === 'point' && ggbApplet.getObjectType(ab[1]) === 'point') {
      var cmd = hi + '=Segment[' + ab[0] + ',' + ab[1] + ']';
      ggbApplet.evalCommand(cmd);  // 例如：cmd = 'AB_{hi}=Segment[A,B]'
      ggbApplet.setLineThickness(hi, attr && attr.dashed ? 5 : 7);  // 加粗亮显
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 查找圆心位于给定点的所有圆
  Hi.findCirclesByCenter = function(center) {
    var xy = Hi.getObjectCoord(center);
    return Hi.getObjectNames('circle').filter(function(name) {
      return Hi.areEqualCoords(xy, Hi.getObjectCoord(name));
    });
  };

  // 亮显圆心位于给定点的所有圆
  Hi.selCircle1p = function(center, attr) {
    return Hi.findCirclesByCenter(center).map(function(name) {
      return Hi.selCircle2p(center, name, attr);
    }).filter(function(name) {
      return name;
    });
  };

  // 给定圆心点和圆上点，亮显一个圆
  Hi.selCircle2p = function(center, name, attr) {
    var hi = buildName(name, 'o', attr);

    if (canHighLight(hi)) {
      if (ggbApplet.getObjectType(name) === 'circle') {     // 根据圆心点(center)和另一个圆(name)上任意点创建圆
        ggbApplet.evalCommand(hi + '=Circle[' + center + ',Point[' + name + ']]');
      }
      else if (ggbApplet.getObjectType(name) === 'point') { // 根据圆心点(center)和另一个点(name)创建圆
        ggbApplet.evalCommand(hi + '=Circle[' + center + ',' + name + ']');
      }
      ggbApplet.setLineThickness(hi, 7);                    // 加粗显示
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 根据图形名称亮显
  Hi.selShape = function(name, attr) {
    var hi = buildName(name, '', attr);
    if (canHighLight(hi)) {
      ggbApplet.evalCommand(hi + '=' + ggbApplet.getCommandString(name, false));
      ggbApplet.setLineThickness(hi, 7);                    // 加粗显示
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };

  // 亮显一个点，点名可为任意名称
  Hi.selPoint = function(name, attr) {
    var hi = buildName(name, 'p', attr);
    if (ggbApplet.getObjectType(name) === 'point' && canHighLight(hi)) {  // 对应点图形(name)需要提前画出来
      ggbApplet.evalCommand(hi + '=AttachCopyToView[' + name + ',0]');    // 在绘图区(0)创建副本，随原图形移动，随视图缩放
      ggbApplet.setPointSize(hi, 5);                                      // 变大显示
      return addHighLight(hi, attr);
    } else {
      Hi.removeHighLight(hi);
    }
  };
})(window.Hi);
