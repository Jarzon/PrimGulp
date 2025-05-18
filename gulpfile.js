let fs = require('fs');
let del = require('del');
let gulp = require('gulp');
let concat = require('gulp-concat');
let rename = require("gulp-rename");
let merge = require('gulp-merge-json');
const jsonminify = require('gulp-jsonminify');

let uglifyjs = require('uglify-es');
let composer = require('gulp-uglify/composer');

let minify = composer(uglifyjs, console);
let cleanCSS = require('gulp-clean-css');

let spawn = require('child_process').spawn;

let config = {
    production: process.env.production !== undefined
};

let assets = {};

gulp.task('jsRemove', function (done) {
    if(typeof assets.js !== 'undefined') del(assets.js.destination + '*');

    done();
});

gulp.task('cssRemove', function (done) {
    if(typeof assets.css !== 'undefined') del(assets.css.destination + '*');

    done();
});

gulp.task('imgRemove', function (done) {
    if(typeof assets.img !== 'undefined') del(assets.img.destination + '*');

    done();
});

gulp.task('filesRemove', function (done) {
    if(typeof assets.files !== 'undefined') del(assets.files.destination + '*');

    done();
});

gulp.task('jsonRemove', function (done) {
    if(typeof assets.json !== 'undefined') del(assets.json.destination + '*');

    done();
});

gulp.task('jsBuild', function (done) {
    let tasks = Object.keys(assets.js.files).map(function(key) {
        return buildJS(key, done);
    });

    let stream = require('merge-stream')(...tasks);

    return stream.isEmpty() ? null : stream;
});

function buildJS(key, done) {
    let stream = gulp.src(assets.js.files[key], {allowEmpty: true})
        .pipe(concat(key));

    if(config.production) {
        let config = {
            compress: true,
            mangle: true
        };

        if(assets.js.config !== undefined && assets.js.config[key] !== undefined) {
            config = assets.js.config[key];
        }

        stream.pipe(
            minify(config)
                .on('error', function(err) {
                    console.log("JS minify error: " + err.cause.message + " in " + err.fileName);
                    done();
                })
        );
    }

    return stream.pipe(gulp.dest(assets.js.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('jsonBuild', function (done) {
    if(typeof assets.json === 'undefined') {
        done();
        return null;
    }
    let tasks = Object.keys(assets.json.files).map(function(key) {
        return buildJSON(key, done);
    });

    let stream = require('merge-stream')(...tasks);

    return stream.isEmpty() ? null : stream;
});

function buildJSON(key, done) {
    let stream = gulp.src(assets.json.files[key])
        .pipe(concat(key));

    if(config.production) {

        stream.pipe(jsonminify())
            .on('error', function(err) {
                console.log("JSON minify error: " + err.cause.message + " in " + err.fileName);
                done();
            });
    }

    return stream.pipe(gulp.dest(assets.json.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('cssBuild', function (done) {
    if(typeof assets.css === 'undefined') {
        done();
        return null;
    }
    let tasks = Object.keys(assets.css.files).map(function(key) {
        return buildCSS(key, done);
    });

    let stream = require('merge-stream')(...tasks);

    return stream.isEmpty() ? null : stream;
});

function buildCSS(key, done) {
    return gulp.src(assets.css.files[key])
        .pipe(concat(key))
        .pipe(cleanCSS()
            .on('error', function(err) {
                console.log("CSS minify error: " + err.cause.message + " in " + err.fileNam);
            })
        )
        .pipe(gulp.dest(assets.css.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('imgBuild', function (done) {
    if(typeof assets.img === 'undefined') {
        done();
        return null;
    }
    let tasks = Object.keys(assets.img.files).map(function(key) {
        return buildImg(key, done);
    });

    let stream = require('merge-stream')(...tasks);

    return stream.isEmpty() ? null : stream;
});

function buildImg(key, done) {
    return gulp.src(assets.img.files[key])
        .pipe(rename(function (path) {
            path.dirname = key;
        }))
        .pipe(gulp.dest(assets.img.destination))
        .on('end', function() {
            done();
        });
}

gulp.task('filesBuild', function (done) {
    if(typeof assets.files === 'undefined') {
        done();
        return null;
    }
    let tasks = Object.keys(assets.files.files).map(function(key) {
        return buildFiles(key, done);
    });

    let stream = require('merge-stream')(...tasks);

    return stream.isEmpty() ? null : stream;
});

function buildFiles(key, done) {
    return gulp.src(assets.files.files[key])
        .pipe(rename(function (path) {
            path.dirname = key;
        }))
        .pipe(gulp.dest(assets.files.destination))
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
            assets = JSON.parse(data);
        } catch(error) {
            done(error);
        }

        done();
    });
});

gulp.task('watch', function (done) {
    if(typeof assets.js !== 'undefined') {
        Object.keys(assets.js.files).forEach((key) => {
            gulp.watch(assets.js.files[key], null, (done) => {
                buildJS(key, done);
            });
        });
    }

    if(typeof assets.json !== 'undefined') {
        Object.keys(assets.json.files).forEach((key) => {
            gulp.watch(assets.json.files[key], null, (done) => {
                buildJSON(key, done);
            });
        });
    }

    if(typeof assets.css !== 'undefined') {
        Object.keys(assets.css.files).forEach((key) => {
            gulp.watch(assets.css.files[key], null, (done) => {
                buildCSS(key, done);
            });
        });
    }

    if(typeof assets.img !== 'undefined') {
        Object.keys(assets.img.files).forEach((key) => {
            gulp.watch(assets.img.files[key], null, (done) => {
                buildImg(key, done);
            });
        });
    }

    if(typeof assets.files !== 'undefined') {
        Object.keys(assets.files.files).forEach((key) => {
            gulp.watch(assets.files.files[key], null, (done) => {
                buildFiles(key, done);
            });
        });
    }

    gulp.watch(['src/*/config/messages.json', 'vendor/*/*/config/messages.json'], gulp.series('msgBuild'));
    gulp.watch(['src/*/config/assets.json', 'vendor/*/*/config/assets.json'], gulp.series('assetsBuild'));
    gulp.watch(['app/config/assets.json'], gulp.series('assetsReload', gulp.parallel('filesRemove', 'imgRemove', 'cssRemove', 'jsRemove', 'jsonRemove'),
        'msgBuild', 'filesBuild', 'imgBuild',
        gulp.parallel('cssBuild', 'jsBuild', 'jsonBuild')));

    done();
});

gulp.task('preventExecution', function (done) {
        if(fs.existsSync('./.stop.primgulp') === true) {
            gulp.watch('./.stop.primgulp', {events: 'unlink'}, function(ok) {
                done();
                ok();
            });
        } else {
            done();
        }
    }
);

gulp.task('start',
    gulp.series('preventExecution', 'assetsBuild', 'assetsReload',
        gulp.parallel('filesRemove', 'imgRemove', 'cssRemove', 'jsRemove', 'jsonRemove'),
        'msgBuild', 'filesBuild', 'imgBuild',
        gulp.parallel('cssBuild', 'jsBuild', 'jsonBuild'),
        'watch'
    )
);

gulp.task('default', function() {
    let p;

    del('./.stop.primgulp');

    gulp.watch('./.stop.primgulp', {events: 'add'}, spawnChildren);
    spawnChildren();

    function spawnChildren(done = null) {
        // kill previous spawned process
        if(p) { p.kill(); }

        // `spawn` a child `gulp` process linked to the parent `stdio`
        p = spawn('gulp', ['start'], {stdio: 'inherit'});

        if(done) done();
    }
});