(function() {
  window.Playground = (function() {
    function Playground() {}

    Playground.init = function(eatme) {
      var base64, e, params;
      if (navigator.clipboard) {
        eatme.add_button('copy-tsv', {
          name: 'Copy to TSV',
          icon: 'segmented-nav'
        }, 2);
      }
      params = new URLSearchParams(window.location.search);
      if (params.has('input')) {
        base64 = params.get('input').replace(/-/g, '+').replace(/_/g, '/');
        try {
          eatme.input = decodeURIComponent(escape(atob(base64)));
        } catch (error1) {
          e = error1;
          console.log(base64);
          console.log(e);
        }
      }
      return $(window).keydown((function(_this) {
        return function(e) {
          if (e.ctrlKey && e.keyCode === 13) {
            return _this.copy_tsv(null, e, eatme);
          }
        };
      })(this));
    };

    Playground.copy_tsv = function(btn, e, eatme) {
      var tsv;
      tsv = this.make_tsv(eatme);
      return navigator.clipboard.writeText(tsv);
    };

    Playground.make_tsv = function(eatme) {
      var $panes, fields, play, refparse, tree, yaml;
      $panes = eatme.$panes;
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
      fields.push.apply(fields, this.results(eatme, refparse));
      return fields.join("\t");
    };

    Playground.results = function(eatme, expect) {
      var j, len, parser, parsers, refhs, result, results;
      parsers = ['dotnet', 'goyaml', 'hsyaml', 'libfyaml', 'libyaml', 'luayaml', 'npmyaml', 'nimyaml', 'ppyaml', 'pyyaml', 'ruamel', 'snake'];
      results = [''];
      refhs = eatme.$panes['refhs'][0].$output.text();
      if (refhs === '') {
        results.push(expect === '' ? '' : 'x');
      } else {
        results.push(expect !== '' ? '' : 'x');
      }
      for (j = 0, len = parsers.length; j < len; j++) {
        parser = parsers[j];
        result = eatme.$panes[parser][0].$output.text().replace(/^=COMMENT .*\n?/mg, '');
        if (result === expect || result === expect.replace(/\s+(\{\}|\[\])$/mg, '')) {
          results.push('');
        } else {
          if (result = eatme.$panes[parser][0].$error.text()) {
            result = result.replace(/^[^-+=].*\n?/gm, '');
            if (result === expect || result === expect.replace(/\s+(\{\}|\[\])$/mg, '')) {
              results.push('');
            } else {
              results.push('x');
            }
          } else {
            results.push('x');
          }
        }
      }
      return results;
    };

    Playground.show = function(eatme, $pane, data) {
      var $box, error, pane, slug, text;
      pane = $pane[0];
      pane.$output.css('border-top', 'none');
      pane.$error.css('border-top', 'none');
      slug = pane.eatme.slug;
      if (slug === 'yamlcpp') {
        return;
      }
      $box = null;
      if (data.error) {
        $box = pane.$error;
      } else if (data.output) {
        $box = pane.$output;
      } else {
        return;
      }
      text = pane.$output.text();
      if (text.length === 0 && (error = pane.$error.text()).match(/^\+STR/m)) {
        text = error.replace(/^[^-+=].*\n?/mg, '');
        if (!text.match(/^-STR/m)) {
          text = '';
        }
      }
      text = text.replace(/\s+(\{\}|\[\])$/mg, '').replace(/^=COMMENT .*\n?/mg, '').replace(/^([-+]DOC).+/mg, '$1');
      if (slug === 'refparse') {
        this.refparse = text;
        setTimeout((function(_this) {
          return function() {
            return delete _this.refparse;
          };
        })(this), 5000);
      }
      if (slug === 'refhs') {
        if (text.match(/=(ERR|REST)/)) {
          text = '';
        } else {
          text = this.refparse;
        }
      }
      if ((this.refparse != null) && text === this.refparse) {
        return $box.css('border-top', '5px solid green');
      } else {
        return $box.css('border-top', '5px solid red');
      }
    };

    Playground.escape = function(text) {
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

    Playground.indent = function(text) {
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

    Playground.repeat = function(text, n) {
      var i, str;
      str = '';
      i = 0;
      while (i++ < n) {
        str += text;
      }
      return str;
    };

    Playground.change = function(text, pane) {
      var newurl;
      newurl = this.state_url(text);
      return window.history.replaceState(null, null, newurl);
    };

    Playground.state_url = function(text) {
      var base64, origin, pathname, ref;
      ref = window.location, origin = ref.origin, pathname = ref.pathname;
      base64 = btoa(unescape(encodeURIComponent(text))).replace(/\+/g, '-').replace(/\//g, '_');
      return "" + origin + pathname + "?input=" + base64;
    };

    Playground.refparse_event = function(text) {
      var parser;
      parser = new Parser(new TestReceiver);
      parser.parse(text);
      return parser.receiver.output();
    };

    Playground.npmyaml_json = function(text) {
      var data;
      data = npmYAML.parse(text);
      return JSON.stringify(data, null, 2);
    };

    Playground.npmyaml1_json = function(text) {
      var data;
      data = npmYAML1.parse(text);
      return JSON.stringify(data, null, 2);
    };

    Playground.npmyaml1_event = function(text) {
      var error, events, ref;
      ref = npmYAML1.events(text), events = ref.events, error = ref.error;
      if (error != null) {
        throw error;
      }
      return events.join("\n");
    };

    Playground.npmyaml2_json = function(text) {
      var data;
      data = npmYAML2.parse(text);
      return JSON.stringify(data, null, 2);
    };

    Playground.npmyaml2_event = function(text) {
      var error, events, ref;
      ref = npmYAML2.events(text), events = ref.events, error = ref.error;
      if (error != null) {
        throw error;
      }
      return events.join("\n");
    };

    Playground.npmjsyaml_json = function(text) {
      var data;
      data = npmJSYAML.load(text);
      return JSON.stringify(data, null, 2);
    };

    Playground.refhs_yeast = function(text) {
      var value;
      value = this.localhost_server(text, 'cmd=yaml-test-parse-refhs');
      if (_.isString(value) && value.match(/\ =(?:ERR\ |REST)\|/)) {
        throw value;
      } else {
        return value;
      }
    };

    Playground.dotnet_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-dotnet');
    };

    Playground.goyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-goyaml');
    };

    Playground.hsyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-hsyaml');
    };

    Playground.libfyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-libfyaml');
    };

    Playground.libyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-libyaml');
    };

    Playground.luayaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-luayaml');
    };

    Playground.nimyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-nimyaml');
    };

    Playground.npmyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-npmyaml');
    };

    Playground.ppyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-ppyaml');
    };

    Playground.pyyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-pyyaml');
    };

    Playground.ruamel_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-ruamel');
    };

    Playground.snake_event = function(text) {
      return this.sandbox_event(text, 'cmd=yaml-test-parse-snake');
    };

    Playground.sandbox_event = function(text, args) {
      var value;
      value = this.localhost_server(text, args);
      if (_.isString(value) && value.match(/^[^\+\-\=]/m)) {
        throw value;
      } else {
        return value;
      }
    };

    Playground.localhost_server = function(text, args) {
      var data, e, help, loc, port, resp, scheme;
      loc = window.location.href.replace(/#$/, '');
      if (window.location.href.match(/^https/)) {
        scheme = 'https';
        port = 31337;
      } else {
        scheme = 'http';
        port = 1337;
      }
      try {
        resp = $.ajax({
          type: 'POST',
          url: scheme + "://localhost:" + port + "/?" + args,
          data: {
            text: text
          },
          dataType: 'json',
          async: false
        });
      } catch (error1) {
        e = error1;
        window.ajax_error = e;
      }
      if (resp.status === 200) {
        data = resp.responseJSON;
        if (data != null) {
          if (data.error != null) {
            throw data.error;
          }
          if (data.output != null) {
            return data.output;
          }
        }
      }
      help = loc.replace(/\/[^\/]+\?.*/, "/#setting-up-a-local-sandbox");
      return {
        mark: "This pane requires a localhost sandbox server. Run:\n\n```\n$ docker run --rm -d -p " + port + ":" + port + " \\\n    yamlio/yaml-play-sandbox:0.1.1 " + scheme + "\n```\n\non the same computer as your web browser.\n\nSee " + help + ".\n\n[Chat with the YAML team](https://matrix.to/#/#chat:yaml.io)."
      };
    };

    return Playground;

  })();

}).call(this);
