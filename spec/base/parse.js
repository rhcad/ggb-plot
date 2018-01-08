/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
describe('Parse lines', function() {
  function parse(lines, right) {
    return window.parseLines(lines).map(function(r) {
      return r.name + '(' + r.key + (r.rel ? '，' + r.rel : '') + ')';
    }).join('、');
  }

  it('for simple rules', function() {
    expect(parse(['AB∥CD'])).toBe('segment(AB，∥)、segment(CD)');
    expect(parse(['AC与EF垂直'])).toBe('segment(AC，⊥)、segment(EF)');
    expect(parse(['AB=CD'])).toBe('segment(AB，＝)、segment(CD)');
    expect(parse(['四点ABEP共圆'])).toBe('circle3p(ABEP)');
    expect(parse(['圆ABC'])).toBe('circle3p(ABC)');
    expect(parse(['⊙O'])).toBe('circle1p(O)');
    expect(parse(['∠PAB'])).toBe('angle3p(PAB)');
    expect(parse(['∠β'])).toBe('angle1p(β)');
    expect(parse(['平行四边形ABCD'])).toBe('polygon(ABCD)');
    expect(parse(['CD的延长线'])).toBe('extension(CD)');
    expect(parse(['射线AB'])).toBe('ray(AB)');
    expect(parse(['AB'])).toBe('segment(AB)');
    expect(parse(['点P'])).toBe('point(P)');
  });

});
