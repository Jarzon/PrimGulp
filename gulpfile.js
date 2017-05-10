var es = require('event-stream');
var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require("gulp-rename");
var merge = require('gulp-merge-json');
var del = require('del');
var fs = require('fs');

try {
    var config = require('./app/config/assets.json');
} catch(error) {
    var config = {};
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
        fs.readFile('./app/config/assets.json', 'utf8', function (err, data) {
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
    var tasks = Object.keys(config.js.files).map(function(key) {
        return gulp.src(config.js.files[key])
            .pipe(concat(key))
            .pipe(gulp.dest(config.js.destination));
    });

    return es.concat.apply(null, tasks);
});

gulp.task('css-build', ['css-clean'], function() {
    var tasks = Object.keys(config.css.files).map(function(key) {
        return gulp.src(config.css.files[key])
            .pipe(concat(key))
            .pipe(gulp.dest(config.css.destination));
    });

    return es.concat.apply(null, tasks);
});

gulp.task('img-build', ['img-clean'], function() {
    var tasks = Object.keys(config.img.files).map(function(key) {
        return gulp.src(config.img.files[key])
            .pipe(rename(function (path) {
                path.dirname = key;
            }))
            .pipe(gulp.dest(config.img.destination));
    });

    return es.concat.apply(null, tasks);
});

gulp.task('msg-build', function() {
    gulp.src('src/*/config/messages.json')
        .pipe(merge({fileName: 'messages.json', jsonSpace: ''}))
        .pipe(gulp.dest('app/config/'));
});

gulp.task('assets-build', ['assets-clean'], function() {
    gulp.src('src/*/config/assets.json')
        .pipe(merge({fileName: 'assets.json', jsonSpace: '', concatArrays: true}))
        .pipe(gulp.dest('app/config/'));
});

gulp.task('watch', function() {
    gulp.watch('src/*/assets/js/*.js', ['js-build']);
    gulp.watch('src/*/assets/css/*.css', ['css-build']);
    gulp.watch('src/*/assets/img/*', ['img-build']);
    gulp.watch('src/*/config/messages.json', ['msg-clean', 'msg-build']);
    gulp.watch('src/*/config/assets.json', ['rebuild-all']);
});

gulp.task('default', ['rebuild-all', 'watch'], function(){});