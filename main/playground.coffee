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

    $(window).keydown (e)=>
      if e.ctrlKey and e.keyCode == 13
        @copy_tsv null, e, eatme

  @copy_tsv: (btn, e, eatme)->
    # e.stopPropagation()
    tsv = @make_tsv(eatme)
    navigator.clipboard.writeText(tsv)

  @make_tsv: (eatme)->
    $panes = eatme.$panes
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
    fields.push @results(eatme, refparse)...

    return fields.join("\t")

  @results: (eatme, expect)->
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

    refhs = eatme.$panes['refhs'][0].$output.text()
    if refhs == ''
      results.push(if expect == '' then '' else 'x')
    else
      results.push(if expect != '' then '' else 'x')

    for parser in parsers
      result = eatme.$panes[parser][0].$output.text()
        .replace(/^=COMMENT .*\n?/mg, '')
      if result == expect or
         result == expect.replace(/\s+(\{\}|\[\])$/mg, '')
        results.push ''
      else
        if result = eatme.$panes[parser][0].$error.text()
          result = result.replace(/^[^-+=].*\n?/gm, '')
          if result == expect or
             result == expect.replace(/\s+(\{\}|\[\])$/mg, '')
            results.push ''
          else
            results.push 'x'
        else
          results.push 'x'

    return results

  @show: (eatme, $pane, data)->
    pane = $pane[0]
    pane.$output.css('border-top', 'none')
    pane.$error.css('border-top', 'none')

    slug = pane.eatme.slug
    return if slug == 'yamlcpp'

    $box = null
    if data.error
      $box = pane.$error
    else if data.output
      $box = pane.$output
    else
      return

    text = pane.$output.text()

    if text.length == 0 and (error = pane.$error.text()).match(/^\+STR/m)
      text = error
        .replace(/^[^-+=].*\n?/mg, '')
      text = '' unless text.match(/^-STR/m)

    text = text
      .replace(/\s+(\{\}|\[\])$/mg, '')
      .replace(/^=COMMENT .*\n?/mg, '')
      .replace(/^([-+]DOC).+/mg, '$1')

    if slug == 'refparse'
      @refparse = text
      setTimeout =>
        delete @refparse
      , 5000

    if slug == 'refhs'
      if text.match(/=(ERR|REST)/)
        text = ''
      else
        text = @refparse

    if @refparse? and text == @refparse
      $box.css('border-top', '5px solid green')
    else
      $box.css('border-top', '5px solid red')

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

  @refparse_event: (text)->
    parser = new Parser(new TestReceiver)
    parser.parse(text)
    return parser.receiver.output()

  @npmyaml_json: (text)->
    data = npmYAML.parse(text)
    return JSON.stringify(data, null, 2)

#   @npmyaml_event: (text)->
#       {events, error} = npmYAML.events(text)
#       throw error if error?
#       return events.join("\n") + "\n"

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

  @refhs_yeast: (text)->
    value = @localhost_server(text, 'cmd=yaml-test-parse-refhs')
    if _.isString(value) and value.match(/\ =(?:ERR\ |REST)\|/)
      throw value
    else
      return value

#   @yamlcpp_event: (text)->
#     return @sandbox_event(text, 'cmd=yaml-test-parse-yamlcpp')

  @dotnet_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-dotnet')

  @goyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-goyaml')

  @hsyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-hsyaml')

  @libfyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-libfyaml')

  @libyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-libyaml')

  @luayaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-luayaml')

  @nimyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-nimyaml')

  @npmyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-npmyaml')

  @ppyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-ppyaml')

  @pyyaml_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-pyyaml')

  @ruamel_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-ruamel')

  @snake_event: (text)->
    return @sandbox_event(text, 'cmd=yaml-test-parse-snake')

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
      This pane requires a localhost sandbox server. Run:

      ```
      $ docker run --rm -d -p #{port}:#{port} \\
          yamlio/yaml-play-sandbox:0.1.1 #{scheme}
      ```

      on the same computer as your web browser.

      See #{help}.

      [Chat with the YAML team](https://matrix.to/#/#chat:yaml.io).
      """
