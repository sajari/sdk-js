var gulp = require('gulp');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var jslint = require('gulp-jslint');
var tape = require('gulp-tape');
var tapColorize = require('tap-colorize');
var exec = require('child_process').exec;

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var prettify = require('gulp-jsbeautifier');

gulp.task('beautify', function() {
  gulp.src('./src/js/*.js')
    .pipe(prettify({config: '.jsbeautifyrc', mode: 'VERIFY_AND_WRITE'}))
    .pipe(gulp.dest('./src/js/'));
});

gulp.task('lint', function() {
  gulp.src('./src/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
});

gulp.task('test', function() {
  return gulp.src('tests/*.js')
    .pipe(tape({
      reporter: tapColorize()
    }));
});

gulp.task('browserify', function() {
    return browserify('./src/js/api.js')
        .bundle()
        .pipe(source('sj.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('live-tests', function() {
    return browserify('./src/js/live-tests.js')
        .bundle()
        .pipe(source('live-tests.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('uglify', function() {
    return browserify('./src/js/api.js')
        .bundle()
        .pipe(source('sj.min.js'))
        .pipe(buffer()) 
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['lint', 'test', 'browserify', 'uglify']);

gulp.task("watch", ['beautify'], function() {
    watch(['src/js/*', 'tests/*'], function() {
        gulp.start("default");
    });
});
