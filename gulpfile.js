let gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
let concat = require('gulp-concat');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify-es').default;
let resizer = require('gulp-images-resizer');
var sourcemaps = require('gulp-sourcemaps');

let distFolder = 'dist';

gulp.task('css', () => {
    return gulp.src('css/*.css')
      .pipe(cleanCSS(null, (details) => {
        console.log(`${details.name}: ${details.stats.originalSize}`);
        console.log(`${details.name}: ${details.stats.minifiedSize}`);
      }))
      .pipe(gulp.dest(distFolder));
  });


let vendorsFiles = [
    'node_modules/idb/lib/idb.js'
];
let jsFiles = [
    './js/main.js',
    './js/dbhelper.js'
];
let detailJsFiles = [
    './js/restaurant_info.js',
    './js/dbhelper.js'
];

gulp.task('vendors', () => {
    return gulp.src(vendorsFiles)
        .pipe(concat('vendors.js'))
        .pipe(gulp.dest(distFolder))
        .pipe(rename('vendors.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(distFolder));
});
gulp.task('js', () => {
    return gulp.src(jsFiles)
        .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(gulp.dest(distFolder))
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./dist'))
        .pipe(gulp.dest(distFolder));
});
gulp.task('js-detail', () => {
    return gulp.src(detailJsFiles)
        .pipe(sourcemaps.init())
        .pipe(concat('detail.js'))
        .pipe(gulp.dest(distFolder))
        .pipe(rename('detail.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./dist'))
        .pipe(gulp.dest(distFolder));
});

gulp.task('scripts', ['css', 'vendors', 'js', 'js-detail']);

gulp.task('resize', () => {
    return gulp.src('./img/**/*.jpg')
        .pipe(resizer({
            format: "jpg",
            width: "70%"
        }))
        .pipe(gulp.dest('./img'))
});