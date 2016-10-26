import gulp from 'gulp';
import babel from 'gulp-babel';
import gulpWebpack from 'gulp-webpack';
import browserSync from 'browser-sync';
import path from 'path';
import changed from 'gulp-changed';
import del from 'del';
import webpackConfig from './webpack.config.dev.js';
import nodemon from 'gulp-nodemon';
import nodemonConfig from './nodemon';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import gutil from 'gulp-util';
import eslint from 'gulp-eslint';
import plumber from 'gulp-plumber';
import { spawn } from 'child_process';

// browserSync = browserSyncImport.create();

// utility functions
const projPath = (...postfix) => path.join(__dirname, ...postfix);
const buildPath = (...postfix) => projPath('build', ...postfix);
const libPath = (...postfix) => buildPath('lib', 'node_modules', ...postfix);
const files = prefix => path.join(prefix, '**', '*');


//////////////////////////////////////////////////////
// path config
//////////////////////////////////////////////////////

const paths =
	{
		src: {
			src: projPath('src'),
			dest: {
				babel: libPath(),
				hmr: buildPath('src', 'node_modules'),
			},
		},
		views: {
			src: projPath('views'),
			dest: buildPath('views'),
		},
		json: {
			src: projPath('json'),
			dest: buildPath('json'),
		},
		env: {
			src: projPath('.env'),
			dest: buildPath('.env'),
		},
		vendor: {
			src: projPath('vendor'),
			dest: libPath('vendor'),
		},
		server: {
			dir: libPath('server'),
			index: libPath('server', 'index.js'),
			dev: libPath('server', 'devServer.js'),
		},
		client: {
			dir: libPath('client'),
			index: libPath('client', 'index.js'),
		},
		app: buildPath('app.js'),
	}
;

nodemonConfig.watch = [paths.server.dir];

//////////////////////////////////////////////////////
// composite tasks
//////////////////////////////////////////////////////

const browserSyncWatch =
	gulp.parallel(
		watchSrc,
		watchJSON,
		watchViews,
		watchDotenv,
		watchVendor,
		watchHMR,
	)
;

const browserSyncBuild =
	gulp.parallel(
		buildLib,
		buildViews,
		buildJSON,
		buildDotenv,
		buildVendor,
		buildHMR,
	)
;

export const build =
	gulp.parallel(
    browserSyncBuild,
    buildApp,
	)
;

export const watch =
	gulp.parallel(
		browserSyncWatch,
		watchLib,
	)
;

//////////////////////////////////////////////////////
// pure tasks
//////////////////////////////////////////////////////

function devServer(done) {
	  nodemonConfig.script = paths.server.dev;
	  nodemonConfig.stdout = false;

	  return nodemon(nodemonConfig)
		  .on('stdout', data => {
		    var str = data.toString().trim();

		    str.split(/\r\n|\r|\n/g).forEach(line => {
		      gutil.log(`[srv]: ${line}`);
		      if(line === '* LISTENING *') browserSync.reload();
		    });
		  })
		  .on('stderr', data => {
		    var str = data.toString().trim();

		    str.split(/\r\n|\r|\n/g).forEach(line => {
		      gutil.log(`[srv stderr]: ${line}`);
		      if(line === '* LISTENING *') browserSync.reload();
		    });
		  })
			.on('start', done);
}


function startBrowserSyncProxy(done) {
	const compiler = webpack(webpackConfig);

	const WPMW = webpackMiddleware(
		compiler,
		{
			publicPath: '/',
			stats: false,
			progress: true,
		}
	);

	const HMRMW = webpackHotMiddleware(compiler);

	browserSync.init({
		proxy: {
			target: 'localhost:3030',
			middleware: [HMRMW, WPMW],
		},
		open: false,
		reloadOnRestart: false,
		reloadDelay: 0,
		ws: true,
		// files: ['lib/**/*'],
	},
	done
	);
}


// watches
function watchSrc(done) {
	gulp.watch(files(paths.src.src), buildLib);
	done();
}


function watchJSON(done) {
	gulp.watch(files(paths.json.src), buildJSON);
	done();
}

function watchViews(done) {
	gulp.watch(files(paths.views.src), buildViews);
	done();
}

function watchVendor(done) {
	gulp.watch(files(paths.vendor.src), buildVendor);
	done();
}

// unused in favor of webpackMiddleware with browser-sync
function watchLib(done) {
  webpackConfig.watch = true;

  gulp.watch(files(paths.lib.src), () => {
    return gulp.src(paths.client.index)
      .pipe(gulpWebpack(webpackConfig))
      .pipe(gulp.dest(buildPath()));
	  });

	done();
}

function watchDotenv(done) {
  gulp.watch(paths.env.src, buildDotenv);
	done();
}

function watchHMR(done) {
	gulp.watch(files(paths.src.src), buildHMR);
	done();
}

///////////// builds

function buildApp() {
  webpackConfig.watch = false;

  return gulp.src(paths.clientEntry)
    .pipe(gulpWebpack(webpackConfig))
    .pipe(gulp.dest(paths.build));
}

function buildLib() {
  return gulp.src(files(paths.src.src) + '.js')
    .pipe(plumber((err) => {

      gutil.log('[babel] ' + gutil.colors.red('Babel failed to compile.'));
      gutil.log(`[babel] ${gutil.colors.red(err.message)}`);

      err.codeFrame.split(/\r\n|\r|\n/g).forEach(line => {
        gutil.log(`[babel]: ${line}`);
      });
    }))
    .pipe(changed(libPath()))
    // .pipe(eslint())
    // .pipe(eslint.format())
    // .pipe(eslint.failAfterError())
    .pipe(babel())
    .pipe(gulp.dest(libPath()));
}

function buildHMR() {
	return gulp.src(files(paths.src.src))
		.pipe(changed(paths.src.dest.hmr))
		.pipe(gulp.dest(paths.src.dest.hmr));
}

function buildViews() {
  return gulp.src(files(paths.views.src))
    .pipe(changed(paths.views.dest))
    .pipe(gulp.dest(paths.views.dest));
};


function buildJSON() {
  return gulp.src(files(paths.json.src))
    .pipe(changed(paths.json.dest))
    .pipe(gulp.dest(paths.json.dest));
}

function buildDotenv() {
  return gulp.src(paths.env.src)
    .pipe(gulp.dest(buildPath()));

}

function buildVendor() {
  return gulp.src(files(paths.vendor.src))
    .pipe(changed(paths.vendor.dest))
    .pipe(gulp.dest(paths.vendor.dest));
};

// clean
export function clean() {
  return del(buildPath());
}


// lint [not used]
function lint() {
  return gulp.src([paths.srcFiles])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}


//////////////////////////////////////////////////////
// default task
//////////////////////////////////////////////////////

// start dev server
export default
	gulp.series(
		clean,
		browserSyncBuild,
		gulp.parallel(
			browserSyncWatch,
			devServer,
			startBrowserSyncProxy,
		),
	)
;