/**
 * Created by Danielo Rodriguez Rivero on 06/10/2015.
 */

'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function () {
    gulp.src('./OctoWikiwiki/plugins/OctoWiki/styles/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./OctoWikiwiki/plugins/OctoWiki/styles/'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./OctoWikiwiki/plugins/OctoWiki/styles/*.scss', ['sass']);
});