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


gulp.task('default', function() {
  
});

// WORKS FINE, NO LIBS
gulp.task('javascript', function(callback) {
  return gulp.src([
      './src/js/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat("sj.js"))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'))
    .on('error', handleErrors);
});

gulp.task('compile-templates', function (cb) {
  exec('./node_modules/.bin/dottojs  -s src/js/website/views/ -d src/js/website/views/', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
})

gulp.task('browserify', function() {
    return browserify('./src/js/api.js')
        .bundle()
        .pipe(source('sj.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('widgets', ['compile-templates'], function() {
    return browserify('./src/js/website/main.js')
        .bundle()
        .pipe(source('widgets.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('compress-widgets', ['compile-templates'], function() {
    return browserify('./src/js/website/main.js')
        .bundle()
        .pipe(source('widgets.min.js'))
        .pipe(buffer()) 
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['compile-templates', 'widgets', 'compress-widgets']);
