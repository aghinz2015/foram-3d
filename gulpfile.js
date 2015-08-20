"use strict";

var gulp        = require("gulp"),
    coffee      = require("gulp-coffee"),
    uglify      = require("gulp-uglify"),
    concat      = require("gulp-concat"),
    plumber     = require("gulp-plumber"),
    rename      = require("gulp-rename"),
    sourcemaps  = require("gulp-sourcemaps");

gulp.task("build", function() {
  var sourceFiles = ["src/**/*.coffee"];

  var result = gulp.src(sourceFiles)
                .pipe(sourcemaps.init())
                .pipe(coffee({bare: true}))
                .pipe(concat("foram_3d.js"));

  return result
          .pipe(sourcemaps.write())
          .pipe(gulp.dest("public/js"))
          .pipe(uglify())
          .pipe(rename("foram_3d.min.js"))
          .pipe(gulp.dest('public/js'));
});

gulp.task("watch", ["build"], function() {
  gulp.watch(["src/**/*.coffee"], ["build"]);
});

gulp.task("default", ["watch"]);
