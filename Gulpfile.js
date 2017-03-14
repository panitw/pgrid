const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const less = require('gulp-less');

gulp.task('build', function () {
    return browserify({
			entries: './src/main.js',
			debug: true
    	})
        .transform('babelify', {
        	presets: ['es2015']
        })
        .bundle()
        .pipe(source('pgrid.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('build:css', function () {
    return gulp.src('./styles/pgrid.less')
        .pipe(less())
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch', ['build'], function () {
    gulp.watch('src/**/*.js', ['build']);
    gulp.watch('styles/**/*.less', ['build:css']);
});

gulp.task('default', ['watch']);