var gulp = require('gulp'),
    serve = require('gulp-serve'),
    watch = require('gulp-watch'),
    browserify = require('browserify'),
    reactify = require('reactify'),
    source = require('vinyl-source-stream');


var cfg = {
  jsxFiles: 'app/**/*.jsx',
  htmlFiles: 'app/**/*.html',
  mainJs: './main.js',

  dist: 'dist',

  servePort: 1337
};

gulp.task('jsx', function() {
  var b = browserify();
  b.transform(reactify);
  b.add(cfg.mainJs);
  return b.bundle().
      pipe(source(cfg.mainJs)).
      pipe(gulp.dest(cfg.dist));
});

gulp.task('html', function() {
  gulp.src(cfg.htmlFiles).pipe(gulp.dest(cfg.dist));
});

gulp.task('compile', ['jsx', 'html']);
gulp.task('default', ['compile']);

gulp.task('serve', serve({
  root: cfg.dist,
  port: cfg.servePort
}));

gulp.task('watch', function() {
  gulp.watch(cfg.jsxFiles, ['jsx']);
  gulp.watch(cfg.htmlFiles, ['html']);
  gulp.run('serve');
});