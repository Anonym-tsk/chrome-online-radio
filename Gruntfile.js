'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Configurable paths
  var config = {
    app: 'app',
    dist: 'dist'
  };

  grunt.initConfig({

    // Project settings
    config: config,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['<%= config.app %>/scripts/{,*/}*.js'],
        tasks: ['jshint'],
        options: {
          livereload: true
        }
      },
      sass: {
        files: ['<%= config.app %>/styles/{,*/}*.{scss,sass}'],
        tasks: ['sass:chrome']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      styles: {
        files: ['<%= config.app %>/styles/{,*/}*.css'],
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
          '<%= config.app %>/*.html',
          '<%= config.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= config.app %>/manifest.json',
          '<%= config.app %>/_locales/{,*/}*.json'
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
      chrome: {
        options: {
          open: false,
          base: [
            '<%= config.app %>'
          ]
        }
      }
    },

    // Empties folders to start fresh
    clean: {
      chrome: {
      },
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= config.dist %>/*',
            '!<%= config.dist %>/.git*'
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
        globals : {
          chrome: true,
          opr: true,
          define: true
        },
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= config.app %>/scripts/{,*/}*.js',
        '!<%= config.app %>/scripts/lib/*'
      ]
    },

     // Compiles Sass to CSS and generates necessary files if requested
    sass: {
      options: {
        style: 'compressed',
        sourcemap: 'none'
      },
      chrome: {
        options: {
          style: 'expanded',
          update: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.app %>/styles',
          src: ['*.sass'],
          dest: '<%= config.app %>/styles',
          ext: '.css'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/styles',
          src: ['*.sass'],
          dest: '<%= config.dist %>/styles',
          ext: '.css'
        }]
      }
    },

    // The following *-min tasks produce minifies files in the dist folder
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/images',
          src: '{,*/}*.{gif,jpeg,jpg,png}',
          dest: '<%= config.dist %>/images'
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
          cwd: '<%= config.app %>',
          src: '*.html',
          dest: '<%= config.dist %>'
        }]
      }
    },

    // Minify scripts
    uglify: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/scripts',
          src: [
            '{,*/}*.js',
            '!lib/*.js',
            '!chromereload.js'
          ],
          dest: '<%= config.dist %>/scripts'
        }]
      }
    },

    // Check build
    fileExists: {
      dist: grunt.file.readJSON('build.json')
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= config.app %>',
          dest: '<%= config.dist %>',
          src: [
            '_locales/{,*/}*.json',
            'stations.json',
            'scripts/lib/{,*/}*.js'
          ]
        }]
      }
    },

    // Compres dist files to package
    compress: {
      dist: {
        options: {
          archive: function() {
            var manifest = grunt.file.readJSON(config.app + '/manifest.json');
            return 'package/chrome-online-radio-' + manifest.version + '.zip';
          }
        },
        files: [{
          expand: true,
          cwd: 'dist/',
          src: ['**'],
          dest: ''
        }]
      }
    },

    // Update plugin version
    chromeManifestVersionUp: {
      options: {
        exclude: ['scripts/chromereload.js']
      }
    }
  });

  grunt.registerTask('chromeManifestVersionUp', function () {
    var options = this.options({
      exclude: [],
      indentSize: 2
    });

    var manifest = grunt.file.readJSON(config.app + '/manifest.json');
    var buildnumber = manifest.version.split('.');

    // Increase build number that from origin manifest
    var versionUp = function (numbers, index) {
      if (!numbers[index]) {
        grunt.fail.fatal('Build number has overflowing ' + numbers);
        throw 'Build number overflow ' + numbers;
      }
      if (numbers[index] + 1 <= 65535) {
        numbers[index]++;
        return numbers.join('.');
      } else {
        versionUp(numbers, ++index);
      }
    };

    // Update version of dest manifest.json
    manifest.version = versionUp(buildnumber, buildnumber.length - 1);
    grunt.log.writeln('Build number has changed to ' + grunt.log.wordlist(buildnumber));

    // Update source manifest
    grunt.file.write(config.app + '/manifest.json', JSON.stringify(manifest, null, options.indentSize));

    // exclude the scripts from background
    var backgroundScripts = [];
    grunt.util._.each(manifest.background.scripts, function (script) {
      if (grunt.util._.indexOf(options.exclude, script) === -1) {
        backgroundScripts.push(script);
      }
    });
    manifest.background.scripts = backgroundScripts;

    // Write updated manifest to destination.
    grunt.file.write(config.dist + '/manifest.json', JSON.stringify(manifest, null, options.indentSize));
  });

  grunt.registerTask('debug', [
    'jshint',
    'sass:chrome',
    'connect:chrome',
    'watch'
  ]);

  grunt.registerTask('build', [
    'jshint',
    'clean:dist',
    'chromeManifestVersionUp',
    'sass:dist',
    'imagemin',
    'htmlmin',
    'uglify',
    'copy',
    'fileExists',
    'compress'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};
