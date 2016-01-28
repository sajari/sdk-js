var gulp = require('gulp');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var tape = require('gulp-tape');
var tapColorize = require('tap-colorize');
var exec = require('child_process').exec;

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

function handleErrors(errors) {
	console.log(errors);
}

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

gulp.task('uglify', function() {
    return browserify('./src/js/api.js')
        .bundle()
        .pipe(source('sj.min.js'))
        .pipe(buffer()) 
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['test', 'browserify', 'uglify']);

gulp.task("watch", function() {
    watch(['src/js/*', 'tests/*'], function() {
        gulp.start("default");
    });
});
