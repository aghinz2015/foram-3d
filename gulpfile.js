"use strict";

var gulp        = require("gulp"),
    es          = require("event-stream"),
    coffee      = require("gulp-coffee"),
    uglify      = require("gulp-uglify"),
    concat      = require("gulp-concat"),
    rename      = require("gulp-rename"),
    sourcemaps  = require("gulp-sourcemaps"),
    inject      = require("gulp-inject"),
    bowerFiles  = require("main-bower-files");

gulp.task("build", function() {
  var sourceFiles = ["src/**/*.coffee"];

  var result = gulp.src(sourceFiles)
                .pipe(sourcemaps.init())
                .pipe(coffee({ bare: true }))
                .pipe(concat("foram_3d.js"));

  return result
          .pipe(sourcemaps.write())
          .pipe(gulp.dest("dist/js"))
          .pipe(uglify())
          .pipe(rename("foram_3d.min.js"))
          .pipe(gulp.dest("dist/js"));
});

gulp.task("index", ["build"], function () {
  var target  = gulp.src("./dist/index.html");

  var bower   = gulp.src(bowerFiles({ includeDev: true }), { read: false });
  var vendors = gulp.src(["./vendors/**/*.js"], { read: false });
  var dist    = gulp.src(["./dist/js/foram_3d.js"], { read: false });

  return target
    .pipe(inject(bower, { name: "bower", relative: true }))
    .pipe(inject(es.merge(vendors, dist), { relative: true }))
    .pipe(gulp.dest("./dist"));
});

gulp.task("watch", ["index"], function() {
  gulp.watch(["src/**/*.coffee"], ["build"]);
});

gulp.task("default", ["watch"]);
