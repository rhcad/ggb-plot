/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
describe('Seek using keyword', function() {
  var text = '【题目】\n设P是平行四边形ABCD内部的一点，且∠PBA＝∠PDA。\n求证：∠PAB＝∠PCB。';

  it('with simple text', function() {
    Hi.init('AB∥CD，AC与EF垂直\n四点ABEP共圆');
    expect(Hi.seek(1, 'CD')).toBeGreaterThan(0);
  });

  it('without GGB', function() {
    expect(Hi.init(text)).toBeGreaterThan(0);
    expect(Hi.seek(2, 'ABCD')).toBeGreaterThan(0);
    expect(Hi.seek(3, 'PAB')).toBeGreaterThan(0);
    expect(Hi.seek(0, 'PAB')).toBeUndefined();
    expect(Hi.seek(3, 'CAB')).toBeUndefined();
  });

});
