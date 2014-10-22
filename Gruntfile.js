// Generated on 2014-10-22 using generator-chrome-extension 0.2.11
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

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
      bower: {
        files: ['bower.json'],
        tasks: ['bowerInstall']
      },
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
      },
      test: {
        options: {
          open: false,
          base: [
            'test',
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
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= config.app %>/scripts/{,*/}*.js',
        '!<%= config.app %>/scripts/vendor/*',
        'test/spec/{,*/}*.js'
      ]
    },
    mocha: {
      all: {
        options: {
          run: true,
          urls: ['http://localhost:<%= connect.options.port %>/index.html']
        }
      }
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

    // Automatically inject Bower components into the HTML file
    bowerInstall: {
      app: {
        src: [
          '<%= config.app %>/*.html'
        ]
      },
      sass: {
        src: ['<%= config.app %>/styles/{,*/}*.{scss,sass}'],
        ignorePath: '<%= config.app %>/bower_components/'
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

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= config.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          // removeCommentsFromCDATA: true,
          // collapseWhitespace: true,
          // collapseBooleanAttributes: true,
          // removeAttributeQuotes: true,
          // removeRedundantAttributes: true,
          // useShortDoctype: true,
          // removeEmptyAttributes: true,
          // removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= config.app %>',
          src: '*.html',
          dest: '<%= config.dist %>'
        }]
      }
    },

    cssmin: {
       dist: {
         files: {
           '<%= config.dist %>/styles/fonts.css': [
             '<%= config.app %>/styles/fonts.css'
           ],
           '<%= config.dist %>/styles/options.css': [
             '<%= config.app %>/styles/options.css'
           ],
           '<%= config.dist %>/styles/popup.css': [
             '<%= config.app %>/styles/popup.css'
           ]
         }
       }
    },

    uglify: {
       dist: {
         files: {
           '<%= config.dist %>/scripts/popup.js': [
             '<%= config.dist %>/scripts/popup.js'
           ],
           '<%= config.dist %>/scripts/utils/Translator.js': [
             '<%= config.dist %>/scripts/utils/Translator.js'
           ]
         }
       }
    },

    concat: {
       dist: {
         files: {
           '<%= config.dist %>/scripts/lib/require.js': [
             '<%= config.app %>/scripts/lib/require.js'
           ]
         }
       }
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
            '*.{ico,png,txt}',
            'images/{,*/}*.{webp,gif}',
            '{,*/}*.html',
            'styles/{,*/}*.css',
            'styles/fonts/{,*/}*.*',
            '_locales/{,*/}*.json',
          ]
        }]
      }
    },

    // Run some tasks in parallel to speed up build process
    concurrent: {
      chrome: [
        'sass:chrome'
      ],
      dist: [
        'sass:dist',
        'imagemin',
        'svgmin'
      ]
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

  grunt.registerTask('debug', function () {
    grunt.task.run([
      'jshint',
      'concurrent:chrome',
      'connect:chrome',
      'watch'
    ]);
  });

  grunt.registerTask('test', [
    'connect:test',
    'mocha'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'chromeManifestVersionUp',
    'concurrent:dist',
    'cssmin',
    'concat',
    'uglify',
    'copy',
    'compress'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'test',
    'build'
  ]);
};
