/**
 * Created by Danielo Rodriguez Rivero on 06/10/2015.
 */

'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');

gulp.task('sass', () => {
    gulp.src('./wiki/plugins/OctoWiki/styles/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./wiki/plugins/OctoWiki/styles/'));
});

gulp.task('sass:watch', () => {
    gulp.watch('./wiki/plugins/OctoWiki/styles/*.scss', ['sass']);
});
