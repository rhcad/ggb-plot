/**
 * Created by Zhang Yungui on 2017/12/27.
 * License: GNU GPLv3
 */
describe('Open GGB file', function() {
  it('via base64 content', function(done) {
    expect(Hi.openGGBFile).toBeDefined();
    Hi.openGGBFile('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',
      {onload: done});
  });

  it('via filename', function(done) {
    Hi.openGGBFile({filename: 'test/angle.ggb', onload: function() {
      expect(Hi.getObjectNames('angle').length).toBe(2);
      done();
    }});
  });

  it('then findSegment', function(done) {
    Hi.openGGBFile({filename: 'test/angle.ggb', onload: function() {
      expect(Hi.findSegment('AB')).toBeTruthy();
      expect(Hi.findSegment(['A', 'C'])).toBeTruthy();
      expect(Hi.findSegment('AD')).not.toBeTruthy();
      done();
    }});
  });

  it('then hasPolygon', function(done) {
    Hi.openGGBFile({filename: 'test/angle.ggb', onload: function() {
      expect(Hi.hasPolygon('ABC')).toBeTruthy();
      expect(Hi.hasPolygon(['A', 'C', 'B'])).toBeTruthy();
      expect(Hi.hasPolygon('ACD')).not.toBeTruthy();
      done();
    }});
  });
});
