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
          return eatme.input = decodeURIComponent(escape(atob(base64)));
        } catch (error1) {
          e = error1;
          console.log(base64);
          return console.log(e);
        }
      }
    };

    Playground.copy_tsv = function(btn, e, eatme) {
      var tsv;
      e.stopPropagation();
      tsv = this.make_tsv(eatme);
      return navigator.clipboard.writeText(tsv);
    };

    Playground.make_tsv = function(eatme) {
      var $panes, play, tree, yaml;
      $panes = eatme.$panes;
      yaml = $panes['yaml-input'][0].cm.getValue();
      tree = $panes['refparser'][0].$output.text();
      play = this.state_url(yaml);
      yaml = this.escape(yaml);
      yaml = yaml.replace(/"/g, '""');
      if (tree === '') {
        tree = 'ERROR';
      } else {
        tree = this.indent(tree);
        tree = tree.replace(/"/g, '""');
      }
      return play + "\t\t\t\"" + yaml + "\"\t\"" + tree + "\"";
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

    Playground.js_refparser_event = function(text) {
      var parser;
      parser = new Parser(new TestReceiver);
      parser.parse(text);
      return parser.receiver.output();
    };

    Playground.npmyamlmaster_json = function(text) {
      var data;
      data = npmYAML.parse(text);
      return JSON.stringify(data, null, 2);
    };

    Playground.npmyamlmaster_event = function(text) {
      var error, events, ref;
      ref = npmYAML.events(text), events = ref.events, error = ref.error;
      if (error != null) {
        throw error;
      }
      return events.join("\n");
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

    Playground.hs_refparser_yeast = function(text) {
      var value;
      value = this.localhost_server(text, 'cmd=hs-reference-yeast');
      if (_.isString(value) && value.match(/\ =(?:ERR\ |REST)\|/)) {
        throw value;
      } else {
        return value;
      }
    };

    Playground.yamlpp_event = function(text) {
      return this.sandbox_event(text, 'cmd=perl-pp-event');
    };

    Playground.npmyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=js-yaml-event');
    };

    Playground.pyyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=py-pyyaml-event');
    };

    Playground.libfyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=c-libfyaml-event');
    };

    Playground.libyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=c-libfyaml-event');
    };

    Playground.yamlcpp_event = function(text) {
      return this.sandbox_event(text, 'cmd=cpp-yamlcpp-event');
    };

    Playground.nimyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=nim-nimyaml-event');
    };

    Playground.hsyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=hs-hsyaml-event');
    };

    Playground.snakeyaml_event = function(text) {
      return this.sandbox_event(text, 'cmd=java-snakeyaml-event');
    };

    Playground.yamldotnet_event = function(text) {
      return this.sandbox_event(text, 'cmd=dotnet-yamldotnet-event');
    };

    Playground.ruamel_event = function(text) {
      return this.sandbox_event(text, 'cmd=py-ruamel-event');
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
        mark: "This pane requires a localhost sandbox server.\n\nRun:\n\n```\n$ docker run --rm -d -p " + port + ":" + port + " \\\n    yamlio/play-sandbox:0.0.7 " + scheme + "\n```\n\non the same computer as your web browser.\n\nSee " + help + "  \nfor more instructions."
      };
    };

    return Playground;

  })();

}).call(this);
