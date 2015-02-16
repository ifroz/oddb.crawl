var gulp = require('gulp'),
    react = require('gulp-react'),
    serve = require('gulp-serve'),
    watch = require('gulp-watch');

var cfg = {
  jsxFiles: 'app/**/*.jsx',
  htmlFiles: 'app/**/*.html',
  dist: 'dist',
  servePort: 1337
};

gulp.task('jsx', function() {
  gulp.src(cfg.jsxFiles).pipe(react()).
      pipe(browserify()).
      pipe(gulp.dest(cfg.dist));
});
gulp.task('html', function() {
  gulp.src(cfg.htmlFiles).pipe(gulp.dest(cfg.dist));
});

gulp.task('compile', ['jsx', 'html']);

gulp.task('default', ['compile']);

gulp.task('serve', serve({ root: cfg.dist, port: cfg.servePort }));

gulp.task('watch', function() {
    gulp.watch(cfg.jsxFiles, ['compile', 'serve']);
});

