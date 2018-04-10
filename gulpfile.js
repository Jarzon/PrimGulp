let fs = require('fs');
let es = require('event-stream');
let del = require('del');
let gulp = require('gulp');
let concat = require('gulp-concat');
let rename = require("gulp-rename");
let merge = require('gulp-merge-json');

let uglifyjs = require('uglify-es');
let composer = require('gulp-uglify/composer');

let minify = composer(uglifyjs, console);
let cleanCSS = require('gulp-clean-css');

let config = {};

gulp.task('jsRemove', function (done) {
    del(config.js.destination);

    done();
});

gulp.task('cssRemove', function (done) {
    del(config.css.destination);

    done();
});

gulp.task('imgRemove', function (done) {
    del(config.img.destination);

    done();
});

gulp.task('filesRemove', function (done) {
    del(config.files.destination);

    done();
});

gulp.task('jsBuild', function (done) {
    let tasks = Object.keys(config.js.files).map(function(key) {
        return buildJS(key, done);
    });

    es.concat.apply(null, tasks);
});

function buildJS(key, done) {
    return gulp.src(config.js.files[key])
        .pipe(concat(key))
        .pipe(minify({
                mangle: true
            })
                .on('error', function(err) {
                    console.log("JS minify error: " + err.cause.message + " in " + err.fileName);
                })
        )
        .pipe(gulp.dest(config.js.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('cssBuild', function (done) {
    let tasks = Object.keys(config.css.files).map(function(key) {
        return buildCSS(key, done);
    });

    es.concat.apply(null, tasks);
});

function buildCSS(key, done) {
    return gulp.src(config.css.files[key])
        .pipe(concat(key))
        .pipe(cleanCSS()
            .on('error', function(err) {
                console.log("CSS minify error: " + err.cause.message + " in " + err.fileNam);
            })
        )
        .pipe(gulp.dest(config.css.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('imgBuild', function (done) {
    let tasks = Object.keys(config.img.files).map(function(key) {
        return buildImg(key, done);
    });

    es.concat.apply(null, tasks);
});

function buildImg(key, done) {
    return gulp.src(config.img.files[key])
        .pipe(rename(function (path) {
            path.dirname = key;
        }))
        .pipe(gulp.dest(config.img.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('filesBuild', function (done) {
    let tasks = Object.keys(config.files.files).map(function(key) {
        return buildFiles(key, done);
    });

    es.concat.apply(null, tasks);
});

function buildFiles(key, done) {
    return gulp.src(config.files.files[key])
        .pipe(rename(function (path) {
            path.dirname = key;
        }))
        .pipe(gulp.dest(config.files.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('msgBuild', function (done) {
    gulp.src(['src/*/config/messages.json', 'vendor/*/*/config/messages.json'])
        .pipe(
            merge({fileName: 'messages.json', jsonSpace: '', edit: (json, file) => {
                    // Transform array message into string to allow typing message on multiple lines in the JSON file

                    Object.keys(json).forEach(key => {
                        Object.keys(json[key]).forEach(subkey => {
                            if (typeof json[key][subkey] !== 'string') {
                                json[key][subkey] = json[key][subkey].join('');
                            }
                        });
                    });

                    return json;
                }})
                .on('error', function(err) {
                    console.log("Messages build error: " + err.message + " in " + err.fileName + " ");
                    done();
                })
        )
        .pipe(gulp.dest('app/config/'));

    done();
});

gulp.task('assetsBuild', function (done) {
    return gulp.src(['src/*/config/assets.json', 'vendor/*/*/config/assets.json'])
        .pipe(
            merge({fileName: 'assets.json', jsonSpace: '', concatArrays: true})
                .on('error', function(err) {
                    console.log("Assets build error: " + err.message + " in " + err.fileName + " ");
                    done();
                })
        )
        .pipe(gulp.dest('app/config/'))
        .on('end', done);
});

gulp.task('assetsReload', function (done) {
    fs.readFile('app/config/assets.json', 'utf8', function (err, data) {
        if (err) cb(err);

        try {
            config = JSON.parse(data);
        } catch(error) {
            done(error);
        }

        done();
    });
});

gulp.task('stop', function (cb) {
    fs.unlink('./.stop.primgulp', function(error) {
        if (err) cb(error);
    }.bind(cb));
    console.log('Stop Gulp to update depedencies');
    cb();
    process.exit(0);
});

gulp.task('watch', function (done) {
    Object.keys(config.js.files).forEach((key) => {
        gulp.watch(config.js.files[key], null, (done) => {
            buildJS(key, done);
        });
    });

    Object.keys(config.css.files).forEach((key) => {
        gulp.watch(config.css.files[key], null, (done) => {
            buildCSS(key, done);
        });
    });

    Object.keys(config.img.files).forEach((key) => {
        gulp.watch(config.img.files[key], null, (done) => {
            buildImg(key, done);
        });
    });

    Object.keys(config.files.files).forEach((key) => {
        gulp.watch(config.files.files[key], null, (done) => {
            buildFiles(key, done);
        });
    });

    gulp.watch(['src/*/config/messages.json', 'vendor/*/*/config/messages.json'], gulp.series('msgBuild'));
    gulp.watch(['src/*/config/assets.json', 'vendor/*/*/config/assets.json'], gulp.series('assetsBuild'));
    gulp.watch(['app/config/assets.json'], gulp.series('assetsReload'));
    gulp.watch(['.stop.primgulp'], gulp.series('stop'));

    done();
});

gulp.task('default',
    gulp.series('assetsBuild', 'assetsReload',
        gulp.parallel('filesRemove', 'imgRemove', 'cssRemove', 'jsRemove'),
        'msgBuild', 'filesBuild', 'imgBuild',
        gulp.parallel('cssBuild', 'jsBuild'),
        'watch'
    )
);