---
---
class window.Playground extends EatMe

  init: ->
    # To get the clipboard button in the UI, you need to:
    # Enable chrome://#unsafely-treat-insecure-origin-as-secure
    # with http://0.0.0.0:4000
    # and https://play.yaml.io
    if navigator.clipboard
      @add_button 'copy-tsv',
        name: 'Copy to TSV'
        icon: 'segmented-nav'
      , 2

    params = new URLSearchParams(window.location.search)
    if params.has('input')
      base64 = params.get('input')
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      try
        @input = decodeURIComponent(escape(atob(base64)))
      catch e
        console.log(base64)
        console.log(e)

    $(window).keydown (e)=>
      if e.ctrlKey and e.keyCode == 13
        @copy_tsv null, e

  copy_tsv: (btn)->
    # e.stopPropagation()
    tsv = @make_tsv()
    navigator.clipboard.writeText(tsv)

  make_tsv: ->
    $panes = @$panes
    yaml = $panes['yaml-input'][0].cm.getValue()
    tree = $panes['refparse'][0].$output.text()
    refparse = tree
    play = @state_url(yaml)
    yaml = @escape(yaml)
    yaml = '"' + yaml.replace(/"/g, '""') + '"'

    if tree == ''
      tree = 'ERROR'
    else
      tree = @indent(tree)
      tree = '"' + tree.replace(/"/g, '""') + '"'

    fields = [ play, '', '', yaml, tree ]
    fields.push @results(refparse)...

    return fields.join("\t")

  results: (expect)->
    parsers = [
      'dotnet'
      'goyaml'
      'hsyaml'
      'libfyaml'
      'libyaml'
      'luayaml'
      'npmyaml'
      'nimyaml'
      'ppyaml'
      'pyyaml'
      'ruamel'
      'snake'
    ]
    results = ['']

    refhs = @$panes['refhs'][0].$output.text()
    if refhs == ''
      results.push(if expect == '' then '' else 'x')
    else
      results.push(if expect != '' then '' else 'x')

    for parser in parsers
      result = @$panes[parser][0].$output.text()
        .replace(/^=COMMENT .*\n?/mg, '')
      if result == expect or
         result == expect.replace(/\s+(\{\}|\[\])$/mg, '')
        results.push ''
      else
        if result = @$panes[parser][0].$error.text()
          result = result.replace(/^[^-+=].*\n?/gm, '')
          if result == expect or
             result == expect.replace(/\s+(\{\}|\[\])$/mg, '')
            results.push ''
          else
            results.push 'x'
        else
          results.push 'x'

    return results

  show: ($pane, data)->
    super($pane, data)

    return unless @conf.opts.status

    pane = $pane[0]
    pane.$output.css('border-top', 'none')
    pane.$error.css('border-top', 'none')

    slug = pane.eatme.slug
    output = data.output || ''
    error = data.error || ''

    $box = null
    if error
      $box = pane.$error
    else if output
      $box = pane.$output
    else
      return

    output = output
      .replace(/\s+(\{\}|\[\])$/mg, '')
      .replace(/^=COMMENT .*\n?/mg, '')
      .replace(/^[^-+=].*\n?/gm, '')

    if slug == 'refparse'
      @refparse = output
      $box.css('border-top', '5px solid green')
      setTimeout =>
        delete @refparse
      , 5000
    else
      setTimeout =>
        if slug == 'refhs'
          if error
            output = ''
          else
            output = @refparse

        if @refparse? and output == @refparse
          $box.css('border-top', '5px solid green')
        else
          $box.css('border-top', '5px solid red')
      , 500

  escape: (text)->
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

  indent: (text)->
    i = 0
    text = text.replace /^(.)/mg, (m, $1)=>
      if $1 == '+'
        @repeat(' ', i++) + $1
      else if $1 == '-'
        @repeat(' ', --i) + $1
      else
        @repeat(' ', i) + $1
    return text.replace(/\n+$/, '')

  repeat: (text, n)->
    str = ''
    i = 0
    while i++ < n
      str += text
    return str

  change: (text, pane)->
    newurl = @state_url(text)
    window.history.replaceState(null, null, newurl)

  state_url: (text)->
    {origin, pathname} = window.location
    base64 = btoa(unescape(encodeURIComponent(text)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
    return "#{origin}#{pathname}?input=#{base64}"

  refparse_event: (text)->
    parser = new Parser(new TestReceiver)
    parser.parse(text)
    return parser.receiver.output()

  npmyaml_json: (text)->
    data = npmYAML.parse(text)
    return JSON.stringify(data, null, 2)

  npmyaml1_json: (text)->
    data = npmYAML1.parse(text)
    return JSON.stringify(data, null, 2)

  npmyaml1_event: (text)->
      {events, error} = npmYAML1.events(text)
      throw error if error?
      return events.join("\n")

  npmyaml2_json: (text)->
    data = npmYAML2.parse(text)
    return JSON.stringify(data, null, 2)

  npmyaml2_event: (text)->
      {events, error} = npmYAML2.events(text)
      throw error if error?
      return events.join("\n")

  npmjsyaml_json: (text)->
    data = npmJSYAML.load(text)
    return JSON.stringify(data, null, 2)

  refhs_yeast: (text)->
    value = @localhost_server(text, 'yaml-test-parse-refhs')
    if _.isString(value) and value.match(/\ =(?:ERR\ |REST)\|/)
      throw value
    else
      return value

#   yamlcpp_event: (text)->
#     return @sandbox_event(text, 'yaml-test-parse-yamlcpp')

  dotnet_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-dotnet')

  goyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-goyaml')

  hsyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-hsyaml')

  libfyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-libfyaml')

  libyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-libyaml')

  luayaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-luayaml')

  nimyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-nimyaml')

  npmyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-npmyaml')

  ppyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-ppyaml')

  pyyaml_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-pyyaml')

  ruamel_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-ruamel')

  snake_event: (text)->
    return @sandbox_event(text, 'yaml-test-parse-snake')

  sandbox_event: (text, parser)->
    return @localhost_server(text, parser)

  localhost_server: (text, parser)->
    loc = window.location.href
      .replace(/#$/, '')

    if window.location.href.match(/^https/)
      scheme = 'https'
      port = 31337
    else
      scheme = 'http'
      port = 1337

    version = @conf.opts.sandbox
    args = "version=#{version}&parser=#{parser}"

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
        if data.status == 0
          return data.output
        else
          throw data.output

    help = loc.replace(
      /\/[^\/]+\?.*/,
      "/#setting-up-a-local-sandbox",
    )

    return mark: """
      This pane requires a localhost sandbox server. Run:

      ```
      $ docker run --rm -d -p #{port}:#{port} \\
          yamlio/yaml-play-sandbox:#{version} #{scheme}
      ```

      on the same computer as your web browser.

      See #{help}.

      [Chat with the YAML team](https://matrix.to/#/#chat:yaml.io).
      """
