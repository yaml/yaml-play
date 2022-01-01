(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.Playground = (function(superClass) {
    extend(Playground, superClass);

    function Playground() {
      return Playground.__super__.constructor.apply(this, arguments);
    }

    Playground.prototype.init = function() {
      var base64, e, params;
      Playground.__super__.init.apply(this, arguments);
      this.status = {};
      this.current = -1;
      if (navigator.clipboard) {
        this.add_button('copy-tsv', {
          name: 'Copy to TSV',
          icon: 'segmented-nav'
        }, 2);
      }
      params = new URLSearchParams(window.location.search);
      if (params.has('input')) {
        base64 = params.get('input').replace(/-/g, '+').replace(/_/g, '/');
        try {
          this.input = decodeURIComponent(escape(atob(base64)));
        } catch (error1) {
          e = error1;
          console.log(base64);
          console.log(e);
        }
      }
      return $(window).keydown((function(_this) {
        return function(e) {
          if (e.ctrlKey && e.keyCode === 13) {
            return _this.copy_tsv(null, e);
          }
        };
      })(this));
    };

    Playground.prototype.copy_tsv = function(btn) {
      var tsv;
      tsv = this.make_tsv();
      return navigator.clipboard.writeText(tsv);
    };

    Playground.prototype.parsers = ['refparse', 'refhs', 'dotnet', 'goyaml', 'hsyaml', 'libfyaml', 'libyaml', 'luayaml', 'nimyaml', 'npmyaml', 'ppyaml', 'pyyaml', 'ruamel', 'snake'];

    Playground.prototype.make_tsv = function() {
      var $panes, fields, j, len, parser, play, ref, refparse, tree, yaml;
      $panes = this.$panes;
      yaml = $panes['yaml-input'][0].cm.getValue();
      tree = $panes['refparse'][0].$output.text();
      refparse = tree;
      play = this.state_url(yaml);
      yaml = this.escape(yaml);
      yaml = '"' + yaml.replace(/"/g, '""') + '"';
      if (tree === '') {
        tree = 'ERROR';
      } else {
        tree = this.indent(tree);
        tree = '"' + tree.replace(/"/g, '""') + '"';
      }
      fields = [play, '', '', yaml, tree];
      ref = this.parsers;
      for (j = 0, len = ref.length; j < len; j++) {
        parser = ref[j];
        fields.push(this.status[parser]);
      }
      return fields.join("\t");
    };

    Playground.prototype.call = function(func, text, $to) {
      $to.find('.eatme-box').css('border-top', '5px solid black');
      return Playground.__super__.call.call(this, func, text, $to);
    };

    Playground.prototype.show = function($pane, data) {
      var $box, check, error, output, pane, slug;
      Playground.__super__.show.call(this, $pane, data);
      if (!this.conf.opts.status) {
        return;
      }
      pane = $pane[0];
      pane.$output.css('border-top', 'none');
      pane.$error.css('border-top', 'none');
      slug = pane.eatme.slug;
      output = data.output || '';
      error = data.error || '';
      $box = null;
      if (error) {
        $box = pane.$error;
      } else if (output) {
        $box = pane.$output;
      } else {
        return;
      }
      output = output.replace(/\s+(\{\}|\[\])$/mg, '').replace(/^=COMMENT .*\n?/mg, '').replace(/^[^-+=].*\n?/gm, '');
      this.status[slug] = '';
      if (slug === 'refparse') {
        this.current = this.iteration;
        this.refparse = output;
        return $box.css('border-top', '5px solid green');
      } else {
        check = (function(_this) {
          return function() {
            if (_this.current !== _this.iteration) {
              setTimeout(check, 100);
              return;
            }
            if (slug === 'goyaml' && _this.refparse.match(/^\+DOC$/m)) {
              output = output.replace(/^\+DOC ---/m, '+DOC');
            }
            if (slug === 'refhs') {
              if (error) {
                output = '';
              } else {
                output = _this.refparse;
              }
            }
            if ((_this.refparse != null) && output === _this.refparse) {
              $box.css('border-top', '5px solid green');
              return _this.status[slug] = '';
            } else {
              $box.css('border-top', '5px solid red');
              return _this.status[slug] = 'x';
            }
          };
        })(this);
        return check();
      }
    };

    Playground.prototype.escape = function(text) {
      text = text.replace(/(\ +)$/mg, (function(_this) {
        return function(m, $1) {
          return _this.repeat("␣", $1.length);
        };
      })(this));
      while (text.match(/\t/)) {
        text = text.replace(/^(.*?)\t/mg, (function(_this) {
          return function(m, $1) {
            return $1 + _this.repeat('—', 4 - $1.length % 4) + '»';
          };
        })(this));
      }
      text = text.replace(/\n(\n+)$/, (function(_this) {
        return function(m, $1) {
          return "\n" + _this.repeat("↵\n", $1.length);
        };
      })(this));
      text = text.replace(/\r/g, '←');
      if (!text.match(/\n$/)) {
        text += '∎';
      }
      return text;
    };

    Playground.prototype.indent = function(text) {
      var i;
      i = 0;
      text = text.replace(/^(.)/mg, (function(_this) {
        return function(m, $1) {
          if ($1 === '+') {
            return _this.repeat(' ', i++) + $1;
          } else if ($1 === '-') {
            return _this.repeat(' ', --i) + $1;
          } else {
            return _this.repeat(' ', i) + $1;
          }
        };
      })(this));
      return text.replace(/\n+$/, '');
    };

    Playground.prototype.repeat = function(text, n) {
      var i, str;
      str = '';
      i = 0;
      while (i++ < n) {
        str += text;
      }
      return str;
    };

    Playground.prototype.change = function(text, pane) {
      var newurl;
      newurl = this.state_url(text);
      return window.history.replaceState(null, null, newurl);
    };

    Playground.prototype.state_url = function(text) {
      var base64, origin, pathname, ref;
      ref = window.location, origin = ref.origin, pathname = ref.pathname;
      base64 = btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_');
      return "" + origin + pathname + "?input=" + base64;
    };

    Playground.prototype.refparse_event = function(text, cb) {
      var e, parser;
      parser = new Parser(new TestReceiver);
      try {
        parser.parse(text);
        return cb({
          output: parser.receiver.output()
        });
      } catch (error1) {
        e = error1;
        return cb({
          error: e
        });
      }
    };

    Playground.prototype.npmyaml_json = function(text, cb) {
      var data;
      data = npmYAML.parse(text);
      return cb(JSON.stringify(data, null, 2));
    };

    Playground.prototype.npmyaml1_json = function(text, cb) {
      var data;
      data = npmYAML1.parse(text);
      return cb(JSON.stringify(data, null, 2));
    };

    Playground.prototype.npmyaml1_event = function(text, cb) {
      var error, events, ref;
      ref = npmYAML1.events(text), events = ref.events, error = ref.error;
      if (error != null) {
        throw error;
      }
      return cb(events.join("\n"));
    };

    Playground.prototype.npmyaml2_json = function(text, cb) {
      var data;
      data = npmYAML2.parse(text);
      return cb(JSON.stringify(data, null, 2));
    };

    Playground.prototype.npmyaml2_event = function(text, cb) {
      var error, events, ref;
      ref = npmYAML2.events(text), events = ref.events, error = ref.error;
      if (error != null) {
        throw error;
      }
      return cb(events.join("\n"));
    };

    Playground.prototype.npmjsyaml_json = function(text, cb) {
      var data;
      data = npmJSYAML.load(text);
      return cb(JSON.stringify(data, null, 2));
    };

    Playground.prototype.refhs_yeast = function(text, cb) {
      return this.localhost_server(text, 'yaml-test-parse-refhs', (function(_this) {
        return function(value) {
          if ((value.output != null) && value.output.match(/\ =(?:ERR\ |REST)\|/)) {
            value = {
              error: value.output
            };
          }
          return cb(value);
        };
      })(this));
    };

    Playground.prototype.dotnet_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-dotnet', cb);
    };

    Playground.prototype.goyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-goyaml', cb);
    };

    Playground.prototype.hsyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-hsyaml', cb);
    };

    Playground.prototype.libfyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-libfyaml', cb);
    };

    Playground.prototype.libyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-libyaml', cb);
    };

    Playground.prototype.luayaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-luayaml', cb);
    };

    Playground.prototype.nimyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-nimyaml', cb);
    };

    Playground.prototype.npmyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-npmyaml', cb);
    };

    Playground.prototype.ppyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-ppyaml', cb);
    };

    Playground.prototype.pyyaml_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-pyyaml', cb);
    };

    Playground.prototype.ruamel_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-ruamel', cb);
    };

    Playground.prototype.snake_event = function(text, cb) {
      return this.sandbox_event(text, 'yaml-test-parse-snake', cb);
    };

    Playground.prototype.sandbox_event = function(text, parser, cb) {
      return this.localhost_server(text, parser, cb);
    };

    Playground.prototype.localhost_server = function(text, parser, cb) {
      var args, port, resp, scheme, version;
      if (window.location.href.match(/^https/)) {
        scheme = 'https';
        port = 31337;
      } else {
        scheme = 'http';
        port = 1337;
      }
      version = this.conf.opts.sandbox;
      args = "version=" + version + "&parser=" + parser;
      return resp = $.ajax({
        type: 'POST',
        url: scheme + "://0.0.0.0:" + port + "/?" + args,
        data: {
          text: text
        },
        dataType: 'json',
        error: (function(_this) {
          return function() {
            return _this.server_error(scheme, port, version, cb);
          };
        })(this),
        success: (function(_this) {
          return function(data, status) {
            if (status === 'success') {
              if (data != null) {
                if (data.status === 0) {
                  cb({
                    output: data.output
                  });
                } else {
                  cb({
                    error: data.output
                  });
                }
              }
            }
          };
        })(this)
      });
    };

    Playground.prototype.server_error = function(scheme, port, version, cb) {
      var help, loc;
      loc = window.location.href.replace(/#$/, '');
      help = loc.replace(/\/[^\/]+\?.*/, "/#setting-up-a-local-sandbox");
      return cb({
        mark: "This pane requires a localhost sandbox server. Run:\n```\n$ docker run --rm -d -p " + port + ":" + port + " \\\n    yamlio/yaml-play-sandbox:" + version + " " + scheme + "\n```\non the same computer as your web browser, then click:\n" + scheme + "://0.0.0.0:" + port + " and accept the insecure certificate.\n\nSee " + help + " for more help, or\n[Chat with the YAML team](https://matrix.to/#/#chat:yaml.io)."
      });
    };

    return Playground;

  })(EatMe);

}).call(this);
