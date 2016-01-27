var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var exec = require('child_process').exec;

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

function handleErrors(errors) {
	console.log(errors);
}

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

gulp.task('default', ['browserify', 'uglify']);

