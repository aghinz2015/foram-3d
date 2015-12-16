'use strict';

var gulp        = require('gulp'),
    typeScript  = require('gulp-typescript'),
    uglify      = require('gulp-uglify'),
    connect     = require('gulp-connect'),
    sourcemaps  = require('gulp-sourcemaps'),
    rename      = require('gulp-rename'),
    prompt      = require('gulp-prompt'),
    inject      = require('gulp-inject'),
    bowerFiles  = require("main-bower-files");

var tsProject = typeScript.createProject({
  target: 'es5',
  declarationFiles: false,
  module: 'amd',
  removeComments: true,
  noExternalResolve: false,
  out: 'foram3d.js',
  noEmitOnError: true,
  typescript: require('typescript')
});

gulp.task('release', function(){
  var sourceFiles = ['src/**/*.ts', 'typings/**/*.ts'];

  return gulp.src('*').pipe(prompt.prompt({
    type: 'input',
    name: 'task',
    message: 'Version?'
  }, function(res){
    var version = res.task + '.min.js';

    gulp.src(sourceFiles)
        .pipe(sourcemaps.init())
        .pipe(typeScript(tsProject))
        .pipe(uglify())
        .pipe(rename(version))
        .pipe(gulp.dest('release'));
  }));
});

gulp.task('build', function() {
  var sourceFiles = ['src/**/*.ts', 'typings/**/*.ts'];
  var result = gulp.src(sourceFiles)
                .pipe(sourcemaps.init())
                .pipe(typeScript(tsProject));

  return result.js
          .pipe(sourcemaps.write())
          .pipe(gulp.dest('build/js/'))
          .pipe(uglify())
          .pipe(rename('foram3d.min.js'))
          .pipe(gulp.dest('build/js'));
});

gulp.task('wiredep', ['build'], function () {
  var target  = gulp.src("./build/index.html");

  var bower = gulp.src(bowerFiles({ includeDev: true }), { read: false });
  var build = gulp.src(["./build/js/foram3d.js"], { read: false });

  return target
    .pipe(inject(bower, { name: "bower", relative: true }))
    .pipe(inject(build, { relative: true }))
    .pipe(gulp.dest("./build"));
});

gulp.task('watch', ['wiredep'], function() {
  gulp.watch(['src/**/*.ts', 'typings/**/*.ts'], ['build']);
});

gulp.task('connect', function() {
  connect.server({
    port: 4000,
    root: 'build/',
  });
});

gulp.task('default', ['wiredep', 'watch', 'connect']);
