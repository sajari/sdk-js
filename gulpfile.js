var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var exec = require('child_process').exec;

var browserify = require('browserify');
var source = require('vinyl-source-stream');

function handleErrors(errors) {

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
  exec('./node_modules/.bin/dottojs  -s src/js/widgets/views/ -d src/js/widgets/views/', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
})

gulp.task('browserify', function() {
    return browserify('./src/js/api.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('sj.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./dist/'));
});

gulp.task('widgets', function() {

    return browserify('./src/js/widgets/widgets.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('widgets.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['compile-templates', 'widgets']);
