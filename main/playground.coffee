---
---
class window.Playground extends EatMe

  init: ->
    super

    @status = {}
    @current = -1

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

  parsers: [
    'refparse'
    'refhs'
    'dotnet'
    'goyaml'
    'hsyaml'
    'libfyaml'
    'libyaml'
    'luayaml'
    'nimyaml'
    'npmyaml'
    'ppyaml'
    'pyyaml'
    'ruamel'
    'snake'
  ]

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

    for parser in @parsers
      fields.push @status[parser]

    return fields.join("\t")

  call: (func, text, $to)->
    $to
      .find('.eatme-box')
      .css('border-top', '5px solid black')

    super(func, text, $to)

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

    @status[slug] = ''
    if slug == 'refparse'
      @current = @iteration
      @refparse = output
      $box.css('border-top', '5px solid green')
    else
      check = =>
        if @current != @iteration
          setTimeout check, 100
          return

        if slug == 'goyaml' and @refparse.match /^\+DOC$/m
          output = output
            .replace(/^\+DOC ---/m, '+DOC')

        if slug == 'refhs'
          if error
            output = ''
          else
            output = @refparse

        if @refparse? and output == @refparse
          $box.css('border-top', '5px solid green')
          @status[slug] = ''
        else
          $box.css('border-top', '5px solid red')
          @status[slug] = 'x'
      check()

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

  refparse_event: (text, cb)->
    parser = new Parser(new TestReceiver)
    try
      parser.parse(text)
      cb(output: parser.receiver.output())
    catch e
      cb(error: e)

  npmyaml_json: (text, cb)->
    data = npmYAML.parse(text)
    cb(JSON.stringify(data, null, 2))

  npmyaml1_json: (text, cb)->
    data = npmYAML1.parse(text)
    cb(JSON.stringify(data, null, 2))

  npmyaml1_event: (text, cb)->
    {events, error} = npmYAML1.events(text)
    throw error if error?
    cb(events.join("\n"))

  npmyaml2_json: (text, cb)->
    data = npmYAML2.parse(text)
    cb(JSON.stringify(data, null, 2))

  npmyaml2_event: (text, cb)->
    {events, error} = npmYAML2.events(text)
    throw error if error?
    cb(events.join("\n"))

  npmjsyaml_json: (text, cb)->
    data = npmJSYAML.load(text)
    cb(JSON.stringify(data, null, 2))

  refhs_yeast: (text, cb)->
    @localhost_server text, 'yaml-test-parse-refhs', (value)=>
      if value.output? and value.output.match(/\ =(?:ERR\ |REST)\|/)
        value = error: value.output
      cb(value)

#   yamlcpp_event: (text, cb)->
#     cb(@sandbox_event(text, 'yaml-test-parse-yamlcpp'))

  dotnet_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-dotnet', cb)

  goyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-goyaml', cb)

  hsyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-hsyaml', cb)

  libfyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-libfyaml', cb)

  libyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-libyaml', cb)

  luayaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-luayaml', cb)

  nimyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-nimyaml', cb)

  npmyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-npmyaml', cb)

  ppyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-ppyaml', cb)

  pyyaml_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-pyyaml', cb)

  ruamel_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-ruamel', cb)

  snake_event: (text, cb)->
    @sandbox_event(text, 'yaml-test-parse-snake', cb)

  sandbox_event: (text, parser, cb)->
    @localhost_server(text, parser, cb)

  localhost_server: (text, parser, cb)->
    if window.location.href.match(/^https/)
      scheme = 'https'
      port = 31337
    else
      scheme = 'http'
      port = 1337

    version = @conf.opts.sandbox
    args = "version=#{version}&parser=#{parser}"

    resp = $.ajax
      type: 'POST'
      url: "#{scheme}://localhost:#{port}/?#{args}"
      data: { text: text }
      dataType: 'json'
      error: =>
        @server_error(scheme, port, version, cb)
      success: (data, status)=>
        if status == 'success'
          if data?
            if data.status == 0
              cb(output: data.output)
            else
              cb(error: data.output)
            return

  server_error: (scheme, port, version, cb)->
    loc = window.location.href
      .replace(/#$/, '')

    help = loc.replace(
        /\/[^\/]+\?.*/,
        "/#setting-up-a-local-sandbox",
    )

    cb mark: """
        This pane requires a localhost sandbox server. Run:

        ```
        $ docker run --rm -d -p #{port}:#{port} \\
            yamlio/yaml-play-sandbox:#{version} #{scheme}
        ```

        on the same computer as your web browser.

        See #{help}.

        [Chat with the YAML team](https://matrix.to/#/#chat:yaml.io).
        """
