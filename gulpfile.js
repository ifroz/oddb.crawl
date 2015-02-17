var gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    serve = require('gulp-serve'),
    browserify = require('browserify'),
    reactify = require('reactify'),
    source = require('vinyl-source-stream'),
    colors = require('colors');

var swallowError = function(e) {
  console.log(colors.red(e.message));
  console.log(colors.grey(e.stack));
  this.emit('end');
};

var cfg = {
  jsxFiles: 'app/**/*.jsx',
  htmlFiles: 'app/**/*.html',
  mainJs: './main.js',

  dist: 'dist',

  servePort: 1337
};

gulp.task('default', ['watch']);
gulp.task('watch', function() {
  gulp.watch(cfg.jsxFiles, ['react']);
  gulp.watch(cfg.htmlFiles, ['html']);
  gulp.run('serve');
});

gulp.task('react', ['eslint', 'jsx']);
gulp.task('eslint', function() {
  gulp.src(cfg.jsxFiles).
      pipe(eslint()).
      pipe(eslint.format());
      //pipe(eslint.failOnError());
});
gulp.task('jsx', function() {
  var b = browserify();
  b.transform(reactify);
  b.add(cfg.mainJs);
  return b.bundle().
      on('error', swallowError).
      pipe(source(cfg.mainJs)).
      pipe(gulp.dest(cfg.dist));
});

gulp.task('html', function() {
  gulp.src(cfg.htmlFiles).pipe(gulp.dest(cfg.dist));
});

gulp.task('serve', serve({
  root: cfg.dist,
  port: cfg.servePort
}));

