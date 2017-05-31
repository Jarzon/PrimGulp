let fs = require('fs');
let es = require('event-stream');
let del = require('del');
let gulp = require('gulp');
let concat = require('gulp-concat');
let rename = require("gulp-rename");
let merge = require('gulp-merge-json');

try {
    let config = require('app/config/assets.json');
} catch(error) {
    let config = {};
}

gulp.task('js-clean', function () {
    return del(['public/js/*']);
});

gulp.task('css-clean', function () {
    return del(['public/css/*']);
});

gulp.task('img-clean', function () {
    return del(['public/img/*']);
});

gulp.task('msg-clean', function () {
    return del(['app/config/messages.json']);
});

gulp.task('assets-clean', function () {
    return del(['app/config/assets.json']);
});

gulp.task('assets-reload', ['assets-build'], function(cb) {
    return setTimeout(() => {
        fs.readFile('app/config/assets.json', 'utf8', function (err, data) {
            if (err) cb(err);
            config = JSON.parse(data);
            cb();
        });
    }, 50);

});

gulp.task('rebuild-all', ['assets-reload'], function() {
    gulp.start('js-build');
    gulp.start('css-build');
    gulp.start('img-build');
});

gulp.task('js-build', ['js-clean'], function() {
    let tasks = Object.keys(config.js.files).map(function(key) {
        return gulp.src(config.js.files[key])
            .pipe(concat(key))
            .pipe(gulp.dest(config.js.destination));
    });

    return es.concat.apply(null, tasks);
});

gulp.task('css-build', ['css-clean'], function() {
    let tasks = Object.keys(config.css.files).map(function(key) {
        return gulp.src(config.css.files[key])
            .pipe(concat(key))
            .pipe(gulp.dest(config.css.destination));
    });

    return es.concat.apply(null, tasks);
});

gulp.task('img-build', ['img-clean'], function() {
    let tasks = Object.keys(config.img.files).map(function(key) {
        return gulp.src(config.img.files[key])
            .pipe(rename(function (path) {
                path.dirname = key;
            }))
            .pipe(gulp.dest(config.img.destination));
    });

    return es.concat.apply(null, tasks);
});

gulp.task('msg-build', function() {
    gulp.src(['src/*/config/messages.json', 'vendor/*/config/messages.json'])
        .pipe(merge({fileName: 'messages.json', jsonSpace: ''}))
        .pipe(gulp.dest('app/config/'));
});

gulp.task('assets-build', ['assets-clean'], function() {
    gulp.src(['src/*/config/assets.json', 'vendor/*/config/assets.json'])
        .pipe(merge({fileName: 'assets.json', jsonSpace: '', concatArrays: true}))
        .pipe(gulp.dest('app/config/'));
});

gulp.task('watch', function() {
    gulp.watch(['src/*/assets/js/*.js', 'vendor/*/assets/js/*.js'], ['js-build']);
    gulp.watch(['src/*/assets/css/*.css', 'vendor/*/assets/css/*.css'], ['css-build']);
    gulp.watch(['src/*/assets/img/*', 'vendor/*/assets/img/*'], ['img-build']);
    gulp.watch(['src/*/config/messages.json', 'vendor/*/config/messages.json'], ['msg-clean', 'msg-build']);
    gulp.watch(['src/*/config/assets.json', 'vendor/*/config/assets.json'], ['rebuild-all']);
});

gulp.task('default', ['rebuild-all', 'watch'], function(){});

module.exports = gulp;