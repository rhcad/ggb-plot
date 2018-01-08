/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
describe('Automated construction', function() {
  describe('via create directly', function() {
    beforeEach(function(done) {
      Hi.openGGBFile('empty.ggb', {onload: done});
    });

    describe('as triangle', function() {
      it('ABC', function() {
        expect(Hi.createTriangle('ABC')).toMatch(/^[a-z]/);
        expect(Hi.hasPolygon('ABC')).toBeTruthy();
        expect(Hi.getObjectNames('point').length).toBeGreaterThan(2);
      });

      it('and another triangle', function() {
        expect(Hi.createTriangle('ABCD')).toBeTruthy();
        expect(Hi.createTriangle('EF')).toBeFalsy();
      });
    });

    describe('as special point', function() {
      it('of midpoint', function() {
        expect(Hi.createMidpoint('AB')).toBeFalsy();
        Hi.createSegment('AB');
        expect(Hi.createMidpoint('AB')).toBeTruthy();
      });
      it('of segment midpoint', function() {
        var name = Hi.createSegment('AB');
        expect(Hi.createMidpoint(name)).toBeFalsy();
        expect(Hi.createMidpoint([name])).toBeTruthy();
      });
    });

    it('as quadrangle ABCD', function() {
      expect(Hi.createPolygon('ABCD')).toBeTruthy();
      expect(Hi.hasPolygon('ABCD')).toBeTruthy();
      expect(Hi.hasPolygon('ABC')).not.toBeTruthy();
      expect(Hi.getObjectNames('point').length).toBeGreaterThan(3);
    });

    describe('as isosceles triangle', function() {
      it('simply', function() {
        expect(Hi.createIsoscelesTriangle('ABC')).toBeTruthy();
        expect(Hi.findSegment('AB')).toBeTruthy();
        expect(Hi.findSegment('CA')).toBeTruthy();
        expect(Hi.findSegment('BC')).toBeTruthy();
        expect(Hi.getLength(['A', 'B'])).toBeGreaterThan(0);
        expect(Hi.areEqualLength(Hi.findSegment('AB'), ['A', 'C'])).toBeTruthy();
      });

      it('with exist points AC', function() {
        Hi.createSegment('AC');
        expect(Hi.createIsoscelesTriangle('ABC')).toBeTruthy();
        expect(Hi.areEqualLength(Hi.findSegment('AB'), Hi.findSegment('AC'))).toBeTruthy();
      });

      it('with exist points BC', function() {
        Hi.createSegment('BC');
        expect(Hi.createIsoscelesTriangle('ABC')).toBeTruthy();
        expect(Hi.areEqualLength(Hi.findSegment('AB'), Hi.findSegment('AC'))).toBeTruthy();
      });
    });

    describe('as right angled triangle', function() {
      it('simply', function() {
        var name = Hi.createRightAngledTriangle('ABC');
        expect(name).toBeTruthy();
        expect(ggbApplet.getObjectType(name + 'a')).toBe('angle');
        expect(ggbApplet.getValue(name + 'a')).toBeCloseTo(Math.PI / 2, 3);
      });

      it('with exist points AB', function() {
        Hi.createSegment('AB');
        var name = Hi.createRightAngledTriangle('ABC');
        expect(ggbApplet.getValue(name + 'a')).toBeCloseTo(Math.PI / 2, 3);
      });

      it('with exist points AC', function() {
        Hi.createSegment('AC');
        var name = Hi.createRightAngledTriangle('ABC');
        expect(ggbApplet.getValue(name + 'a')).toBeCloseTo(Math.PI / 2, 3);
      });

      it('with exist points BC', function() {
        Hi.createSegment('BC');
        var name = Hi.createRightAngledTriangle('ABC');
        expect(ggbApplet.getValue(name + 'a')).toBeCloseTo(Math.PI / 2, 3);
      });
    });

    it('as center of circle', function() {
      var po = Hi.createCenter(Hi.createCircle3p('ABC'), {name: 'O'});
      expect(po).toBe('O');
      expect(Hi.areEqualLength(['O', 'A'], ['O', 'B'])).toBeTruthy();

      var circle = Hi.findCirclesByCenter('O')[0];
      expect(circle).toBeTruthy();

      var chord = Hi.createChord('CD', circle);
      var pm = Hi.createMidpoint([chord], {name: 'M'});
      expect(pm).toBe('M');
      expect(Hi.createRay('OM')).toBeTruthy();
    });

    describe('as trapezoid', function() {
      it('simply', function() {
        expect(Hi.createTrapezoid('ABCD')).toBeTruthy();
        expect(Hi.findSegment('AB')).toBeTruthy();
        expect(Hi.findSegment('CD')).toBeTruthy();
        expect(Hi.areParallel(Hi.findSegment('AD'), Hi.findSegment('BC'))).toBeTruthy();
      });

      it('with exist points AD', function() {
        Hi.createSegment('AD');
        expect(Hi.createTrapezoid('ABCD')).toBeTruthy();
        expect(Hi.findSegment('AB')).toBeTruthy();
        expect(Hi.findSegment('CD')).toBeTruthy();
        expect(Hi.findSegment('AD')).toBeTruthy();
        expect(Hi.areParallel(Hi.findSegment('AD'), ['B', 'C'])).toBeTruthy();
      });

      it('with exist points CD', function() {
        Hi.createSegment('CD');
        expect(Hi.createTrapezoid('ABCD')).toBeTruthy();
        expect(Hi.areParallel(Hi.findSegment('AD'), ['B', 'C'])).toBeTruthy();
      });

      it('with exist points ACD', function() {
        expect(Hi.createRightAngledTriangle('ACD')).toBeTruthy();
        expect(Hi.createTrapezoid('ABCD')).toBeTruthy();
        expect(Hi.areParallel(Hi.findSegment('AD'), ['B', 'C'])).toBeTruthy();
      });

      it('with exist points BCD', function() {
        expect(Hi.createRightAngledTriangle('BCD')).toBeTruthy();
        expect(Hi.createTrapezoid('ABCD')).toBeTruthy();
        expect(Hi.areParallel(Hi.findSegment('AD'), ['B', 'C'])).toBeTruthy();
      });
    });

    describe('as rectangle', function() {
      it('simply', function() {
        expect(Hi.createRectangle('ABCD')).toBeTruthy();
        expect(Hi.areEqualLength(Hi.findSegment('AB'), Hi.findSegment('DC'))).toBeTruthy();
        expect(Hi.areEqualLength(Hi.findSegment('AD'), Hi.findSegment('BC'))).toBeTruthy();
        expect(Hi.areParallel(Hi.findSegment('AB'), Hi.findSegment('CD'))).toBeTruthy();
        expect(Hi.areParallel(Hi.findSegment('CB'), Hi.findSegment('DA'))).toBeTruthy();
      });

      it('with exist points CD', function() {
        Hi.createSegment('CD');
        expect(Hi.createRectangle('ABCD')).toBeTruthy();
        expect(Hi.arePerpendicular(Hi.findSegment('AB'), Hi.findSegment('BC'))).toBeTruthy();
        expect(Hi.arePerpendicular(Hi.findSegment('CD'), Hi.findSegment('AD'))).toBeTruthy();
      });

      it('with exist points AD', function() {
        Hi.createSegment('AD');
        expect(Hi.createRectangle('ABCD')).toBeTruthy();
      });

      it('with exist right angled triangle', function() {
        Hi.createRightAngledTriangle('ADC');
        expect(Hi.createRectangle('ABCD')).toBeTruthy();
        expect(Hi.arePerpendicular(['A', 'B'], ['B', 'C'])).toBeTruthy();
        expect(Hi.arePerpendicular(['C', 'D'], ['A', 'D'])).toBeTruthy();

        Hi.createRightAngledTriangle('EFG');
        expect(Hi.createRectangle('EFGH')).toBeTruthy();
      });

      it('with exist points ADC', function() {
        Hi.createTriangle('ADC');
        expect(Hi.createRectangle('ABCD')).toBeFalsy();
      });
    });

    describe('as parallelogram', function() {
      it('simply', function() {
        expect(Hi.createParallelogram('ABCD')).toBeTruthy();
        expect(Hi.areParallel(['A', 'D'], ['B', 'C'])).toBeTruthy();
        expect(Hi.areParallel(['A', 'B'], ['C', 'D'])).toBeTruthy();
      });

      it('with exist points AD', function() {
        Hi.createSegment('AD');
        expect(Hi.createParallelogram('ABCD')).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'D'], ['B', 'C'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'B'], ['C', 'D'])).toBeTruthy();
      });

      it('with exist points CD', function() {
        Hi.createSegment('CD');
        expect(Hi.createParallelogram('ABCD')).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'D'], ['B', 'C'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'B'], ['C', 'D'])).toBeTruthy();
      });
    });

    describe('as diamond', function() {
      it('simply', function() {
        expect(Hi.createDiamond('ABCD')).toBeTruthy();
        expect(Hi.areParallel(['A', 'D'], ['B', 'C'])).toBeTruthy();
        expect(Hi.areParallel(['A', 'B'], ['C', 'D'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'B'], ['A', 'D'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'B'], ['B', 'C'])).toBeTruthy();
      });

      it('with exist points AD', function() {
        Hi.createSegment('AD');
        expect(Hi.createDiamond('ABCD')).toBeTruthy();
        expect(Hi.areParallel(['A', 'D'], ['B', 'C'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'D'], ['B', 'C'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'B'], ['C', 'D'])).toBeTruthy();
      });

      it('with exist points CD', function() {
        Hi.createSegment('CD');
        expect(Hi.createDiamond('ABCD')).toBeTruthy();
        expect(Hi.areParallel(['A', 'B'], ['C', 'D'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'D'], ['B', 'C'])).toBeTruthy();
        expect(Hi.areEqualLength(['A', 'B'], ['C', 'D'])).toBeTruthy();
      });
    });
  });

  // 题目: 在△ABC中，AB=AC，△ABC的外接圆⊙O的弦AD的延长线交BC的延长线于点E．求证：△ABD~△AEB．
  // 来源: http://www.zujuan.com/question/detail-6154667.shtml
  describe('for problem 1', function() {
    beforeEach(function(done) {
      Hi.openGGBFile('empty.ggb', {onload: done});
    });

    it('created manually', function() {
      Hi.createIsoscelesTriangle('ABC');
      var circle = Hi.createCircle3p('ABC');
      Hi.createCenter(circle, {name: 'O'});
      expect(Hi.createChord('AD', circle)).toBeTruthy();
      expect(Hi.createIntersect(Hi.createExtension('AD'), Hi.createExtension('BC'), {name: 'E'})).toBeTruthy();
    });

    xit('from "ABC"', function() {
      Hi.init('在△ABC中');
      expect(Hi.hasPolygon('ABC')).toBeTruthy();
      expect(Hi.getObjectNames('point').length).toBeGreaterThan(2);
    });

    xit('from "ABC,AB=AC"', function() {
      Hi.init('在△ABC中，AB=AC');
      expect(Hi.findSegment('AB')).toBeTruthy();
      expect(Hi.findSegment('CA')).toBeTruthy();
      expect(Hi.findSegment('BC')).toBeTruthy();
    });
  });
});
