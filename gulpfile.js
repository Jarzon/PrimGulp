let fs = require('fs');
let es = require('event-stream');
let del = require('del');
let gulp = require('gulp');
let concat = require('gulp-concat');
let rename = require("gulp-rename");
let merge = require('gulp-merge-json');

let config = {};

gulp.task('js-clean', function () {
    return del(['public/js/*']);
});

gulp.task('css-clean', function () {
    return del(['public/css/*']);
});

gulp.task('img-clean', function () {
    return del(['public/img/*']);
});

gulp.task('files-clean', function () {
    return del(['public/files/*']);
});

gulp.task('msg-clean', function () {
    return del(['app/config/messages.json']);
});

function jsBuild() {
    let tasks = Object.keys(config.js.files).map(function(key) {
        return gulp.src(config.js.files[key])
            .pipe(concat(key))
            .pipe(gulp.dest(config.js.destination));
    });

    return es.concat.apply(null, tasks);
}

function cssBuild() {
    let tasks = Object.keys(config.css.files).map(function(key) {
        return gulp.src(config.css.files[key])
            .pipe(concat(key))
            .pipe(gulp.dest(config.css.destination));
    });

    return es.concat.apply(null, tasks);
}

function imgBuild() {
    let tasks = Object.keys(config.img.files).map(function(key) {
        return gulp.src(config.img.files[key])
            .pipe(rename(function (path) {
                path.dirname = key;
            }))
            .pipe(gulp.dest(config.img.destination));
    });

    return es.concat.apply(null, tasks);
}

function filesBuild() {
    let tasks = Object.keys(config.files.files).map(function(key) {
        return gulp.src(config.files.files[key])
            .pipe(rename(function (path) {
                path.dirname = key;
            }))
            .pipe(gulp.dest(config.files.destination));
    });

    return es.concat.apply(null, tasks);
}

function msgBuild(cb) {
    return gulp.src(['src/*/config/messages.json', 'vendor/*/*/config/messages.json'])
        .pipe(
            merge({fileName: 'messages.json', jsonSpace: ''})
                .on('error', function(err) {
                    cb(err);
                })
        )
        .pipe(gulp.dest('app/config/'));
}

function assetsBuild(cb) {
    return gulp.src(['src/*/config/assets.json', 'vendor/*/*/config/assets.json'])
        .pipe(
            merge({fileName: 'assets.json', jsonSpace: '', concatArrays: true})
                .on('error', function(err) {
                    cb(err);
                })
        )
        .pipe(gulp.dest('app/config/'))
        .on('end', cb);
}

function assetsReload(cb) {
    fs.readFile('app/config/assets.json', 'utf8', function (err, data) {
        if (err) cb(err);

        try {
            config = JSON.parse(data);
        } catch(error) {
            cb(error);
        }

        cb();
    });
}

function watch() {
    gulp.watch(['src/*/assets/js/*.js', 'vendor/*/*/assets/js/*.js'], ['js-build']);
    gulp.watch(['src/*/assets/css/*.css', 'vendor/*/*/assets/css/*.css'], ['css-build']);
    gulp.watch(['src/*/assets/img/*', 'vendor/*/*/assets/img/*'], ['img-build']);
    gulp.watch(['src/*/assets/files/*', 'vendor/*/*/assets/files/*'], ['files-build']);
    gulp.watch(['src/*/config/messages.json', 'vendor/*/*/config/messages.json'], ['msg-clean', 'msg-build']);
    gulp.watch(['src/*/config/assets.json', 'vendor/*/*/config/assets.json'], ['assets-build']);
    gulp.watch(['app/config/assets.json'], ['assets-reload']);
}

gulp.task('js-build', ['js-clean'], function() {
    return jsBuild();
});

gulp.task('css-build', ['css-clean'], function() {
    return cssBuild();
});

gulp.task('img-build', ['img-clean'], function() {
    return imgBuild();
});

gulp.task('files-build', ['files-clean'], function() {
    return filesBuild();
});

gulp.task('msg-build', function(cb) {
    return msgBuild(cb);
});

gulp.task('assets-build', function(cb) {
    return assetsBuild(cb);
});

gulp.task('assets-reload', function(cb) {
    assetsReload(cb);
});

gulp.task('watch', function() {
    watch();
});

gulp.task('default', [], function() {
    assetsBuild(function() {
        assetsReload(function() {
            msgBuild({});
            filesBuild();
            imgBuild();
            cssBuild();
            jsBuild();
        });
    });

    watch();
});

module.exports = gulp;