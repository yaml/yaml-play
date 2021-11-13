---
---
class window.Playground
  @init: (eatme) ->

    # To get the clipboard button in the UI, you need to:
    # Enable chrome://#unsafely-treat-insecure-origin-as-secure
    # with http://0.0.0.0:4000
    # and https://play.yaml.io
    if navigator.clipboard
      eatme.add_button 'copy-tsv',
        name: 'Copy to TSV'
        icon: 'segmented-nav'
      , 2

    params = new URLSearchParams(window.location.search)
    if params.has('input')
      base64 = params.get('input')
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      try
        eatme.input = decodeURIComponent(escape(atob(base64)))
      catch e
        console.log(base64)
        console.log(e)

  @copy_tsv: (btn, e, eatme)->
    # e.stopPropagation()
    tsv = @make_tsv(eatme)
    navigator.clipboard.writeText(tsv)

  @make_tsv: (eatme)->
    $panes = eatme.$panes
    yaml = $panes['yaml-input'][0].cm.getValue()
    tree = $panes['refparser'][0].$output.text()
    refparser = tree
    play = @state_url(yaml)
    yaml = @escape(yaml)
    yaml = "\"'" + yaml.replace(/"/g, '""') + '"'

    if tree == ''
      tree = 'ERROR'
    else
      tree = @indent(tree)
      tree = "\"'" + tree.replace(/"/g, '""') + '"'

    fields = [ play, '', '', yaml, tree ]
    fields.push @results(eatme, refparser)...

    return fields.join("\t")

  @results: (eatme, expect)->
    parsers = [
      'libyaml'
      'libfyaml'
      'yamlpp'
      'npmyamlmaster'
      'pyyaml'
      'goyaml'
      'nimyaml'
      'hsyaml'
      'snakeyaml'
      'ruamel'
      'yamldotnet'
    ]
    results = ['']

    yeast = eatme.$panes['hsrefyeast'][0].$output.text()
    npm = eatme.$panes['libyaml'][0].$output.text()
    eee = expect.replace(/\s+(\{\}|\[\])$/mg, '')
    say [eee, npm, eee == npm]
    if yeast == ''
      results.push(if expect == '' then '' else 'X')
    else
      results.push(if expect != '' then '' else 'X')

    for parser in parsers
      result = eatme.$panes[parser][0].$output.text()
        .replace(/^=COMMENT .*\n?/mg, '')
      if result == expect or
         result == expect.replace(/\s+(\{\}|\[\])$/mg, '')
        results.push ''
      else
        results.push 'X'

    return results

  @escape: (text)->
    text = text.replace /(\ +)$/mg, (m, $1)=>
      @repeat("␣", $1.length)

    while text.match(/\t/)
      text = text.replace /^(.*?)\t/mg, (m, $1)=>
        return $1 + @repeat('—', 4-$1.length%4) + '»'

    text = text.replace /\n(\n+)$/, (m, $1)=>
      "\n" + @repeat("↵\n", $1.length)

    text = text.replace /\r/g, '←'

    if not text.match(/\n$/)
      text += '∎'

    return text

  @indent: (text)->
    i = 0
    text = text.replace /^(.)/mg, (m, $1)=>
      if $1 == '+'
        @repeat(' ', i++) + $1
      else if $1 == '-'
        @repeat(' ', --i) + $1
      else
        @repeat(' ', i) + $1
    return text.replace(/\n+$/, '')

  @repeat: (text, n)->
    str = ''
    i = 0
    while i++ < n
      str += text
    return str

  @change: (text, pane)->
    newurl = @state_url(text)
    window.history.replaceState(null, null, newurl)

  @state_url: (text)->
    {origin, pathname} = window.location
    base64 = btoa(unescape(encodeURIComponent(text)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    return "#{origin}#{pathname}?input=#{base64}"

  @js_refparser_event: (text)->
    parser = new Parser(new TestReceiver)
    parser.parse(text)
    return parser.receiver.output()

  @npmyamlmaster_json: (text)->
    data = npmYAML.parse(text)
    return JSON.stringify(data, null, 2)

  @npmyamlmaster_event: (text)->
      {events, error} = npmYAML.events(text)
      throw error if error?
      return events.join("\n") + "\n"

  @npmyaml1_json: (text)->
    data = npmYAML1.parse(text)
    return JSON.stringify(data, null, 2)

  @npmyaml1_event: (text)->
      {events, error} = npmYAML1.events(text)
      throw error if error?
      return events.join("\n")

  @npmyaml2_json: (text)->
    data = npmYAML2.parse(text)
    return JSON.stringify(data, null, 2)

  @npmyaml2_event: (text)->
      {events, error} = npmYAML2.events(text)
      throw error if error?
      return events.join("\n")

  @npmjsyaml_json: (text)->
    data = npmJSYAML.load(text)
    return JSON.stringify(data, null, 2)

  @hs_refparser_yeast: (text)->
    value = @localhost_server(text, 'cmd=hs-reference-yeast')
    if _.isString(value) and value.match(/\ =(?:ERR\ |REST)\|/)
      throw value
    else
      return value

  @yamlpp_event: (text)->
    return @sandbox_event(text, 'cmd=perl-pp-event')

  @npmyaml_event: (text)->
    return @sandbox_event(text, 'cmd=js-yaml-event')

  @pyyaml_event: (text)->
    return @sandbox_event(text, 'cmd=py-pyyaml-event')

  @libyaml_event: (text)->
    return @sandbox_event(text, 'cmd=c-libyaml-event')

  @libfyaml_event: (text)->
    return @sandbox_event(text, 'cmd=c-libfyaml-event')

  @goyaml_event: (text)->
    return @sandbox_event(text, 'cmd=go-yaml-test')

  @yamlcpp_event: (text)->
    return @sandbox_event(text, 'cmd=cpp-yamlcpp-event')

  @nimyaml_event: (text)->
    return @sandbox_event(text, 'cmd=nim-nimyaml-event')

  @hsyaml_event: (text)->
    return @sandbox_event(text, 'cmd=hs-hsyaml-event')

  @snakeyaml_event: (text)->
    return @sandbox_event(text, 'cmd=java-snakeyaml-event')

  @yamldotnet_event: (text)->
    return @sandbox_event(text, 'cmd=dotnet-yamldotnet-event')

  @ruamel_event: (text)->
    return @sandbox_event(text, 'cmd=py-ruamel-event')

  @sandbox_event: (text, args)->
    value = @localhost_server(text, args)
    if _.isString(value) and value.match(/^[^\+\-\=]/m)
      throw value
    else
      return value

  @localhost_server: (text, args)->
    loc = window.location.href
      .replace(/#$/, '')

    if window.location.href.match(/^https/)
      scheme = 'https'
      port = 31337
    else
      scheme = 'http'
      port = 1337

    try
      resp = $.ajax(
        type: 'POST'
        url: "#{scheme}://localhost:#{port}/?#{args}"
        data: { text: text }
        dataType: 'json'
        async: false
      )
    catch e
      window.ajax_error = e

    if resp.status == 200
      data = resp.responseJSON
      if data?
        if data.error?
          throw data.error
        if data.output?
          return data.output

    help = loc.replace(
      /\/[^\/]+\?.*/,
      "/#setting-up-a-local-sandbox",
    )

    return mark: """
      This pane requires a localhost sandbox server.

      Run:

      ```
      $ docker run --rm -d -p #{port}:#{port} \\
          yamlio/yaml-play-sandbox:0.1.0 #{scheme}
      ```

      on the same computer as your web browser.

      See #{help}  
      for more instructions.
      """
