var cheerio = require('cheerio');

function expectTOC($, addFile) {

  var file1 = addFile ? "first-chapter.html" : "";
  var file2 = addFile ? "second-chapter.html" : "";

  var level1 = $('nav > ol > li');
  var level2 = $('nav > ol > li > ol > li');
  expect(level1.find('> a').eq(0).text()).toEqual("First Heading")
  expect(level1.find('> a').eq(0).attr('href')).toEqual(file1 + "#first-heading-4WbKTev")
    expect(level2.find('> a').eq(0).text()).toEqual("Sub Heading")
    expect(level2.find('> a').eq(0).attr('href')).toEqual(file1 + "#sub-heading-YlG0T2j")
    expect(level2.find('> a').eq(1).text()).toEqual("Links")
    expect(level2.find('> a').eq(1).attr('href')).toEqual(file1 + "#links-5vqdTZW")
  expect(level1.find('> a').eq(1).text()).toEqual("Second Heading")
  expect(level1.find('> a').eq(1).attr('href')).toEqual(file2 + "#second-heading-8vy0FZP")
    expect(level2.find('> a').eq(2).text()).toEqual("Second section 1")
    expect(level2.find('> a').eq(2).attr('href')).toEqual(file2 + "#second-section-1-NP3ZF5b")
}

describe("TOC plugin", function() {

  it("should insert TOC into files", function(done) {
    var uid = triggerBuild({
      builds: [{ format: "html" }],
      files: [
        "spec/support/book/content/toc.html",
        "spec/support/book/content/first-chapter.md",
        "spec/support/book/content/second-chapter.html"
      ],
      liquid: {
        includes: "spec/support/book/includes",
      },
      finish: function() {
        var content = buildContent(uid, "build1/toc.html").toString();
        expectTOC(cheerio.load(content), true)
        done();
      }
    });
  });

  it("should insert TOC into layouts", function(done) {
    var uid = triggerBuild({
      builds: [{ format: "html" }],
      layout: "spec/support/book/layouts/toc.html",
      files: [
        "spec/support/book/content/first-chapter.md",
        "spec/support/book/content/second-chapter.html"
      ],
      liquid: {
        includes: "spec/support/book/includes",
      },
      finish: function() {
        expectTOC(cheerio.load(buildContent(uid, "build1/first-chapter.html").toString()), true);
        expectTOC(cheerio.load(buildContent(uid, "build1/second-chapter.html").toString()), true)
        done();
      }
    });
  });

  it("should generate TOC even when content is wrapped", function(done) {
    var uid = triggerBuild({
      builds: [{ format: "html" }],
      layout: "spec/support/book/layouts/container.html",
      files: [
        "spec/support/book/content/toc.html",
        "spec/support/book/content/first-chapter.md",
        "spec/support/book/content/second-chapter.html"
      ],
      liquid: {
        includes: "spec/support/book/includes",
      },
      finish: function() {
        var content = buildContent(uid, "build1/toc.html").toString();
        expectTOC(cheerio.load(content), true)
        done();
      }
    });
  });

  it("should not add filenames in PDF", function(done) {
    var uid = triggerBuild({
      builds: [{ format: "pdf" }],
      files: [
        "spec/support/book/content/toc.html",
        "spec/support/book/content/first-chapter.md",
        "spec/support/book/content/second-chapter.html"
      ],
      liquid: {
        includes: "spec/support/book/includes",
      },
      finish: function() {
        var content = buildContent(uid, "build1/consolidated.html").toString();
        expectTOC(cheerio.load(content), false)
        done();
      }
    });
  });

  it('should make toc links relative to toc permalink', function(done) {
    var uid = triggerBuild({
      builds: [{ format: "html" }],
      permalink: ':title/index.html',
      files: [
        "spec/support/book/content/toc.html",
        "spec/support/book/content/first-chapter.md"
      ],
      liquid: {
        includes: "spec/support/book/includes",
      },
      finish: function() {
        var content = buildContent(uid, "build1/toc/index.html").toString();
        var $ = cheerio.load(content);
        expect($('a').attr('href')).toEqual('../first-chapter/index.html#first-heading-94J3TWY')
        done();
      }
    });
  });

  describe("Parts", function() {

    it("should populate TOC with parts", function(done) {
      var uid = triggerBuild({
        files: partTree,
        liquid: {
          includes: "spec/support/book/includes",
        },
        builds: [{ format: "html" }],
        finish: function() {
          var $ = cheerio.load(buildContent(uid, "build1/toc.html").toString());
          expect($('nav > ol > li').eq(0).find('> a').text()).toEqual("First Heading")
          expect($('nav > ol > li').eq(1).find('> span').text()).toEqual("Part 1")
          expect($('nav > ol > li').eq(1).find('> ol > li > a').eq(0).text()).toEqual("Second Heading")
          expect($('nav > ol > li').eq(1).find('> ol > li > span').eq(0).text()).toEqual("Sub Part")
          done();
        }
      });
    });

  });

});
