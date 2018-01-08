/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
(function() {
  'use strict';

  // 提取英文字母、数字或希腊字母序列，作为亮显关键字
  function pickKey(text) {
    return text.replace(/[^A-Za-z0-9\u0370-\u03ff]/g, '');
  }

  // 对于匹配的关系串text，提取两个字母序列形成三元组返回值. 参数 text 举例：'AB∥CD', 'AB⊥CD', 'AB=CD','AB平行于CD','AB与CD平行'
  function parse2Segments(text) {
    var a = text.replace(/[^A-Z].+$/, '');        // 提取第一个字母序列
    var b = pickKey(text.substring(a.length));    // 提取第二个字母序列
    return [['segment', a, true], ['segment', b]];
  }

  // 匹配规则集(正则表达式)，简单规则省略parse函数
  // rules[i].re    ：正则表达式规则
  // rules[i].type  ：线段间的关系类型
  // rules[i].parse ：关键字提取函数，简单规则省略parse函数
  var rules = [
    {
      re: /[A-Z]{2}(平行(于)?|∥)[A-Z]{2}|[A-Z]{2}(和|与|、)[A-Z]{2}平行/,
      type: '∥', parse: parse2Segments
    },
    {
      re: /[A-Z]{2}(垂直(于)?|⊥)[A-Z]{2}|[A-Z]{2}(和|与|、)[A-Z]{2}垂直/,
      type: '⊥', parse: parse2Segments
    },
    {
      re: /[A-Z]{2}(=|＝|等于)[A-Z]{2}|[A-Z]{2}(和|与|、)[A-Z]{2}(相等|等长)/,
      type: '＝', parse: parse2Segments
    },
    {type: 'circle3p', re: /[A-Z]{4}共圆|(圆|⊙)[A-Z]{3}/},
    {type: 'line', re: /[A-Z]{3,4}共线/},
    {type: 'angle3p', re: /(角|∠)[A-Z]{3}/},
    {type: 'angle1p', re: /(角|∠)([A-Z0-9\u0370-\u03ff])/},
    {type: 'polygon', re: /(Rt△|△|□|三角形|平行四边形)?[A-Z]{3,8}/},
    {type: 'ray', re: /射线[A-Z]{2}/},
    {type: 'line', re: /直线[A-Z]{2}/},
    {type: 'extension', re: /[A-Z]{2}的延长线|延长[A-Z]{2}/},
    {type: 'segment', re: /(线段)?[A-Z]{2}/},
    {type: 'circle1p', re: /(⊙|圆)[A-Z]/},
    {type: 'highlight', re: /(⊙|圆|射线|直线|线段)[a-z]/},
    {type: 'point', re: /[A-Z]/}
  ];

  // 从匹配最优项中，提取关键字和谓词, 构造四元组添加到queue的末尾
  // 参数：queue（四元组数组）, line（文本行号）, rule（匹配的最优规则项）, text（匹配的最优匹配串，例如：'AB∥CD'，'∠ABC' ）
  function applyRule(queue, line, rule, text) {
    // 若rule.parse有值，则r=二维数组（例如：[['segment', 'AB', true], ['segment', 'CD']] ）；否则r=一维数组（例如：['angle3p','ABC'] ）
    var r = rule.parse ? rule.parse(text) : [rule.type, pickKey(text)];  // 从匹配文本提取谓词和关键字
    if (r[0] instanceof Array) {              // 如果是图形关系结果，则分别添加两个图形的四元组
      queue.push({
        line: line,
        name: r[0][0],
        key: r[0][1],
        rel: rule.type
      }, {
        line: line,
        name: r[1][0],
        key: r[1][1]
      });
    } else {                                  // 若r[0]不是数组，则是简单结果（例如：'∠ABC'），则往queue的末尾添加一个图形的四元组
      queue.push({
        line: line,
        name: r[0],
        key: r[1]
      });
    }
  }

  // 解析几何题的所有文本行，逐行，逐规则，逐最优，构造并返回所有的四元组数组queue
  window.parseLines = function(lines) {
    var queue = [];
    var pos, rule, t;

    lines.forEach(function(text, line) {          // 解析lines中的每一行, text=当前行，line=当前行的索引
      text = text.replace(/\s+/g, '');            // 取一行文本，去除空白字符
      while (text) {                              // 开始匹配文本，直到没有匹配项或已到行尾
        pos = 9999;                               // 匹配位置先置为最大值
        rule = null;                              // 最优规则项：先置为空
        rules.forEach(function(r) {               // 尝试每个规则
          t = text.search(r.re);                  // 该规则的匹配位置
          if (t >= 0 && pos > t) {                // 如果更先匹配，则为最佳匹配候选项
            pos = t;
            rule = r;
          }
        });
        if (rule) {                               // 找到最佳匹配项
          t = text.match(rule.re)[0];             // 匹配到的文本
          applyRule(queue, line + 1, rule, t);    // 从匹配项中，提取关键字和谓词, 构造四元组添加到queue的末尾
          text = text.substring(pos + t.length);  // text留下最优匹配串之后的，继续当前行的后续匹配
        } else {
          break;                                  // 没有匹配项就结束本行
        }
      }
    });

    return queue;
  };
})();
