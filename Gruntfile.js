'use strict';

/**
 * @param {grunt} grunt
 */
module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  grunt.initConfig({

    // Project config
    config: {
      path: {
        app: 'app',
        dist: 'dist',
        package: 'package'
      },
      package: grunt.file.readJSON('package.json'),
      manifest: grunt.file.readJSON('app/manifest.json')
    },

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['<%= config.path.app %>/scripts/{,*/}*.js'],
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },
      sass: {
        files: ['<%= config.path.app %>/styles/{,*/}*.{scss,sass}'],
        tasks: ['sass:debug']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      styles: {
        files: ['<%= config.path.app %>/styles/{,*/}*.css'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= config.path.app %>/*.html',
          '<%= config.path.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= config.path.app %>/manifest.json',
          '<%= config.path.app %>/_locales/{,*/}*.json'
        ]
      }
    },

    // Grunt server and debug server setting
    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      debug: {
        options: {
          open: false,
          base: [
            '<%= config.path.app %>'
          ]
        }
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= config.path.dist %>/*',
            '!<%= config.path.dist %>/.git*'
          ]
        }]
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        node: true,
        browser: true,
        esnext: true,
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        indent: 2,
        latedef: true,
        newcap: true,
        noarg: true,
        quotmark: 'single',
        regexp: true,
        undef: true,
        unused: true,
        strict: true,
        trailing: true,
        smarttabs: true,
        validthis: true,
        globals: {
          chrome: true,
          opr: true,
          define: true
        },
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= config.path.app %>/scripts/{,*/}*.js',
        '!<%= config.path.app %>/scripts/lib/*'
      ]
    },

     // Compiles Sass to CSS and generates necessary files if requested
    sass: {
      options: {
        style: 'compressed',
        sourcemap: 'none'
      },
      debug: {
        options: {
          style: 'expanded',
          update: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.path.app %>/styles',
          src: ['*.sass'],
          dest: '<%= config.path.app %>/styles',
          ext: '.css'
        }]
      },
      expanded: {
        options: {
          style: 'expanded',
          sourcemap: 'none'
        },
        files: [{
          expand: true,
          cwd: '<%= config.path.app %>/styles',
          src: ['*.sass'],
          dest: '<%= config.path.dist %>/styles',
          ext: '.css'
        }]
      },
      compressed: {
        files: [{
          expand: true,
          cwd: '<%= config.path.app %>/styles',
          src: ['*.sass'],
          dest: '<%= config.path.dist %>/styles',
          ext: '.css'
        }]
      }
    },

    // The following *-min tasks produce minifies files in the dist folder
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.path.app %>/images',
          src: '{,*/}*.{gif,jpeg,jpg,png}',
          dest: '<%= config.path.dist %>/images'
        }]
      }
    },

    // Minify html
    htmlmin: {
      dist: {
        options: {
          removeCommentsFromCDATA: true,
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeEmptyAttributes: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.path.app %>',
          src: '*.html',
          dest: '<%= config.path.dist %>'
        }]
      }
    },

    // Minify scripts
    uglify: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.path.app %>/scripts',
          src: [
            '{,*/}*.js',
            '!lib/*.js',
            '!chromereload.js'
          ],
          dest: '<%= config.path.dist %>/scripts'
        }]
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      assets: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.path.app %>',
          dest: '<%= config.path.dist %>',
          src: [
            '_locales/{,*/}*.json',
            'stations.json',
            'scripts/lib/{,*/}*.js'
          ]
        }]
      },
      html: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.path.app %>',
          dest: '<%= config.path.dist %>',
          src: '*.html'
        }]
      },
      js: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.path.app %>/scripts',
          dest: '<%= config.path.dist %>/scripts',
          src: [
            '{,*/}*.js',
            '!lib/*.js',
            '!chromereload.js'
          ]
        }]
      }
    },

    // Compres dist files to package
    compress: {
      chrome: {
        options: {
          archive: 'package/chrome-<%= config.package.name %>-<%= config.package.version %>.zip'
        },
        files: [{
          expand: true,
          cwd: 'dist/',
          src: ['**'],
          dest: ''
        }]
      },
      opera: {
        options: {
          archive: 'package/opera-<%= config.package.name %>-<%= config.package.version %>.zip'
        },
        files: [{
          expand: true,
          cwd: 'dist/',
          src: ['**'],
          dest: ''
        }]
      }
    },

    // Bump version
    bump: {
      options: {
        files: ['package.json', '<%= config.path.app %>/manifest.json'],
        updateConfigs: ['config.package', 'config.manifest'],
        commit: true,
        commitMessage: 'Release %VERSION%',
        commitFiles: ['package.json', '<%= config.path.app %>/manifest.json'],
        createTag: true,
        tagName: '%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
        globalReplace: false
      }
    },

    // Excluded scripts from manifest
    manifestCopy: {
      options: {
        exclude: ['scripts/chromereload.js']
      }
    }
  });

  grunt.registerTask('manifestCopy', function() {
    var options = this.options({exclude: []});
    var manifest = grunt.config.get('config.manifest');

    // exclude the scripts from background
    var backgroundScripts = [];
    grunt.util._.each(manifest.background.scripts, function(script) {
      if (grunt.util._.indexOf(options.exclude, script) === -1) {
        backgroundScripts.push(script);
      }
    });
    manifest.background.scripts = backgroundScripts;

    // Write updated manifest to destination.
    grunt.file.write(grunt.config.get('config.path.dist') + '/manifest.json', JSON.stringify(manifest, null, 2));
  });

  grunt.registerTask('check', function() {
    console.log('Checking build...');

    var need = grunt.file.readJSON('build.json'),
        result = true;

    grunt.file.recurse(grunt.config.get('config.path.dist'), function(abspath, rootdir, subdir, filename) {
      var file = subdir ? subdir + '/' + filename : filename,
        index = need.indexOf(file);
      if (index < 0) {
        grunt.log.error('Found unknown file %s!', file);
        result = false;
      } else {
        need.splice(index, 1);
      }
    });

    need.forEach(function(file) {
      grunt.log.error('Required file %s not found!', file);
      result = false;
    });

    if (result) {
      grunt.log.ok();
    }
    return result;
  });

  grunt.registerTask('debug', [
    'jshint',
    'sass:debug',
    'connect:debug',
    'watch'
  ]);

  grunt.registerTask('build-chrome', [
    'jshint',
    'clean',
    'manifestCopy',
    'sass:compressed',
    'imagemin',
    'htmlmin',
    'uglify',
    'copy:assets',
    'check',
    'compress:chrome'
  ]);

  grunt.registerTask('build-opera', [
    'jshint',
    'clean',
    'manifestCopy',
    'sass:expanded',
    'imagemin',
    'copy:html',
    'copy:js',
    'copy:assets',
    'check',
    'compress:opera'
  ]);

  grunt.registerTask('build', [
    'build-chrome',
    'build-opera'
  ]);

  grunt.registerTask('release', [
    'bump',
    'build'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};
